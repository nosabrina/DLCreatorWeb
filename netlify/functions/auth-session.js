const {json,safeHandler}=require('./_shared');
exports.handler=safeHandler(async(event)=>json(200,{authMode:'pilote',active:false,serverSessionPrepared:true,jwtPrepared:true,refreshTokenPrepared:true,message:'Session serveur non obligatoire en v9.10.'},event),['GET']);
