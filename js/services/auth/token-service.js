(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};const KEY='DL_CREATOR_PILOT_TOKENS_V830';
  function read(){try{return JSON.parse(sessionStorage.getItem(KEY)||localStorage.getItem(KEY)||'{}');}catch{return {};}}
  function write(tokens,remember){const payload={...tokens,storedAtUTC:new Date().toISOString(),mode:'prepared'};try{(remember?localStorage:sessionStorage).setItem(KEY,JSON.stringify(payload));}catch{}}
  function clearTokens(){try{sessionStorage.removeItem(KEY);localStorage.removeItem(KEY);}catch{}}
  function getAccessToken(){const t=read();return t.accessToken||'';}
  root.tokenService={read,write,clearTokens,getAccessToken,diagnostic(){const t=read();return{hasAccessToken:!!t.accessToken,hasRefreshToken:!!t.refreshToken,storage:t.storedAtUTC?'présent':'absent',jwtPrepared:true,refreshPrepared:true,serverEnabled:false};}};
})(window);
