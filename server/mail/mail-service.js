'use strict';
const fs=require('fs');const path=require('path');
const PROVIDERS=['disabled','sendgrid','mailgun','postmark','smtp'];
function provider(){return process.env.DL_CREATOR_MAIL_PROVIDER||process.env.MAIL_PROVIDER||'disabled';}
function loadTemplate(name){const file=path.join(__dirname,'templates',`${name}.html`);return fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';}
async function sendMail({to,subject,template='invitation-utilisateur',variables={}}){const p=provider();const html=loadTemplate(template).replace(/{{\s*(\w+)\s*}}/g,(_,k)=>variables[k]||'');console.log(JSON.stringify({level:'INFO',action:'mail-prepared',provider:p,to,subject,template,sent:false,timestampUTC:new Date().toISOString()}));return{ok:true,sent:false,provider:p,htmlPreview:html.slice(0,500),message:'Envoi réel désactivé en pilote v8.30.'};}
module.exports={PROVIDERS,provider,sendMail,loadTemplate};
