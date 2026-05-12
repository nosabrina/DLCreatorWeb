(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};
  const runtimeConfig = window.DL_CREATOR_RUNTIME_CONFIG || {};
  const appRuntimeConfig = window.DL_CREATOR_APP_CONFIG || {};
  const versionInfo = root.getVersionInfo ? root.getVersionInfo() : { version:(runtimeConfig.version || 'v9.10'), build:(runtimeConfig.build || 'manual'), buildDate:(runtimeConfig.buildDate || '2026-05-11'), environment:(runtimeConfig.environment || 'local'), productionMode:(runtimeConfig.productionMode || 'pilote'), flags:(window.DL_CREATOR_FEATURE_FLAGS || {}) };

  /*
   * Configuration frontend v9.10 externalisée.
   * Une seule source de vérité version : js/config/version.js.
   * Le mode local/offline-first reste le mode actif. Les fondations serveur sont préparées mais désactivées.
   */
  const config = Object.freeze({
    appName: appRuntimeConfig.appName || 'DL Creator Web',
    appVersion: versionInfo.version,
    build: versionInfo.build,
    buildDate: versionInfo.buildDate,
    environment: versionInfo.environment || 'local',
    productionMode: versionInfo.productionMode || 'pilote',
    authMode: appRuntimeConfig.authMode || 'local',
    storageMode: appRuntimeConfig.storageMode || 'local',
    backendEnabled: false,
    apiBaseUrl: appRuntimeConfig.apiBaseUrl || '/.netlify/functions',
    apiTimeoutMs: appRuntimeConfig.apiTimeoutMs || 10000,
    apiVersion: versionInfo.apiVersion || '2026-05-pilot-v7',
    serverDiagnosticsEnabled: true,
    productionModeNoticeEnabled: true,
    securityDiagnosticsEnabled: true,
    compatibility: versionInfo.compatibility || {},
    versionInfo,
    featureFlags: Object.freeze({
      authServerEnabled: false,
      dlServerStorageEnabled: false,
      workflowServerEnabled: false,
      libraryServerEnabled: false,
      adminDashboardEnabled: false,
      notificationsEnabled: false,
      emailDiagnosticsEnabled: true,
      reminderDiagnosticsEnabled: false,
      remoteStorageEnabled: false,
      serverAuditEnabled: false,
      syncQueueEnabled: false,
      syncQueuePrepared: true,
      backupRestorePrepared: true,
      netlifyFunctionsPrepared: true,
      transactionalMailPrepared: true,
      workflowServerPrepared: true,
      centralBackupPrepared: true,
      serverAuditPrepared: true
    })
  });

  function getConfig(){ return config; }
  function isBackendEnabled(){ return config.backendEnabled === true; }
  function getFeatureFlag(name){ return !!config.featureFlags[name]; }
  function getStorageMode(){ return config.storageMode || 'local'; }
  function getVersionInfo(){ return versionInfo; }

  root.config = config;
  root.getConfig = getConfig;
  root.isBackendEnabled = isBackendEnabled;
  root.getFeatureFlag = getFeatureFlag;
  root.getStorageMode = getStorageMode;
  root.getVersionInfo = getVersionInfo;
})(window);
