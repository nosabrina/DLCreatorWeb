(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};const KEY='DL_CREATOR_SYNC_QUEUE_V830';
  function list(){try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch{return[];}}
  function save(rows){try{localStorage.setItem(KEY,JSON.stringify(rows.slice(-500)));}catch{}}
  function checksum(value){return root.storageAdapter?.checksum?.(value)||String(JSON.stringify(value||{}).length)+'-'+Date.now();}
  function enqueue(action,payload,meta){const rows=list();rows.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),action,payload,checksum:checksum(payload),owner:meta?.owner||'local',documentVersion:meta?.documentVersion||null,createdAtUTC:new Date().toISOString(),updatedAtUTC:new Date().toISOString(),attempts:0,nextRetryAtUTC:null,status:'pending'});save(rows);return rows.length;}
  function markRetry(id,error){const rows=list().map(r=>r.id===id?{...r,attempts:(r.attempts||0)+1,lastError:String(error||''),nextRetryAtUTC:new Date(Date.now()+Math.min(3600000,60000*Math.pow(2,r.attempts||0))).toISOString(),status:'retry'}:r);save(rows);}
  function diagnostic(){const rows=list();return{pending:rows.filter(x=>x.status==='pending').length,retry:rows.filter(x=>x.status==='retry').length,total:rows.length,enabled:false,remoteSyncEnabled:false,prepared:true,conflictsPrepared:true,rotation:'500 derniers éléments'};}
  root.syncQueueService={list,enqueue,markRetry,clear:()=>save([]),diagnostic};
})(window);
