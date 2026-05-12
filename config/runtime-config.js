(function(window){
  'use strict';
  /**
   * DL Creator Web v9.10 — configuration runtime publique.
   * Ce fichier ne contient aucun secret. Les valeurs sensibles doivent rester
   * exclusivement dans les variables d'environnement Netlify / serveur.
   */
  const existing = window.DL_CREATOR_RUNTIME_CONFIG || {};
  const runtimeConfig = Object.freeze({
    appName: 'DL Creator Web',
    version: 'v9.10',
    numericVersion: '9.10',
    build: '2026.05.11-v9.10-github-security-hardening',
    buildIncrement: 110,
    buildDate: '2026-05-11',
    buildDateUTC: '2026-05-11T20:10:00.000Z',
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
