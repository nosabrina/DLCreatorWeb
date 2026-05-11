export const ROLES = Object.freeze(['creator','responsible','validator','admin','read_only','library_reader']);

export const PERMISSIONS = Object.freeze({
  creator: ['dl:create','dl:readOwn','dl:updateDraft','workflow:submit','library:read'],
  responsible: ['dl:create','dl:readOwn','dl:readAssigned','dl:updateDraft','dl:updateAssigned','workflow:submit','library:read'],
  validator: ['dl:create','dl:readOwn','dl:readAssigned','dl:readAll','workflow:assign','workflow:reject','workflow:validatePrivate','workflow:validateLibrary','workflow:archive','library:read','admin:readAudit','admin:dashboard','admin:readStats','admin:readLateDocuments'],
  admin: ['dl:create','dl:readOwn','dl:readAssigned','dl:readAll','dl:updateDraft','dl:updateAssigned','workflow:assign','workflow:submit','workflow:reject','workflow:validatePrivate','workflow:validateLibrary','workflow:archive','library:read','admin:dashboard','admin:readStats','admin:readAudit','admin:exportDashboard','admin:readUsersActivity','admin:readLateDocuments','app:structure'],
  read_only: ['dl:readOwn','dl:readAssigned','dl:readAll','library:read'],
  library_reader: ['library:read']
});

export function normalizeRole(role){
  return ROLES.includes(role) ? role : 'creator';
}

export function getPermissionsForRole(role){
  return new Set(PERMISSIONS[normalizeRole(role)] || []);
}

export function hasPermission(user, permission){
  if (!user || !permission) return false;
  return getPermissionsForRole(user.role).has(permission);
}

export function assertPermission(user, permission){
  if (!hasPermission(user, permission)) {
    const err = new Error('Droit insuffisant');
    err.status = 403;
    throw err;
  }
}

export function canReadDl(user, dl){
  if (!user || !dl) return false;
  if (hasPermission(user, 'dl:readAll')) return true;
  if (hasPermission(user, 'dl:readOwn') && dl.owner_user_id === user.id) return true;
  if (hasPermission(user, 'dl:readAssigned') && dl.assigned_to_user_id === user.id) return true;
  if (hasPermission(user, 'library:read') && dl.status === 'validated_library') return true;
  return false;
}

export function canUpdateDl(user, dl){
  if (!user || !dl) return false;
  if (user.role === 'admin') return true;
  if (hasPermission(user, 'dl:updateDraft') && dl.owner_user_id === user.id) return true;
  if (hasPermission(user, 'dl:updateAssigned') && dl.assigned_to_user_id === user.id) return true;
  return false;
}
