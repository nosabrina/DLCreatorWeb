(function(window){
  'use strict';
  const runtime = window.DL_CREATOR_RUNTIME_CONFIG || {};
  const flags = window.DL_CREATOR_FEATURE_FLAGS || {};
  window.DL_CREATOR_APP_CONFIG = Object.freeze({
    appName: runtime.appName || 'DL Creator Web',
    version: runtime.version || 'v10.03',
    build: runtime.build || '2026.05.12-v10.03-pdf-public-cible-bold-black-11pt',
    environment: runtime.environment || 'local',
    productionMode: runtime.productionMode || 'pilote',
    authMode: 'local',
    storageMode: 'local',
    apiBaseUrl: runtime.apiBaseUrl || '/.netlify/functions',
    apiTimeoutMs: runtime.apiTimeoutMs || 10000,
    apiVersion: runtime.apiVersion || '2026-05-pilot-v7',
    backendEnabled: false,
    serverAuthEnabled: false,
    remoteStorageEnabled: false,
    serverAuditEnabled: false,
    transactionalMailEnabled: false,
    featureFlags: flags
  });
})(window);
