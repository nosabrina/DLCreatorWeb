(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  const STATES=['brouillon','en rédaction','validation responsable domaine','validation chef formation','validation publication','refus validation','corrections demandées','publication bloquée','validé','publié','archivé'];
  const STEPS=[
    {id:'responsable-domaine',state:'validation responsable domaine',label:'Validation responsable domaine',permission:'workflow:validate:domain',next:'validation chef formation'},
    {id:'chef-formation',state:'validation chef formation',label:'Validation chef formation',permission:'workflow:validate:chief',next:'validation publication'},
    {id:'publication',state:'validation publication',label:'Validation publication',permission:'workflow:publish:distributed',next:'validé'}
  ];
  const TRANSITIONS={
    'brouillon':['en rédaction','validation responsable domaine','archivé'],
    'en rédaction':['validation responsable domaine','corrections demandées','archivé'],
    'validation responsable domaine':['validation chef formation','refus validation','corrections demandées','publication bloquée','archivé'],
    'validation chef formation':['validation publication','refus validation','corrections demandées','publication bloquée','archivé'],
    'validation publication':['validé','publié','refus validation','publication bloquée','corrections demandées','archivé'],
    'refus validation':['corrections demandées','en rédaction','archivé'],
    'publication bloquée':['corrections demandées','validation publication','archivé'],
    'corrections demandées':['en rédaction','validation responsable domaine','archivé'],
    'validé':['publié','corrections demandées','archivé'],
    'publié':['archivé'],
    'archivé':[]
  };
  function now(){return new Date().toISOString();}
  function uid(prefix){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);}
  function actor(opts){return opts?.by||opts?.user?.fullName||root.authState?.read?.().userProfile?.fullName||root.sessionService?.describe?.().authType||'local';}
  function stateOf(dl){return String(dl?.workflow?.state||dl?.validation?.statut||dl?.statut||'brouillon').trim().toLowerCase()||'brouillon';}
  function ensure(dl){
    if(!dl) return null;
    dl.workflow=dl.workflow||{};
    const state=STATES.includes(stateOf(dl))?stateOf(dl):'brouillon';
    dl.workflow=Object.assign({schema:'dl.creator.workflow.v3.distributed',state,ownerId:dl.ownerId||'',redacteurs:[],validateurs:[],responsables:[],history:[],comments:[],signatures:[],acknowledgements:[],refusals:[],lockedForValidation:false,lockedForPublication:false,validationLevel:0,distributedValidationPrepared:true,serverSignaturePrepared:true,remoteValidationPrepared:true,mfaValidationPrepared:true,serverTimestampPrepared:true,updatedAt:now()},dl.workflow||{});
    ['redacteurs','validateurs','responsables','history','comments','signatures','acknowledgements','refusals'].forEach(k=>{if(!Array.isArray(dl.workflow[k]))dl.workflow[k]=[];});
    dl.workflow.state=state;
    dl.workflow.lockedForValidation=state.startsWith('validation ');
    dl.workflow.lockedForPublication=['validation publication','publication bloquée','publié'].includes(state);
    dl.statut=state.charAt(0).toUpperCase()+state.slice(1);
    if(dl.validation) dl.validation.statut=dl.statut;
    return dl.workflow;
  }
  function currentStep(dl){const s=stateOf(dl);return STEPS.find(x=>x.state===s)||null;}
  function canTransition(dl,next){const current=stateOf(dl);return (TRANSITIONS[current]||[]).includes(String(next||'').toLowerCase());}
  function canValidateStep(dl,step,user){const required=(step||currentStep(dl))?.permission||'workflow:validate';return root.rbacService?.can?.(required,user,{document:dl})!==false;}
  function messageForTransition(from,to){
    if(to==='validation responsable domaine') return 'Demande envoyée au responsable domaine.';
    if(to==='validation chef formation') return 'Validation responsable domaine enregistrée.';
    if(to==='validation publication') return 'Validation chef formation enregistrée.';
    if(to==='validé') return 'Validation publication enregistrée.';
    if(to==='publié') return 'Publication validée.';
    if(to==='corrections demandées') return 'Retour en corrections demandé.';
    if(to==='publication bloquée') return 'Publication bloquée avec motif.';
    return `Workflow mis à jour : ${from} → ${to}`;
  }
  function transition(dl,next,details){
    ensure(dl); const target=String(next||'').toLowerCase();
    if(!canTransition(dl,target)){
      root.auditService?.write?.('workflow-transition-refused',{scope:'workflow.distributed',from:dl.workflow.state,to:target,dlId:dl.id,reason:'transition non autorisée'},'SECURITY');
      return {ok:false,message:'Transition workflow distribuée non autorisée pour cet état.',dl};
    }
    const previous=dl.workflow.state; dl.workflow.state=target; dl.workflow.updatedAt=now();
    dl.workflow.lockedForValidation=target.startsWith('validation ');
    dl.workflow.lockedForPublication=['validation publication','publication bloquée','publié'].includes(target);
    const row={id:uid('wf'),atUTC:now(),from:previous,to:target,by:actor(details),comment:details?.comment||'',correlationId:details?.correlationId||uid('corr'),lock:{validation:dl.workflow.lockedForValidation,publication:dl.workflow.lockedForPublication}};
    dl.workflow.history.push(row); dl.statut=target.charAt(0).toUpperCase()+target.slice(1); if(dl.validation)dl.validation.statut=dl.statut;
    root.auditService?.write?.('validation-hiérarchique',{dlId:dl.id,from:previous,to:target,by:row.by,lockedForValidation:dl.workflow.lockedForValidation,lockedForPublication:dl.workflow.lockedForPublication},'WORKFLOW');
    root.notificationService?.push?.('workflow',{title:'Workflow distribué mis à jour',message:messageForTransition(previous,target),dlId:dl.id});
    return {ok:true,dl,history:row,message:messageForTransition(previous,target)};
  }
  function requestValidation(dl,opts){ensure(dl);return transition(dl,'validation responsable domaine',Object.assign({comment:'Demande de validation distribuée'},opts));}
  function approveStep(dl,opts){
    ensure(dl); const step=currentStep(dl); if(!step) return {ok:false,message:'Aucune étape de validation active.',dl};
    if(!canValidateStep(dl,step,opts?.user)) return {ok:false,message:`Permission insuffisante : ${step.label}.`,dl};
    const sig={id:uid('sig'),step:step.id,label:step.label,by:actor(opts),decision:'approved',comment:opts?.comment||'',atUTC:now(),serverSignaturePrepared:true,mfaPrepared:true};
    dl.workflow.signatures.push(sig); dl.workflow.acknowledgements.push({id:uid('ack'),signatureId:sig.id,atUTC:now(),by:sig.by});
    root.auditService?.write?.('validation-signature',{dlId:dl.id,step:step.id,decision:'approved',by:sig.by},'AUDIT');
    root.notificationService?.push?.('validation-requise',{title:'Validation distribuée',message:`${step.label} validée`,dlId:dl.id});
    return transition(dl,step.next,{by:sig.by,comment:opts?.comment||step.label+' validée'});
  }
  function refuse(dl,reason,opts){
    ensure(dl); const previous=dl.workflow.state; const clean=String(reason||'Refus validation motivé').trim()||'Refus validation motivé';
    if(!root.rbacService?.can?.('workflow:refuse',opts?.user,{document:dl})) return {ok:false,message:'Permission insuffisante pour refuser cette validation.',dl};
    const refusal={id:uid('ref'),from:previous,reason:clean,by:actor(opts),atUTC:now(),returnTo:'corrections demandées'};
    dl.workflow.refusals.push(refusal); dl.workflow.comments.push({id:uid('wfc'),type:'refus validation',message:refusal.reason,by:refusal.by,atUTC:refusal.atUTC});
    root.auditService?.write?.('refus-validation',{dlId:dl.id,from:previous,reason:refusal.reason,by:refusal.by},'WORKFLOW');
    root.notificationService?.push?.('validation-refusée',{title:'Validation refusée',message:refusal.reason,dlId:dl.id});
    const res=transition(dl,'refus validation',{by:refusal.by,comment:refusal.reason});
    return res.ok?transition(dl,'corrections demandées',{by:refusal.by,comment:'Retour corrections après refus motivé'}):res;
  }
  function blockPublication(dl,reason,opts){
    ensure(dl); if(!root.rbacService?.can?.('workflow:block-publication',opts?.user,{document:dl})) return {ok:false,message:'Permission insuffisante pour bloquer la publication.',dl};
    root.auditService?.write?.('publication-bloquée',{dlId:dl.id,reason:reason||'',by:actor(opts)},'WORKFLOW');
    return transition(dl,'publication bloquée',{by:actor(opts),comment:reason||'Publication bloquée'});
  }
  function diagnostic(library){const rows=Array.isArray(library)?library:[];const states=STATES.reduce((a,s)=>(a[s]=0,a),{});rows.forEach(d=>{const s=stateOf(d);states[s]=(states[s]||0)+1;});return {schema:'dl.creator.workflow.diagnostic.v3',states,total:rows.length,activeDistributedValidations:rows.filter(d=>stateOf(d).startsWith('validation ')).length,blockedPublications:states['publication bloquée']||0,refusals:rows.reduce((n,d)=>n+(d.workflow?.refusals?.length||0),0),lockedForValidation:rows.filter(d=>d.workflow?.lockedForValidation).length,lockedForPublication:rows.filter(d=>d.workflow?.lockedForPublication).length,serverSignaturePrepared:true,remoteValidationPrepared:true,mfaValidationPrepared:true,offlineFirst:true};}
  root.distributedValidationService={states:STATES,steps:STEPS,transitions:TRANSITIONS,ensure,stateOf,currentStep,canTransition,canValidateStep,transition,requestValidation,approveStep,refuse,blockPublication,diagnostic};
  root.workflowService=Object.assign({},root.workflowService||{},root.distributedValidationService);
})(window);
