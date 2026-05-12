(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  root.remoteStorageService={enabled:false,mode:'mock',async save(doc){root.syncQueueService?.enqueue?.('remote-save-prepared',doc,{owner:'local-browser',documentVersion:doc?.version});return {ok:false,offline:true,queued:true,message:'Stockage distant préparé mais désactivé en v9.00.'};},async load(){return {ok:false,offline:true,items:[],message:'Chargement distant désactivé par défaut.'};},diagnostic(){return{enabled:false,remoteSyncEnabled:false,adapter:'mock',fallbackOffline:true};}};
})(window);
