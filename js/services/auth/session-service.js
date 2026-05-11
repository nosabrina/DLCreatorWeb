(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  const DEFAULT_TIMEOUT_MIN=8*60;
  function now(){return Date.now();}
  function iso(ms){return ms?new Date(ms).toISOString():null;}
  function read(){return root.authState?.read?.()||{};}
  function write(p){root.authState?.write?.(p);return read();}
  function startLocal(user,opts){const timeoutMin=Number(opts?.timeoutMin||DEFAULT_TIMEOUT_MIN);const remember=opts?.remember===true;const expiresAt=remember?null:iso(now()+timeoutMin*60000);const state={authType:'local',mode:'local',user:user||'local',rememberSession:remember,startedAt:new Date().toISOString(),lastActivityAt:new Date().toISOString(),expiresAt,timeoutMin};write(state);root.auditService?.write?.('login',{authType:'local',rememberSession:remember},'AUDIT');return state;}
  function touch(){const s=read();if(!s.startedAt)return s;s.lastActivityAt=new Date().toISOString();write(s);return s;}
  function isExpired(){const s=read();return !!(s.expiresAt&&Date.parse(s.expiresAt)<now());}
  function describe(){const state=read();const vi=root.getVersionInfo?.()||{};const expired=isExpired();return{label:(state.authType||'local')+' · '+(expired?'session expirée':'session navigateur'),authType:state.authType||'local',mode:state.mode||'local',rememberSession:state.rememberSession===true,startedAt:state.startedAt||null,lastActivityAt:state.lastActivityAt||null,expiresAt:state.expiresAt||null,expired,timeoutMin:state.timeoutMin||DEFAULT_TIMEOUT_MIN,version:vi.version||'v9.00',serverPrepared:true,serverEnabled:false,refreshTokenPrepared:true,jwtPrepared:true};}
  function logout(){root.auditService?.write?.('logout',{authType:read().authType||'local'},'AUDIT');root.tokenService?.clearTokens?.();root.authState?.clear?.();}
  root.sessionService={describe,startLocal,touch,isExpired,logout,refresh:async()=>({ok:false,message:'Refresh token serveur préparé, désactivé en v9.00.'}),revoke:async()=>({ok:false,message:'Revoke serveur préparé, désactivé en v9.00.'})};
})(window);
