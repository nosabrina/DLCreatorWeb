(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};
  function manifest(payload){
    return {schema:'dl.creator.backup.manifest.v1',version:root.getVersionInfo?.().version||'v9.00',createdAtUTC:new Date().toISOString(),contains:Object.keys(payload||{}),zipPrepared:true,restoreGuided:true,destructive:false};
  }
  function buildPayload(parts){
    const payload={library:parts?.library||[],audit:parts?.audit||[],users:parts?.users||[],workflow:parts?.workflow||[],diagnostics:parts?.diagnostics||{},environment:root.getVersionInfo?.()||{}};
    return {manifest:manifest(payload),payload};
  }
  function diagnostic(){return {schema:'dl.creator.backup.zip.v1',prepared:true,enabled:false,restoreGuided:true,compatibilityCheck:true,corruptionProtection:true,fallbackRestore:true};}
  root.backupZipService={manifest,buildPayload,diagnostic};
})(window);
