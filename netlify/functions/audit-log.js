const {json,parseJson,requireFields,safeHandler,audit}=require('./_shared');
exports.handler=safeHandler(async(event)=>{const body=parseJson(event);requireFields(body,['action']);audit(event,body.level||'AUDIT',body.action,body.details||{});return json(202,{accepted:true,serverAuditEnabled:false,message:'Audit serveur pilote reçu en log Netlify uniquement.'},event);},['POST']);
