(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};

  const STATUS_LABELS = Object.freeze({
    draft: 'Brouillon',
    assigned: 'Attribuée',
    in_progress: 'En rédaction',
    submitted: 'Soumise à validation',
    rejected: 'Refusée / à corriger',
    validated_private: 'Validée privée',
    validated_library: 'Validée bibliothèque',
    archived: 'Archivée'
  });

  function isWorkflowEnabled(){
    return !!(root.apiClient?.isEnabled?.() && root.getFeatureFlag?.('workflowServerEnabled'));
  }

  async function postWorkflow(path, body){
    if(!isWorkflowEnabled()) return { skipped:true, reason:'workflow-disabled' };
    return root.apiClient.apiPost(path, body || {});
  }

  async function getWorkflow(path){
    if(!isWorkflowEnabled()) return { skipped:true, reason:'workflow-disabled', items:[] };
    return root.apiClient.apiGet(path);
  }

  function assignDL(dlId, assignedToUserId, comment){ return postWorkflow(`/dl/${encodeURIComponent(dlId)}/assign`, { assignedToUserId, comment }); }
  function submitDL(dlId, comment){ return postWorkflow(`/dl/${encodeURIComponent(dlId)}/submit`, { comment }); }
  function rejectDL(dlId, comment){ return postWorkflow(`/dl/${encodeURIComponent(dlId)}/reject`, { comment }); }
  function validateDLPrivate(dlId, comment){ return postWorkflow(`/dl/${encodeURIComponent(dlId)}/validate-private`, { comment }); }
  function validateDLLibrary(dlId, comment){ return postWorkflow(`/dl/${encodeURIComponent(dlId)}/validate-library`, { comment }); }
  function archiveDL(dlId, comment){ return postWorkflow(`/dl/${encodeURIComponent(dlId)}/archive`, { comment }); }
  function getDLHistory(dlId){ return getWorkflow(`/dl/${encodeURIComponent(dlId)}/history`); }
  function getDLComments(dlId){ return getWorkflow(`/dl/${encodeURIComponent(dlId)}/comments`); }
  function getWorkflowStatusLabel(status){ return STATUS_LABELS[status] || status || 'Statut inconnu'; }

  root.validationWorkflow = {
    assignDL,
    submitDL,
    rejectDL,
    validateDLPrivate,
    validateDLLibrary,
    archiveDL,
    getDLHistory,
    getDLComments,
    getWorkflowStatusLabel,
    isWorkflowEnabled
  };
})(window);
