(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  const KEY='DL_CREATOR_USERS_V850';
  const LEGACY_KEYS=['DL_CREATOR_USERS_V830','DL_CREATOR_HABILITATIONS'];
  const ROLES=['admin','chefFormation','responsableDomaine','validateur','redacteur','lecteur'];
  function uid(){return 'usr-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);} 
  function now(){return new Date().toISOString();}
  function initials(name){return String(name||'Utilisateur').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('')||'U';}
  function normalizeRoles(v){const arr=Array.isArray(v)?v:[v||'lecteur'];return Array.from(new Set(arr.map(r=>root.rbacService?.normalizeRole?.(r)||String(r||'lecteur')).filter(r=>ROLES.includes(r))));}
  function normalizeUser(u){const fullName=String(u.fullName||u.nom||u.name||u.email||'Utilisateur local').trim();return {id:u.id||uid(),fullName,email:String(u.email||'').trim(),active:u.active!==false,status:u.active===false?'inactif':'actif',roles:normalizeRoles(u.roles||u.role||u.droitAcces),primaryRole:normalizeRoles(u.roles||u.role||u.droitAcces)[0]||'lecteur',profile:u.profile||u.fonction||'',avatarInitials:u.avatarInitials||initials(fullName),createdAt:u.createdAt||now(),updatedAt:u.updatedAt||now(),lastAccessAt:u.lastAccessAt||null,loginHistory:Array.isArray(u.loginHistory)?u.loginHistory.slice(-20):[],sessionLocked:u.sessionLocked===true,concurrentSessionPrepared:true,backendAuthPrepared:true,jwtPrepared:true,refreshTokenPrepared:true,mfaPrepared:true};}
  function seed(){return [normalizeUser({id:'local-admin',fullName:'Administrateur local',email:'',roles:['admin'],profile:'Compte pilote local',createdAt:now()})];}
  function read(){try{let raw=localStorage.getItem(KEY);if(!raw){for(const k of LEGACY_KEYS){raw=localStorage.getItem(k);if(raw)break;}}let rows=JSON.parse(raw||'[]');if(!Array.isArray(rows)) rows=[];return (rows.length?rows:seed()).map(normalizeUser);}catch{return seed();}}
  function write(rows){try{localStorage.setItem(KEY,JSON.stringify((rows||[]).map(normalizeUser)));}catch(e){root.auditService?.write?.('critical-error',{scope:'users.write',message:e.message},'ERROR');}}
  function list(){return read();}
  function get(id){return read().find(u=>u.id===id)||null;}
  function save(user){const rows=read();const normalized=normalizeUser(user||{});const i=rows.findIndex(u=>u.id===normalized.id);if(i>=0)rows[i]={...rows[i],...normalized,updatedAt:now()};else rows.push(normalized);write(rows);root.auditService?.write?.(i>=0?'user-update':'user-create',{userId:normalized.id,roles:normalized.roles},'AUDIT');return normalized;}
  function deactivate(id){const rows=read();const u=rows.find(x=>x.id===id);if(!u)return null;u.active=false;u.status='inactif';u.updatedAt=now();write(rows);root.auditService?.write?.('user-deactivate',{userId:id},'SECURITY');return u;}
  function recordLogin(id){const rows=read();const u=rows.find(x=>x.id===id)||rows[0];if(!u)return null;u.lastAccessAt=now();u.loginHistory=[...(u.loginHistory||[]),{at:u.lastAccessAt,mode:'local',userAgent:navigator.userAgent}].slice(-20);write(rows);return u;}
  function lockSession(id,locked=true){const u=get(id);if(!u)return null;u.sessionLocked=!!locked;return save(u);}
  function diagnostic(){const rows=read();return {schema:'dl.creator.users.diagnostic.v1',total:rows.length,active:rows.filter(u=>u.active).length,inactive:rows.filter(u=>!u.active).length,roles:ROLES.reduce((a,r)=>(a[r]=rows.filter(u=>u.roles.includes(r)).length,a),{}),backendAuthPrepared:true,jwtPrepared:true,refreshTokenPrepared:true,mfaPrepared:true,offlineFirst:true};}
  root.userService={list,get,save,deactivate,recordLogin,lockSession,diagnostic,normalizeUser,normalizeRoles,roles:ROLES};
})(window);
