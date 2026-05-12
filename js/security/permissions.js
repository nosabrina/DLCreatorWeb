(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  const permissionsByRole=Object.freeze({
    admin:['app:admin','users:manage','dl:create','dl:read','dl:update','dl:delete','dl:validate','dl:publish','audit:read','backup:manage'],
    chefFormation:['app:admin','users:manage','users:disable','users:import','users:export','permissions:manage','settings:manage','dl:create','dl:read','dl:update','dl:delete','dl:validate','dl:publish','audit:read','audit:export','audit:purge','backup:manage','diagnostics:read','supervision:read'],
    responsableDomaine:['dl:create','dl:read','dl:update','dl:validate','dl:publish'],
    validateur:['dl:read','dl:validate'],
    redacteur:['dl:create','dl:read','dl:update'],
    lecteur:['dl:read']
  });
  root.securityPermissions={permissionsByRole,permissionsForRole(role){return permissionsByRole[role]||permissionsByRole.lecteur;}};
})(window);
