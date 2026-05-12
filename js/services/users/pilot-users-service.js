(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{}; const KEY='DL_CREATOR_USERS_V850';
  const PILOT_PROFILES=[
    {id:'pilot-admin',fullName:'Administrateur pilote',roles:['admin'],profile:'Administration plateforme',domain:'Tous domaines'},
    {id:'pilot-chef-formation',fullName:'Chef formation pilote',roles:['chefFormation'],profile:'Validation finale formation',domain:'Formation'},
    {id:'pilot-responsable-domaine',fullName:'Responsable domaine pilote',roles:['responsableDomaine'],profile:'Validation domaine',domain:'FOBA'},
    {id:'pilot-validateur',fullName:'Validateur pilote',roles:['validateur'],profile:'Contrôle validation',domain:'Opérationnel'},
    {id:'pilot-redacteur',fullName:'Rédacteur pilote',roles:['redacteur'],profile:'Rédaction DL',domain:'Formation'},
    {id:'pilot-lecteur',fullName:'Lecteur pilote',roles:['lecteur'],profile:'Consultation',domain:'Tous domaines'}
  ];
  function now(){return new Date().toISOString();}
  function normalize(u){const base=root.userService?.normalizeUser?root.userService.normalizeUser(u||{}):Object.assign({},u);return Object.assign(base,{institutionalProfile:u?.institutionalProfile||u?.profile||base.profile||'',domain:u?.domain||u?.domaine||'Tous domaines',preferences:Object.assign({theme:'institutionnel',density:'standard',notifications:true},u?.preferences||{}),actionHistory:Array.isArray(u?.actionHistory)?u.actionHistory.slice(-100):[],session:Object.assign({inactiveAfterMinutes:60,expiresAtUTC:null,rotationPrepared:true,locked:u?.sessionLocked===true},u?.session||{}),security:Object.assign({lockout:false,failedAttempts:0,lastTraceAtUTC:null,connectionTrace:[]},u?.security||{}),futureDirectoryPrepared:true,futureSsoPrepared:true,futureAzureAdPrepared:true,futureEntraIdPrepared:true});}
  function seedPilots(){return PILOT_PROFILES.map(p=>normalize(Object.assign({active:true,createdAt:now(),updatedAt:now(),email:''},p)));}
  function list(){let rows=[];try{rows=JSON.parse(localStorage.getItem(KEY)||'[]');}catch{} if(!rows.length) rows=(root.userService?.list?.()||[]).map(normalize); if(!rows.length) rows=seedPilots(); return rows.map(normalize);}
  function saveAll(rows){try{localStorage.setItem(KEY,JSON.stringify((rows||[]).map(normalize)));}catch(e){root.auditService?.write?.('critical-error',{scope:'pilotUsers.saveAll',message:e.message},'ERROR');}}
  function ensurePilotProfiles(){const rows=list();const ids=new Set(rows.map(u=>u.id));let changed=false;seedPilots().forEach(p=>{if(!ids.has(p.id)){rows.push(p);changed=true;}}); if(changed)saveAll(rows); return rows;}
  function exportUsers(){return JSON.stringify({schema:'dl.creator.users.export.v2',version:root.getVersionInfo?.().version||'v9.00',exportedAtUTC:now(),items:list()},null,2);}
  function importUsers(payload){const data=typeof payload==='string'?JSON.parse(payload):payload;const items=Array.isArray(data?.items)?data.items:Array.isArray(data)?data:[];saveAll(items);root.auditService?.write?.('users-import',{count:items.length},'AUDIT');return list();}
  function backup(){const payload=exportUsers();try{localStorage.setItem('DL_CREATOR_USERS_BACKUP_V850',payload);}catch{}root.notificationService?.push?.('backup-terminé',{title:'Backup utilisateurs terminé',message:'Sauvegarde locale des comptes pilotes effectuée'});return payload;}
  function restore(){const raw=localStorage.getItem('DL_CREATOR_USERS_BACKUP_V850');if(!raw)return [];const rows=importUsers(raw);root.notificationService?.push?.('restauration-terminée',{title:'Restauration utilisateurs terminée',message:`${rows.length} compte(s) restauré(s)`});return rows;}
  function traceConnection(userId,event){const rows=list();const u=rows.find(x=>x.id===userId)||rows[0];if(!u)return null;u.security.connectionTrace=[...(u.security.connectionTrace||[]),{atUTC:now(),event:event||'session',userAgent:navigator.userAgent}].slice(-50);u.security.lastTraceAtUTC=now();u.actionHistory=[...(u.actionHistory||[]),{atUTC:now(),action:event||'session'}].slice(-100);saveAll(rows);root.auditService?.write?.('connexion-tracée',{userId:u.id,event:event||'session'},'SECURITY');return u;}
  function lockSession(userId,reason){const rows=list();const u=rows.find(x=>x.id===userId);if(!u)return null;u.session.locked=true;u.session.lockReason=reason||'Verrouillage sécurité';u.session.lockedAtUTC=now();saveAll(rows);root.auditService?.write?.('session-verrouillée',{userId:u.id,reason:u.session.lockReason},'SECURITY');return u;}
  function diagnostic(){const rows=ensurePilotProfiles();return {schema:'dl.creator.users.diagnostic.v2',total:rows.length,active:rows.filter(u=>u.active!==false).length,domains:Array.from(new Set(rows.map(u=>u.domain||'Tous domaines'))),sessionExpirationPrepared:true,tokenRotationPrepared:true,connectionTracePrepared:true,importExport:true,backupRestore:true,futureDirectoryPrepared:true,futureSsoPrepared:true,offlineFirst:true};}
  root.pilotUsersService={list,saveAll,ensurePilotProfiles,exportUsers,importUsers,backup,restore,traceConnection,lockSession,diagnostic};
})(window);
