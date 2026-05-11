(function(window){
  'use strict';
  const root=window.DLCreatorCore=window.DLCreatorCore||{};
  const providers=Object.freeze(['Postmark','SendGrid','Mailgun']);
  const templates=Object.freeze([
    {id:'invitation',label:'Invitation utilisateur',version:'v9.00'},
    {id:'reset-password',label:'Réinitialisation mot de passe',version:'v9.00'},
    {id:'validation-demandee',label:'Validation demandée',version:'v9.00'},
    {id:'validation-refusee',label:'Validation refusée',version:'v9.00'},
    {id:'publication-validee',label:'Publication validée',version:'v9.00'},
    {id:'rappel-validation',label:'Rappel validation',version:'v9.00'}
  ]);
  const journal=[];
  function findTemplate(id){return templates.find(t=>t.id===id)||templates[0];}
  function render(template,payload){const t=findTemplate(template);return{template:t.id,label:t.label,version:t.version,payload:payload||{},subject:`[DL Creator] ${t.label}`,htmlTemplate:`server/mail/templates/${t.id}.html`,textTemplate:`server/mail/templates/${t.id}.txt`,dryRun:true};}
  function logMail(template,payload){const entry={id:'mail-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),template,to:payload?.to||'',provider:'disabled',sent:false,createdAtUTC:new Date().toISOString(),version:root.getVersionInfo?.().version||'v9.00'};journal.unshift(entry);if(journal.length>100)journal.length=100;root.auditService?.write?.('mail-dry-run',entry,'INFO');return entry;}
  root.mailService={enabled:false,mode:'dry-run',providers,templates:templates.map(t=>t.id),templateCatalog:templates,render,async send(template,payload){const entry=logMail(template,payload);return {ok:false,dryRun:true,enabled:false,template,payload,journalId:entry.id,providers,message:'E-mails transactionnels préparés. Aucun envoi réel en v9.00.'};},diagnostic(){return{schema:'dl.creator.mail.diagnostic.v9',enabled:false,providers,templates:templates.map(t=>t.id),templateCatalog:templates,journalPrepared:true,journalCount:journal.length,serverFunction:'notifications-send',noRealSend:true}},journal:()=>journal.slice()};
})(window);
