(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  const STATES=['brouillon','en rédaction','en validation','corrections demandées','validé','publié','archivé'];
  const TRANSITIONS={
    'brouillon':['en rédaction','archivé'],
    'en rédaction':['en validation','corrections demandées','archivé'],
    'en validation':['corrections demandées','validé','archivé'],
    'corrections demandées':['en rédaction','archivé'],
    'validé':['publié','corrections demandées','archivé'],
    'publié':['archivé'],
    'archivé':[]
  };
  function now(){return new Date().toISOString();}
  function stateOf(dl){return String(dl?.workflow?.state||dl?.validation?.statut||dl?.statut||'brouillon').trim().toLowerCase()||'brouillon';}
  function ensure(dl){if(!dl.workflow)dl.workflow={};const s=STATES.includes(stateOf(dl))?stateOf(dl):'brouillon';dl.workflow={schema:'dl.creator.workflow.v1',state:s,ownerId:dl.workflow.ownerId||dl.ownerId||'',redacteurs:Array.isArray(dl.workflow.redacteurs)?dl.workflow.redacteurs:[],validateurs:Array.isArray(dl.workflow.validateurs)?dl.workflow.validateurs:[],responsables:Array.isArray(dl.workflow.responsables)?dl.workflow.responsables:[],history:Array.isArray(dl.workflow.history)?dl.workflow.history:[],comments:Array.isArray(dl.workflow.comments)?dl.workflow.comments:[],lockedForPublication:dl.workflow.lockedForPublication===true,validationLevel:dl.workflow.validationLevel||1,serverValidationPrepared:true,notificationsPrepared:true,auditPrepared:true,updatedAt:dl.workflow.updatedAt||now()};dl.statut=dl.workflow.state.charAt(0).toUpperCase()+dl.workflow.state.slice(1);return dl.workflow;}
  function canTransition(dl,next){const current=stateOf(dl);return (TRANSITIONS[current]||[]).includes(String(next||'').toLowerCase());}
  function transition(dl,next,details){ensure(dl);const target=String(next||'').toLowerCase();if(!canTransition(dl,target)){root.auditService?.write?.('permission-denied',{scope:'workflow.transition',from:dl.workflow.state,to:target,dlId:dl.id},'SECURITY');return {ok:false,message:'Transition workflow non autorisée',dl};}const previous=dl.workflow.state;dl.workflow.state=target;dl.workflow.updatedAt=now();dl.workflow.history.push({atUTC:now(),from:previous,to:target,by:details?.by||root.sessionService?.describe?.().authType||'local',comment:details?.comment||''});dl.statut=target.charAt(0).toUpperCase()+target.slice(1);if(dl.validation)dl.validation.statut=dl.statut;root.auditService?.write?.('workflow-transition',{dlId:dl.id,from:previous,to:target},'AUDIT');root.notificationService?.push?.('workflow',{title:'Workflow mis à jour',message:`${previous} → ${target}`,dlId:dl.id});return {ok:true,dl};}
  function addComment(dl,message,opts){ensure(dl);const c={id:'wfc-'+Date.now().toString(36),atUTC:now(),by:opts?.by||'local',type:opts?.type||'commentaire',message:String(message||'')};dl.workflow.comments.push(c);root.auditService?.write?.('workflow-comment',{dlId:dl.id,type:c.type},'AUDIT');return c;}
  function diagnostic(library){const rows=Array.isArray(library)?library:[];const states=STATES.reduce((a,s)=>(a[s]=0,a),{});rows.forEach(d=>{const s=stateOf(d);states[s]=(states[s]||0)+1;});return {schema:'dl.creator.workflow.diagnostic.v1',states,total:rows.length,multiLevelValidationPrepared:true,serverWorkflowPrepared:true,notificationsPrepared:true};}
  root.workflowService={states:STATES,transitions:TRANSITIONS,ensure,stateOf,canTransition,transition,addComment,diagnostic};
})(window);
