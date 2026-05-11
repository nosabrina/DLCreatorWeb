(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};
  const DB_NAME='DL_CREATOR_WEB_DB_V1';
  const STORE='library';

  function getStorageMode(){ return root.getStorageMode ? root.getStorageMode() : 'local'; }
  function isServerModeEnabled(){ return !!(root.getFeatureFlag && root.getFeatureFlag('dlServerStorageEnabled')) && !!(root.isBackendEnabled && root.isBackendEnabled()); }

  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)) return reject(new Error('IndexedDB indisponible'));
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{ const db=req.result; if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'id'}); };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error || new Error('Ouverture IndexedDB impossible'));
    });
  }

  async function listLocal(){
    const db=await openDb();
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly'); const req=tx.objectStore(STORE).getAll();
      req.onsuccess=()=>resolve(req.result || []); req.onerror=()=>reject(req.error || new Error('Lecture IndexedDB impossible'));
    });
  }
  async function saveLocal(dl){
    const d=root.dlModel?.normalizeDL ? root.dlModel.normalizeDL(root.dlModel.cloneDL(dl)) : JSON.parse(JSON.stringify(dl||{}));
    if(!d.id) throw new Error('Impossible de sauvegarder une DL sans identifiant.');
    const db=await openDb();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).put(d);
      tx.oncomplete=()=>resolve(true); tx.onerror=()=>reject(tx.error || new Error('Écriture IndexedDB impossible'));
    });
    return d;
  }
  async function loadLocal(id){ return (await listLocal()).find(dl=>String(dl.id)===String(id) || String(dl.referenceDL)===String(id)) || null; }
  async function deleteLocal(id){
    const target=await loadLocal(id); if(!target) return false;
    const db=await openDb();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).delete(target.id);
      tx.oncomplete=()=>resolve(true); tx.onerror=()=>reject(tx.error || new Error('Suppression IndexedDB impossible'));
    });
    return true;
  }

  function toServerPayload(dl){
    const d=dl || {};
    return {
      title: d.title || d.titre || d.referenceDL || d.id || 'DL sans titre',
      domain: d.domain || d.domaine || '',
      theme: d.theme || d.themeLabel || '',
      subtheme: d.subtheme || d.sousTheme || '',
      publicTarget: d.publicTarget || d.publicCible || d.public || '',
      jsonData: d
    };
  }
  async function saveDLServer(dl){ return root.apiClient.apiPost('/dl', toServerPayload(dl)); }
  async function updateDLServer(id,dl){ return root.apiClient.apiPut('/dl/'+encodeURIComponent(id), toServerPayload(dl)); }
  async function loadDLServer(id){ return root.apiClient.apiGet('/dl/'+encodeURIComponent(id)); }
  async function listDLServer(){ const data=await root.apiClient.apiGet('/dl'); return data?.items || []; }
  async function deleteDLServer(id){ return root.apiClient.apiDelete('/dl/'+encodeURIComponent(id)); }

  async function saveDL(dl){ return isServerModeEnabled() ? saveDLServer(dl) : saveLocal(dl); }
  async function loadDL(id){ return isServerModeEnabled() ? loadDLServer(id) : loadLocal(id); }
  async function listDL(){ return isServerModeEnabled() ? listDLServer() : listLocal(); }
  async function deleteDL(id){ return isServerModeEnabled() ? deleteDLServer(id) : deleteLocal(id); }
  async function exportDL(id){ const dl=await loadDL(id); return dl ? JSON.stringify(dl,null,2) : null; }
  async function importDL(json){ const dl=typeof json==='string' ? JSON.parse(json) : json; return saveDL(dl); }

  root.dlStorageApi = { saveDL, loadDL, listDL, deleteDL, exportDL, importDL, getStorageMode, isServerModeEnabled, saveDLServer, updateDLServer, loadDLServer, listDLServer, deleteDLServer };
})(window);
