(function(window){
  'use strict';
  /** Feature flags publics. Aucun secret, aucun token, aucun hash sensible. */
  window.DL_CREATOR_FEATURE_FLAGS = Object.freeze({
    offlineFirst: true,
    backendPrepared: true,
    backendEnabled: false,
    remoteStorageEnabled: false,
    serverAuthEnabled: false,
    serverAuditEnabled: false,
    transactionalMailEnabled: false,
    syncQueuePrepared: true,
    syncRemoteEnabledByDefault: false,
    backupRestorePrepared: true,
    rbacCentralized: true,
    pdfEngineLocked: true,
    githubSecurityReadyV910: true,
    runtimeConfigExternalizedV910: true,
    frontendSecretsRemovedV910: true,
    envArchitecturePreparedV910: true,
    netlifyPreviewHardenedV910: true,
    githubPrivateReadyV910: true,
    configCentralizationV910: true,
    libraryJsonImportV912: true,
    safariSessionResumeGuardV912: true,
    accessEmailPreviewBoldTitlesV912: true,
    filRougeUiAddSectionBottomV912: true
  });
})(window);
