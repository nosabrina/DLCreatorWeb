(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  function roleOf(user){
    const localRight=user?.droitAcces||user?.role||user?.function||user?.fonction;
    return root.securityRoles?.normalizeRole(localRight)||'lecteur';
  }
  function can(user,permission){
    const explicit=Array.isArray(user?.permissions)?user.permissions:[];
    if(explicit.includes(permission)) return true;
    const role=roleOf(user);
    return (root.securityPermissions?.permissionsForRole(role)||[]).includes(permission);
  }
  function allowedServerModules(user){
    return ['dl','bibliotheque','mesdl','habilitations','outils','profile'].filter(m=>m!=='habilitations'||can(user,'users:manage'));
  }
  root.accessControl={roleOf,can,allowedServerModules};
})(window);
