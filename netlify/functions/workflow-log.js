const {json,parseJson,safeHandler,audit}=require('./_shared');
exports.handler=safeHandler(async(event)=>{const body=event.httpMethod==='POST'?parseJson(event):{};audit(event,'AUDIT','workflow-log',{mock:true,dlId:body.dlId||''});return json(200,{items:[],mock:true,message:'Journal workflow serveur préparé. Journal local prioritaire en v9.10.'},event);},['GET','POST']);
