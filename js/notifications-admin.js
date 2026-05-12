(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};
  function enabled(){
    return !!(root.isBackendEnabled && root.isBackendEnabled() && root.getFeatureFlag && root.getFeatureFlag('notificationsEnabled'));
  }
  function client(){ return root.apiClient || root.api || null; }
  async function apiGet(path){
    if (!enabled()) return { skipped:true, reason:'notifications_disabled' };
    const c = client();
    if (!c || typeof c.apiGet !== 'function') return { skipped:true, reason:'api_client_missing' };
    return c.apiGet(path);
  }
  async function apiPost(path, body){
    if (!enabled()) return { skipped:true, reason:'notifications_disabled' };
    const c = client();
    if (!c || typeof c.apiPost !== 'function') return { skipped:true, reason:'api_client_missing' };
    return c.apiPost(path, body || {});
  }
  function qs(filters){ const p = new URLSearchParams(); Object.entries(filters || {}).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); }); const s=p.toString(); return s ? `?${s}` : ''; }
  const notificationsAdmin = {
    isNotificationsEnabled: enabled,
    getEmailLog(filters){ return apiGet(`/admin/notifications/email-log${qs(filters)}`); },
    testSmtp(){ return apiPost('/admin/notifications/test-smtp', {}); },
    testEmail(payload){ return apiPost('/admin/notifications/test-email', payload || {}); },
    runReminders(options){ return apiPost('/admin/notifications/run-reminders', options || {}); },
    getReminderRuns(filters){ return apiGet(`/admin/notifications/reminder-runs${qs(filters)}`); },
    formatNotificationStatus(status){ return ({ sent:'Envoyé', dry_run:'Simulation', failed:'Échec', skipped:'Ignoré', queued:'En attente' })[status] || String(status || 'Inconnu'); }
  };
  root.notificationsAdmin = notificationsAdmin;
})(window);
