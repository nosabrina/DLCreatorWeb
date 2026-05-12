(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};

  function cfg(){ return root.getConfig ? root.getConfig() : {}; }
  function isAdminDashboardEnabled(){
    const c = cfg();
    return c.backendEnabled === true && root.getFeatureFlag?.('adminDashboardEnabled') === true && !!root.apiClient?.isEnabled?.();
  }
  async function guardedGet(path){
    if(!isAdminDashboardEnabled()) return null;
    return root.apiClient.apiGet(path);
  }
  function query(params){
    const entries = Object.entries(params || {}).filter(([,v]) => v !== undefined && v !== null && v !== '');
    return entries.length ? '?' + new URLSearchParams(entries).toString() : '';
  }
  function formatDashboardStatusLabel(status){
    return ({
      draft:'Brouillon',
      assigned:'Assignée',
      in_progress:'En rédaction',
      submitted:'Soumise à validation',
      rejected:'Refusée',
      validated_private:'Validée privée',
      validated_library:'Publiée bibliothèque',
      archived:'Archivée',
      unknown:'Statut inconnu'
    })[status] || 'Statut inconnu';
  }
  function formatLateLabel(item){
    if(!item) return '';
    const days = Number(item.daysLate || 0);
    const suffix = days > 1 ? 'jours' : 'jour';
    return `${item.title || 'DL'} — ${days} ${suffix} de retard`;
  }

  function getAdminDashboardSummary(){ return guardedGet('/admin/dashboard/summary'); }
  function getAdminDashboardByStatus(){ return guardedGet('/admin/dashboard/by-status'); }
  function getAdminDashboardByResponsible(options){ return guardedGet('/admin/dashboard/by-responsible' + query(options)); }
  function getLateDocuments(){ return guardedGet('/admin/dashboard/late'); }
  function getRecentActivity(options){ return guardedGet('/admin/dashboard/recent-activity' + query(options)); }
  function getUsersActivity(options){ return guardedGet('/admin/dashboard/users-activity' + query(options)); }
  function getDLTimeline(dlId){
    if(!dlId || !isAdminDashboardEnabled()) return null;
    return root.apiClient.apiGet('/admin/dashboard/dl/' + encodeURIComponent(dlId) + '/timeline');
  }
  async function exportAdminDashboard(format){
    if(!isAdminDashboardEnabled()) return null;
    const selected = format === 'csv' ? 'csv' : 'json';
    if(selected === 'json') return root.apiClient.apiGet('/admin/dashboard/export?format=json');
    const token = root.apiClient.getAccessToken ? root.apiClient.getAccessToken() : '';
    const c = cfg();
    const base = String(c.apiBaseUrl || '').replace(/\/$/, '');
    const response = await fetch(base + '/admin/dashboard/export?format=csv', { headers:{ ...(token ? { Authorization:'Bearer ' + token } : {}) }, credentials:'include' });
    if(!response.ok) throw new Error('Export dashboard Admin impossible');
    return response.text();
  }

  root.AdminDashboard = {
    isAdminDashboardEnabled,
    getAdminDashboardSummary,
    getAdminDashboardByStatus,
    getAdminDashboardByResponsible,
    getLateDocuments,
    getRecentActivity,
    getUsersActivity,
    getDLTimeline,
    exportAdminDashboard,
    formatDashboardStatusLabel,
    formatLateLabel
  };
})(window);
