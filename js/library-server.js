(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};

  function isServerLibraryEnabled(){
    return !!(root.apiClient?.isEnabled?.() && root.getFeatureFlag?.('libraryServerEnabled'));
  }

  function toQueryString(filters){
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key,value]) => {
      if (value === undefined || value === null || value === '') return;
      params.set(key, String(value));
    });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

  async function safeCall(callback, fallback){
    if (!isServerLibraryEnabled()) return fallback;
    try { return await callback(); }
    catch (error) {
      console.warn('[DL Creator] Bibliothèque serveur indisponible:', error?.message || error);
      return fallback;
    }
  }

  function listServerLibrary(filters){
    return safeCall(() => root.apiClient.apiGet(`/library${toQueryString(filters)}`), { items:[], total:0, disabled:true });
  }

  function getServerLibraryDL(id){
    if (!id) return Promise.resolve(null);
    return safeCall(() => root.apiClient.apiGet(`/library/${encodeURIComponent(id)}`), null);
  }

  function getNewLibraryCount(){
    return safeCall(() => root.apiClient.apiGet('/library/stats/new-count').then(data => Number(data?.count || 0)), 0);
  }

  function markLibraryDLViewed(id){
    if (!id) return Promise.resolve({ ok:false, disabled:!isServerLibraryEnabled() });
    return safeCall(() => root.apiClient.apiPost(`/library/${encodeURIComponent(id)}/mark-viewed`, {}), { ok:false, disabled:true });
  }

  function getLibraryFilterOptions(){
    return safeCall(() => root.apiClient.apiGet('/library/filters/options'), { domains:[], themes:[], subthemes:[], publicTargets:[], versions:[], disabled:true });
  }

  function formatLibraryNotice(count){
    const n = Number(count || 0);
    if (n <= 0) return '';
    return `${n} DL ${n > 1 ? 'ont été ajoutées' : 'a été ajoutée'} à la bibliothèque depuis votre dernière connexion.`;
  }

  root.LibraryServer = {
    isServerLibraryEnabled,
    listServerLibrary,
    getServerLibraryDL,
    getNewLibraryCount,
    markLibraryDLViewed,
    getLibraryFilterOptions,
    formatLibraryNotice
  };
})(window);
