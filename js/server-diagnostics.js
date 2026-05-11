(function(window, document){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};
  function cfg(){ return root.getConfig ? root.getConfig() : {}; }
  function flag(name){ return root.getFeatureFlag ? root.getFeatureFlag(name) : !!cfg().featureFlags?.[name]; }
  function enabled(){ const c=cfg(); return c.backendEnabled === true && c.serverDiagnosticsEnabled === true; }
  function safe(value){ try { return JSON.stringify(value, null, 2); } catch { return String(value); } }
  function log(panel, label, value){ panel.querySelector('pre').textContent = `[${new Date().toLocaleTimeString()}] ${label}\n${safe(value)}\n\n` + panel.querySelector('pre').textContent; }
  function logError(panel, label, err){ log(panel, label, { error:err.message || String(err), status:err.status || null }); }
  function makeButton(label, fn){ const b=document.createElement('button'); b.type='button'; b.textContent=label; b.style.margin='2px'; b.addEventListener('click', fn); return b; }
  function currentDL(){ return window.currentDL || window.dl || root.currentDL || { id:'diagnostic-'+Date.now(), title:'DL diagnostic Phase 8', domain:'TEST', jsonData:{ diagnostic:true, createdAt:new Date().toISOString() } }; }
  function needApi(panel){ if(!root.apiClient){ log(panel, 'API client indisponible', { error:'js/api-client.js non chargé' }); return false; } return true; }
  function init(){
    if(!enabled()) return;
    const panel=document.createElement('div');
    panel.id='server-diagnostics-panel';
    panel.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;background:#fff;border:1px solid #999;border-radius:8px;padding:10px;max-width:460px;box-shadow:0 4px 18px rgba(0,0,0,.2);font:12px Arial,sans-serif;';
    panel.innerHTML='<strong>Diagnostic serveur Phase 8</strong><div style="margin:4px 0;color:#555">Visible uniquement si backendEnabled + serverDiagnosticsEnabled.</div><div class="actions"></div><pre style="max-height:190px;overflow:auto;background:#f6f6f6;padding:6px;white-space:pre-wrap"></pre>';
    const actions=panel.querySelector('.actions');
    actions.appendChild(makeButton('Health', async()=>{ try{ if(!needApi(panel)) return; log(panel, 'Health', await root.apiClient.apiGet('/health')); }catch(e){ logError(panel, 'Health erreur', e); } }));
    actions.appendChild(makeButton('Login', async()=>{ const u=prompt('Identifiant serveur'); const p=prompt('Mot de passe serveur'); if(!u||!p) return; try{ log(panel, 'Login serveur', await root.authClient.loginServer(u,p)); }catch(e){ logError(panel, 'Login erreur', e); } }));
    actions.appendChild(makeButton('Me', async()=>{ try{ log(panel, 'Utilisateur serveur', await root.authClient.getServerCurrentUser()); }catch(e){ logError(panel, 'Me erreur', e); } }));
    if(flag('dlServerStorageEnabled')){
      actions.appendChild(makeButton('Save DL', async()=>{ try{ log(panel, 'Sauvegarde DL serveur', await root.dlStorageApi.saveDLServer(currentDL())); }catch(e){ logError(panel, 'Save erreur', e); } }));
      actions.appendChild(makeButton('List DL', async()=>{ try{ log(panel, 'Liste DL serveur', await root.dlStorageApi.listDLServer()); }catch(e){ logError(panel, 'List erreur', e); } }));
    }
    if(flag('workflowServerEnabled') && root.validationWorkflow?.isWorkflowEnabled?.()){
      actions.appendChild(makeButton('History DL', async()=>{ const id=prompt('ID DL'); if(!id) return; try{ log(panel, 'Historique workflow', await root.validationWorkflow.getDLHistory(id)); }catch(e){ logError(panel, 'History erreur', e); } }));
      actions.appendChild(makeButton('Submit DL', async()=>{ const id=prompt('ID DL'); if(!id) return; try{ log(panel, 'Soumission workflow', await root.validationWorkflow.submitDL(id, 'Soumission diagnostic Phase 8')); }catch(e){ logError(panel, 'Submit erreur', e); } }));
    }
    if(flag('libraryServerEnabled') && root.LibraryServer?.isServerLibraryEnabled?.()){
      actions.appendChild(makeButton('Library count', async()=>{ try{ log(panel, 'Nouveautés bibliothèque', await root.LibraryServer.getNewLibraryCount()); }catch(e){ logError(panel, 'Library count erreur', e); } }));
      actions.appendChild(makeButton('List library', async()=>{ try{ log(panel, 'Bibliothèque serveur', await root.LibraryServer.listServerLibrary({ limit:5 })); }catch(e){ logError(panel, 'Library list erreur', e); } }));
    }
    if(flag('adminDashboardEnabled') && root.AdminDashboard?.isAdminDashboardEnabled?.()){
      actions.appendChild(makeButton('Admin summary', async()=>{ try{ log(panel, 'Dashboard résumé', await root.AdminDashboard.getAdminDashboardSummary()); }catch(e){ logError(panel, 'Admin summary erreur', e); } }));
      actions.appendChild(makeButton('Admin status', async()=>{ try{ log(panel, 'Dashboard statuts', await root.AdminDashboard.getAdminDashboardByStatus()); }catch(e){ logError(panel, 'Admin status erreur', e); } }));
      actions.appendChild(makeButton('Admin late', async()=>{ try{ log(panel, 'Dashboard retards', await root.AdminDashboard.getLateDocuments()); }catch(e){ logError(panel, 'Admin late erreur', e); } }));
    }
    if(flag('notificationsEnabled')){
      actions.appendChild(makeButton('Notif dry-run', async()=>{ const to=prompt('E-mail destinataire test'); if(!to) return; try{ log(panel, 'Notification dry-run', await root.apiClient.apiPost('/admin/notifications/test-email', { to, subject:'Diagnostic DL Creator', text:'Dry-run diagnostic Phase 8', dryRun:true })); }catch(e){ logError(panel, 'Notif erreur', e); } }));
      actions.appendChild(makeButton('Rappels dry-run', async()=>{ try{ log(panel, 'Rappels dry-run', await root.apiClient.apiPost('/admin/notifications/run-reminders', { dryRun:true })); }catch(e){ logError(panel, 'Rappels erreur', e); } }));
    }
    document.body.appendChild(panel);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})(window, document);
