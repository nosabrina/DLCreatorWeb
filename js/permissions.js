(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};

  const ROLES = Object.freeze({
    CREATOR: 'creator',
    RESPONSIBLE: 'responsible',
    VALIDATOR: 'validator',
    ADMIN: 'admin',
    READ_ONLY: 'readOnly',
    LIBRARY_READER: 'libraryReader'
  });

  const PERMISSIONS = Object.freeze({
    DL_CREATE: 'dl:create',
    DL_EDIT_OWN_DRAFT: 'dl:editOwnDraft',
    DL_SUBMIT: 'dl:submit',
    DL_VALIDATE: 'dl:validate',
    DL_REJECT: 'dl:reject',
    DL_PUBLISH_LIBRARY: 'dl:publishLibrary',
    DL_ARCHIVE: 'dl:archive',
    ADMIN_USERS: 'admin:users',
    ADMIN_DASHBOARD: 'admin:dashboard',
    LIBRARY_READ: 'library:read',
    APP_STRUCTURE: 'app:structure'
  });

  const ROLE_PERMISSIONS = Object.freeze({
    [ROLES.CREATOR]: [PERMISSIONS.DL_CREATE, PERMISSIONS.DL_EDIT_OWN_DRAFT, PERMISSIONS.DL_SUBMIT, PERMISSIONS.LIBRARY_READ],
    [ROLES.RESPONSIBLE]: [PERMISSIONS.DL_CREATE, PERMISSIONS.DL_EDIT_OWN_DRAFT, PERMISSIONS.DL_SUBMIT, PERMISSIONS.LIBRARY_READ],
    [ROLES.VALIDATOR]: [PERMISSIONS.DL_VALIDATE, PERMISSIONS.DL_REJECT, PERMISSIONS.DL_PUBLISH_LIBRARY, PERMISSIONS.LIBRARY_READ],
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.READ_ONLY]: [PERMISSIONS.LIBRARY_READ],
    [ROLES.LIBRARY_READER]: [PERMISSIONS.LIBRARY_READ]
  });

  function roleHasPermission(role, permission){
    if(!role || !permission) return false;
    return (ROLE_PERMISSIONS[role] || []).includes(permission);
  }

  root.permissions = { ROLES, PERMISSIONS, ROLE_PERMISSIONS, roleHasPermission };
})(window);
