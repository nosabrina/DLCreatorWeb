import { Router } from 'express';
import { z } from 'zod';
import { getDb, nowIso } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { assertPermission, hasPermission, canReadDl } from '../services/permissions-service.js';
import { WORKFLOW_STATUSES, normalizeStatus } from '../services/workflow-service.js';
import { writeAudit } from '../db/audit.js';

export const adminDashboardRouter = Router();
adminDashboardRouter.use(requireAuth);

const STATUS_LABELS = Object.freeze({
  draft: 'Brouillon',
  assigned: 'Assignée',
  in_progress: 'En rédaction',
  submitted: 'Soumise à validation',
  rejected: 'Refusée',
  validated_private: 'Validée privée',
  validated_library: 'Publiée bibliothèque',
  archived: 'Archivée',
  unknown: 'Statut inconnu'
});
const FINAL_STATUSES = ['validated_private','validated_library','archived'];
const TRANSITIONAL_LATE_DAYS = Number(process.env.ADMIN_DASHBOARD_TRANSITIONAL_LATE_DAYS || 14);

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  includeInactive: z.coerce.boolean().optional().default(false),
  role: z.string().trim().max(80).optional(),
  status: z.string().trim().max(80).optional(),
  format: z.enum(['json','csv']).optional().default('json')
});

function requireDashboardPermission(req, permission){
  assertPermission(req.user, 'admin:dashboard');
  if (permission) assertPermission(req.user, permission);
}

