(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};const KEY='DL_CREATOR_AUTH_STATE_V830';const OLD='DL_CREATOR_AUTH_STATE_V830'.replace('V830','V820');
  function read(){try{const current=localStorage.getItem(KEY);const legacy=localStorage.getItem(OLD);return JSON.parse(current||legacy||'{}');}catch{return{};}}
  function write(v){try{localStorage.setItem(KEY,JSON.stringify({...v,updatedAt:new Date().toISOString()}));}catch{}}
  function clear(){try{localStorage.removeItem(KEY);localStorage.removeItem(OLD);}catch{}}
  root.authState={read,write,clear,type:()=>read().authType||'local'};
})(window);
