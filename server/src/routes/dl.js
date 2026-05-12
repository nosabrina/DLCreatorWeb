import { Router } from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { getDb, nowIso } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { writeAudit } from '../db/audit.js';
import { canReadDl, canUpdateDl, hasPermission, assertPermission } from '../services/permissions-service.js';
import { isLockedStatus, normalizeStatus, insertStatusHistory } from '../services/workflow-service.js';

export const dlRouter = Router();
dlRouter.use(requireAuth);

const payloadSchema = z.object({
  title: z.string().trim().min(1).max(250),
  domain: z.string().trim().max(80).optional().nullable(),
  theme: z.string().trim().max(250).optional().nullable(),
  subtheme: z.string().trim().max(250).optional().nullable(),
  publicTarget: z.string().trim().max(250).optional().nullable(),
  status: z.string().optional(),
  jsonData: z.any()
});

function rowToDto(row, includeJson=false){
  const dto = {
    id:row.id,
    ownerUserId:row.owner_user_id,
    assignedToUserId:row.assigned_to_user_id,
    validatorUserId:row.validator_user_id,
    title:row.title,
    domain:row.domain,
    theme:row.theme,
    subtheme:row.subtheme,
    publicTarget:row.public_target,
    status:normalizeStatus(row.status),
    version:row.version || 1,
    publishedAt:row.published_at,
    archivedAt:row.archived_at,
    submittedAt:row.submitted_at,
    validatedAt:row.validated_at,
    rejectedAt:row.rejected_at,
    dueAt:row.due_at,
    assignedAt:row.assigned_at,
    firstSavedAt:row.first_saved_at,
    createdAt:row.created_at,
    updatedAt:row.updated_at
  };
  if (includeJson) dto.jsonData = JSON.parse(row.json_data || '{}');
  return dto;
}

function validateJsonSize(jsonData){
  const text = JSON.stringify(jsonData ?? {});
  const max = Number(process.env.UPLOAD_MAX_JSON_SIZE_MB || 50) * 1024 * 1024;
  if (Buffer.byteLength(text, 'utf8') > max) throw Object.assign(new Error('JSON DL trop volumineux pour le serveur (taille maximale configurée dépassée).'), { status:413 });
  return text;
}

function createVersion({ dlId, version, jsonData, userId, changeReason, req }){
  getDb().prepare(`INSERT INTO dl_versions (id,dl_id,version,json_data,created_by_user_id,change_reason,created_at)
    VALUES (@id,@dlId,@version,@jsonData,@userId,@changeReason,@createdAt)`).run({
      id:nanoid(), dlId, version, jsonData, userId, changeReason, createdAt:nowIso()
    });
  writeAudit({ userId, action:'dl.version_created', entityType:'dl_document', entityId:dlId, newValue:{ version, changeReason }, req });
}

function selectableRowsForUser(user){
  if (hasPermission(user, 'dl:readAll')) return getDb().prepare('SELECT * FROM dl_documents WHERE deleted_at IS NULL ORDER BY updated_at DESC').all();
  const rows = getDb().prepare(`SELECT * FROM dl_documents
    WHERE deleted_at IS NULL AND (owner_user_id = @userId OR assigned_to_user_id = @userId OR status = 'validated_library')
    ORDER BY updated_at DESC`).all({ userId:user.id });
  return rows.filter(row => canReadDl(user, row));
}

dlRouter.get('/', (req, res) => {
  const rows = selectableRowsForUser(req.user);
  res.json({ items: rows.map(r => rowToDto(r, false)) });
});

dlRouter.post('/', (req, res, next) => {
  try{
    assertPermission(req.user, 'dl:create');
    const body = payloadSchema.parse(req.body || {});
    const id = nanoid();
    const ts = nowIso();
    const jsonText = validateJsonSize(body.jsonData);
    getDb().prepare(`INSERT INTO dl_documents (id,owner_user_id,title,domain,theme,subtheme,public_target,status,version,json_data,created_at,updated_at)
      VALUES (@id,@owner,@title,@domain,@theme,@subtheme,@publicTarget,'draft',1,@jsonData,@createdAt,@updatedAt)`).run({
        id, owner:req.user.id, title:body.title, domain:body.domain || null, theme:body.theme || null, subtheme:body.subtheme || null,
        publicTarget:body.publicTarget || null, jsonData:jsonText, createdAt:ts, updatedAt:ts
      });
    createVersion({ dlId:id, version:1, jsonData:jsonText, userId:req.user.id, changeReason:'Création serveur Phase 3', req });
    writeAudit({ userId:req.user.id, action:'dl.create', entityType:'dl_document', entityId:id, newValue:{ title:body.title, status:'draft', version:1 }, req });
    res.status(201).json({ id, title:body.title, status:'draft', version:1, updatedAt:ts });
  }catch(err){ next(err); }
});

