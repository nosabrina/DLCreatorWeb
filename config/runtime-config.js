(function(window){
  'use strict';
  /**
   * DL Creator Web v9.12 — configuration runtime publique.
   * Ce fichier ne contient aucun secret. Les valeurs sensibles doivent rester
   * exclusivement dans les variables d'environnement Netlify / serveur.
   */
  const existing = window.DL_CREATOR_RUNTIME_CONFIG || {};
  const runtimeConfig = Object.freeze({
    appName: 'DL Creator Web',
    version: 'v9.12',
    numericVersion: '9.12',
    build: '2026.05.12-v9.12-library-import-safari-session-access-mail-filrouge-ui',
    buildIncrement: 112,
    buildDate: '2026-05-12',
    buildDateUTC: '2026-05-12T07:30:00.000Z',
    environment: existing.environment || 'local',
    supportedEnvironments: Object.freeze(['local','pilote','preview','production']),
    productionMode: existing.productionMode || 'pilote',
    authMode: 'local',
    storageMode: 'local',
    apiBaseUrl: existing.apiBaseUrl || '/.netlify/functions',
    apiTimeoutMs: 10000,
    apiVersion: '2026-05-pilot-v7',
    minimumCompatibleVersion: 'v8.10',
    previewMode: existing.previewMode === true || existing.environment === 'preview',
    productionRuntime: existing.environment === 'production',
    backendEnabled: false,
    remoteStorageEnabled: false,
    serverAuthEnabled: false,
    serverAuditEnabled: false,
    transactionalMailEnabled: false,
    diagnosticsEnabled: true,
    securityDiagnosticsEnabled: true,
    runtimeConfigExternalizedV910: true,
    frontendSecretsRemovedV910: true,
    envArchitecturePreparedV910: true,
    netlifyPreviewHardenedV910: true,
    githubPrivateReadyV910: true
  });
  window.DL_CREATOR_RUNTIME_CONFIG = runtimeConfig;
})(window);
