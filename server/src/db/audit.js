import { nanoid } from 'nanoid';
import { getDb, nowIso } from './database.js';
import { logger } from '../services/logger.js';
export function writeAudit({ userId = null, action, entityType = null, entityId = null, oldValue = null, newValue = null, req = null, severity = 'info' }) {
  try {
    getDb().prepare(`INSERT INTO audit_log (id,user_id,action,entity_type,entity_id,old_value,new_value,ip_address,user_agent,severity,request_id,created_at)
      VALUES (@id,@userId,@action,@entityType,@entityId,@oldValue,@newValue,@ipAddress,@userAgent,@severity,@requestId,@createdAt)`).run({
      id:nanoid(), userId, action, entityType, entityId,
      oldValue:oldValue == null ? null : JSON.stringify(logger.mask(oldValue)),
      newValue:newValue == null ? null : JSON.stringify(logger.mask(newValue)),
      ipAddress:req?.ip || null, userAgent:req?.headers?.['user-agent'] || null, severity, requestId:req?.requestId || null, createdAt:nowIso()
    });
    logger.audit(action,{userId,entityType,entityId,severity,requestId:req?.requestId||null});
  } catch (err) { logger.warn('Audit non bloquant en échec',{action,error:err}); }
}
