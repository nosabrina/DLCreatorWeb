const {json,safeHandler}=require('./_shared');
exports.handler=safeHandler(async(event)=>json(200,{message:'Point d’entrée API pilote générique. Utiliser /health, /auth-login, /auth-session, /audit-log ou /mail-test.',path:event.path,method:event.httpMethod}),['GET','POST']);
