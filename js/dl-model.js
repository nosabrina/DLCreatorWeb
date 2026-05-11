(function(window){
  'use strict';
  const root = window.DLCreatorCore = window.DLCreatorCore || {};

  function uid(){ return 'dl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8); }
  function nowIso(){ return new Date().toISOString(); }
  function cloneDL(dl){ return JSON.parse(JSON.stringify(dl || {})); }
  function isValidVersion(v){ return /^v[1-9]\d*\.\d{2}$/.test(String(v||'').trim().toLowerCase()); }
  function extractVersion(v){ const m=String(v||'').match(/(?:^|[-_\s])([vV][1-9]\d*\.\d{2})(?=$|[-_\s.])/); return m ? m[1].toLowerCase() : ''; }

  function createEmptyDL(){
    return {
      schema:'dl.creator.web.v2', id:uid(), referenceDL:'', version:'v1.00', dateCreation:nowIso(), dateModification:nowIso(), statut:'',
      identification:{ domaine:'', theme:'', codeTheme:'', sousTheme:'', codeSousTheme:'', typeDoc:'DL', resumeCamelCase:'', informationLecon:'', typeFormation:'', niveauBloom:'', codeBloom:'', publicCible:'', codePublic:'', participantsClasses:'', dureeTotale:0, creationModification:'' },
      tags:[], responsables:{responsable:'', redacteurs:[], formateurs:[]}, buts:[], evaluations:[], planHoraire:[], planFormateurLecon:'', planTrancheCount:1, planTranchesHoraires:[{debut:''},{debut:''},{debut:''},{debut:''}], filRougeEmplacementChantierGeneral:'', filRougePreparationChantierGeneral:'', filRouge:[],
      materiel:{didactique:[], materielEngage:[], fournitures:[], vehiculesEngages:[], remarquesLogistiques:''},
      conclusion:[], distribution:{destinataires:[], groupes:[], groupesLibre:'', fonctions:[], fonctionsLibre:'', remarques:'', remarqueGeneraleHtml:'', remarqueGeneraleText:''},
      validation:{statut:'', validateur:'', dateValidation:'', commentaire:''}, importWord:{sourceName:'', detectedFields:{}, unclassifiedHtml:'', warnings:[]}, historique:[]
    };
  }

  function ensureArray(value){ return Array.isArray(value) ? value : (value == null || value === '' ? [] : [value]); }
  function normalizeLinkedGoals(value){
    const raw=String(Array.isArray(value)?value.join(', '):(value||'')).trim();
    if(!raw) return [];
    const tokens=raw.replace(/[;\n\t]+/g, ',').replace(/\s*,\s*/g, ',').split(/[ ,]+/).map(v=>v.trim()).filter(Boolean);
    const out=[];
    tokens.forEach(token=>{ if(!out.includes(token)) out.push(token); });
    return out;
  }
  function normalizeDL(dl){
    const d = (dl && typeof dl === 'object') ? dl : {};
    if(!d.id) d.id=uid();
    if(!d.schema) d.schema='dl.creator.web.v2';
    if(!d.dateCreation) d.dateCreation=nowIso();
    d.dateModification=d.dateModification || nowIso();
    const versionCandidate=String(d.version||'').trim().toLowerCase();
    d.version=isValidVersion(versionCandidate) ? versionCandidate : (extractVersion(d.referenceDL||d.fileName||d.nomFichier||'') || 'v1.00');
    d.identification=d.identification || {};
    if(d.identification.informationLecon == null) d.identification.informationLecon='';
    d.responsables=d.responsables || {responsable:'', redacteurs:[], formateurs:[]};
    d.responsables.redacteurs=ensureArray(d.responsables.redacteurs);
    d.responsables.formateurs=ensureArray(d.responsables.formateurs);
    d.tags=ensureArray(d.tags);
    d.buts=ensureArray(d.buts);
    d.evaluations=ensureArray(d.evaluations).map(e=>{
      if(e && typeof e === 'object') e.butsLies=normalizeLinkedGoals(e.butsLies);
      return e;
    });
    d.planHoraire=ensureArray(d.planHoraire);
    if(d.planFormateurLecon == null) d.planFormateurLecon='';
    if(d.planTrancheCount == null) d.planTrancheCount=1;
    if(!Array.isArray(d.planTranchesHoraires)) d.planTranchesHoraires=[{debut:''},{debut:''},{debut:''},{debut:''}];
    while(d.planTranchesHoraires.length<4) d.planTranchesHoraires.push({debut:''});
    d.planTranchesHoraires=d.planTranchesHoraires.slice(0,4).map(t=>({debut:String(t?.debut||'')}));
    if(d.filRougeEmplacementChantierGeneral == null) d.filRougeEmplacementChantierGeneral='';
    if(d.filRougePreparationChantierGeneral == null) d.filRougePreparationChantierGeneral='';
    d.filRouge=ensureArray(d.filRouge);
    d.materiel=d.materiel || {didactique:[], materielEngage:[], fournitures:[], vehiculesEngages:[], remarquesLogistiques:''};
    d.distribution=d.distribution || {destinataires:[], groupes:[], groupesLibre:'', fonctions:[], fonctionsLibre:'', remarques:'', remarqueGeneraleHtml:'', remarqueGeneraleText:''};
    d.validation=d.validation || {statut:'', validateur:'', dateValidation:'', commentaire:''};
    return d;
  }

  function validateDLShape(dl){
    const errors=[];
    if(!dl || typeof dl !== 'object') errors.push('La DL doit être un objet JSON.');
    if(dl && dl.identification && typeof dl.identification !== 'object') errors.push('identification doit être un objet.');
    if(dl && dl.filRouge && !Array.isArray(dl.filRouge)) errors.push('filRouge doit être un tableau.');
    if(dl && dl.planHoraire && !Array.isArray(dl.planHoraire)) errors.push('planHoraire doit être un tableau.');
    return { valid: errors.length===0, errors };
  }

  function getDLIdentifier(dl){ return String(dl?.id || dl?.referenceDL || dl?.identification?.referenceDL || '').trim(); }
  function getDLTitle(dl){ return String(dl?.identification?.theme || dl?.identification?.sousTheme || dl?.referenceDL || 'Descente de leçon sans titre').trim(); }
  function getDLStatus(dl){ return String(dl?.validation?.statut || dl?.statut || 'Brouillon').trim() || 'Brouillon'; }
  function setDLStatus(dl,status){ const d=normalizeDL(dl); d.statut=status || ''; d.validation=d.validation || {}; d.validation.statut=status || ''; d.dateModification=nowIso(); return d; }

  root.dlModel = { createEmptyDL, normalizeDL, validateDLShape, cloneDL, getDLIdentifier, getDLTitle, getDLStatus, setDLStatus };
})(window);
