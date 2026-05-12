import { getDb } from '../db/database.js';
import { writeAudit } from '../db/audit.js';
import { sendTemplateMail, recordMailEvent } from './mail-service.js';

const EVENT_TO_TEMPLATE = Object.freeze({
  assigned:'dl_assigned', submitted:'dl_submitted', rejected:'dl_rejected', validated_private:'dl_validated_private', validated_library:'dl_validated_library', archived:'dl_archived',
  dl_assigned:'dl_assigned', dl_submitted:'dl_submitted', dl_rejected:'dl_rejected', dl_validated_private:'dl_validated_private', dl_validated_library:'dl_validated_library', dl_archived:'dl_archived'
});
function isValidEmail(email){ return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }
function userById(id){ return id ? getDb().prepare('SELECT id, username, email, display_name, role, is_active FROM users WHERE id = ? AND is_active = 1').get(id) : null; }
function activeAdmins(){ return getDb().prepare("SELECT id, username, email, display_name, role, is_active FROM users WHERE is_active = 1 AND role = 'admin'").all(); }
function activeValidators(){ return getDb().prepare("SELECT id, username, email, display_name, role, is_active FROM users WHERE is_active = 1 AND role IN ('admin','validator')").all(); }
function dedupe(users){ const seen=new Set(); return users.filter(u => u && Number(u.is_active) === 1 && isValidEmail(u.email) && !seen.has(u.id) && seen.add(u.id)); }
export function shouldNotify(user, notificationType){
  if (!user || Number(user.is_active) !== 1 || !isValidEmail(user.email)) return false;
  const pref = getDb().prepare('SELECT enabled FROM notification_preferences WHERE user_id = ? AND notification_type = ?').get(user.id, notificationType);
  return !pref || Number(pref.enabled) === 1;
}
export function resolveRecipients(eventType, dl, context = {}){
  const templateKey = EVENT_TO_TEMPLATE[eventType] || eventType;
  let users=[];
  if (templateKey === 'dl_assigned') users=[userById(dl.assigned_to_user_id)];
  else if (templateKey === 'dl_submitted') users=dl.validator_user_id ? [userById(dl.validator_user_id)] : activeValidators();
  else if (templateKey === 'dl_rejected' || templateKey === 'dl_validated_private' || templateKey === 'dl_validated_library') users=[userById(dl.assigned_to_user_id), userById(dl.owner_user_id)];
  else if (templateKey === 'dl_archived') users=[userById(dl.assigned_to_user_id), userById(dl.owner_user_id), ...activeAdmins()];
  else if (templateKey === 'dl_not_started_reminder') users=[userById(dl.assigned_to_user_id)];
  else if (templateKey === 'dl_late_reminder') users=[userById(dl.assigned_to_user_id), ...(context.includeAdmins ? activeAdmins() : [])];
  return dedupe(users).filter(u => shouldNotify(u, templateKey));
}
function dataFor(dl, actorUser, context){
  const responsible = userById(dl.assigned_to_user_id) || userById(dl.owner_user_id);
  return { dl:{ id:dl.id, title:dl.title, status:dl.status }, responsible, responsibleName:responsible?.display_name || responsible?.username || null, actor:actorUser || null, comment:context.comment || null, dueAt:dl.due_at || null, daysLate:context.daysLate, daysSinceAssigned:context.daysSinceAssigned, appBaseUrl:process.env.MAIL_APP_BASE_URL };
}
export function recordNotificationAudit({ action, actorUser = null, dl = null, eventType, metadata = {}, req = null }){
  writeAudit({ userId:actorUser?.id || null, action, entityType:'notification', entityId:dl?.id || null, newValue:{ eventType, ...metadata }, req });
}
export async function notifyWorkflowEvent(eventType, dl, actorUser = null, context = {}){
  const templateKey = EVENT_TO_TEMPLATE[eventType] || eventType;
  const recipients = resolveRecipients(templateKey, dl, context);
  if (!recipients.length) {
    const id = recordMailEvent({ eventType:templateKey, dlId:dl?.id || null, subject:`Notification ${templateKey}`, text:'Aucun destinataire valide.', status:'skipped', dryRun:true, metadata:{ reason:'no_recipient', actorUserId:actorUser?.id || null } });
    writeAudit({ userId:actorUser?.id || null, action:'notification.skipped', entityType:'email_notification', entityId:id, newValue:{ eventType:templateKey, dlId:dl?.id || null, reason:'no_recipient' }, req:context.req || null });
    return [{ status:'skipped', id }];
  }
  try{
    return await sendTemplateMail(templateKey, recipients, dataFor(dl, actorUser, context), { dlId:dl?.id || null, actorUserId:actorUser?.id || null, eventType:templateKey });
  }catch(err){
    recordNotificationAudit({ action:'notification.failed', actorUser, dl, eventType:templateKey, metadata:{ error:err.message }, req:context.req || null });
    return [{ status:'failed', error:err.message }];
  }
}
export async function notifyAdmins(eventType, dl, context = {}){
  const recipients = activeAdmins().filter(u => shouldNotify(u, eventType));
  if (!recipients.length) return [];
  return sendTemplateMail(eventType, recipients, dataFor(dl, context.actorUser || null, context), { dlId:dl?.id || null, actorUserId:context.actorUser?.id || null, eventType });
}
