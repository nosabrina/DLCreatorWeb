(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  const KEY='DL_CREATOR_WEB_AUDIT_LOCAL_V2';
  const LEGACY='DL_CREATOR_WEB_AUDIT_LOCAL_V1';
  const LEVELS=['INFO','WARN','ERROR','SECURITY','AUDIT','WORKFLOW'];
  const ACTIONS=['login','logout','creation','modification','suppression','validation','validation-hiérarchique','validation-signature','refus-validation','publication','publication-bloquée','archivage','partage','backup','restore','permission-denied','permission-refusée-détaillée','user-create','user-update','user-deactivate','users-import','workflow-transition','workflow-transition-refused','workflow-comment','role-change','import','export','critical-error','security-error','verrouillage-document','conflit-détecté','résolution-préparatoire','ownership-modifié','session-verrouillée','session-expirée','diagnostic-sécurité','connexion-tracée','migration-version','storage-save','sauvegarde-bibliothèque','audit-purge'];
  const THROTTLED_ACTIONS=new Set(['storage-save','sauvegarde-bibliothèque','migration-version']);
  const THROTTLE_MS=30000;
  function now(){return new Date().toISOString();}
  function version(){return root.getVersionInfo?.().version||'v9.00';}
  function stableDetails(details){
    try{ return JSON.stringify(details||{}, Object.keys(details||{}).sort()); }catch{return String(details||'');}
  }
  function list(){try{let raw=localStorage.getItem(KEY)||localStorage.getItem(LEGACY)||'[]';const rows=JSON.parse(raw);return Array.isArray(rows)?rows:[];}catch{return []}}
  function persist(rows){try{localStorage.setItem(KEY,JSON.stringify((rows||[]).slice(-1500)));}catch{}}
  function shouldMerge(last,action,details,lvl){
    if(!last || !THROTTLED_ACTIONS.has(action)) return false;
    if(last.action!==action || last.level!==lvl) return false;
    const delta=Date.now()-Date.parse(last.createdAtUTC||0);
    if(!Number.isFinite(delta) || delta>THROTTLE_MS) return false;
    const lastComparable={...(last.details||{})};
    delete lastComparable.occurrences; delete lastComparable.lastAtUTC; delete lastComparable.correlationId;
    const nextComparable={...(details||{})};
    delete nextComparable.correlationId;
    return stableDetails(lastComparable)===stableDetails(nextComparable);
  }
  function write(action,details,level){
    const act=String(action||'event');
    const lvl=LEVELS.includes(String(level||'AUDIT').toUpperCase())?String(level||'AUDIT').toUpperCase():'AUDIT';
    const rows=list();
    const last=rows[rows.length-1];
    if(shouldMerge(last,act,details,lvl)){
      last.details=Object.assign({}, last.details||{}, {occurrences:Number(last.details?.occurrences||1)+1,lastAtUTC:now()});
      persist(rows);
      return rows.length;
    }
    rows.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),action:act,category:ACTIONS.includes(act)?act:'custom',details:details||{},level:lvl,createdAtUTC:now(),version:version(),mode:root.getConfig?.().productionMode||'pilote',authType:root.sessionService?.describe?.().authType||'local',correlationId:details?.correlationId||('loc-'+Date.now().toString(36))});
    persist(rows);
    return rows.length;
  }
  function purge(){const before=list().length;persist([]);try{localStorage.setItem(KEY+'_LAST_PURGE',JSON.stringify({atUTC:now(),before,version:version()}));}catch{}return 0;}
  function exportFiltered(filters){let rows=list();if(filters?.level)rows=rows.filter(x=>x.level===filters.level);if(filters?.action)rows=rows.filter(x=>x.action===filters.action);if(filters?.dlId)rows=rows.filter(x=>x.details?.dlId===filters.dlId);return JSON.stringify({schema:'dl.creator.audit.v4',version:version(),exportedAtUTC:now(),filters:filters||{},items:rows},null,2);}
  root.auditService={enabled:true,mode:'local',levels:LEVELS,actions:ACTIONS,list,write,purge,export(){return exportFiltered({});},exportFiltered,diagnostic(){const rows=list();return{count:rows.length,serverPrepared:true,serverEnabled:false,rotation:'1500 derniers événements avec purge contrôlée + anti-duplication 30s',filters:['ownership','publication','validation','conflits','utilisateur','workflow','sécurité','stockage'],levels:LEVELS,exportJson:true,purgeSecure:true,collaborativeAudit:true,throttlingMs:THROTTLE_MS}}};
})(window);
