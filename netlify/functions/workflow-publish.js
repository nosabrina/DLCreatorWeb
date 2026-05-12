const {json,parseJson,requireFields,safeHandler,audit}=require('./_shared');
const NAME=__filename.split('/').pop().replace('.js','');
function requiredFor(name){
  if(name==='validation-distributed') return ['dlId','workflowState'];
  if(name==='users-session') return [];
  if(name==='workflow-validation') return ['dlId','step'];
  if(name==='workflow-publish') return ['dlId'];
  if(name==='collaborative-lock') return ['dlId'];
  return [];
}
exports.handler=safeHandler(async(event)=>{
  const body=event.httpMethod==='POST'?parseJson(event):{};
  requireFields(body,requiredFor(NAME));
  audit(event,NAME.includes('lock')?'AUDIT':'WORKFLOW',NAME,{mock:true,dlId:body.dlId||'',step:body.step||'',permission:body.permission||''});
  return json(200,{
    endpoint:NAME,
    accepted:false,
    mock:true,
    remoteWriteEnabled:false,
    offlineFallback:true,
    pdfEngine:'locked-client-side',
    validationJsonStrict:true,
    permissionsPrepared:true,
    message:'Fonction pilote v9.10 préparée. Aucune synchronisation distante réelle; la source de vérité reste locale/offline-first.',
    received:body
  },event);
},['GET','POST']);
