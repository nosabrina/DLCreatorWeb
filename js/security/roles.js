(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  const roles=Object.freeze({
    admin:'Administrateur application',
    chefFormation:'Chef formation',
    responsableDomaine:'Responsable domaine',
    redacteur:'Rédacteur',
    validateur:'Validateur',
    lecteur:'Lecteur'
  });
  const legacyRoleMap=Object.freeze({
    'ADMIN STRUCTURE APPLICATION':'admin',
    'GESTION DL':'chefFormation',
    'RÉDACTION DL':'redacteur',
    'REDACTION DL':'redacteur',
    'CONSULTATION DL':'lecteur'
  });
  root.securityRoles={roles,legacyRoleMap,normalizeRole(value){return legacyRoleMap[String(value||'').trim().toUpperCase()]||String(value||'lecteur').trim()||'lecteur';}};
})(window);
