(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  const JOURNAL_KEY='DL_CREATOR_WEB_MIGRATION_JOURNAL_V881';
  const STORAGE_JOURNAL_KEY='DL_CREATOR_WEB_STORAGE_JOURNAL_V881';
  const LEGACY_KEYS=['DL_CREATOR_WEB_MIGRATION_JOURNAL_V880','DL_CREATOR_WEB_MIGRATION_JOURNAL_V870','DL_CREATOR_WEB_MIGRATION_JOURNAL_V860'];
  const STATE_KEY='DL_CREATOR_WEB_MIGRATION_STATE';
  const STORAGE_THROTTLE_MS=30000;
  function now(){return new Date().toISOString();}
  function version(){return root.getVersionInfo?.().version||root.config?.appVersion||'v9.00';}
  function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch{return fallback;}}
  function persistKey(key,rows,max){try{localStorage.setItem(key,JSON.stringify((rows||[]).slice(-(max||300))));}catch{}}
  function journal(){let rows=readJson(JOURNAL_KEY,null);if(!Array.isArray(rows)){rows=[];LEGACY_KEYS.forEach(k=>{const r=readJson(k,[]);if(Array.isArray(r))rows=rows.concat(r);});}return rows.slice(-300);}
  function storageJournal(){const rows=readJson(STORAGE_JOURNAL_KEY,[]);return Array.isArray(rows)?rows.slice(-200):[];}
  function writeMigration(event,details,level){
    const rows=journal();
    const item={id:'mig-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),event:String(event||'migration'),category:'migration',level:String(level||'INFO').toUpperCase(),details:details||{},version:version(),atUTC:now(),offlineFirst:true,destructive:false};
    rows.push(item); persistKey(JOURNAL_KEY,rows,300);
    root.auditService?.write?.('migration-version',item,item.level==='ERROR'?'ERROR':'AUDIT');
    return item;
  }
  function writeStorage(event,details,level){
    const rows=storageJournal();
    const item={id:'sto-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),event:String(event||'storage-save'),category:'storage',level:String(level||'INFO').toUpperCase(),details:details||{},version:version(),atUTC:now(),offlineFirst:true,destructive:false};
    const last=rows[rows.length-1];
    const delta=last ? Date.now()-Date.parse(last.atUTC||0) : Infinity;
    if(last && last.event===item.event && last.level===item.level && delta<STORAGE_THROTTLE_MS && JSON.stringify(last.details||{})===JSON.stringify(item.details||{})){
      last.occurrences=Number(last.occurrences||1)+1;
      last.lastAtUTC=now();
      persistKey(STORAGE_JOURNAL_KEY,rows,200);
      return last;
    }
    rows.push(item); persistKey(STORAGE_JOURNAL_KEY,rows,200);
    root.auditService?.write?.('storage-save',details,item.level==='ERROR'?'ERROR':'INFO');
    return item;
  }
  function write(event,details,level){
    const ev=String(event||'');
    if(ev==='sauvegarde-bibliothèque' || ev==='storage-save') return writeStorage('sauvegarde-bibliothèque',details,level);
    return writeMigration(ev||'migration',details,level);
  }
  function storageSnapshot(){const keys=['DL_CREATOR_WEB_LIBRARY','DL_CREATOR_WEB_AUDIT_LOCAL_V2','DL_CREATOR_WEB_USERS_V2','DL_CREATOR_WEB_AUTH_STATE','DL_CREATOR_WEB_KEYWORDS','DL_CREATOR_COLLAB_SYNC_JOURNAL_V860'];const local={};keys.forEach(k=>{try{const raw=localStorage.getItem(k);local[k]={present:raw!=null,bytes:raw?raw.length:0};}catch{local[k]={present:false,error:true};}});return {localStorage:!!window.localStorage,indexedDB:!!window.indexedDB,keys:local};}
  function recordStartupMigration(library){const state=readJson(STATE_KEY,{});const current=version();const previous=state.currentVersion||state.lastVersion||null;const changed=previous!==current;const snapshot=storageSnapshot();const details={from:previous||'première ouverture locale',to:current,changed,libraryCount:Array.isArray(library)?library.length:0,snapshot};if(changed){writeMigration('migration-version-détectée',details,'INFO');}try{localStorage.setItem(STATE_KEY,JSON.stringify({currentVersion:current,previousVersion:previous,lastMigrationAtUTC:changed?now():(state.lastMigrationAtUTC||now()),libraryCount:details.libraryCount,migrationOk:true}));}catch{}return {ok:true,currentVersion:current,previousVersion:previous,changed,libraryCount:details.libraryCount,snapshot,journalCount:journal().length};}
  function diagnostic(library){const state=readJson(STATE_KEY,{});return {schema:'dl.creator.migration.diagnostic.v4',ok:state.migrationOk!==false,currentVersion:version(),previousVersion:state.previousVersion||null,lastMigrationAtUTC:state.lastMigrationAtUTC||null,libraryCount:Array.isArray(library)?library.length:(state.libraryCount||0),journalEntries:journal().length,storageJournalEntries:storageJournal().length,localStorage:!!window.localStorage,indexedDB:!!window.indexedDB,silentMigrations:true,destructiveMigration:false,upgradePersistenceHardened:true,compatibilityAscending:true,categories:['migration','storage'],storageThrottlingMs:STORAGE_THROTTLE_MS};}
  root.migrationService={journal,storageJournal,write,writeMigration,writeStorage,recordStartupMigration,diagnostic,storageSnapshot};
})(window);
