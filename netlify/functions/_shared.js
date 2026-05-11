const PILOT_HEADERS={
  'Content-Type':'application/json; charset=utf-8',
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'Content-Type, Authorization, X-DL-API-Version, X-Correlation-Id',
  'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff'
};
function correlationId(event){return event.headers?.['x-correlation-id']||event.headers?.['X-Correlation-Id']||`srv-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;}
function json(status,body,event){const cid=event?correlationId(event):`srv-${Date.now()}`;return{statusCode:status,headers:{...PILOT_HEADERS,'X-Correlation-Id':cid},body:JSON.stringify({ok:status>=200&&status<300,mode:'pilote',version:'v9.10',backendEnabled:false,destructive:false,timestampUTC:new Date().toISOString(),correlationId:cid,...body})};}
function preflight(event){return event.httpMethod==='OPTIONS'?{statusCode:204,headers:PILOT_HEADERS,body:''}:null;}
function method(event,allowed){if(!allowed.includes(event.httpMethod))return json(405,{error:'Méthode non autorisée',allowed},event);return null;}
function parseJson(event){try{return event.body?JSON.parse(event.body):{};}catch(e){const err=new Error('JSON invalide');err.statusCode=400;throw err;}}
function requireFields(obj,fields){const missing=fields.filter(f=>!obj || obj[f]===undefined || obj[f]===null || obj[f]==='');if(missing.length){const e=new Error('Champ(s) obligatoire(s) manquant(s): '+missing.join(', '));e.statusCode=400;throw e;}}
function audit(event,level,action,details){console.log(JSON.stringify({level:level||'INFO',action:action||'function',details:details||{},correlationId:correlationId(event),timestampUTC:new Date().toISOString()}));}
function safeHandler(fn,allowed){return async(event,context)=>{const p=preflight(event);if(p)return p;const m=method(event,allowed||['GET']);if(m)return m;try{audit(event,'INFO','function-call',{path:event.path,method:event.httpMethod});return await fn(event,context);}catch(e){audit(event,'ERROR','function-error',{message:e.message,status:e.statusCode||500});return json(e.statusCode||500,{error:e.message||'Erreur serveur pilote'},event);}};}
module.exports={json,parseJson,requireFields,safeHandler,audit,correlationId};