function activeWhere(){ return 'd.deleted_at IS NULL'; }
function safeJsonParse(value){ try { return value ? JSON.parse(value) : null; } catch { return null; } }
function displayName(row, prefix = ''){ return row?.[`${prefix}display_name`] || row?.[`${prefix}username`] || null; }
function normalizeDashboardStatus(status){ return WORKFLOW_STATUSES.includes(status) ? status : 'unknown'; }
function countFromRows(rows, status){ return rows.find(r => r.status === status)?.count || 0; }
function daysBetween(fromIso, toMs = Date.now()){
  if (!fromIso) return null;
  const start = new Date(fromIso).getTime();
  if (!Number.isFinite(start)) return null;
  return Math.max(0, Math.floor((toMs - start) / 86400000));
}
function isLate(row, nowMs = Date.now()){
  const status = normalizeStatus(row.status);
  if (FINAL_STATUSES.includes(status)) return false;
  if (row.due_at) {
    const due = new Date(row.due_at).getTime();
    if (Number.isFinite(due) && due < nowMs) return true;
  }
  if (status === 'assigned' && row.assigned_at) {
    const days = daysBetween(row.assigned_at, nowMs);
    return days != null && days > TRANSITIONAL_LATE_DAYS;
  }
  return false;
}
function daysLate(row, nowMs = Date.now()){
  if (row.due_at) {
    const due = new Date(row.due_at).getTime();
    if (Number.isFinite(due) && due < nowMs) return Math.max(1, Math.ceil((nowMs - due) / 86400000));
  }
  if (row.assigned_at) {
    const days = daysBetween(row.assigned_at, nowMs);
    if (days != null && days > TRANSITIONAL_LATE_DAYS) return days - TRANSITIONAL_LATE_DAYS;
  }
  return 0;
}
function allActiveDocuments(){
  return getDb().prepare(`SELECT d.*, owner.display_name AS owner_display_name, owner.username AS owner_username,
      ass.display_name AS assigned_display_name, ass.username AS assigned_username
    FROM dl_documents d
    LEFT JOIN users owner ON owner.id = d.owner_user_id
    LEFT JOIN users ass ON ass.id = d.assigned_to_user_id
    WHERE ${activeWhere()}`).all();
}
function auditAdminView(req, action, extra = {}){
  writeAudit({ userId:req.user.id, action, entityType:'admin_dashboard', entityId:null, newValue:extra, req });
}
function toLateDto(row){
  return {
    id: row.id,
    title: row.title,
    status: normalizeStatus(row.status),
    responsibleName: row.assigned_display_name || row.assigned_username || row.owner_display_name || row.owner_username || null,
    assignedAt: row.assigned_at,
    dueAt: row.due_at,
    daysLate: daysLate(row)
  };
}
function csvEscape(value){
  const text = value == null ? '' : String(value);
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function rowsToCsv(headers, rows){
  const lines = [headers.map(h => csvEscape(h.label)).join(';')];
  for (const row of rows) lines.push(headers.map(h => csvEscape(row[h.key])).join(';'));
  return lines.join('\n');
}
function summaryData(){
  const docs = allActiveDocuments();
  const statusCounts = new Map();
  for (const doc of docs) statusCounts.set(normalizeDashboardStatus(doc.status), (statusCounts.get(normalizeDashboardStatus(doc.status)) || 0) + 1);
  const activeUsers = getDb().prepare('SELECT COUNT(*) AS count FROM users WHERE is_active = 1').get()?.count || 0;
  const notStarted = docs.filter(d => normalizeStatus(d.status) === 'assigned' && !d.first_saved_at).length;
  const late = docs.filter(d => isLate(d)).length;
  const emailNotificationSummary = getDb().prepare(`SELECT
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
    SUM(CASE WHEN status IN ('sent','dry_run') THEN 1 ELSE 0 END) AS delivered_or_dry_run
    FROM email_notifications`).get() || {};
  const lastReminderRun = getDb().prepare('SELECT started_at, finished_at, status, sent_count, error_count FROM reminder_runs ORDER BY started_at DESC LIMIT 1').get() || null;
  return {
    totalDocuments: docs.length,
    assigned: statusCounts.get('assigned') || 0,
    notStarted,
    inProgress: statusCounts.get('in_progress') || 0,
    submitted: statusCounts.get('submitted') || 0,
    rejected: statusCounts.get('rejected') || 0,
    validatedPrivate: statusCounts.get('validated_private') || 0,
    validatedLibrary: statusCounts.get('validated_library') || 0,
    archived: statusCounts.get('archived') || 0,
    late,
    activeUsers: Number(activeUsers || 0),
    lastUpdatedAt: nowIso()
  };
}
function byStatusData(){
  const rows = getDb().prepare(`SELECT status, COUNT(*) AS count FROM dl_documents d WHERE ${activeWhere()} GROUP BY status`).all()
    .map(r => ({ status:normalizeDashboardStatus(r.status), count:Number(r.count || 0) }));
  const merged = new Map();
  for (const row of rows) merged.set(row.status, (merged.get(row.status) || 0) + row.count);
  const items = WORKFLOW_STATUSES.map(status => ({ status, label:STATUS_LABELS[status], count:merged.get(status) || 0 }));
  if (merged.has('unknown')) items.push({ status:'unknown', label:STATUS_LABELS.unknown, count:merged.get('unknown') || 0 });
  return { items };
}
function byResponsibleData(includeInactive = false){
  const users = getDb().prepare(`SELECT id, username, display_name, is_active FROM users ${includeInactive ? '' : 'WHERE is_active = 1'} ORDER BY display_name COLLATE NOCASE`).all();
  const docs = allActiveDocuments();
  const lastRows = getDb().prepare(`SELECT COALESCE(d.assigned_to_user_id, d.owner_user_id) AS user_id, MAX(a.created_at) AS last_activity_at
    FROM dl_documents d LEFT JOIN audit_log a ON a.entity_type = 'dl_document' AND a.entity_id = d.id
    WHERE d.deleted_at IS NULL GROUP BY COALESCE(d.assigned_to_user_id, d.owner_user_id)`).all();
  const lastMap = new Map(lastRows.map(r => [r.user_id, r.last_activity_at]));
  const items = [];
  for (const user of users) {
    const owned = docs.filter(d => (d.assigned_to_user_id || d.owner_user_id) === user.id);
    if (!owned.length) continue;
    items.push({
      userId: user.id,
      displayName: user.display_name || user.username,
      assigned: owned.filter(d => normalizeStatus(d.status) === 'assigned').length,
      inProgress: owned.filter(d => normalizeStatus(d.status) === 'in_progress').length,
      submitted: owned.filter(d => normalizeStatus(d.status) === 'submitted').length,
      rejected: owned.filter(d => normalizeStatus(d.status) === 'rejected').length,
      validatedPrivate: owned.filter(d => normalizeStatus(d.status) === 'validated_private').length,
      validatedLibrary: owned.filter(d => normalizeStatus(d.status) === 'validated_library').length,
      late: owned.filter(d => isLate(d)).length,
      lastActivityAt: lastMap.get(user.id) || null
    });
  }
  return { items };
}
function lateData(){
  return { items: allActiveDocuments().filter(d => isLate(d)).sort((a,b) => daysLate(b) - daysLate(a)).map(toLateDto) };
}

adminDashboardRouter.get('/summary', (req, res, next) => {
  try{ requireDashboardPermission(req, 'admin:readStats'); auditAdminView(req, 'admin.dashboard.summary'); res.json(summaryData()); }catch(err){ next(err); }
});
adminDashboardRouter.get('/by-status', (req, res, next) => {
  try{ requireDashboardPermission(req, 'admin:readStats'); auditAdminView(req, 'admin.dashboard.by_status'); res.json(byStatusData()); }catch(err){ next(err); }
});
adminDashboardRouter.get('/by-responsible', (req, res, next) => {
  try{ requireDashboardPermission(req, 'admin:readStats'); const q=listQuerySchema.parse(req.query || {}); auditAdminView(req, 'admin.dashboard.by_responsible', { includeInactive:q.includeInactive }); res.json(byResponsibleData(q.includeInactive)); }catch(err){ next(err); }
});
adminDashboardRouter.get('/late', (req, res, next) => {
  try{ requireDashboardPermission(req, 'admin:readLateDocuments'); auditAdminView(req, 'admin.dashboard.late'); res.json(lateData()); }catch(err){ next(err); }
});
adminDashboardRouter.get('/recent-activity', (req, res, next) => {
  try{
    requireDashboardPermission(req, 'admin:readAudit');
    const q=listQuerySchema.parse(req.query || {});
    const items = getDb().prepare(`
      SELECT created_at, user_name, action, entity_type, entity_id, title, comment FROM (
        SELECT a.created_at, COALESCE(u.display_name,u.username) AS user_name, a.action, a.entity_type, a.entity_id,
               d.title, a.new_value AS comment
        FROM audit_log a LEFT JOIN users u ON u.id = a.user_id LEFT JOIN dl_documents d ON d.id = a.entity_id
        WHERE a.entity_type IN ('dl_document','library','admin_dashboard','notification','email_notification','reminder_run') OR a.action LIKE 'workflow.%' OR a.action LIKE 'library.%' OR a.action LIKE 'notification.%' OR a.action LIKE 'reminder.%'
        UNION ALL
        SELECT h.created_at, COALESCE(u.display_name,u.username) AS user_name, 'status.' || h.to_status AS action, 'dl_document' AS entity_type, h.dl_id AS entity_id, d.title, h.comment
        FROM dl_status_history h LEFT JOIN users u ON u.id = h.user_id LEFT JOIN dl_documents d ON d.id = h.dl_id
        UNION ALL
        SELECT e.created_at, COALESCE(u.display_name,u.username) AS user_name, e.event_type AS action, 'library_event' AS entity_type, e.dl_id AS entity_id, d.title, e.metadata_json AS comment
        FROM library_events e LEFT JOIN users u ON u.id = e.user_id LEFT JOIN dl_documents d ON d.id = e.dl_id
      ) ORDER BY created_at DESC LIMIT @limit OFFSET @offset`).all({ limit:q.limit, offset:q.offset });
    auditAdminView(req, 'admin.dashboard.recent_activity', { limit:q.limit, offset:q.offset });
    res.json({ items: items.map(r => ({ createdAt:r.created_at, userName:r.user_name, action:r.action, entityType:r.entity_type, entityId:r.entity_id, title:r.title, comment:r.comment })) });
  }catch(err){ next(err); }
});
adminDashboardRouter.get('/users-activity', (req, res, next) => {
  try{
    requireDashboardPermission(req, 'admin:readUsersActivity');
    const q=listQuerySchema.parse(req.query || {});
    const whereUsers = [];
    const userParams = {};
    if (!q.includeInactive) whereUsers.push('is_active = 1');
    if (q.role) { whereUsers.push('role = @role'); userParams.role = q.role; }
    const users = getDb().prepare(`SELECT id, username, display_name, role, is_active, last_login_at FROM users ${whereUsers.length ? 'WHERE ' + whereUsers.join(' AND ') : ''} ORDER BY display_name COLLATE NOCASE`).all(userParams);
    const items = users.map(u => {
      const row = getDb().prepare(`SELECT
        SUM(CASE WHEN owner_user_id = @id THEN 1 ELSE 0 END) AS owned,
        SUM(CASE WHEN assigned_to_user_id = @id THEN 1 ELSE 0 END) AS assigned,
        SUM(CASE WHEN assigned_to_user_id = @id AND status = 'submitted' THEN 1 ELSE 0 END) AS submitted,
        SUM(CASE WHEN validator_user_id = @id AND status IN ('validated_private','validated_library') THEN 1 ELSE 0 END) AS validated
        FROM dl_documents WHERE deleted_at IS NULL`).get({ id:u.id });
      const last = getDb().prepare('SELECT MAX(created_at) AS last_action_at FROM audit_log WHERE user_id = ?').get(u.id);
      return { userId:u.id, displayName:u.display_name || u.username, role:u.role, isActive:Number(u.is_active) === 1, lastLoginAt:u.last_login_at,
        ownedDocuments:Number(row?.owned || 0), assignedDocuments:Number(row?.assigned || 0), submittedDocuments:Number(row?.submitted || 0), validatedDocuments:Number(row?.validated || 0), lastActionAt:last?.last_action_at || null };
    });
    auditAdminView(req, 'admin.dashboard.users_activity', { includeInactive:q.includeInactive, role:q.role || null });
    res.json({ items });
  }catch(err){ next(err); }
});
adminDashboardRouter.get('/dl/:id/timeline', (req, res, next) => {
  try{
    const dl = getDb().prepare('SELECT * FROM dl_documents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
    if (!dl) return res.status(404).json({ error:'DL introuvable' });
    const isGlobalAllowed = hasPermission(req.user, 'admin:readAudit') || hasPermission(req.user, 'admin:readStats');
    if (!isGlobalAllowed && !canReadDl(req.user, dl)) return res.status(403).json({ error:'Droit insuffisant' });
    const history = getDb().prepare(`SELECT h.created_at, 'status' AS type, COALESCE(u.display_name,u.username) AS user_name, h.from_status, h.to_status, h.comment, NULL AS action, NULL AS version
      FROM dl_status_history h LEFT JOIN users u ON u.id = h.user_id WHERE h.dl_id = ?`).all(dl.id);
    const comments = getDb().prepare(`SELECT c.created_at, 'comment' AS type, COALESCE(u.display_name,u.username) AS user_name, NULL AS from_status, NULL AS to_status, c.comment, c.comment_type AS action, NULL AS version
      FROM dl_comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.dl_id = ?`).all(dl.id);
    const audits = getDb().prepare(`SELECT a.created_at, 'audit' AS type, COALESCE(u.display_name,u.username) AS user_name, NULL AS from_status, NULL AS to_status, a.new_value AS comment, a.action, NULL AS version
      FROM audit_log a LEFT JOIN users u ON u.id = a.user_id WHERE a.entity_type = 'dl_document' AND a.entity_id = ?`).all(dl.id);
    const versions = getDb().prepare(`SELECT v.created_at, 'version' AS type, COALESCE(u.display_name,u.username) AS user_name, NULL AS from_status, NULL AS to_status, v.change_reason AS comment, 'dl.version' AS action, v.version
      FROM dl_versions v LEFT JOIN users u ON u.id = v.created_by_user_id WHERE v.dl_id = ?`).all(dl.id);
    const library = getDb().prepare(`SELECT e.created_at, 'library' AS type, COALESCE(u.display_name,u.username) AS user_name, NULL AS from_status, NULL AS to_status, e.metadata_json AS comment, e.event_type AS action, NULL AS version
      FROM library_events e LEFT JOIN users u ON u.id = e.user_id WHERE e.dl_id = ?`).all(dl.id);
    const items = [...history, ...comments, ...audits, ...versions, ...library].sort((a,b) => String(a.created_at).localeCompare(String(b.created_at))).map(r => ({
      createdAt:r.created_at, type:r.type, userName:r.user_name, fromStatus:r.from_status, toStatus:r.to_status, comment:r.comment, action:r.action, version:r.version
    }));
    auditAdminView(req, 'admin.dashboard.timeline', { dlId:dl.id });
    res.json({ dl:{ id:dl.id, title:dl.title, status:normalizeStatus(dl.status), version:Number(dl.version || 1) }, items });
  }catch(err){ next(err); }
});
adminDashboardRouter.get('/export', (req, res, next) => {
  try{
    requireDashboardPermission(req, 'admin:exportDashboard');
    const q=listQuerySchema.parse(req.query || {});
    const data = { exportedAt:nowIso(), summary:summaryData(), byStatus:byStatusData().items, byResponsible:byResponsibleData(false).items, late:lateData().items };
    const activity = getDb().prepare(`SELECT a.created_at AS createdAt, COALESCE(u.display_name,u.username) AS userName, a.action, a.entity_type AS entityType, a.entity_id AS entityId
      FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 50`).all();
    data.recentActivity = activity;
    auditAdminView(req, 'admin.dashboard.export', { format:q.format });
    if (q.format === 'csv') {
      const csv = [
        '# Résumé', rowsToCsv([{key:'key',label:'Indicateur'},{key:'value',label:'Valeur'}], Object.entries(data.summary).map(([key,value]) => ({ key, value }))),
        '\n# Par statut', rowsToCsv([{key:'status',label:'Statut'},{key:'label',label:'Libellé'},{key:'count',label:'Nombre'}], data.byStatus),
        '\n# Par responsable', rowsToCsv([{key:'displayName',label:'Responsable'},{key:'assigned',label:'Assignées'},{key:'inProgress',label:'En rédaction'},{key:'submitted',label:'Soumises'},{key:'rejected',label:'Refusées'},{key:'validatedPrivate',label:'Validées privées'},{key:'validatedLibrary',label:'Bibliothèque'},{key:'late',label:'Retards'}], data.byResponsible),
        '\n# Retards', rowsToCsv([{key:'id',label:'ID'},{key:'title',label:'Titre'},{key:'status',label:'Statut'},{key:'responsibleName',label:'Responsable'},{key:'assignedAt',label:'Assignée le'},{key:'dueAt',label:'Échéance'},{key:'daysLate',label:'Jours retard'}], data.late)
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="admin-dashboard-dl.csv"');
      return res.send(csv);
    }
    res.json(data);
  }catch(err){ next(err); }
});