dlRouter.get('/:id', (req, res, next) => {
  try{
    const row = getDb().prepare('SELECT * FROM dl_documents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
    if (!row) return res.status(404).json({ error:'DL introuvable' });
    if (!canReadDl(req.user, row)) return res.status(403).json({ error:'Droit insuffisant' });
    res.json(rowToDto(row, true));
  }catch(err){ next(err); }
});

dlRouter.put('/:id', (req, res, next) => {
  try{
    const row = getDb().prepare('SELECT * FROM dl_documents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
    if (!row) return res.status(404).json({ error:'DL introuvable' });
    if (!canReadDl(req.user, row) || !canUpdateDl(req.user, row)) return res.status(403).json({ error:'Droit insuffisant' });
    if (isLockedStatus(row.status)) {
      writeAudit({ userId:req.user.id, action:'dl.update_blocked_locked_status', entityType:'dl_document', entityId:row.id, oldValue:{ status:row.status }, newValue:{ attemptedAt:nowIso() }, req });
      return res.status(423).json({ error:'DL verrouillée par son statut workflow', status:normalizeStatus(row.status) });
    }
    const body = payloadSchema.parse(req.body || {});
    const ts = nowIso();
    const jsonText = validateJsonSize(body.jsonData);
    const nextVersion = Number(row.version || 1) + 1;
    let nextStatus = normalizeStatus(row.status);
    let statusChanged = false;
    if (nextStatus === 'assigned' || nextStatus === 'rejected') { nextStatus = 'in_progress'; statusChanged = true; }
    getDb().prepare(`UPDATE dl_documents SET title=@title, domain=@domain, theme=@theme, subtheme=@subtheme, public_target=@publicTarget,
      status=@status, version=@version, json_data=@jsonData, first_saved_at=COALESCE(first_saved_at,@firstSavedAt), updated_at=@updatedAt WHERE id=@id`).run({
      id:row.id, title:body.title, domain:body.domain || null, theme:body.theme || null, subtheme:body.subtheme || null,
      publicTarget:body.publicTarget || null, status:nextStatus, version:nextVersion, jsonData:jsonText, firstSavedAt: nextStatus === 'in_progress' ? ts : null, updatedAt:ts
    });
    createVersion({ dlId:row.id, version:nextVersion, jsonData:jsonText, userId:req.user.id, changeReason:'Mise à jour serveur', req });
    if (statusChanged) insertStatusHistory({ dlId:row.id, userId:req.user.id, fromStatus:normalizeStatus(row.status), toStatus:'in_progress', comment:normalizeStatus(row.status) === 'assigned' ? 'Première sauvegarde serveur significative' : 'Correction après refus' });
    writeAudit({ userId:req.user.id, action:'dl.update', entityType:'dl_document', entityId:row.id, oldValue:{ title:row.title, status:row.status, version:row.version, updatedAt:row.updated_at }, newValue:{ title:body.title, status:nextStatus, version:nextVersion, updatedAt:ts }, req });
    res.json({ id:row.id, title:body.title, status:nextStatus, version:nextVersion, updatedAt:ts });
  }catch(err){ next(err); }
});

dlRouter.delete('/:id', (req, res, next) => {
  try{
    const row = getDb().prepare('SELECT * FROM dl_documents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
    if (!row) return res.status(404).json({ error:'DL introuvable' });
    if (!canReadDl(req.user, row) || !canUpdateDl(req.user, row)) return res.status(403).json({ error:'Droit insuffisant' });
    const ts = nowIso();
    getDb().prepare('UPDATE dl_documents SET deleted_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, row.id);
    writeAudit({ userId:req.user.id, action:'dl.delete.soft', entityType:'dl_document', entityId:row.id, oldValue:{ deletedAt:null }, newValue:{ deletedAt:ts }, req });
    res.json({ ok:true, id:row.id, deletedAt:ts });
  }catch(err){ next(err); }
});
