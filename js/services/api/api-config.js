(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  function fromMeta(name){return document.querySelector(`meta[name="${name}"]`)?.content||'';}
  function getApiConfig(){const cfg=root.getConfig?.()||{};const vi=root.getVersionInfo?.()||{};const env=cfg.environment||vi.environment||fromMeta('dl-environment')||'local';return{enabled:cfg.backendEnabled===true,mode:env,baseUrl:cfg.apiBaseUrl||'/.netlify/functions',timeoutMs:Number(cfg.apiTimeoutMs||10000),retries:1,version:cfg.apiVersion||vi.apiVersion||'2026-05-pilot-v7',offlineFallback:true,remoteSyncEnabled:cfg.featureFlags?.remoteStorageEnabled===true};}
  function validateCritical(){const c=getApiConfig();return{ok:!!c.baseUrl&&!!c.version,warnings:[c.enabled?'Backend actif pilote — contrôler Netlify Functions':'Backend désactivé — mode local/offline-first prioritaire'],config:c};}
  root.apiConfig={getApiConfig,validateCritical};
})(window);
