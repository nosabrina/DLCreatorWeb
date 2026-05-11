import { nanoid } from 'nanoid';
import { getDb, nowIso } from '../db/database.js';
import { writeAudit } from '../db/audit.js';
import { hasPermission } from './permissions-service.js';

export const WORKFLOW_STATUSES = Object.freeze(['draft','assigned','in_progress','submitted','rejected','validated_private','validated_library','archived']);

const TRANSITIONS = Object.freeze({
  draft: ['assigned','in_progress'],
  assigned: ['in_progress'],
  in_progress: ['submitted'],
  submitted: ['rejected','validated_private','validated_library'],
  rejected: ['in_progress'],
  validated_private: ['archived'],
  validated_library: ['archived'],
  archived: []
});

const TRANSITION_PERMISSIONS = Object.freeze({
  assigned: 'workflow:assign',
  submitted: 'workflow:submit',
  rejected: 'workflow:reject',
  validated_private: 'workflow:validatePrivate',
  validated_library: 'workflow:validateLibrary',
  archived: 'workflow:archive',
  in_progress: null
});

export function normalizeStatus(status){
  if (status === 'server_saved') return 'draft';
  return WORKFLOW_STATUSES.includes(status) ? status : 'draft';
}

export function isLockedStatus(status){
  return ['submitted','validated_private','validated_library','archived'].includes(normalizeStatus(status));
}

export function requiresComment(_fromStatus, toStatus){
  return toStatus === 'rejected';
}

export function canTransition(fromStatus, toStatus, userRole){
  const from = normalizeStatus(fromStatus);
  const to = normalizeStatus(toStatus);
  if (!TRANSITIONS[from]?.includes(to)) return false;
  if (userRole === 'admin') return true;
  const perm = TRANSITION_PERMISSIONS[to];
  if (!perm) return true;
  if (to === 'assigned') return ['validator'].includes(userRole);
  if (to === 'submitted') return ['creator','responsible'].includes(userRole);
  if (to === 'rejected' || to === 'validated_private' || to === 'validated_library' || to === 'archived') return ['validator'].includes(userRole);
  return false;
}

function assertActorContextAllowed(dl, toStatus, user){
  const to = normalizeStatus(toStatus);
  if (user.role === 'admin') return;
  if (to === 'submitted' && dl.owner_user_id !== user.id && dl.assigned_to_user_id !== user.id) {
    const err = new Error('Soumission réservée au créateur ou au responsable assigné');
    err.status = 403;
    throw err;
  }
}

export function assertTransitionAllowed({ dl, toStatus, user, comment }){
  const from = normalizeStatus(dl.status);
  const to = normalizeStatus(toStatus);
  if (!WORKFLOW_STATUSES.includes(to)) {
    const err = new Error(`Statut cible invalide : ${toStatus}`);
    err.status = 400;
    throw err;
  }
  if (!TRANSITIONS[from]?.includes(to)) {
    const err = new Error(`Transition workflow interdite : ${from} → ${to}`);
    err.status = 409;
    throw err;
  }
  if (!canTransition(from, to, user.role)) {
    const err = new Error('Rôle insuffisant pour cette transition workflow');
    err.status = 403;
    throw err;
  }
  const permission = TRANSITION_PERMISSIONS[to];
  if (permission && !hasPermission(user, permission)) {
    const err = new Error('Permission serveur insuffisante');
    err.status = 403;
    throw err;
  }
  if (requiresComment(from, to) && !String(comment || '').trim()) {
    const err = new Error('Commentaire obligatoire pour un refus');
    err.status = 400;
    throw err;
  }
  assertActorContextAllowed(dl, to, user);
}

export function insertStatusHistory({ dlId, userId, fromStatus, toStatus, comment }){
  getDb().prepare(`INSERT INTO dl_status_history (id,dl_id,user_id,from_status,to_status,comment,created_at)
    VALUES (@id,@dlId,@userId,@fromStatus,@toStatus,@comment,@createdAt)`).run({
      id:nanoid(), dlId, userId, fromStatus, toStatus, comment:comment || null, createdAt:nowIso()
    });
}

