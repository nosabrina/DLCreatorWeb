import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { canReadDl } from '../services/permissions-service.js';
import { applyStatusTransition, normalizeStatus } from '../services/workflow-service.js';
import { notifyWorkflowEvent } from '../services/notification-service.js';

export const workflowRouter = Router();
workflowRouter.use(requireAuth);

const commentSchema = z.object({ comment:z.string().trim().max(4000).optional().nullable() });
const rejectSchema = z.object({ comment:z.string().trim().min(1, 'Commentaire obligatoire pour un refus').max(4000) });
const assignSchema = commentSchema.extend({ assignedToUserId:z.string().trim().min(1).max(120) });

function getDlOr404(id){
  const row = getDb().prepare('SELECT * FROM dl_documents WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!row) throw Object.assign(new Error('DL introuvable'), { status:404 });
  return row;
}

function dto(row){
  return { id:row.id, status:normalizeStatus(row.status), assignedToUserId:row.assigned_to_user_id, validatorUserId:row.validator_user_id, version:row.version || 1, updatedAt:row.updated_at };
}

workflowRouter.post('/:id/assign', (req, res, next) => {
  try{
    const dl = getDlOr404(req.params.id);
    const body = assignSchema.parse(req.body || {});
    const assigned = getDb().prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(body.assignedToUserId);
    if (!assigned) return res.status(400).json({ error:'Utilisateur assigné introuvable ou inactif' });
    const updated = applyStatusTransition({ dl, toStatus:'assigned', user:req.user, comment:body.comment, extraUpdates:{ assigned_to_user_id:body.assignedToUserId, assigned_at:new Date().toISOString() }, req, auditAction:'workflow.assign' });
    notifyWorkflowEvent('assigned', updated, req.user, { comment:body.comment, req }).catch(() => {});
    res.json({ ok:true, item:dto(updated) });
  }catch(err){ next(err); }
});

workflowRouter.post('/:id/submit', (req, res, next) => {
  try{
    const dl = getDlOr404(req.params.id);
    const body = commentSchema.parse(req.body || {});
    const updated = applyStatusTransition({ dl, toStatus:'submitted', user:req.user, comment:body.comment, req, auditAction:'workflow.submit' });
    notifyWorkflowEvent('submitted', updated, req.user, { comment:body.comment, req }).catch(() => {});
    res.json({ ok:true, item:dto(updated) });
  }catch(err){ next(err); }
});

workflowRouter.post('/:id/reject', (req, res, next) => {
  try{
    const dl = getDlOr404(req.params.id);
    const body = rejectSchema.parse(req.body || {});
    const updated = applyStatusTransition({ dl, toStatus:'rejected', user:req.user, comment:body.comment, extraUpdates:{ validator_user_id:req.user.id }, req, auditAction:'workflow.reject' });
    notifyWorkflowEvent('rejected', updated, req.user, { comment:body.comment, req }).catch(() => {});
    res.json({ ok:true, item:dto(updated) });
  }catch(err){ next(err); }
});

workflowRouter.post('/:id/validate-private', (req, res, next) => {
  try{
    const dl = getDlOr404(req.params.id);
    const body = commentSchema.parse(req.body || {});
    const updated = applyStatusTransition({ dl, toStatus:'validated_private', user:req.user, comment:body.comment, extraUpdates:{ validator_user_id:req.user.id }, req, auditAction:'workflow.validate_private' });
    notifyWorkflowEvent('validated_private', updated, req.user, { comment:body.comment, req }).catch(() => {});
    res.json({ ok:true, item:dto(updated) });
  }catch(err){ next(err); }
});

workflowRouter.post('/:id/validate-library', (req, res, next) => {
  try{
    const dl = getDlOr404(req.params.id);
    const body = commentSchema.parse(req.body || {});
    const updated = applyStatusTransition({ dl, toStatus:'validated_library', user:req.user, comment:body.comment, extraUpdates:{ validator_user_id:req.user.id }, req, auditAction:'workflow.validate_library' });
    notifyWorkflowEvent('validated_library', updated, req.user, { comment:body.comment, req }).catch(() => {});
    res.json({ ok:true, item:dto(updated) });
  }catch(err){ next(err); }
});

workflowRouter.post('/:id/archive', (req, res, next) => {
  try{
    const dl = getDlOr404(req.params.id);
    const body = commentSchema.parse(req.body || {});
    const updated = applyStatusTransition({ dl, toStatus:'archived', user:req.user, comment:body.comment, req, auditAction:'workflow.archive' });
    notifyWorkflowEvent('archived', updated, req.user, { comment:body.comment, req }).catch(() => {});
    res.json({ ok:true, item:dto(updated) });
  }catch(err){ next(err); }
});

workflowRouter.get('/:id/history', (req, res, next) => {
  try{
    const dl = getDlOr404(req.params.id);
    if (!canReadDl(req.user, dl)) return res.status(403).json({ error:'Droit insuffisant' });
    const items = getDb().prepare(`SELECT h.*, u.username, u.display_name FROM dl_status_history h LEFT JOIN users u ON u.id = h.user_id WHERE h.dl_id = ? ORDER BY h.created_at ASC`).all(dl.id);
    res.json({ items });
  }catch(err){ next(err); }
});

workflowRouter.get('/:id/comments', (req, res, next) => {
  try{
    const dl = getDlOr404(req.params.id);
    if (!canReadDl(req.user, dl)) return res.status(403).json({ error:'Droit insuffisant' });
    const items = getDb().prepare(`SELECT c.*, u.username, u.display_name FROM dl_comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.dl_id = ? ORDER BY c.created_at ASC`).all(dl.id);
    res.json({ items });
  }catch(err){ next(err); }
});
