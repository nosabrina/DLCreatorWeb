const {json,safeHandler,audit}=require('./_shared');
exports.handler=safeHandler(async(event)=>{audit(event,'AUDIT','auth-refresh-prepared',{enabled:false});return json(200,{enabled:false,authMode:'local-fallback',accessToken:null,refreshToken:null,message:'Refresh serveur préparé mais désactivé par défaut. Session locale conservée.'},event);},['POST']);
