import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/database.js';
import { assertPermission } from '../services/permissions-service.js';
export const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get('/audit-log', (req, res, next) => {
  try{
    assertPermission(req.user, 'admin:readAudit');
    const items = getDb().prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200').all();
    res.json({ items });
  }catch(err){ next(err); }
});
adminRouter.get('/dashboard', (req, res, next) => {
  try{
    assertPermission(req.user, 'dl:readAll');
    const users = getDb().prepare('SELECT COUNT(*) AS count FROM users').get().count;
    const dl = getDb().prepare('SELECT COUNT(*) AS count FROM dl_documents WHERE deleted_at IS NULL').get().count;
    res.json({ users, dl });
  }catch(err){ next(err); }
});