function insertLibraryEvent({ dlId = null, userId = null, eventType, metadata = null, req = null }){
  getDb().prepare(`INSERT INTO library_events (id,dl_id,user_id,event_type,metadata_json,ip_address,user_agent,created_at)
    VALUES (@id,@dlId,@userId,@eventType,@metadataJson,@ipAddress,@userAgent,@createdAt)`).run({
      id:nanoid(), dlId, userId, eventType,
      metadataJson: metadata == null ? null : JSON.stringify(metadata),
      ipAddress:req?.ip || null,
      userAgent:req?.headers?.['user-agent'] || null,
      createdAt:nowIso()
    });
}

export function insertComment({ dlId, userId, commentType, comment }){
  if (!String(comment || '').trim()) return;
  getDb().prepare(`INSERT INTO dl_comments (id,dl_id,user_id,comment_type,comment,created_at)
    VALUES (@id,@dlId,@userId,@commentType,@comment,@createdAt)`).run({
      id:nanoid(), dlId, userId, commentType, comment:String(comment).trim(), createdAt:nowIso()
    });
}

function timestampColumnForStatus(status){
  return ({ submitted:'submitted_at', rejected:'rejected_at', validated_private:'validated_at', validated_library:'validated_at', archived:'archived_at' })[status] || null;
}

export function applyStatusTransition({ dl, toStatus, user, comment = null, extraUpdates = {}, req = null, auditAction }){
  const from = normalizeStatus(dl.status);
  const to = normalizeStatus(toStatus);
  assertTransitionAllowed({ dl, toStatus:to, user, comment });
  const ts = nowIso();
  const updates = { status:to, updated_at:ts, ...extraUpdates };
  const stamp = timestampColumnForStatus(to);
  if (stamp) updates[stamp] = ts;
  if (to === 'validated_library') {
    updates.published_at = dl.published_at || ts;
    updates.published_by_user_id = user.id;
    updates.library_visible = 1;
  }
  if (to === 'archived') {
    updates.library_visible = 0;
  }
  const setSql = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  getDb().prepare(`UPDATE dl_documents SET ${setSql} WHERE id = @id`).run({ id:dl.id, ...updates });
  insertStatusHistory({ dlId:dl.id, userId:user.id, fromStatus:from, toStatus:to, comment });
  insertComment({ dlId:dl.id, userId:user.id, commentType:to === 'rejected' ? 'rejection' : 'workflow', comment });
  writeAudit({ userId:user.id, action:auditAction || `workflow.${to}`, entityType:'dl_document', entityId:dl.id, oldValue:{ status:from }, newValue:{ status:to, comment:comment || null, ...extraUpdates }, req });
  if (to === 'validated_library') {
    writeAudit({ userId:user.id, action:'library.published', entityType:'dl_document', entityId:dl.id, oldValue:{ status:from }, newValue:{ status:to, publishedAt:updates.published_at, libraryVisible:1 }, req });
    insertLibraryEvent({ dlId:dl.id, userId:user.id, eventType:'library.published', metadata:{ fromStatus:from, publishedAt:updates.published_at }, req });
  }
  if (to === 'archived' && from === 'validated_library') {
    writeAudit({ userId:user.id, action:'library.hidden_archived', entityType:'dl_document', entityId:dl.id, oldValue:{ status:from, libraryVisible:1 }, newValue:{ status:to, libraryVisible:0 }, req });
    insertLibraryEvent({ dlId:dl.id, userId:user.id, eventType:'library.hidden_archived', metadata:{ fromStatus:from, archivedAt:ts }, req });
  }
  return getDb().prepare('SELECT * FROM dl_documents WHERE id = ?').get(dl.id);
}
