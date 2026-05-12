(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};
  const functions = Object.freeze([
    'auth-login','auth-refresh','users-invite','workflow-submit','workflow-validate','notifications-send','diagnostics-ping'
  ]);
  const templates = Object.freeze(['invitation','reset-password','validation-demandee','validation-refusee','publication-validee','rappel-validation']);
  function list(){
    return functions.map(name=>({name,path:'/.netlify/functions/'+name,enabled:false,prepared:true,status:'prepared',timeoutMs:10000,offlineFallback:true,destructive:false,writesData:false,requiresFrontendSecret:false}));
  }
  function diagnostic(last){
    return {schema:'dl.creator.netlify.functions.v2',version:root.getVersionInfo?.().version||'v9.10',enabled:false,prepared:true,total:functions.length,items:list(),mode:'prepared-disabled',fallbackOffline:true,diagnosticMode:true,lastDiagnostic:(last || root.functionsRegistry?._lastDiagnostic || null),templatesPrepared:templates,providersPrepared:['Postmark','SendGrid','Mailgun']};
  }
  async function runDiagnostic(){
    const result=await (root.pilotApiClient?.diagnosticPing?.() || Promise.resolve({status:'prepared',reachable:false,message:'Client API non chargé'}));
    root.functionsRegistry._lastDiagnostic=result;
    return result;
  }
  root.functionsRegistry = {functions, list, diagnostic, runDiagnostic, _lastDiagnostic:null};
})(window);
