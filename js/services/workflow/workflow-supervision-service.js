(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};
  const terminalStates = ['validé','publié','archivé'];
  const allowedTransitions = {
    'brouillon':['en rédaction','archivé'],
    'en rédaction':['validation responsable domaine','archivé'],
    'validation responsable domaine':['validation chef formation','refus validation','corrections demandées'],
    'validation chef formation':['validation publication','refus validation','corrections demandées'],
    'validation publication':['validé','publication bloquée'],
    'validé':['publié','archivé'],
    'publié':['archivé'],
    'refus validation':['en rédaction','archivé'],
    'corrections demandées':['en rédaction','archivé'],
    'publication bloquée':['validation publication','archivé'],
    'archivé':[]
  };
  function stateOf(dl){return root.workflowService?.stateOf?.(dl) || String(dl?.workflow?.state || dl?.validation?.statut || 'brouillon').toLowerCase();}
  function detect(dl){
    const state=stateOf(dl); const issues=[];
    if(!allowedTransitions[state]) issues.push({level:'WARN',code:'workflow-state-unknown',state});
    if(terminalStates.includes(state) && dl?.collaboration?.editLock?.locked) issues.push({level:'WARN',code:'terminal-document-locked',state});
    if(dl?.workflow?.publicationStatus==='obsolète' && state!=='archivé') issues.push({level:'INFO',code:'obsolete-not-archived',state});
    return issues;
  }
  function diagnostic(library){
    const list=Array.isArray(library)?library:[]; const issues=list.flatMap(d=>detect(d).map(i=>({...i,dlId:d.id||''})));
    return {schema:'dl.creator.workflow.supervision.v1',prepared:true,total:list.length,issues,allowedTransitions,signaturePrepared:true,publicationDistributedPrepared:true,lockPrepared:true,offlineFirst:true};
  }
  root.workflowSupervisionService={allowedTransitions,stateOf,detect,diagnostic};
})(window);
