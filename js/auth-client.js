(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};
  const PROFILE_KEY='DL_CREATOR_WEB_PROFILE_V1';
  const SESSION_KEY='DL_CREATOR_WEB_SESSION_V1';
  const SERVER_USER_KEY='DL_CREATOR_SERVER_USER_V1';
  const REFRESH_TOKEN_KEY='DL_CREATOR_SERVER_REFRESH_TOKEN_V1';

  function readJson(key,fallback,storage){ try{ return JSON.parse((storage||localStorage).getItem(key)||'') || fallback; }catch{ return fallback; } }
  function writeJson(key,value,storage){ (storage||localStorage).setItem(key, JSON.stringify(value)); }
  function profileIdentifier(profile){ return String(profile?.identifier || profile?.nip || '').trim(); }
  function getLegacyProfile(){ return readJson(PROFILE_KEY,null); }
  function getCurrentUser(){
    const serverUser=getServerUser();
    if(serverUser) return serverUser;
    const profile=getLegacyProfile();
    const session=localStorage.getItem(SESSION_KEY);
    return profile && profileIdentifier(profile) === session ? profile : null;
  }
  function isAuthenticated(){ return !!getCurrentUser(); }
  function getCurrentUserRole(){ return getCurrentUser()?.role || 'creator'; }
  function hasPermission(permission){ return !!root.permissions?.roleHasPermission(getCurrentUserRole(), permission); }
  function getServerUser(){ return readJson(SERVER_USER_KEY,null,sessionStorage); }
  function setServerSession(payload){
    if(payload?.accessToken) root.apiClient?.setAccessToken(payload.accessToken);
    if(payload?.refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
    if(payload?.user) writeJson(SERVER_USER_KEY, payload.user, sessionStorage);
  }
  function clearServerSession(){ root.apiClient?.setAccessToken(''); sessionStorage.removeItem(SERVER_USER_KEY); sessionStorage.removeItem(REFRESH_TOKEN_KEY); }

  async function loginLegacy(username,password){
    return { ok:false, mode:'legacy', message:'Le login legacy reste géré par app.js afin de ne pas modifier le comportement existant.', username, passwordProvided: !!password };
  }
  function logoutLegacy(){ localStorage.removeItem(SESSION_KEY); return true; }
  async function loginServer(username,password){
    const data=await root.apiClient.apiPost('/auth/login',{ username, password },{ storeAccessToken:true });
    setServerSession(data);
    return data;
  }
  async function logoutServer(){
    const refreshToken=sessionStorage.getItem(REFRESH_TOKEN_KEY) || undefined;
    try{ if(root.apiClient?.getAccessToken()) await root.apiClient.apiPost('/auth/logout',{ refreshToken }); }
    finally{ clearServerSession(); }
    return { ok:true };
  }
  async function getServerCurrentUser(){
    const data=await root.apiClient.apiGet('/auth/me');
    if(data?.user) writeJson(SERVER_USER_KEY, data.user, sessionStorage);
    return data?.user || null;
  }

  root.authClient = { getCurrentUser, isAuthenticated, getCurrentUserRole, hasPermission, loginLegacy, logoutLegacy, loginServer, logoutServer, getServerCurrentUser, getServerUser, clearServerSession };
})(window);
