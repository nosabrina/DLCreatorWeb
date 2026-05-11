const {json,safeHandler,audit}=require('./_shared');
exports.handler=safeHandler(async(event)=>{audit(event,'AUDIT','users-list',{mock:true});return json(200,{items:[],mock:true,message:'Liste utilisateurs serveur préparée. Source de vérité locale en v9.10.',permissions:['users:manage'],remoteWriteEnabled:false},event);},['GET']);
