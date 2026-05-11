(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  const DEFAULT_TIMEOUT_MS=10000;
  function conf(){return root.apiConfig?.getApiConfig?.()||{enabled:false,baseUrl:'/.netlify/functions',timeoutMs:DEFAULT_TIMEOUT_MS,retries:1,mode:'local',version:'2026-05-pilot-v7',offlineFallback:true};}
  function token(){return root.tokenService?.getAccessToken?.()||'';}
  function correlationId(){return 'dl-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);}
  function url(path){const c=conf();return String(c.baseUrl||'').replace(/\/$/,'')+'/'+String(path||'diagnostics-ping').replace(/^\//,'');}
  function audit(action,details,level){try{root.auditService?.write?.(action,{...(details||{}),serverPrepared:true,destructive:false},level||'INFO');}catch(e){console.warn('[DL Creator] Audit API non bloquant',e);}}
  function isLocalStaticFunctionsUnavailable(error){
    const host=String(window.location?.hostname||'');
    const isLocal=['localhost','127.0.0.1','0.0.0.0',''].includes(host);
    const msg=String(error?.message||error?.error||'');
    return isLocal && /API 404|404/.test(msg);
  }
  function normalizeStatus(result){
    if(result?.ok) return 'reachable';
    if(result?.statusLabel==='unavailable-local-static') return 'unavailable-local-static';
    if(result?.disabled || result?.offline || result?.offlineFallback) return 'disabled';
    if(result?.prepared) return 'prepared';
    return 'failed';
  }
  async function once(path,options,cid,force){
    const c=conf();
    const ctl=new AbortController();
    const t=setTimeout(()=>ctl.abort(),Number(options?.timeoutMs||c.timeoutMs||DEFAULT_TIMEOUT_MS));
    try{
      const body=options?.body;
      const headers={'Accept':'application/json','X-DL-API-Version':c.version||'2026-05-pilot-v7','X-Correlation-Id':cid,...(body?{'Content-Type':'application/json'}:{}),...(token()?{'Authorization':'Bearer '+token()}:{}),...(options?.headers||{})};
      const res=await fetch(url(path),{method:options?.method||'GET',headers,body:body?JSON.stringify(body):undefined,credentials:'include',signal:ctl.signal});
      const txt=await res.text();
      let data=null;try{data=txt?JSON.parse(txt):null;}catch{data={raw:txt};}
      if(!res.ok)throw new (root.apiErrors?.PilotApiError||Error)(data?.error||('API '+res.status),{status:res.status,payload:data,correlationId:cid});
      audit('api-function-reachable',{path,status:res.status,correlationId:cid,forcedDiagnostic:force===true},'INFO');
      return root.apiResponse?.ok?.(data,{status:res.status,correlationId:cid})||{ok:true,data,status:res.status,correlationId:cid,statusLabel:'reachable'};
    }finally{clearTimeout(t);}
  }
  async function request(path,options){
    const c=conf();
    const cid=correlationId();
    const force=options?.diagnostic===true || options?.force===true;
    if(!c.enabled && !force){
      const res={ok:false,offline:true,disabled:true,prepared:true,statusLabel:'disabled',message:'Backend désactivé — fallback offline prioritaire',mode:c.mode,correlationId:cid};
      audit('api-function-disabled-fallback',{path,correlationId:cid},'INFO');
      return root.apiResponse?.fail?.(res,{offline:true,mode:c.mode,correlationId:cid})||res;
    }
    let last;const attempts=Math.max(1,Number(c.retries||1)+1);
    for(let i=0;i<attempts;i++){try{return await once(path,options,cid,force);}catch(e){last=e;if(i<attempts-1)await new Promise(r=>setTimeout(r,250*(i+1)));}}
    const localStatic=isLocalStaticFunctionsUnavailable(last);
    const fallback={ok:false,error:last?.message||'Erreur Function',offlineFallback:true,statusLabel:localStatic?'unavailable-local-static':'failed',correlationId:cid,path,prepared:true,localStatic};
    if(localStatic) fallback.message='Non disponible en serveur statique local — normal hors Netlify Dev / Netlify Preview';
    audit('api-function-failed-fallback',{path,error:fallback.error,correlationId:cid,status:fallback.statusLabel,message:fallback.message||''},localStatic?'INFO':'WARN');
    return fallback;
  }
  async function diagnosticPing(){
    const started=Date.now();
    const res=await request('diagnostics-ping',{method:'GET',diagnostic:true,timeoutMs:Math.min(conf().timeoutMs||DEFAULT_TIMEOUT_MS,5000)});
    const status=normalizeStatus(res);
    const out={schema:'dl.creator.functions.diagnostic.v9',name:'diagnostics-ping',status,reachable:status==='reachable',durationMs:Date.now()-started,enabled:false,prepared:true,destructive:false,offlineFallback:status!=='reachable',fallbackOk:status==='unavailable-local-static'||status==='disabled',correlationId:res?.correlationId||'',message:res?.message||'',response:res?.data||res?.payload||res};
    audit('netlify-functions-diagnostic',{status:out.status,durationMs:out.durationMs,correlationId:out.correlationId,message:out.message||''},status==='failed'?'WARN':'INFO');
    return out;
  }
  root.pilotApiClient={request,get:p=>request(p),post:(p,b)=>request(p,{method:'POST',body:b}),diagnostic:diagnosticPing,diagnosticPing,isEnabled:()=>!!conf().enabled,normalizeStatus};
})(window);
