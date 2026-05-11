(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  const namespace='documentsApi';
  async function request(path,options){
    const cfg=root.getConfig?root.getConfig():{};
    if(!cfg.backendEnabled || !root.apiClient){
      return {ok:false,offline:true,disabled:true,path,options:options||null,message:'Backend désactivé : fallback offline-first actif.'};
    }
    return root.apiClient.request ? root.apiClient.request(path,options||{}) : root.apiClient.apiGet(path);
  }
  root[namespace]={request};
})(window);
