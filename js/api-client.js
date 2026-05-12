(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};
  const ACCESS_TOKEN_KEY='DL_CREATOR_SERVER_ACCESS_TOKEN_V1';

  class ApiDisabledError extends Error{
    constructor(){ super('Backend désactivé. Aucun appel serveur effectué.'); this.name='ApiDisabledError'; }
  }

  function config(){ return root.getConfig ? root.getConfig() : { backendEnabled:false, apiBaseUrl:'', apiTimeoutMs:10000 }; }
  function isEnabled(){ return !!(root.isBackendEnabled && root.isBackendEnabled()); }
  function getAccessToken(){ return sessionStorage.getItem(ACCESS_TOKEN_KEY) || ''; }
  function setAccessToken(token){ token ? sessionStorage.setItem(ACCESS_TOKEN_KEY, token) : sessionStorage.removeItem(ACCESS_TOKEN_KEY); }
  function buildUrl(path){
    const cfg=config();
    const base=String(cfg.apiBaseUrl||'').replace(/\/$/,'');
    const clean=String(path||'').startsWith('/') ? String(path) : '/' + String(path||'');
    return base + clean;
  }

  async function apiRequest(method,path,body,options){
    if(!isEnabled()) throw new ApiDisabledError();
    const cfg=config();
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(), Number(cfg.apiTimeoutMs||10000));
    try{
      const token=getAccessToken();
      const headers={ 'Accept':'application/json', ...(body!==undefined?{'Content-Type':'application/json'}:{}), ...(token?{'Authorization':'Bearer '+token}:{}) };
      const response=await fetch(buildUrl(path),{ method, headers, body: body===undefined ? undefined : JSON.stringify(body), credentials:'include', signal:controller.signal });
      const text=await response.text();
      const data=text ? JSON.parse(text) : null;
      if(!response.ok){
        const err=new Error(data?.error || data?.message || `Erreur API ${response.status}`);
        err.status=response.status; err.payload=data; throw err;
      }
      if(options?.storeAccessToken && data?.accessToken) setAccessToken(data.accessToken);
      return data;
    }finally{ clearTimeout(timer); }
  }

  const apiGet = path => apiRequest('GET',path);
  const apiPost = (path,body,options) => apiRequest('POST',path,body,options);
  const apiPut = (path,body) => apiRequest('PUT',path,body);
  const apiDelete = path => apiRequest('DELETE',path);

  root.apiClient = { apiGet, apiPost, apiPut, apiDelete, apiRequest, ApiDisabledError, isEnabled, getAccessToken, setAccessToken };
})(window);
