const {json,safeHandler}=require('./_shared');
exports.handler=safeHandler(async(event)=>json(200,{version:'v9.10',apiVersion:'2026-05-pilot-v7',users:true,workflow:true,permissions:true,audit:true,remoteSyncEnabled:false,backendMandatory:false,offlineFirst:true,pdfEngine:'locked'},event),['GET']);
