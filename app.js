'use strict';

window.DL_CREATOR_WEB_APP_JS_LOADED = true;
if(window.DL_CREATOR_BOOT) window.DL_CREATOR_BOOT.appJsLoaded = true;

const APP = {
  VERSION: String(window.DLCreatorCore?.getVersionInfo?.().version || window.DLCreatorCore?.config?.appVersion || 'v9.13').trim().toLowerCase(),
  STORAGE_KEY: 'DL_CREATOR_WEB_LIBRARY_V1',
  PROFILE_KEY: 'DL_CREATOR_WEB_PROFILE_V1',
  SESSION_KEY: 'DL_CREATOR_WEB_SESSION_V1',
  DRAFT_KEY: 'DL_CREATOR_WEB_DRAFT_V1',
  KEYWORDS_KEY: 'DL_CREATOR_WEB_KEYWORDS_V1',
  HABILITATIONS_KEY: 'DL_CREATOR_WEB_HABILITATIONS_V1',
  DOMAINS: ['AUTO','AUTRE','DAP','DPS','FOBA','FOCA','FOCO','FOSPEC','JSP','PR'],
  BLOOM: ['Mémoriser','Comprendre','Appliquer','Analyser','Évaluer','Créer'],
  BLOOM_CODES: ['Me','Co','Ap','An','Ev','Cr'],
  TYPES: ['Théorie','Pratique','Mixte','Exercice','Atelier','Évaluation','Répétition','Formation cadres'],
  STATUSES: ['Brouillon','En validation','Validé','Refusé / à corriger','Archivé'],
  FUNCTIONS: ['Membre État-major','Chef formation','Of AUTO','C PR','C FOBA','C FOCA','C FOSPEC','C JSP','Formateur'],
  GRADES: ['', 'Rec', 'Sap', 'App', 'Cpl', 'Sgt', 'Sgt instr', 'Sgt chef', 'Sgt chef instr', 'Sgtm', 'Four', 'Adj', 'Lt', 'Lt instr', 'Plt', 'Plt instr', 'Of spéc', 'Cap', 'Cap instr', 'Cap adj', 'Maj', 'Maj instr'],
  PUBLICS: ['Recrue','Sapeur','Sapeur DPS','Sapeur DAP','Cadre','Cadre DPS','Cadre DAP','Porteur APR','Conducteur véhicule léger','Conducteur poids-lourd','Conducteur poids-lourd Ydon 129','Machiniste EA','Opérateur Ydon 0','Spécialiste Antichute','Porteur ABC tenue lourde','Porteur Cobra','Pilote bateau','Cariste','Élévateur à timon','Pontier-élingueur','NAC','Personnel OFSI','Grutier','Équipier','Chef d’engin','Chef d’intervention'],
  HABILITATION_FUNCTIONS: ['ADMIN STRUCTURE APPLICATION','Chef formation','Responsable','Gestion formation','Membres État-major','Formateur','Rédacteur','Consultant'],
  ACCESS_RIGHTS: ['ADMIN STRUCTURE APPLICATION','GESTION DL','RÉDACTION DL','CONSULTATION DL'],
  CODE_OPTIONS: {
    theme: [
      ['ABC','Risques ABC'],
      ['COM','Communication'],
      ['HYD','Hydraulique'],
      ['MAI','Maîtriser'],
      ['PRR','Protection respiratoire'],
      ['PRO','Protéger'],
      ['SAU','Sauver'],
      ['SEC','Sécuriser'],
      ['TEN','Tenir']
    ],
    sousTheme: [
      ['CHI','Chimique'],
      ['CONS','Consommateurs'],
      ['ECH','Échelles'],
      ['ENG','Engagement'],
      ['GEN','Général'],
      ['MAT','Matériel'],
      ['MMP','Machiniste motopompe'],
      ['MTP','Machiniste tonne-pompe'],
      ['NOE','Nœuds'],
      ['POL','Pollution'],
      ['RAD','Radio'],
      ['TUY','Service des tuyaux'],
      ['ZONE','Zone sinistrée']
    ],
    public: [
      ['ABC','Personnel ABC'],
      ['CAD','Cadres'],
      ['CPL','Cond PL'],
      ['CVL','Cond VL'],
      ['DAP','Personnel DAP'],
      ['DPS','Personnel DPS'],
      ['FO1','FOBA 1'],
      ['FO2','FOBA 2'],
      ['FO3','FOBA 3'],
      ['MEA','Machiniste échelle automobile'],
      ['NAC','Nouveau animaux de compagnie'],
      ['OPVPC','Opérateur VPC'],
      ['PAPR','Porteur appareil protection respiratoire'],
      ['PBAT','Pilote BAT']
    ].sort((a,b)=>a[0].localeCompare(b[0],'fr',{sensitivity:'base'}))
  },
  state: { user:null, current:null, library:[], activeModule:'home', activeTab:'generalites', personnel:[], vehicules:[], materiel:[], fournitures:[], dirty:false, saveTimer:null, lastAutosave:null, profileCompletionRequired:false, motsCles:[], habilitations:[] },
  pdfJsPromise:null,
  activeRich:null,
  savedRange:null
};

function isQuotaExceededError(error){
  return !!error && (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014);
}
function safeSetLocalStorage(key, value, context='stockage'){
  try{
    localStorage.setItem(key, value);
    return true;
  }catch(e){
    const message=e?.message||String(e);
    console.warn(`[DL creator][${context}] localStorage ignoré`, e);
    try{ window.DLCreatorCore?.auditService?.write?.('localstorage-write-skipped',{key,context,quota:isQuotaExceededError(e),message,destructive:false}, isQuotaExceededError(e)?'WARN':'ERROR'); }catch{}
    try{ actionStatus?.(isQuotaExceededError(e) ? 'Stockage localStorage plein : IndexedDB reste prioritaire, purge contrôlée conseillée.' : 'Écriture localStorage ignorée sans interruption.', isQuotaExceededError(e)?'warn':'warn'); }catch{}
    return false;
  }
}
function safeRemoveLocalStorage(key, context='stockage'){
  try{ localStorage.removeItem(key); return true; }catch(e){ console.warn(`[DL creator][${context}] suppression localStorage ignorée`, e); return false; }
}
function installMissingFunctionGuard(){
  const guarded={
    saveHabilitationsExplicit(){
      const list=typeof loadHabilitations==='function' ? loadHabilitations() : (APP.state.habilitations||[]);
      if(typeof saveHabilitations==='function') saveHabilitations(list);
      try{ actionStatus?.('Habilitations enregistrées.', 'ok'); }catch{}
      try{ renderHabilitations?.(); }catch{}
      return true;
    }
  };
  Object.entries(guarded).forEach(([name,fn])=>{
    if(typeof window[name] !== 'function') window[name]=function(...args){
      console.warn(`[DL creator] Fonction ${name} absente : garde-fou v9.13 exécuté.`);
      try{ window.DLCreatorCore?.auditService?.write?.('missing-function-guard',{name,version:'v9.13',destructive:false},'WARN'); }catch{}
      return fn(...args);
    };
  });
}
installMissingFunctionGuard();

const DISPLAY_STATUS_TO_WORKFLOW_STATE = Object.freeze({
  'Brouillon': 'brouillon',
  'En validation': 'validation responsable domaine',
  'Validé': 'validé',
  'Refusé / à corriger': 'corrections demandées',
  'Archivé': 'archivé'
});
const WORKFLOW_STATE_TO_DISPLAY_STATUS = Object.freeze({
  'brouillon': 'Brouillon',
  'en rédaction': 'Brouillon',
  'en validation': 'En validation',
  'validation responsable domaine': 'En validation',
  'validation chef formation': 'En validation',
  'validation publication': 'En validation',
  'soumise à validation': 'En validation',
  'soumise a validation': 'En validation',
  'refus validation': 'Refusé / à corriger',
  'refusée / à corriger': 'Refusé / à corriger',
  'refusee / a corriger': 'Refusé / à corriger',
  'corrections demandées': 'Refusé / à corriger',
  'corrections demandees': 'Refusé / à corriger',
  'publication bloquée': 'Refusé / à corriger',
  'publication bloquee': 'Refusé / à corriger',
  'validé': 'Validé',
  'valide': 'Validé',
  'validée': 'Validé',
  'validee': 'Validé',
  'validée privée': 'Validé',
  'validée bibliothèque': 'Validé',
  'publié': 'Validé',
  'publie': 'Validé',
  'archivé': 'Archivé',
  'archive': 'Archivé',
  'archivée': 'Archivé',
  'archivee': 'Archivé'
});
function workflowStateForDisplayStatus(status){
  const display=normalizeDLStatus(status)||'Brouillon';
  return DISPLAY_STATUS_TO_WORKFLOW_STATE[display] || 'brouillon';
}
function displayStatusFromWorkflowState(state){
  const key=String(state||'').trim().toLowerCase();
  if(!key) return '';
  return WORKFLOW_STATE_TO_DISPLAY_STATUS[key] || '';
}
function displayStatusFromAny(value){
  const normalized=normalizeDLStatus(value);
  if(normalized) return normalized;
  return displayStatusFromWorkflowState(value);
}

const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const esc = v => String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const jsString = v => String(v??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r?\n/g,' ');
const strip = html => String(html||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const norm = v => String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const normalizeLegacyDomain = value => String(value||'').trim().toLowerCase()==='autre' ? 'AUTRE' : String(value||'').trim();
const today = ()=>new Date().toISOString().slice(0,10);
const nowIso = ()=>new Date().toISOString();
const uid = ()=> 'dl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
const fileSafe = v => norm(v).toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'') || 'SANS_TITRE';
const BLOOM_CODE_MAP = { 'Mémoriser':'Me', 'Comprendre':'Co', 'Appliquer':'Ap', 'Analyser':'An', 'Évaluer':'Ev', 'Créer':'Cr' };
function bloomCodeFor(level){ return BLOOM_CODE_MAP[String(level||'').trim()] || ''; }

function normalizeKeyword(value){
  return String(value||'')
    .trim()
    .replace(/\s+/g,' ')
    .split(' ')
    .map(w=>w ? w.charAt(0).toLocaleUpperCase('fr-CH') + w.slice(1).toLocaleLowerCase('fr-CH') : '')
    .join(' ');
}
function normalizeKeywordList(value){
  const out=[];
  splitValueList(value).forEach(raw=>{
    const clean=normalizeKeyword(raw);
    if(clean.length>=3 && !out.some(x=>norm(x)===norm(clean))) out.push(clean);
  });
  return out.sort((a,b)=>a.localeCompare(b,'fr',{sensitivity:'base'}));
}
function loadKeywordLibrary(){
  const local=loadJson(APP.KEYWORDS_KEY, []);
  const fromDL=(APP.state.library||[]).flatMap(dl=>splitValueList(dl?.tags||[]));
  return normalizeKeywordList([...(Array.isArray(local)?local:[]), ...fromDL].join(';'));
}
function saveKeywordLibrary(){
  APP.state.motsCles=normalizeKeywordList(APP.state.motsCles||[]);
  safeSetLocalStorage(APP.KEYWORDS_KEY, JSON.stringify(APP.state.motsCles), 'mots-cles');
}
function addKeywordsToLibrary(values){
  const next=normalizeKeywordList([...(APP.state.motsCles||[]), ...normalizeKeywordList(values)].join(';'));
  const changed=JSON.stringify(next)!==JSON.stringify(APP.state.motsCles||[]);
  APP.state.motsCles=next;
  if(changed) saveKeywordLibrary();
  return next;
}

function keywordExistsInLibrary(keyword){
  const clean=normalizeKeyword(keyword);
  return !!clean && (APP.state.motsCles||[]).some(k=>norm(k)===norm(clean));
}
function replaceKeywordInList(values, oldKeyword, newKeyword){
  const oldNorm=norm(oldKeyword);
  const replacement=normalizeKeyword(newKeyword||'');
  const out=[];
  splitValueList(values||[]).forEach(raw=>{
    const clean=normalizeKeyword(raw);
    if(clean.length<3) return;
    const next=(norm(clean)===oldNorm) ? replacement : clean;
    if(next.length>=3 && !out.some(x=>norm(x)===norm(next))) out.push(next);
  });
  return normalizeKeywordList(out);
}
async function propagateKeywordChange(oldKeyword, newKeyword){
  const oldClean=normalizeKeyword(oldKeyword);
  const newClean=normalizeKeyword(newKeyword||'');
  if(!oldClean) return;
  const apply=dl=>{
    if(!dl) return false;
    const before=JSON.stringify(normalizeKeywordList(dl.tags||[]));
    dl.tags=replaceKeywordInList(dl.tags||[], oldClean, newClean);
    const after=JSON.stringify(dl.tags||[]);
    if(before!==after){ dl.dateModification=nowIso(); return true; }
    return false;
  };
  let changed=false;
  if(APP.state.current && apply(APP.state.current)) changed=true;
  (APP.state.library||[]).forEach(dl=>{ if(apply(dl)) changed=true; });
  if(newClean){
    APP.state.motsCles=normalizeKeywordList((APP.state.motsCles||[]).map(k=>norm(k)===norm(oldClean)?newClean:k));
  }else{
    APP.state.motsCles=(APP.state.motsCles||[]).filter(k=>norm(k)!==norm(oldClean));
  }
  saveKeywordLibrary();
  window.selectedKeywords=(window.selectedKeywords||[]).filter(k=>norm(k)!==norm(oldClean));
  if(changed){
    try{ await saveLibrary(); }catch(e){ console.error(e); actionStatus('Propagation du mot clé impossible : '+(e?.message||e),'warn'); }
    if(APP.state.current) setDirty(true);
  }
}
function keywordSuggestions(query){
  const q=norm(query);
  if(q.length<3) return [];
  return (APP.state.motsCles||[]).filter(k=>norm(k).includes(q)).slice(0,6);
}
function keywordDisplay(value){
  return normalizeKeyword(value).toLocaleUpperCase('fr-CH');
}
function splitKeywordEntry(value){
  return String(value||'').split(/[;\n\t, ]+/).map(v=>v.trim()).filter(Boolean);
}
function normalizeHabilitationFunction(value){
  const raw=String(value||'').trim();
  const map={
    'Admin':'ADMIN STRUCTURE APPLICATION',
    'Administrateur':'ADMIN STRUCTURE APPLICATION',
    'Admin structure':'ADMIN STRUCTURE APPLICATION',
    'Admin structure application':'ADMIN STRUCTURE APPLICATION',
    'Responsable formation':'Responsable',
    'Responsable exercice':'Responsable',
    'Officier instruction':'Gestion formation',
    'Cadre habilité':'Membres État-major',
    'Membre État-major':'Membres État-major'
  };
  const mapped=map[raw]||raw||'Consultant';
  return APP.HABILITATION_FUNCTIONS.includes(mapped) ? mapped : 'Consultant';
}
function defaultAccessRightForFunction(fonction){
  const f=normalizeHabilitationFunction(fonction);
  const map={
    'ADMIN STRUCTURE APPLICATION':'ADMIN STRUCTURE APPLICATION',
    'Chef formation':'ADMIN STRUCTURE APPLICATION',
    'Responsable':'GESTION DL',
    'Gestion formation':'GESTION DL',
    'Membres État-major':'GESTION DL',
    'Formateur':'RÉDACTION DL',
    'Rédacteur':'RÉDACTION DL',
    'Consultant':'CONSULTATION DL'
  };
  return map[f] || 'CONSULTATION DL';
}
const ACCESS_RIGHT_DETAILS={
  'ADMIN STRUCTURE APPLICATION':{
    rank:4,
    label:'Administration structurelle complète',
    summary:['Créer DL','Modifier DL','Valider DL','Gérer mots clés','Gérer habilitations','Modifier la structure de l’application','Gérer les listes de référence','Administrer la bibliothèque DL','Archiver / supprimer DL'],
    explanation:'Droit maximal réservé à l’administration institutionnelle. Il permet de modifier la structure de l’application, les paramètres structurants, les listes de référence, les habilitations et les droits globaux. Il permet aussi de consulter, modifier, valider, archiver, supprimer et administrer les DL.'
  },
  'GESTION DL':{
    rank:3,
    label:'Gestion formation / validation',
    summary:['Créer DL','Modifier DL','Valider DL','Gérer mots clés','Gérer la gestion des accès métier','Administrer les DL liées'],
    explanation:'Droit destiné aux Chefs formation, Responsables et cadres de gestion. Il permet de créer, modifier, transmettre, valider et administrer les DL liées au périmètre formation, sans modifier la structure globale de l’application.'
  },
  'RÉDACTION DL':{
    rank:2,
    label:'Rédaction et contribution',
    summary:['Créer DL','Modifier DL','Transmettre en validation','Consulter les DL impliquées'],
    explanation:'Droit destiné aux rédacteurs et formateurs. Il permet de préparer et modifier une DL, puis de la transmettre en validation. Il ne permet pas de valider officiellement ni de gérer les habilitations globales.'
  },
  'CONSULTATION DL':{
    rank:1,
    label:'Consultation uniquement',
    summary:['Consulter DL','Exporter / imprimer selon accès','Lecture seule'],
    explanation:'Droit de lecture seule. Il permet de consulter les informations autorisées et d’imprimer ou exporter selon le contexte, sans création, modification, validation ni administration.'
  }
};
function accessRightsSummary(right){
  return (ACCESS_RIGHT_DETAILS[normalizeAccessRight(right)]||ACCESS_RIGHT_DETAILS['CONSULTATION DL']).summary;
}
function accessRightExplanation(right){
  return (ACCESS_RIGHT_DETAILS[normalizeAccessRight(right)]||ACCESS_RIGHT_DETAILS['CONSULTATION DL']).explanation;
}
function accessRightLabel(right){
  return (ACCESS_RIGHT_DETAILS[normalizeAccessRight(right)]||ACCESS_RIGHT_DETAILS['CONSULTATION DL']).label;
}
function rightsHierarchyHtml(){
  return APP.ACCESS_RIGHTS.map(r=>`<details class="rights-detail"><summary><strong>${esc(r)}</strong> — ${esc(accessRightLabel(r))}</summary><p>${esc(accessRightExplanation(r))}</p><ul>${accessRightsSummary(r).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`).join('');
}
function functionRightsMatrixHtml(){
  return APP.HABILITATION_FUNCTIONS.map(f=>`<span class="function-right-chip"><strong>${esc(f)}</strong><small>${esc(defaultAccessRightForFunction(f))}</small></span>`).join('');
}
function currentUserDisplayName(){
  return profileDisplayName(normalizeProfile(APP.state.user||loadLocalProfile()||{}));
}

function emailFromText(value){
  const m=String(value||'').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m ? m[0].trim() : '';
}
function isValidEmail(value){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim()); }
function personEmail(p){ return String(p?.Email || p?.['E-mail'] || p?.email || p?.Mail || p?.mail || p?.Courriel || p?.courriel || '').trim(); }
function personLogin(p){ return String(p?.Login || p?.login || p?.Identifiant || p?.identifiant || p?.NIP || p?.nip || personEmail(p) || '').trim(); }

function personNip(p){ return String(p?.NIP || p?.nip || p?.Nip || p?.Matricule || p?.matricule || p?.Login || p?.login || '').trim(); }
function personGrade(p){ return String(p?.Grade || p?.grade || p?.GRD || p?.grd || '').trim(); }
function personNom(p){ return String(p?.Nom || p?.NOM || p?.nom || p?.lastName || p?.lastname || '').trim(); }
function personPrenom(p){ return String(p?.Prénom || p?.Prenom || p?.prenom || p?.PRENOM || p?.firstName || p?.firstname || '').trim(); }
function personFonction(p){ return String(p?.Fonction || p?.fonction || p?.Function || p?.function || p?.Role || p?.role || '').trim(); }
function personFullNameFromRow(p){ return [personGrade(p), personPrenom(p), personNom(p)].filter(Boolean).join(' ') || personLabel(p) || ''; }
function hydrateHabilitationFromPersonnel(row, existing={}){
  const nomComplet=personFullNameFromRow(row);
  const csvEmail=personEmail(row);
  const csvNip=personNip(row) || personLogin(row);
  const next={...(existing||{})};
  next.nom = nomComplet || next.nom || '';
  next.nip = csvNip || next.nip || '';
  next.login = next.nip || next.login || '';
  next.grade = personGrade(row) || next.grade || '';
  next.prenom = personPrenom(row) || next.prenom || '';
  next.nomFamille = personNom(row) || next.nomFamille || '';
  next.fullName = [next.grade,next.prenom,next.nomFamille].filter(Boolean).join(' ') || next.nom;
  next.fonctionCsv = personFonction(row) || next.fonctionCsv || '';
  if(csvEmail && !String(next.email||'').trim()) next.email=csvEmail;
  next.personnelCsvSelected=true;
  next.updatedAt=nowIso();
  return next;
}
function syncProfileFromHabilitation(h, profile=loadLocalProfile()){
  if(!h || !profile) return profile;
  const p=normalizeProfile({...profile});
  const pLogin=norm(profileIdentifier(p));
  const hKeys=[h.nip,h.login,h.email,h.nom,h.fullName].map(norm).filter(Boolean);
  if(!pLogin || !hKeys.some(k=>k===pLogin || k.includes(pLogin) || pLogin.includes(k))) return p;
  if(h.nip) p.nip=p.identifier=h.nip;
  if(h.grade) p.grade=h.grade;
  if(h.prenom) p.prenom=h.prenom;
  if(h.nomFamille) p.nom=h.nomFamille;
  if(h.email) p.email=h.email;
  if(h.fonction) p.fonction=h.fonction;
  p.droitAcces=normalizeAccessRight(h.droitAcces||h.role||p.droitAcces);
  p.displayName=profileDisplayName(p);
  return p;
}
function findPersonnelByLabel(label){
  const n=norm(label);
  if(!n) return null;
  return (APP.state.personnel||[]).find(p=>{
    const keys=[personLabel(p), personResponsabilityLabel?.(p), personEmail(p), personLogin(p)].filter(Boolean).map(norm);
    return keys.some(k=>k && (k===n || k.includes(n) || n.includes(k)));
  }) || null;
}
function currentUserEmail(){
  const u=normalizeProfile(APP.state.user||loadLocalProfile()||{});
  return String(u.email || u.mail || emailFromText(u.identifier) || '').trim();
}
function currentUserLogin(){
  const u=normalizeProfile(APP.state.user||loadLocalProfile()||{});
  return String(u.identifier || u.login || u.nip || currentUserEmail() || '').trim();
}
function currentUserMatchKeys(){
  const u=normalizeProfile(APP.state.user||loadLocalProfile()||{});
  return [currentUserEmail(), currentUserLogin(), profileDisplayName(u), [u.prenom,u.nom].filter(Boolean).join(' '), [u.grade,u.prenom,u.nom].filter(Boolean).join(' ')]
    .map(v=>norm(v)).filter(Boolean);
}
function dlTitle(dl){
  const id=dl?.identification||{};
  return dl?.referenceDL || computeReference(dl) || id.theme || 'DL sans référence';
}
function redacteurMatchesCurrentUser(value){
  const text=String(value||'').trim();
  if(!text) return false;
  const email=emailFromText(text);
  const userEmail=currentUserEmail();
  if(email && userEmail && norm(email)===norm(userEmail)) return true;
  const keys=currentUserMatchKeys();
  const n=norm(text.replace(/[<>()[\]{}]/g,' '));
  return keys.some(k=>k && (n===k || n.includes(k) || k.includes(n)));
}
function isCurrentUserRedacteur(dl){
  const redacteurs=splitValueList(dl?.responsables?.redacteurs || []);
  return redacteurs.some(redacteurMatchesCurrentUser);
}
function canEditDL(dl=APP.state.current){
  if(hasAccessAtLeast('RÉDACTION DL')) return true;
  return false;
}
function canExportDL(dl=APP.state.current){ return hasAccessAtLeast('CONSULTATION DL') || isCurrentUserRedacteur(dl); }
function canConsultDL(dl=APP.state.current){ return hasAccessAtLeast('CONSULTATION DL') || isCurrentUserRedacteur(dl); }
function droitBadgeHtml(right){ return `<span class="badge gray">${esc(normalizeAccessRight(right))}</span>`; }
const DEFAULT_DL_VERSION='v1.00';
const DL_VERSION_PATTERN=/^v([1-9]\d*)\.(\d{2})$/;
function isValidDLVersion(value){
  return DL_VERSION_PATTERN.test(String(value||'').trim().toLowerCase());
}
function extractVersionFromReference(value){
  const m=String(value||'').match(/(?:^|[-_\s])([vV][1-9]\d*\.\d{2})(?=$|[-_\s.])/);
  return m ? m[1].toLowerCase() : '';
}
function normalizeVersionValue(value,fallback=DEFAULT_DL_VERSION){
  const raw=String(value||'').trim().toLowerCase();
  if(isValidDLVersion(raw)) return raw;
  const detected=extractVersionFromReference(value);
  if(detected) return detected;
  return fallback;
}
function syncDocumentVersionFromReference(dl){
  if(!dl || typeof dl!=='object') return '';
  const current=String(dl.version||'').trim().toLowerCase();
  if(isValidDLVersion(current)){ dl.version=current; return current; }
  const detected=extractVersionFromReference(dl.referenceDL || dl.fileName || dl.nomFichier || '');
  if(detected){
    dl.version=detected;
    return detected;
  }
  dl.version=DEFAULT_DL_VERSION;
  return dl.version;
}
function nextMinorVersionValue(value){
  const v=normalizeVersionValue(value,DEFAULT_DL_VERSION);
  const m=v.match(/^v(\d+)\.(\d{2})$/);
  if(!m) return DEFAULT_DL_VERSION;
  return `v${m[1]}.${String((Number(m[2])+1)%100).padStart(2,'0')}`;
}
function nextMajorVersionValue(value){
  const v=normalizeVersionValue(value,DEFAULT_DL_VERSION);
  const m=v.match(/^v(\d+)\.(\d{2})$/);
  if(!m) return DEFAULT_DL_VERSION;
  return `v${Number(m[1])+1}.00`;
}
function conclusionTotalMinutes(dl=APP.state.current){
  return (dl?.conclusion||[]).reduce((sum,c)=>sum+numericMinutes(c?.duree),0);
}
function conclusionPlanRow(existing={}){
  const total=conclusionTotalMinutes(APP.state.current);
  return {...existing,_source:'conclusion',_sourceId:'conclusion-discussion',debut:existing.debut||'',fin:existing.fin||'',duree:total,theme:'CONCLUSION ET DISCUSSION',formateur:existing.formateur||'',remarques:existing.remarques||''};
}

const PUBLIC_CIBLE_GROUPS = [
  {title:'Personnel', icon:'person.fill', items:['Cadre','Cadre DAP','Cadre DPS','Recrue','Sapeur','Sapeur DAP','Sapeur DPS']},
  {title:'Spécialiste', icon:'person.fill', items:['Cariste','Conducteur poids-lourd','Conducteur poids-lourd Ydon 129','Conducteur véhicule léger','Élévateur à timon','Grutier','Machiniste EA','NAC','Opérateur Ydon 0','Personnel OFSI','Pilote bateau','Pontier-élingueur','Porteur ABC tenue lourde','Porteur APR','Porteur Cobra','Spécialiste Antichute']},
  {title:'Opérationnel', icon:'person.fill', items:['Chef d’engin','Chef d’intervention','Équipier']}
];
const PUBLIC_CIBLE_ALL = PUBLIC_CIBLE_GROUPS.flatMap(g=>g.items);
function uniqueNormalized(values){
  const out=[];
  (Array.isArray(values)?values:splitValueList(values)).forEach(v=>{
    const clean=String(v||'').trim();
    if(clean && !out.some(x=>norm(x)===norm(clean))) out.push(clean);
  });
  return out;
}
function publicCibleKnownLabel(value){
  const n=norm(value);
  return PUBLIC_CIBLE_ALL.find(v=>norm(v)===n) || '';
}
function splitPublicCibleLegacy(value){
  return splitValueList(value).flatMap(part=>String(part||'').split(/[\n,]+/)).map(v=>v.trim()).filter(Boolean);
}
function normalizePublicCibleModel(dl){
  if(!dl || !dl.identification) return dl;
  const id=dl.identification;
  const selected=[];
  const free=[];
  const hadStructuredPublic = (Array.isArray(id.publicCibleSelections) && id.publicCibleSelections.length>0) || String(id.publicCibleLibre||'').trim().length>0;
  uniqueNormalized(id.publicCibleSelections||[]).forEach(v=>{
    const known=publicCibleKnownLabel(v);
    if(known) selected.push(known); else free.push(v);
  });
  if(!hadStructuredPublic && id.publicCible){
    splitPublicCibleLegacy(id.publicCible).forEach(v=>{
      const known=publicCibleKnownLabel(v);
      if(known) selected.push(known); else free.push(v);
    });
  }
  const libre=String(id.publicCibleLibre||'').trim();
  if(libre) free.push(libre);
  id.publicCibleSelections=uniqueNormalized(selected);
  id.publicCibleLibre=uniqueNormalized(free).join(' ; ');
  id.publicCible=publicCibleDisplay(id);
  return dl;
}
function publicCibleDisplay(id){
  const selected=uniqueNormalized(id?.publicCibleSelections||[]);
  const libre=String(id?.publicCibleLibre||'').trim();
  return selected.concat(libre?[libre]:[]).join(' ; ');
}
function syncPublicCibleLegacy(dl=APP.state.current){
  normalizePublicCibleModel(dl);
  dl.dateModification=nowIso();
  computeReference(dl);
}
function sfSymbolText(name){
  if(name==='person.fill') return '👤';
  return '●';
}

const PERSON_GRADE_ORDER = new Map([
  'Col','Lt-col','Maj','Maj instr','Cap','Cap instr','Cap adj','Of spéc','Plt','Plt instr','Lt','Lt instr','Adj','Four','Sgtm','Sgt chef instr','Sgt chef','Sgt instr','Sgt','Cpl','App','Sap','Rec'
].map((g,i)=>[norm(g),i]));
function personGradeRank(value){
  const g=norm(value);
  if(!g) return 9999;
  if(PERSON_GRADE_ORDER.has(g)) return PERSON_GRADE_ORDER.get(g);
  return 9000;
}
function gradeFromPersonLabel(label){
  const text=String(label||'').trim();
  const grades=Array.from(new Set([...(APP.GRADES||[]), ...Array.from(PERSON_GRADE_ORDER.keys())])).filter(Boolean).sort((a,b)=>String(b).length-String(a).length);
  const found=grades.find(g=>norm(text).startsWith(norm(g)+' ') || norm(text)===norm(g));
  return found || '';
}
function personNamePartsFromLabel(label){
  const clean=String(label||'').trim();
  const exact=(APP.state?.personnel||[]).find(p=>norm(personLabel(p))===norm(clean));
  if(exact){
    return {
      grade: exact.Grade||exact.grade||'',
      nom: exact.Nom||exact.NOM||exact.nom||exact.lastName||'',
      prenom: exact.Prénom||exact.Prenom||exact.prenom||exact.firstName||''
    };
  }
  const grade=gradeFromPersonLabel(clean);
  const rest=grade ? clean.slice(String(grade).length).trim() : clean;
  const parts=rest.split(/\s+/).filter(Boolean);
  return {grade, prenom:parts[0]||'', nom:parts.slice(1).join(' ')||parts[0]||''};
}
function personLabelRank(label){ return personGradeRank(personNamePartsFromLabel(label).grade); }
function sortPersonLabels(values){
  return (values||[]).filter(Boolean).slice().sort((a,b)=>{
    const pa=personNamePartsFromLabel(a), pb=personNamePartsFromLabel(b);
    return personGradeRank(pa.grade)-personGradeRank(pb.grade) ||
      String(pa.nom||'').localeCompare(String(pb.nom||''),'fr',{sensitivity:'base'}) ||
      String(pa.prenom||'').localeCompare(String(pb.prenom||''),'fr',{sensitivity:'base'}) ||
      String(a).localeCompare(String(b),'fr',{sensitivity:'base'});
  });
}
function sortPersonnelRows(rows){
  return (rows||[]).slice().sort((a,b)=>
    personGradeRank(a.Grade||a.grade)-personGradeRank(b.Grade||b.grade) ||
    String(a.Nom||a.NOM||a.nom||'').localeCompare(String(b.Nom||b.NOM||b.nom||''),'fr',{sensitivity:'base'}) ||
    String(a.Prénom||a.Prenom||a.prenom||'').localeCompare(String(b.Prénom||b.Prenom||b.prenom||''),'fr',{sensitivity:'base'})
  );
}
function sortDLResponsables(dl=APP.state.current){
  if(!dl?.responsables) return;
  ['redacteurs','formateurs'].forEach(key=>{
    const current=dl.responsables[key];
    const sorted=sortPersonLabels(splitValueList(current));
    dl.responsables[key]=Array.isArray(current) ? sorted : sorted.join(' ; ');
  });
}


const BLOOM_HELP = {
  'Mémoriser': {
    caracterisation: 'Repérer de l’information et s’en souvenir. Connaître des événements, des dates, des lieux, des faits, de grandes idées, des règles, des lois et des formules.',
    capacite: 'Mémoriser et restituer des informations dans des termes voisins de ceux appris.',
    critere: 'La réponse donnée est identique à celle qui devrait être mémorisée.',
    verbes: ['Acquérir','Arranger','Associer','Assortir','Choisir','Citer','Cocher','Copier','Décrire','Définir','Désigner','Énoncer','Énumérer','Identifier','Indiquer','Inventorier','Lister','Localiser','Montrer','Nommer','Observer','Rappeler','Réciter','Reconnaître','Regrouper','Répéter','Reproduire','Sélectionner','Situer','Souligner','Trouver']
  },
  'Comprendre': {
    caracterisation: 'Saisir des significations, traduire des connaissances dans un nouveau contexte et interpréter des faits à partir d’un cadre donné.',
    capacite: 'Traduire et interpréter de l’information en fonction de ce qui a été appris.',
    critere: 'La réponse donnée a le même sens que l’information à reformuler.',
    verbes: ['Associer','Calculer','Changer','Classer','Comparer','Convertir','Définir','Démontrer','Déterminer','Différencier','Dire en ses mots','Distinguer','Donner un exemple','Estimer','Expliquer','Formuler','Généraliser','Illustrer','Interpréter','Paraphraser','Préciser','Prédire','Présenter','Réécrire','Reformuler','Représenter','Résumer','Traduire','Transformer']
  },
  'Appliquer': {
    caracterisation: 'Réinvestir des méthodes, des concepts et des théories dans de nouvelles situations. Résoudre des problèmes en mobilisant les compétences et connaissances requises.',
    capacite: 'Sélectionner et transférer des données pour réaliser une tâche ou résoudre un problème.',
    critere: 'La consigne a été appliquée et le résultat est juste.',
    verbes: ['Accomplir','Administrer','Appliquer','Calculer','Choisir','Classifier','Collaborer','Compléter','Construire','Contrôler','Coordonner','Découvrir','Démontrer','Déterminer','Développer','Employer','Exécuter','Expérimenter','Formuler','Gérer','Illustrer','Interpréter','Manipuler','Mesurer','Mettre en œuvre','Mettre en pratique','Modifier','Opérer','Organiser','Pratiquer','Préparer','Produire','Résoudre','Sélectionner','Transférer','Utiliser']
  },
  'Analyser': {
    caracterisation: 'Percevoir des tendances, reconnaître les sous-entendus, extraire des éléments et identifier les parties constituantes d’un tout pour en distinguer les idées.',
    capacite: 'Distinguer, classer, mettre en relation les faits et la structure d’un énoncé ou d’une question.',
    critere: 'L’argumentation présentée est réfléchie et illustre bien les concepts.',
    verbes: ['Analyser','Attribuer','Catégoriser','Chercher','Clarifier','Classer','Comparer','Compiler','Contraster','Critiquer','Déceler','Décomposer','Déduire','Délimiter','Détecter','Différencier','Discerner','Distinguer','Diviser','Examiner','Expérimenter','Expliquer','Extraire','Faire ressortir','Illustrer','Inspecter','Investiguer','Mettre en ordre d’importance','Organiser','Questionner','Rechercher','Recueillir','Séparer','Simplifier','Tester','Trier','Vérifier']
  },
  'Évaluer': {
    caracterisation: 'Comparer et distinguer des idées, déterminer la valeur de théories et d’exposés, poser des choix en fonction d’arguments raisonnés et vérifier la valeur des preuves.',
    capacite: 'Estimer, évaluer ou critiquer en fonction des normes et des critères.',
    critere: 'La démonstration est pertinente et scientifiquement viable.',
    verbes: ['Anticiper','Apprécier','Appuyer','Argumenter','Comparer','Conclure','Considérer','Corriger','Critiquer','Débattre','Décider','Défendre','Déterminer','Diagnostiquer','Discuter','Estimer','Évaluer','Expliquer','Formuler','Interpréter','Juger','Justifier','Mesurer','Négocier','Optimiser','Orienter','Prédire','Prioriser','Recommander','Réviser','Soutenir','Structurer','Valider']
  },
  'Créer': {
    caracterisation: 'Utiliser des idées disponibles pour en créer de nouvelles, généraliser à partir de faits et mettre en rapport des connaissances issues de plusieurs domaines.',
    capacite: 'Concevoir, intégrer et conjuguer des idées en une proposition, un plan ou un produit nouveau.',
    critere: 'Le produit est original, créatif.',
    verbes: ['Adapter','Animer','Bâtir','Collaborer','Combiner','Composer','Concevoir','Confectionner','Constituer','Construire','Coordonner','Créer','Dessiner','Développer','Élaborer','Établir','Fabriquer','Façonner','Former','Fusionner','Générer','Intégrer','Inventer','Organiser','Planifier','Produire','Proposer','Rédiger','Schématiser','Soumettre','Synthétiser']
  }
};
function renderBloomHelp(level){
  const cleanLevel=String(level||'').trim();
  const item=BLOOM_HELP[cleanLevel];
  if(!item) return '<div class="bloom-help bloom-help-empty"><strong>Aide Bloom</strong><span>Sélectionner un niveau Bloom pour afficher l’aide contextuelle.</span></div>';
  const cls='bloom-help-'+norm(cleanLevel).replace(/[^a-z0-9]+/g,'-');
  const verbes=item.verbes.map(v=>`<span>${esc(v)}</span>`).join('');
  return `<div class="bloom-help ${cls}">
    <div class="bloom-help-title">Aide rédactionnelle Bloom — ${esc(level)}</div>
    <div class="bloom-help-grid">
      <div class="bloom-help-card"><strong>Caractérisation de ce niveau hiérarchique</strong><p>${esc(item.caracterisation)}</p></div>
      <div class="bloom-help-card"><strong>Capacité à</strong><p>${esc(item.capacite)}</p></div>
      <div class="bloom-help-card"><strong>Critère d’évaluation</strong><p>${esc(item.critere)}</p></div>
      <div class="bloom-help-card bloom-help-verbs"><strong>Verbes d’action</strong><p class="bloom-verbs">${verbes}</p></div>
    </div>
  </div>`;
}
function syncBloomCode(dl=APP.state.current){
  if(!dl || !dl.identification) return '';
  const id=dl.identification;
  id.codeBloom = bloomCodeFor(id.niveauBloom);
  return id.codeBloom;
}

const normCompact = v => norm(v).replace(/[^a-z0-9]+/g,'');
const normTokens = v => norm(v).split(/\s+/).filter(Boolean);

function csvRecords(text){
  const src=String(text||'')
    .replace(/^\uFEFF/,'')
    .replace(/\r\n/g,'\n')
    .replace(/\r/g,'\n');
  const records=[]; let cur='', quoted=false;
  for(let i=0;i<src.length;i++){
    const ch=src[i];
    if(ch==='"'){
      if(quoted && src[i+1]==='"'){ cur+='"'; i++; }
      else quoted=!quoted;
    }else if(ch==='\n' && !quoted){ records.push(cur); cur=''; }
    else cur+=ch;
  }
  if(cur.length || src.endsWith('\n')) records.push(cur);
  return records.map(r=>r.replace(/^\uFEFF/,'')).filter(r=>String(r).trim().length);
}
function parseCsvLine(line,delimiter){
  const out=[]; let cur='', quoted=false; const src=String(line||'');
  for(let i=0;i<src.length;i++){
    const ch=src[i];
    if(ch==='"'){
      if(quoted && src[i+1]==='"'){ cur+='"'; i++; }
      else quoted=!quoted;
    }else if(ch===delimiter && !quoted){ out.push(cur.trim()); cur=''; }
    else cur+=ch;
  }
  out.push(cur.trim());
  return out;
}
function headerScore(cells){
  const nonEmpty=cells.filter(c=>String(c||'').trim()).length;
  const joined=cells.join(' ');
  if(cells.length<2 || nonEmpty<2) return -1;
  let score=nonEmpty*10 + cells.length;
  if(/[A-Za-zÀ-ÿ]/.test(joined)) score+=25;
  if(cells.some(c=>/^(NIP|Grade|Nom|Prénom|Prenom|OI|indicatif|type|plaque|marqueType|priseDeForce|Matériel|Materiel|Catégorie|Categorie|Fourniture|NoArticle|Quantité|Quantite)$/i.test(String(c).trim()))) score+=80;
  if(nonEmpty < Math.max(2, Math.ceil(cells.length/3))) score-=20;
  return score;
}
function detectCsvLayout(records){
  const candidates=[';',',','\t'];
  let best={delimiter:';', headerIndex:0, score:-1};
  const max=Math.min(records.length, 25);
  for(const delimiter of candidates){
    for(let i=0;i<max;i++){
      const cells=parseCsvLine(records[i],delimiter);
      let score=headerScore(cells);
      if(score<0) continue;
      if(delimiter===';') score+=3; // standard prioritaire du projet
      if(i>0) score-=i; // ignore les lignes parasites, mais préfère les vrais en-têtes tôt
      if(score>best.score) best={delimiter, headerIndex:i, score};
    }
  }
  return best;
}
function normalHeaderName(header,index){
  const h=String(header||'').replace(/^\uFEFF/,'').trim().replace(/^"|"$/g,'').trim();
  return h || `_col${index+1}`;
}
function addHeaderAliases(row,headers){
  for(const h of headers){
    const key=norm(h).replace(/[^a-z0-9]+/g,'');
    if(key && row[key] == null) row[key]=row[h];
  }
  return row;
}
function parseCsv(text){
  const records=csvRecords(text);
  if(!records.length) return [];
  const layout=detectCsvLayout(records);
  const headers=parseCsvLine(records[layout.headerIndex],layout.delimiter).map(normalHeaderName);
  return records.slice(layout.headerIndex+1).map(line=>{
    const cols=parseCsvLine(line,layout.delimiter);
    const row={};
    headers.forEach((h,i)=>row[h]=String(cols[i]??'').trim().replace(/^"|"$/g,'').trim());
    return addHeaderAliases(row,headers);
  }).filter(row=>Object.entries(row).some(([k,v])=>!/^_col\d+$/.test(k) && String(v||'').trim()));
}

const CSVStore = (()=>{
  const cache=new Map();
  const base='data/';
  const clean=name=>String(name||'').replace(/^\/+|^\.\//g,'').replace(/^data\//,'').split('/').pop();
  async function load(name){
    const key=clean(name);
    const existing=cache.get(key);
    if(Array.isArray(existing)) return existing;
    if(existing && typeof existing.then==='function') return existing;
    const promise=(async()=>{
      try{
        const r=await fetch(base+key,{cache:'no-cache'});
        if(!r.ok) throw new Error('HTTP '+r.status);
        const buf=await r.arrayBuffer();
        let text=new TextDecoder('utf-8',{fatal:false}).decode(buf);
        if(text.charCodeAt(0)===0xFEFF) text=text.slice(1);
        const rows=parseCsv(text);
        cache.set(key,rows); return rows;
      }catch(e){ console.warn('[CSVStore] '+key+' non chargé',e); cache.set(key,[]); return []; }
    })();
    cache.set(key,promise); return promise;
  }
  async function loadAll(files){ await Promise.all(files.map(load)); return true; }
  function get(name){ const v=cache.get(clean(name)); return Array.isArray(v)?v:[]; }
  function has(name){ return cache.has(clean(name)); }
  return {load,loadAll,get,has,clean};
})();

const AutocompleteService = (()=>{
  const aliases={
    personnel:{csv:'PersonnelSDIS.csv', fields:['NIP','nip','Nip','Grade','grade','Nom','NOM','nom','Prénom','Prenom','prenom','OI','Site','Email','E-mail','email','Mail','mail','Login','login'], label:personResponsabilityLabel, detail:r=>[r.NIP||r.nip||r.Nip, r.OI||r.Site].filter(Boolean).join(' · '), dedupe:personResponsabilityLabel},
    vehicles:{csv:'ListeVehiculeSDIS.csv', fields:['indicatif','Indicatif','type','Type','plaque','Plaque','marqueType','MarqueType','priseDeForce'], label:vehicleFullLabel, detail:r=>[r.type||r.Type,r.plaque||r.Plaque,r.marqueType||r.MarqueType].filter(Boolean).join(' · '), dedupe:vehicleFullLabel},
    vehicules:null,
    materiel:{csv:'Materiel.csv', fields:['Matériel','Materiel','Catégorie','Categorie','Numéro','Numero'], label:r=>r['Matériel']||r.Materiel||Object.values(r)[0]||'', detail:r=>[r['Catégorie']||r.Categorie,r['Numéro']||r.Numero].filter(Boolean).join(' · ')},
    fournitures:{csv:'Fournitures.csv', fields:['Fourniture','NoArticle','Catégorie','Categorie'], label:r=>r.Fourniture||r.NoArticle||Object.values(r)[0]||'', detail:r=>[r.NoArticle,r['Catégorie']||r.Categorie].filter(Boolean).join(' · ')},
    public:{staticRows:()=>APP.PUBLICS.map(v=>({label:v})), fields:['label'], label:r=>r.label, detail:r=>'', dedupe:r=>r.label}
  };
  aliases.vehicules=aliases.vehicles;
  function cfg(key){ return aliases[key] || aliases[String(key||'').toLowerCase()] || {csv:key, fields:[], label:r=>String(r.name||r.Nom||Object.values(r)[0]||''), detail:r=>''}; }
  function textFor(row,c){ return (c.fields&&c.fields.length?c.fields:Object.keys(row)).map(f=>row[f]||'').join(' '); }
  function score(row,c,query){
    const q=norm(query), cq=normCompact(query); if(!q) return -1;
    const label=c.label(row)||'', labelN=norm(label), labelC=normCompact(label);
    const hay=textFor(row,c), hayN=norm(hay), hayC=normCompact(hay);
    let s=-1;
    if(labelN===q || labelC===cq) s=1000;
    else if(labelN.startsWith(q) || labelC.startsWith(cq)) s=850;
    else if(labelN.includes(q) || labelC.includes(cq)) s=700;
    else if(hayN.includes(q) || hayC.includes(cq)) s=520;
    else if(normTokens(q).every(t=>hayN.includes(t)||hayC.includes(t))) s=420;
    if(s<0) return -1;
    return s-Math.min(80,label.length/4);
  }
  function rows(key){ const c=cfg(key); const base=c.staticRows?c.staticRows():CSVStore.get(c.csv); return String(key||'').toLowerCase()==='personnel' ? sortPersonnelRows(base) : base; }
  function search(key,query,{limit=16}={}){
    const c=cfg(key); const seen=new Set(); const out=[];
    for(const row of rows(key)){
      const s=score(row,c,query); if(s<0) continue;
      const label=c.label(row)||''; const dkey=normCompact(c.dedupe?c.dedupe(row):label);
      if(!dkey || seen.has(dkey)) continue; seen.add(dkey);
      out.push({row,score:s,label,detail:c.detail?c.detail(row):''});
    }
    out.sort((a,b)=> String(key||'').toLowerCase()==='personnel' ? (personGradeRank(a.row.Grade||a.row.grade)-personGradeRank(b.row.Grade||b.row.grade) || String(a.row.Nom||a.row.NOM||a.row.nom||'').localeCompare(String(b.row.Nom||b.row.NOM||b.row.nom||''),'fr',{sensitivity:'base'}) || String(a.row.Prénom||a.row.Prenom||a.row.prenom||'').localeCompare(String(b.row.Prénom||b.row.Prenom||b.row.prenom||''),'fr',{sensitivity:'base'})) : (b.score-a.score || String(a.label).localeCompare(String(b.label),'fr')));
    return out.slice(0,limit);
  }
  function findExact(key,value){ const c=cfg(key), v=norm(value); if(!v)return null; return rows(key).find(r=>norm(c.label(r))===v)||null; }
  return {config:cfg,rows,search,findExact,label:(key,row)=>cfg(key).label(row),detail:(key,row)=>cfg(key).detail?.(row)||''};
})();

function formatPersonNamePart(value){
  return String(value||'')
    .trim()
    .toLocaleLowerCase('fr-CH')
    .replace(/(^|[\s'’\-])([\p{L}])/gu,(m,sep,ch)=>sep+ch.toLocaleUpperCase('fr-CH'));
}
function personFullLabel(p){
  const grade=String(p.Grade||p.grade||'').trim();
  const prenom=formatPersonNamePart(p.Prénom||p.Prenom||p.prenom||p.firstName||'');
  const nom=formatPersonNamePart(p.Nom||p.NOM||p.nom||p.lastName||'');
  return [grade,prenom,nom].filter(Boolean).join(' ');
}
function personResponsabilityLabel(p){
  return personFullLabel(p);
}
function vehicleFullLabel(v){ return v.indicatif||v.Indicatif||v.plaque||v.Plaque||v.type||v.Type||''; }
function catalogLabel(key,row){ return AutocompleteService.label(key,row)||''; }

function defaultDL(){
  return {
    schema:'dl.creator.web.v2', id:uid(), referenceDL:'', version:'v1.00', dateCreation:nowIso(), dateModification:nowIso(), statut:'',
    identification:{
      domaine:'', theme:'', codeTheme:'', sousTheme:'', codeSousTheme:'', typeDoc:'DL', resumeCamelCase:'', informationLecon:'',
      typeFormation:'', niveauBloom:'', codeBloom:'', publicCible:'', publicCibleSelections:[], publicCibleLibre:'', codePublic:'', participantsClasses:'', dureeTotale:0,
      creationModification:''
    },
    tags:[],
    responsables:{responsable:'', redacteurs:[], formateurs:[]},
    buts:[],
    evaluations:[],
    planHoraire:[],
    planTrancheCount:1,
    planTranchesHoraires:[{debut:''},{debut:''},{debut:''},{debut:''}],
    planFormateurLecon:'',
    filRougeEmplacementChantierGeneral:'',
    filRougePreparationChantierGeneral:'',
    filRouge:[],
    materiel:{didactique:[], materielEngage:[], fournitures:[], vehiculesEngages:[], remarquesLogistiques:''},
    conclusion:[],
    distribution:{destinataires:[], groupes:[], groupesLibre:'', fonctions:[], fonctionsLibre:'', remarques:'', remarqueGeneraleHtml:'', remarqueGeneraleText:''},
    validation:{statut:'', validateur:'', dateValidation:'', commentaire:''},
    importWord:{sourceName:'', detectedFields:{}, unclassifiedHtml:'', warnings:[]},
    historique:[]
  };
}


function ensureDLModel(dl){
  if(!dl.identification) dl.identification={};
  const id=dl.identification;
  if(id.codeTheme == null) id.codeTheme='';
  if(id.sousTheme == null) id.sousTheme='';
  if(id.codeSousTheme == null) id.codeSousTheme='';
  if(id.typeDoc == null) id.typeDoc='DL';
  if(id.resumeCamelCase == null) id.resumeCamelCase='';
  if(id.informationLecon == null) id.informationLecon='';
  if(id.publicCible == null) id.publicCible='';
  if(!Array.isArray(id.publicCibleSelections)) id.publicCibleSelections=[];
  if(id.publicCibleLibre == null) id.publicCibleLibre='';
  normalizePublicCibleModel(dl);
  if(id.codePublic == null) id.codePublic='';
  if(id.codeBloom == null) id.codeBloom='';
  syncBloomCode(dl);
  if(id.creationModification == null) id.creationModification='';
  dl.tags=normalizeKeywordList(dl.tags||[]);
  if(!Array.isArray(dl.planHoraire)) dl.planHoraire=[];
  if(dl.planTrancheCount == null) dl.planTrancheCount=1;
  ensurePlanTranchesHoraires(dl);
  if(dl.planFormateurLecon == null) dl.planFormateurLecon='';
  syncDocumentVersionFromReference(dl);
  dl.version=normalizeVersionValue(dl.version||'v1.00');
  dl.appVersion=APP.VERSION;
  dl.versionMeta=window.DLCreatorCore?.getVersionInfo?.() || {version:APP.VERSION};
  if(dl.filRougeEmplacementChantierGeneral == null) dl.filRougeEmplacementChantierGeneral='';
  if(dl.filRougePreparationChantierGeneral == null) dl.filRougePreparationChantierGeneral='';
  if(!Array.isArray(dl.filRouge)) dl.filRouge=[];
  dl.filRouge.forEach(normalizeFilRougeSection);
  if(!Array.isArray(dl.buts)) dl.buts=[];
  if(!Array.isArray(dl.evaluations)) dl.evaluations=[];
  if(!Array.isArray(dl.conclusion)) dl.conclusion=[];
  dl.conclusion=dl.conclusion.map(c=>({texte:'',texteHtml:'',duree:'',butsLies:[],evaluationsLiees:[],pointsAVerifier:'',pointsAVerifierHtml:'',...(typeof c==='string'?{texte:c}:c||{})}));
  dl.buts=dl.buts.map(b=>({texte:'',niveauBloom:'Appliquer',evaluationsLiees:[],...(typeof b==='string'?{texte:b}:b||{})}));
  dl.evaluations=dl.evaluations.map(e=>({texte:'',mesurable:true,butsLies:[],...(typeof e==='string'?{texte:e}:e||{})}));
  if(!dl.responsables) dl.responsables={responsable:'',redacteurs:[],formateurs:[]};
  sortDLResponsables(dl);
  if(!dl.materiel) dl.materiel={didactique:[], materielEngage:[], fournitures:[], vehiculesEngages:[], remarquesLogistiques:''};
  if(!dl.distribution) dl.distribution={destinataires:[], groupes:[], groupesLibre:'', fonctions:[], fonctionsLibre:'', remarques:'', remarqueGeneraleHtml:'', remarqueGeneraleText:''};
  if(dl.distribution.remarqueGeneraleHtml == null) dl.distribution.remarqueGeneraleHtml='';
  if(dl.distribution.remarqueGeneraleText == null) dl.distribution.remarqueGeneraleText=strip(dl.distribution.remarqueGeneraleHtml||'');
  if(!dl.validation) dl.validation={statut:'',validateur:'',dateValidation:'',commentaire:''};
  window.DLCreatorCore?.workflowService?.ensure?.(dl);
  window.DLCreatorCore?.collaborationStorage?.enrich?.(dl);
  syncDLStatus(dl);
  return dl;
}
function normalizeDLStatus(value){
  const raw=String(value||'').trim();
  if(!raw) return '';
  const found=APP.STATUSES.find(s=>norm(s)===norm(raw));
  if(found) return found;
  return displayStatusFromWorkflowState(raw);
}
function effectiveDLStatus(dl){
  const fromValidation=displayStatusFromAny(dl?.validation?.statut || '');
  if(fromValidation) return fromValidation;
  const fromWorkflow=displayStatusFromWorkflowState(dl?.workflow?.state || '');
  if(fromWorkflow) return fromWorkflow;
  const fromGeneral=displayStatusFromAny(dl?.statut || '');
  return fromGeneral || 'Brouillon';
}
function syncDLStatus(dl){
  if(!dl) return 'Brouillon';
  if(!dl.distribution) dl.distribution={destinataires:[], groupes:[], groupesLibre:'', fonctions:[], fonctionsLibre:'', remarques:'', remarqueGeneraleHtml:'', remarqueGeneraleText:''};
  if(dl.distribution.remarqueGeneraleHtml == null) dl.distribution.remarqueGeneraleHtml='';
  if(dl.distribution.remarqueGeneraleText == null) dl.distribution.remarqueGeneraleText=strip(dl.distribution.remarqueGeneraleHtml||'');
  if(!dl.validation) dl.validation={statut:'',validateur:'',dateValidation:'',commentaire:''};
  const status=effectiveDLStatus(dl);
  dl.statut=status;
  dl.validation.statut=status;
  if(!dl.workflow) dl.workflow={};
  if(!displayStatusFromWorkflowState(dl.workflow.state)) dl.workflow.state=workflowStateForDisplayStatus(status);
  return status;
}
function syncValidationStatusUI(status){
  const normalized=normalizeDLStatus(status)||'Brouillon';
  const fields=document.querySelectorAll('[data-path="validation.statut"], [data-validation-status="1"]');
  fields.forEach(field=>{ if('value' in field) field.value=normalized; else field.textContent=normalized; });
  return normalized;
}
function syncGeneralitesStatusUI(status){
  const normalized=normalizeDLStatus(status)||'Brouillon';
  const generalStatus=document.getElementById('generalitesStatus');
  if(generalStatus) generalStatus.value=normalized;
  const legacyGeneralStatus=document.querySelector('[data-path="statut"]');
  if(legacyGeneralStatus) legacyGeneralStatus.value=normalized;
  return normalized;
}
function syncStatusFieldsUI(status){
  const normalized=normalizeDLStatus(status)||'Brouillon';
  syncValidationStatusUI(normalized);
  syncGeneralitesStatusUI(normalized);
  return normalized;
}
function applyValidationStatus(displayStatus, workflowState, options={}){
  const dl=APP.state.current;
  if(!dl) return 'Brouillon';
  ensureDLModel(dl);
  let next=normalizeDLStatus(displayStatus)||displayStatusFromWorkflowState(workflowState)||'Brouillon';
  if(next==='Validé' && !canValidateDL()){
    next='En validation';
    workflowState=workflowStateForDisplayStatus(next);
    if(!options.silent) actionStatus('Validation réservée aux responsables habilités.','warn');
  }
  const targetWorkflow=workflowState || workflowStateForDisplayStatus(next);
  dl.validation=dl.validation||{statut:'',validateur:'',dateValidation:'',commentaire:''};
  dl.workflow=dl.workflow||{};
  dl.statut=next;
  dl.validation.statut=next;
  dl.workflow.state=targetWorkflow;
  dl.workflow.updatedAt=nowIso();
  dl.workflow.lockedForValidation=String(targetWorkflow).startsWith('validation ');
  dl.workflow.lockedForPublication=['validation publication','publication bloquée','publié'].includes(targetWorkflow);
  if(!Array.isArray(dl.workflow.history)) dl.workflow.history=[];
  if(options.audit!==false){
    dl.workflow.history.push({atUTC:nowIso(),from:options.previousWorkflowState||'',to:targetWorkflow,by:currentUserDisplayName(),comment:options.comment||next});
  }
  if(next==='Validé'){
    dl.validation.validateur=currentUserDisplayName();
    if(!dl.validation.dateValidation) dl.validation.dateValidation=today();
  }
  dl.dateModification=nowIso();
  syncStatusFieldsUI(next);
  try{ window.DLCreatorCore?.auditService?.write?.('workflow-status-ui-sync',{dlId:dl.id,status:next,workflowState:targetWorkflow},'WORKFLOW'); }catch{}
  try{ window.DLCreatorCore?.audit?.push?.({type:'workflow-status', status:next, workflowState:targetWorkflow, at:nowIso()}); }catch{}
  setDirty();
  const saved=saveCurrent(false,{forceIncompleteDraft:true});
  if(saved?.catch) saved.catch(e=>console.warn('Sauvegarde statut workflow impossible', e));
  if(options.refresh!==false) renderPanel();
  return next;
}
function setValidationStatus(status, options={}){
  return applyValidationStatus(status, workflowStateForDisplayStatus(status), options);
}
function statusBadgeClass(status){
  return status==='Validé' || status==='Validée' ? 'green' : (status==='Archivé' || status==='Archivée' ? 'gray' : 'red');
}
function effectiveDLType(dl){
  return String(dl?.identification?.typeFormation || dl?.identification?.typeDoc || '').trim();
}
function toCamelCaseStrict(value){
  return String(value||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^A-Za-z0-9]+/g,' ')
    .trim()
    .split(/\s+/).filter(Boolean)
    .map(w=>w.charAt(0).toUpperCase()+w.slice(1))
    .join('');
}
function cleanCodeValue(value,max=5){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,max);
}
function updateComputedDurations(dl=APP.state.current){
  if(!dl) return 0;
  if(!dl.identification) dl.identification={};
  if(Array.isArray(dl.planHoraire)){
    const conclusionMinutes=conclusionTotalMinutes(dl);
    const row=dl.planHoraire.find(r=>r && r._source==='conclusion');
    if(row) row.duree=conclusionMinutes;
  }
  const total=planHoraireTotalMinutes(dl);
  dl.identification.dureeTotale=total;
  return total;
}
function formatMinutesDisplay(value){
  const n=numericMinutes(value);
  return `${n} minutes`;
}
function refreshLiveGeneralites(){
  const dl=APP.state.current; if(!dl) return;
  const duration=$('#generalitesDureeTotal'); if(duration) duration.value=formatMinutesDisplay(dl.identification?.dureeTotale||0);
  const bloom=$('#generalitesCodeBloom'); if(bloom) bloom.value=dl.identification?.codeBloom||'';
  const ref=$('#generalitesReference'); if(ref) ref.value=dl.referenceDL||'';
  const status=$('#generalitesStatus') || $('[data-path="statut"]'); if(status) status.value=effectiveDLStatus(dl)||'Brouillon';
  const top=$('.status-line.dl-ref'); if(top) top.textContent=dl.referenceDL||'';
}
function numericMinutes(v){
  const n=String(v??'').replace(/\D/g,'').slice(0,3);
  return n ? Number(n) : 0;
}
function ensureFilRougeSyncIds(dl){
  (dl.filRouge||[]).forEach((section,index)=>{
    if(!section._syncId) section._syncId = 'fr-' + (dl.id||'dl') + '-' + index + '-' + Math.random().toString(36).slice(2,8);
  });
}

function normalizeFilRougeSection(section){
  if(!section || typeof section!=='object') return section;
  if(!Array.isArray(section.butsLies)) section.butsLies=asArray(section.butsLies);
  if(!Array.isArray(section.annexesPdf)) section.annexesPdf=Array.isArray(section.documentsPdf)?section.documentsPdf:[];
  section.annexesPdf=section.annexesPdf.map(a=>{
    const normalized={
      id:a.id||uid(),
      name:a.name||a.fileName||'Annexe PDF',
      type:a.type||'application/pdf',
      size:Number(a.size||a.sizeBytes||0),
      pages:Number(a.pages||a.pageCount||1)||1,
      dataUrl:a.dataUrl||a.data||a.url||'',
      addedAt:a.addedAt||nowIso(),
      updatedAt:a.updatedAt||a.addedAt||nowIso()
    };
    // Cache temporaire utilisé uniquement par l'aperçu / impression v8.01.
    // Il est conservé en mémoire pendant la génération, mais n'est pas créé dans
    // les JSON métier importés/exportés.
    if(Array.isArray(a.renderedPages)) normalized.renderedPages=a.renderedPages;
    if(a.renderError) normalized.renderError=a.renderError;
    return normalized;
  }).filter(a=>a.dataUrl);
  return section;
}
function formatBytes(bytes){
  const n=Number(bytes||0);
  if(!n) return '0 Ko';
  if(n<1024) return n+' o';
  if(n<1024*1024) return (n/1024).toFixed(n<10240?1:0).replace('.',',')+' Ko';
  return (n/1024/1024).toFixed(2).replace('.',',')+' Mo';
}
function estimatePdfPageCountFromDataUrl(dataUrl){
  try{
    const base64=String(dataUrl||'').split(',')[1]||'';
    const bin=atob(base64);
    const sample=bin.length>2200000 ? bin.slice(0,2200000)+bin.slice(-2200000) : bin;
    const matches=sample.match(/\/Type\s*\/Page(?!s)\b/g);
    return Math.max(1,matches?matches.length:1);
  }catch(e){ return 1; }
}
function readFileAsDataUrl(file){
  return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(r.error||new Error('Lecture fichier impossible')); r.readAsDataURL(file); });
}
async function pdfFileToAnnex(file,existing={}){
  if(!file || !(file.type==='application/pdf' || /\.pdf$/i.test(file.name||''))) throw new Error('Sélectionner un fichier PDF valide.');
  const dataUrl=await readFileAsDataUrl(file);
  return {
    id:existing.id||uid(),
    name:file.name||existing.name||'Annexe PDF',
    type:'application/pdf',
    size:file.size||0,
    pages:estimatePdfPageCountFromDataUrl(dataUrl),
    dataUrl,
    addedAt:existing.addedAt||nowIso(),
    updatedAt:nowIso()
  };
}

function dataUrlToArrayBuffer(dataUrl){
  const base64=String(dataUrl||'').split(',')[1]||'';
  const bin=atob(base64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return bytes.buffer;
}
async function renderSinglePdfPageToDataUrl(pdf,pageNo,scale=1.65){
  const page=await pdf.getPage(pageNo);
  const viewport=page.getViewport({scale});
  const canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width);
  canvas.height=Math.ceil(viewport.height);
  const ctx=canvas.getContext('2d',{alpha:false});
  ctx.fillStyle='#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  await page.render({canvasContext:ctx,viewport}).promise;
  return canvas.toDataURL('image/png');
}
async function renderAnnexPdfPagesForExport(dl){
  // Clone d'export uniquement : ne modifie ni IndexedDB, ni JSON, ni la DL active.
  // v8.01 : toute annexe PDF destinée au document imprimable est convertie en PNG
  // page par page avant l'ouverture de l'aperçu. Aucun iframe/object/embed PDF ne
  // doit être généré dans le flux imprimable.
  const exportDl=JSON.parse(JSON.stringify(dl||{}));
  try{
    ensureDLModel(exportDl);
    const annexes=allPdfAnnexes(exportDl).filter(x=>x.annex?.dataUrl);
    if(!annexes.length) return exportDl;
    const pdfjs=await loadPdfJs();
    for(const {annex} of annexes){
      delete annex.renderedPages;
      delete annex.renderError;
      try{
        const pdf=await pdfjs.getDocument({data:dataUrlToArrayBuffer(annex.dataUrl)}).promise;
        const total=Math.max(1,Number(pdf.numPages||annex.pages||1));
        annex.pages=total;
        annex.renderedPages=[];
        for(let p=1;p<=total;p++){
          annex.renderedPages.push(await renderSinglePdfPageToDataUrl(pdf,p,1.7));
        }
        if(annex.renderedPages.length!==total) throw new Error('Nombre de pages rendues incomplet');
      }catch(err){
        console.warn('Rendu image annexe PDF impossible, bloc institutionnel généré', annex?.name, err);
        annex.renderedPages=[];
        annex.renderError='Annexe PDF non rendue automatiquement — réimporter le PDF ou vérifier PDF.js';
      }
    }
  }catch(err){
    console.warn('Préparation annexes PDF impossible, aucun fallback iframe imprimable', err);
    allPdfAnnexes(exportDl).forEach(({annex})=>{
      annex.renderedPages=[];
      annex.renderError='Annexe PDF non rendue automatiquement — réimporter le PDF ou vérifier PDF.js';
    });
  }
  return exportDl;
}
function allPdfAnnexes(dl=APP.state.current){
  ensureDLModel(dl);
  const out=[];
  (dl.filRouge||[]).forEach((s,sectionIndex)=>{
    normalizeFilRougeSection(s);
    (s.annexesPdf||[]).forEach((annex,annexIndex)=>out.push({section:s,sectionIndex,annex,annexIndex}));
  });
  return out;
}
function renderPdfAnnexes(sectionIndex,section){
  normalizeFilRougeSection(section);
  const annexes=section.annexesPdf||[];
  return `<div class="annexes-pdf-block"><div class="annexes-pdf-head"><label>ANNEXES PDF LIÉES À CETTE SECTION</label><label class="btn small annex-import-btn"><input type="file" hidden accept="application/pdf,.pdf" onchange="importSectionPdfAnnex(event,${sectionIndex})">Importer un PDF</label></div>${annexes.length?`<div class="annex-card-grid">${annexes.map((a,j)=>`<article class="annex-card"><div class="annex-icon">PDF</div><div class="annex-info"><strong>${esc(a.name)}</strong><span>${esc(a.pages)} page${Number(a.pages)>1?'s':''} · ${esc(formatBytes(a.size))}</span></div><div class="annex-actions"><button class="btn small icon-only" type="button" title="Aperçu" onclick="previewSectionPdfAnnex(${sectionIndex},${j})">👁</button><label class="btn small icon-only" title="Modifier / remplacer"><input type="file" hidden accept="application/pdf,.pdf" onchange="replaceSectionPdfAnnex(event,${sectionIndex},${j})">✏️</label><button class="btn small icon-only" type="button" title="Supprimer" onclick="deleteSectionPdfAnnex(${sectionIndex},${j})">🗑</button></div></article>`).join('')}</div>`:`<div class="annex-empty">Aucune annexe PDF liée à cette section.</div>`}</div>`;
}
window.importSectionPdfAnnex=async (event,sectionIndex)=>{
  const file=event?.target?.files?.[0];
  if(event?.target) event.target.value='';
  if(!file) return;
  try{
    const section=APP.state.current.filRouge[sectionIndex]; if(!section) return;
    normalizeFilRougeSection(section);
    section.annexesPdf.push(await pdfFileToAnnex(file));
    APP.state.current.dateModification=nowIso(); setDirty(); renderPanel(); actionStatus('Annexe PDF importée');
  }catch(e){ actionStatus('Import PDF impossible : '+(e?.message||e),'warn'); }
};
window.replaceSectionPdfAnnex=async (event,sectionIndex,annexIndex)=>{
  const file=event?.target?.files?.[0];
  if(event?.target) event.target.value='';
  if(!file) return;
  try{
    const section=APP.state.current.filRouge[sectionIndex]; if(!section) return;
    normalizeFilRougeSection(section);
    const previous=section.annexesPdf[annexIndex]; if(!previous) return;
    section.annexesPdf[annexIndex]=await pdfFileToAnnex(file,previous);
    APP.state.current.dateModification=nowIso(); setDirty(); renderPanel(); actionStatus('Annexe PDF remplacée');
  }catch(e){ actionStatus('Remplacement PDF impossible : '+(e?.message||e),'warn'); }
};
window.deleteSectionPdfAnnex=(sectionIndex,annexIndex)=>{
  const section=APP.state.current.filRouge[sectionIndex]; if(!section) return;
  normalizeFilRougeSection(section);
  if(!section.annexesPdf[annexIndex]) return;
  if(!confirm('Confirmer la suppression de cette annexe PDF ?')) return;
  section.annexesPdf.splice(annexIndex,1);
  APP.state.current.dateModification=nowIso(); setDirty(); renderPanel(); actionStatus('Annexe PDF supprimée');
};
window.previewSectionPdfAnnex=(sectionIndex,annexIndex)=>{
  const section=APP.state.current.filRouge[sectionIndex]; if(!section) return;
  normalizeFilRougeSection(section);
  const annex=section.annexesPdf[annexIndex]; if(!annex) return;
  openPdfAnnexPreview(annex, section.titre||`Section ${sectionIndex+1}`);
};
function openPdfAnnexPreview(annex,sectionTitle=''){
  const overlay=document.createElement('div'); overlay.className='pdf-annex-overlay no-print';
  const total=Math.max(1,Number(annex.pages||1));
  overlay.innerHTML=`<div class="pdf-annex-modal"><div class="pdf-annex-modal-head"><div><strong>${esc(annex.name)}</strong><span>${esc(sectionTitle)} · ${total} page${total>1?'s':''} · ${esc(formatBytes(annex.size))}</span></div><button class="preview-close" type="button" aria-label="Fermer">×</button></div><div class="pdf-annex-tools"><button class="btn small" data-prev type="button">Page précédente</button><span>Page <input type="number" min="1" max="${total}" value="1" data-page> / ${total}</span><button class="btn small" data-next type="button">Page suivante</button><label>Zoom <input type="range" min="60" max="180" value="100" step="10" data-zoom></label><span data-zoom-label>100%</span></div><iframe class="pdf-annex-frame" title="Aperçu PDF" src="${annex.dataUrl}#page=1&zoom=100"></iframe></div>`;
  document.body.appendChild(overlay);
  const frame=overlay.querySelector('.pdf-annex-frame'), pageInput=overlay.querySelector('[data-page]'), zoomInput=overlay.querySelector('[data-zoom]'), zoomLabel=overlay.querySelector('[data-zoom-label]');
  const update=()=>{ const page=Math.min(total,Math.max(1,Number(pageInput.value||1))); pageInput.value=page; const zoom=Number(zoomInput.value||100); zoomLabel.textContent=zoom+'%'; frame.src=annex.dataUrl+`#page=${page}&zoom=${zoom}`; };
  overlay.querySelector('[data-prev]').onclick=()=>{ pageInput.value=Math.max(1,Number(pageInput.value)-1); update(); };
  overlay.querySelector('[data-next]').onclick=()=>{ pageInput.value=Math.min(total,Number(pageInput.value)+1); update(); };
  pageInput.onchange=update; zoomInput.oninput=update;
  const close=()=>overlay.remove(); overlay.onclick=e=>{if(e.target===overlay)close();}; overlay.querySelector('.preview-close').onclick=close;
}
function pdfAnnexesIndexHtml(dl){
  const annexes=allPdfAnnexes(dl);
  if(!annexes.length) return '';
  return `<div class="pdf-annexes-index pdf-section"><h2>ANNEXES PDF</h2><p>Les annexes ci-dessous sont ajoutées automatiquement dans l’ordre des sections FIL ROUGE.</p><table class="pdf-table pdf-annexes-table"><colgroup><col class="pdf-annex-col-section"><col class="pdf-annex-col-file"><col class="pdf-annex-col-pages"><col class="pdf-annex-col-size"></colgroup><thead><tr><th>Section</th><th>Fichier</th><th>Pages</th><th>Taille</th></tr></thead><tbody>${annexes.map(({sectionIndex,section,annex})=>`<tr><td>${sectionIndex+1}. ${esc(section.titre||'Section sans titre')}</td><td>${esc(annex.name)}</td><td class="num">${esc(annex.pages)}</td><td>${esc(formatBytes(annex.size))}</td></tr>`).join('')}</tbody></table></div>`;
}
function pdfAnnexesPagesHtml(dl){
  const annexes=allPdfAnnexes(dl);
  if(!annexes.length) return '';
  return annexes.map(({sectionIndex,section,annex})=>{
    const total=Math.max(1,Number(annex.pages||1));
    return Array.from({length:total},(_,page)=>{
      const img=Array.isArray(annex.renderedPages) ? annex.renderedPages[page] : '';
      const body=img
        ? `<div class="pdf-annex-image-wrap"><img src="${img}" alt="${esc(annex.name)} page ${page+1}"></div>`
        : `<div class="pdf-annex-render-error" role="note"><strong>Annexe PDF non rendue automatiquement</strong><span>Réimporter le PDF ou vérifier PDF.js.</span></div>`;
      return `<section class="pdf-annex-page"><div class="pdf-annex-page-head"><strong>Annexe PDF · Section ${sectionIndex+1} — ${esc(section.titre||'Section sans titre')}</strong><span>${esc(annex.name)} · page ${page+1}/${total}</span></div>${body}</section>`;
    }).join('');
  }).join('');
}
function pdfAnnexesHtml(dl){
  return pdfAnnexesIndexHtml(dl)+pdfAnnexesPagesHtml(dl);
}

function planRowFromFilRouge(section,existing={}){
  return {
    ...existing,
    _source:'filRouge',
    _sourceId:section._syncId,
    debut: existing.debut || '',
    fin: existing.fin || '',
    duree: numericMinutes(section.duree),
    theme: String(section.titre||'').trim(),
    formateur: existing.formateur || '',
    remarques: existing.remarques || ''
  };
}
function syncPlanHoraireFromFilRouge(dl=APP.state.current, options={}){
  if(!dl) return 0;
  if(!Array.isArray(dl.filRouge)) dl.filRouge=[];
  if(!Array.isArray(dl.planHoraire)) dl.planHoraire=[];
  ensureFilRougeSyncIds(dl);

  const requiredAutoIds=new Set(dl.filRouge.map(section=>section._syncId));
  const existingById=new Map();
  dl.planHoraire.forEach(row=>{
    if(row && row._source==='filRouge' && row._sourceId) existingById.set(row._sourceId,row);
  });

  const next=[];
  const insertedAutoIds=new Set();

  if(options && options.forceFilRougeOrder){
    // Réorganisation FIL ROUGE : les séquences automatiques doivent suivre exactement
    // le nouvel ordre des sections, tout en conservant les lignes manuelles existantes.
    dl.filRouge.forEach(section=>{
      next.push(planRowFromFilRouge(section, existingById.get(section._syncId)||{}));
      insertedAutoIds.add(section._syncId);
    });
    dl.planHoraire.forEach(row=>{
      if(!row || row._source==='filRouge') return;
      next.push(row);
    });
  }else{
    // Conserver l'ordre actuellement affiché afin que les séquences manuelles
    // restent à l'endroit choisi par l'utilisateur. Les lignes FIL ROUGE sont
    // seulement rafraîchies, pas reconstruites en bloc au-dessus des autres.
    dl.planHoraire.forEach(row=>{
      if(row && row._source==='filRouge'){
        if(requiredAutoIds.has(row._sourceId) && !insertedAutoIds.has(row._sourceId)){
          const section=dl.filRouge.find(s=>s._syncId===row._sourceId);
          next.push(planRowFromFilRouge(section,row));
          insertedAutoIds.add(row._sourceId);
        }
      }else{
        // Conserver aussi les lignes manuelles vides : elles viennent d'être ajoutées
        // et doivent rester éditables après le rendu.
        next.push(row || {debut:'',fin:'',duree:'',theme:'',formateur:'',remarques:''});
      }
    });

    // Ajouter les nouvelles sections FIL ROUGE qui n'existaient pas encore dans le plan.
    dl.filRouge.forEach(section=>{
      if(!insertedAutoIds.has(section._syncId)){
        next.push(planRowFromFilRouge(section, existingById.get(section._syncId)||{}));
        insertedAutoIds.add(section._syncId);
      }
    });
  }

  const conclusionMinutes=conclusionTotalMinutes(dl);
  const existingConclusion=dl.planHoraire.find(row=>row && row._source==='conclusion') || {};
  const withoutOldConclusion=next.filter(row=>!(row && row._source==='conclusion'));
  if(conclusionMinutes>0){
    withoutOldConclusion.push({...existingConclusion,_source:'conclusion',_sourceId:'conclusion-discussion',debut:existingConclusion.debut||'',fin:existingConclusion.fin||'',duree:conclusionMinutes,theme:'CONCLUSION ET DISCUSSION',formateur:existingConclusion.formateur||'',remarques:existingConclusion.remarques||''});
  }
  const changed=JSON.stringify(dl.planHoraire)!==JSON.stringify(withoutOldConclusion);
  if(changed) dl.planHoraire=withoutOldConclusion;
  fillEmptyPlanTrainerRowsFromLesson(dl);
  computePlanRowTranches(dl);
  updateComputedDurations(dl);
  return changed ? 1 : 0;
}
function planHoraireTotalMinutes(dl=APP.state.current){
  return (dl?.planHoraire||[]).reduce((sum,row)=>sum+numericMinutes(row?.duree),0);
}
function parsePlanTime(value){
  const raw=String(value||'').trim().toLowerCase().replace(/\s+/g,'');
  let m=raw.match(/^(\d{1,2}):(\d{2})$/);
  if(!m) m=raw.match(/^(\d{1,2})h(\d{2})$/);
  if(!m){
    const compact=raw.match(/^(\d{3,4})$/);
    if(compact){
      const digits=compact[1].padStart(4,'0');
      m=[compact[0], digits.slice(0,2), digits.slice(2,4)];
    }
  }
  if(!m) return null;
  const h=Number(m[1]), min=Number(m[2]);
  if(h<0 || h>23 || min<0 || min>59) return null;
  return h*60+min;
}
function formatPlanTime(total){
  if(total == null || !Number.isFinite(total)) return '';
  const m=((Math.round(total)%1440)+1440)%1440;
  return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
}
function diffPlanMinutes(start,end){
  const a=parsePlanTime(start), b=parsePlanTime(end);
  if(a == null || b == null) return 0;
  let d=b-a;
  if(d<0) d+=1440;
  return d;
}
function addPlanMinutes(start,duration){
  const a=parsePlanTime(start);
  const d=numericMinutes(duration);
  if(a == null || d == null || !Number.isFinite(d)) return '';
  return formatPlanTime(a+d);
}
function ensurePlanTranchesHoraires(dl=APP.state.current){
  if(!dl) return [];
  if(!Array.isArray(dl.planTranchesHoraires)) dl.planTranchesHoraires=[];
  const rows=Array.isArray(dl.planHoraire) ? dl.planHoraire : [];
  const legacyStart=rows.find(r=>r && r.debut)?.debut || '';
  const existingUsed=dl.planTranchesHoraires.reduce((max,t,i)=>String(t?.debut||'').trim()?i+1:max,0);
  const count=Math.max(1, Math.min(4, Number(dl.planTrancheCount)||existingUsed||1));
  const next=[];
  for(let i=0;i<4;i++){
    const current=dl.planTranchesHoraires[i] || {};
    const debut=String(current.debut || (i===0 && !dl.planTranchesHoraires[0]?.debut ? legacyStart : '') || '').trim();
    next.push({debut: i<count ? debut : ''});
  }
  dl.planTrancheCount=count;
  dl.planTranchesHoraires=next;
  return next;
}
function computePlanRowTranches(dl=APP.state.current){
  if(!dl || !Array.isArray(dl.planHoraire)) return;
  const tranches=ensurePlanTranchesHoraires(dl);
  const visibleCount=usedPlanTrancheCount(dl);
  const offsets=[];
  let acc=0;
  dl.planHoraire.forEach((row,i)=>{
    if(!row || typeof row!=='object') return;
    offsets[i]=acc;
    const dur=numericMinutes(row.duree);
    row.tranches=tranches.map((t,idx)=>{
      const base=t?.debut || '';
      if(idx>=visibleCount || !isCompletePlanTime(base) || !dur) return {debut:'',fin:''};
      const debut=addPlanMinutes(base, offsets[i]);
      return {debut, fin:addPlanMinutes(debut,dur)};
    });
    if(row.tranches[0]?.debut){ row.debut=row.tranches[0].debut; row.fin=row.tranches[0].fin; }
    acc += dur;
  });
}
function normalizeTrainerDisplayName(value){
  return String(value||'').replace(/\s+/g,' ').trim();
}
function applyPlanFormateurLeconToRows(dl=APP.state.current, options={}){
  if(!dl || !Array.isArray(dl.planHoraire)) return 0;
  const global=normalizeTrainerDisplayName(dl.planFormateurLecon);
  if(!global) return 0;
  dl.planFormateurLecon=global;
  let changed=0;
  // Action volontaire depuis FORMATEUR DE LA LEÇON : remplace toutes les lignes.
  // En dehors de cette action, les lignes modifiées manuellement ne doivent jamais
  // être réécrasées par un re-render ou une synchronisation Fil rouge.
  dl.planHoraire.forEach(row=>{
    if(row && typeof row==='object' && normalizeTrainerDisplayName(row.formateur)!==global){
      row.formateur=global;
      row.formateurPersonnalise=false;
      changed++;
    }
  });
  if(changed && options.persist!==false){
    dl.dateModification=nowIso();
  }
  return changed;
}
function fillEmptyPlanTrainerRowsFromLesson(dl=APP.state.current){
  if(!dl || !Array.isArray(dl.planHoraire)) return 0;
  const global=normalizeTrainerDisplayName(dl.planFormateurLecon);
  if(!global) return 0;
  let changed=0;
  dl.planHoraire.forEach(row=>{
    if(!row || typeof row!=='object') return;
    // Ne remplir que les lignes jamais personnalisées et encore vides.
    // Une ligne saisie manuellement, même différente du formateur global, est conservée.
    if(!row.formateurPersonnalise && !normalizeTrainerDisplayName(row.formateur)){
      row.formateur=global;
      changed++;
    }
  });
  return changed;
}
function applyManualPlanTrainer(rowIndex, trainerName, options={}){
  const dl=APP.state.current;
  const clean=normalizeTrainerDisplayName(trainerName);
  if(!dl || !Array.isArray(dl.planHoraire)) return false;
  const idx=Number(rowIndex);
  const row=dl.planHoraire[idx];
  if(!row || !Number.isInteger(idx)) return false;
  row.formateur=clean;
  row.formateurPersonnalise=!!clean && clean!==normalizeTrainerDisplayName(dl.planFormateurLecon);
  dl.dateModification=nowIso();
  const el=document.querySelector(`[data-ac-path="planHoraire.${idx}.formateur"] .ac-input, [data-path="planHoraire.${idx}.formateur"]`);
  if(el) el.value=clean;
  refreshPlanHoraireInputs();
  setDirty();
  if(options.render) renderPanel();
  return true;
}
function planTrainerRowIndexFromPath(path){
  const m=String(path||'').match(/^planHoraire\.(\d+)\.formateur$/);
  return m ? Number(m[1]) : null;
}
function syncPlanFormateurLeconUI(value){
  const clean=normalizeTrainerDisplayName(value);
  const globalInput=document.querySelector('[data-ac-path="planFormateurLecon"] .ac-input');
  if(globalInput && globalInput!==document.activeElement) globalInput.value=clean;
}
function syncPlanFormateurRowsUI(dl=APP.state.current){
  if(!dl || !Array.isArray(dl.planHoraire)) return;
  dl.planHoraire.forEach((row,i)=>{
    const el=document.querySelector(`[data-ac-path="planHoraire.${i}.formateur"] .ac-input, [data-path="planHoraire.${i}.formateur"]`);
    if(el) el.value=row?.formateur || '';
  });
}
function applyLessonTrainerToSchedule(trainerName, options={}){
  const dl=APP.state.current;
  if(!dl) return 0;
  const clean=normalizeTrainerDisplayName(trainerName);
  if(!clean) return 0;
  if(!Array.isArray(dl.planHoraire)) dl.planHoraire=[];
  dl.planFormateurLecon=clean;
  const changed=applyPlanFormateurLeconToRows(dl, {persist:false});
  dl.dateModification=nowIso();
  syncPlanFormateurLeconUI(clean);
  syncPlanFormateurRowsUI(dl);
  refreshPlanHoraireInputs();
  refreshLiveGeneralites();
  setDirty();
  if(options.render) renderPanel();
  return changed;
}

function formatPlanRange(row,index){
  const slot=row?.tranches?.[index] || {};
  if(slot.debut && slot.fin) return `${slot.debut}
${slot.fin}`;
  return '—';
}
function formatPlanRangeHtml(row,index){
  const slot=row?.tranches?.[index] || {};
  if(slot.debut && slot.fin){
    return `<span>${esc(slot.debut)}</span><span>${esc(slot.fin)}</span>`;
  }
  return '<span class="plan-range-empty">—</span>';
}
function usedPlanTrancheCount(dl=APP.state.current){
  const existing=Array.isArray(dl?.planTranchesHoraires) ? dl.planTranchesHoraires.reduce((max,t,i)=>String(t?.debut||'').trim()?i+1:max,0) : 0;
  return Math.max(1, Math.min(4, Number(dl?.planTrancheCount)||existing||1));
}
function planTimeSuggestionBase(dl=APP.state.current){
  const tranches=ensurePlanTranchesHoraires(dl);
  return tranches.find(t=>isCompletePlanTime(t?.debut))?.debut || '18:30';
}
function applyPlanTrancheSuggestion(countValue, baseValue){
  const dl=APP.state.current;
  if(!dl) return;
  const count=Math.max(1, Math.min(4, Number(countValue)||usedPlanTrancheCount(dl)||1));
  const total=planHoraireTotalMinutes(dl);
  const fallbackBase=planTimeSuggestionBase(dl);
  const base=isCompletePlanTime(baseValue) ? normalizePlanTimeInput(baseValue) : normalizePlanTimeInput(fallbackBase);
  dl.planTrancheCount=count;
  const tranches=ensurePlanTranchesHoraires(dl);
  let previous=base;
  for(let i=0;i<4;i++){
    if(i>=count){
      tranches[i].debut='';
      continue;
    }
    if(i===0){
      tranches[i].debut=base;
      previous=base;
      continue;
    }
    // Chaque session suivante commence à l'heure de début de la session précédente + TOTAL DURÉE.
    // On écrase volontairement les anciennes valeurs résiduelles pour éviter les horaires incohérents.
    const next=total>0 && isCompletePlanTime(previous) ? addPlanMinutes(previous,total) : '';
    tranches[i].debut=next;
    previous=next || previous;
  }
  dl.planTranchesHoraires=tranches;
  computePlanRowTranches(dl);
  updateComputedDurations(dl);
  refreshLiveGeneralites();
  setDirty();
}
window.applyPlanTrancheSuggestion=()=>{
  const count=Number(document.querySelector('[data-plan-tranche-count]')?.value || usedPlanTrancheCount(APP.state.current));
  const base=document.querySelector('[data-path="planTranchesHoraires.0.debut"]')?.value || planTimeSuggestionBase(APP.state.current);
  applyPlanTrancheSuggestion(count, base);
  renderPanel();
};
window.setPlanTrancheCount=(value)=>{
  const dl=APP.state.current;
  if(!dl) return;
  const count=Math.max(1, Math.min(4, Number(value)||1));
  dl.planTrancheCount=count;
  const tranches=ensurePlanTranchesHoraires(dl);
  for(let i=count;i<4;i++) tranches[i].debut='';
  computePlanRowTranches(dl);
  updateComputedDurations(dl);
  refreshLiveGeneralites();
  setDirty();
  renderPanel();
};
function formatPlanRangesPdf(row){
  const count=usedPlanTrancheCount(APP.state.current);
  const values=Array.from({length:count},(_,i)=>formatPlanRange(row,i)).filter(v=>v && v!=='—');
  return values.length ? values.map((v,i)=>`<span><strong>${sfClockFillIcon('pdf-plan-hour-inline-icon')}</strong> ${esc(v)}</span>`).join('') : '—';
}
function isCompletePlanTime(value){
  return parsePlanTime(value) !== null;
}
function normalizePlanTimeInput(value){
  const parsed=parsePlanTime(value);
  return parsed == null ? String(value||'').trim() : formatPlanTime(parsed);
}
window.normalizePlanTrancheInput=(el)=>{
  if(!el) return;
  const normalized=normalizePlanTimeInput(el.value);
  el.value=normalized;
  if(el.dataset?.path){
    setByPath(APP.state.current,el.dataset.path,normalized);
    computePlanRowTranches(APP.state.current);
    refreshPlanHoraireInputs();
    updateComputedDurations(APP.state.current);
    refreshLiveGeneralites();
    setDirty();
  }
};
function recalcPlanHoraireFrom(index=0, changedField=''){
  const dl=APP.state.current;
  if(!dl || !Array.isArray(dl.planHoraire)) return;
  const rows=dl.planHoraire;
  if(!rows.length) return;
  const startIndex=Math.max(0, Math.min(Number(index)||0, rows.length-1));
  const row=rows[startIndex];
  if(!row) return;

  // Ne jamais recalculer pendant une saisie horaire partielle.
  // Certains navigateurs émettent un input transitoire (ex. "19:" ou "19:0")
  // pendant la saisie des minutes. Recalculer + rerender à ce moment faisait perdre
  // le focus, relançait l'interface et pouvait donner l'impression d'un reset de la DL.
  if((changedField==='debut' || changedField==='fin') && row[changedField] && !isCompletePlanTime(row[changedField])) return;

  if(changedField==='fin' && isCompletePlanTime(row.debut) && isCompletePlanTime(row.fin)){
    row.duree=diffPlanMinutes(row.debut,row.fin);
  }
  if(changedField==='debut' && isCompletePlanTime(row.debut) && numericMinutes(row.duree)){
    row.fin=addPlanMinutes(row.debut,row.duree);
  }
  if(changedField==='duree' && isCompletePlanTime(row.debut) && numericMinutes(row.duree)){
    row.fin=addPlanMinutes(row.debut,row.duree);
  }

  for(let i=startIndex;i<rows.length;i++){
    const current=rows[i];
    if(!current) continue;
    if(i>startIndex && isCompletePlanTime(rows[i-1]?.fin)) current.debut=rows[i-1].fin;
    if(isCompletePlanTime(current.debut) && numericMinutes(current.duree)){
      current.fin=addPlanMinutes(current.debut,current.duree);
    }else if(isCompletePlanTime(current.debut) && isCompletePlanTime(current.fin) && !numericMinutes(current.duree)){
      current.duree=diffPlanMinutes(current.debut,current.fin);
    }
  }
  computePlanRowTranches(dl);
  updateComputedDurations(dl);
}
function refreshPlanHoraireInputs(){
  const rows=APP.state.current?.planHoraire || [];
  rows.forEach((row,i)=>{
    ['debut','fin','duree','formateur'].forEach(field=>{
      const el=document.querySelector(`[data-path="planHoraire.${i}.${field}"], [data-ac-path="planHoraire.${i}.${field}"] .ac-input`);
      if(el && el !== document.activeElement) el.value = row?.[field] ?? '';
    });
  });
  const tranches=ensurePlanTranchesHoraires(APP.state.current);
  tranches.forEach((tranche,i)=>{
    const el=document.querySelector(`[data-path="planTranchesHoraires.${i}.debut"]`);
    if(el && el !== document.activeElement) el.value = tranche?.debut || '';
  });
  computePlanRowTranches(APP.state.current);
  rows.forEach((row,i)=>{
    for(let h=0;h<4;h++){
      const cell=document.querySelector(`[data-plan-range="${i}.${h}"]`);
      if(cell) cell.innerHTML=formatPlanRangeHtml(row,h);
    }
  });
  const totalEl=document.querySelector('.plan-total span');
  if(totalEl) totalEl.textContent = `${planHoraireTotalMinutes(APP.state.current)} minutes`;
}

function computeReference(dl){
  ensureDLModel(dl);
  const id=dl.identification||{};
  updateComputedDurations(dl);
  syncBloomCode(dl);
  const fallback=v=>String(v||'').trim() || 'X';
  const ref=[id.codeTheme, id.codeSousTheme, id.typeDoc, id.codePublic, id.codeBloom, id.resumeCamelCase, dl.version]
    .map(fallback)
    .join('-');
  dl.referenceDL=ref;
  return ref;
}
function dlFileName(dl,ext){
  computeReference(dl);
  const ref=dl.referenceDL || 'DL_SANS_REFERENCE';
  return ref.replace(/[^A-Za-z0-9._-]+/g,'_')+'.'+ext;
}
function loadJson(key,fallback){ try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback} }

function saveLocalProfile(profile){ safeSetLocalStorage(APP.PROFILE_KEY, JSON.stringify(profile||{}), 'profil-local'); }
function loadLocalProfile(){ return loadJson(APP.PROFILE_KEY, null); }
function profileIdentifier(profile){ return String(profile?.identifier || profile?.nip || '').trim(); }
function profileDisplayName(profile){ return [profile?.grade, profile?.prenom, profile?.nom].map(v=>String(v||'').trim()).filter(Boolean).join(' ') || profile?.displayName || 'Profil'; }
function normalizeProfile(profile){
  const p=profile||{};
  if(!p.identifier && p.nip) p.identifier=String(p.nip||'').trim();
  if(!p.nom && p.displayName && String(p.displayName||'').trim().toLowerCase()!=='profil'){
    const parts=String(p.displayName||'').trim().split(/\s+/);
    if(parts.length>1){ p.prenom=p.prenom||parts.slice(0,-1).join(' '); p.nom=p.nom||parts.at(-1); }
    else p.nom=p.nom||p.displayName;
  }
  if(String(p.nom||'').trim().toLowerCase()==='profil') p.nom='';
  // La fonction legacy peut exister dans d'anciens profils, mais elle n'est plus utilisée ni affichée.
  if(!p.email && p.eMail) p.email=p.eMail;
  if(!p.email && p.mail) p.email=p.mail;
  p.displayName=profileDisplayName(p);
  return p;
}
function cryptoBytesHex(length=16){
  const a=new Uint8Array(length);
  if(window.crypto?.getRandomValues) window.crypto.getRandomValues(a); else for(let i=0;i<a.length;i++) a[i]=Math.floor(Math.random()*256);
  return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function sha256Hex(value){
  if(window.crypto?.subtle){
    const data=new TextEncoder().encode(String(value));
    const hash=await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  // Repli local minimal si SubtleCrypto est indisponible (ex. ouverture file:// très restrictive).
  let h1=0x811c9dc5, h2=0x01000193;
  for(const ch of String(value)){ h1^=ch.charCodeAt(0); h1=Math.imul(h1,0x01000193); h2=(h2+Math.imul(h1,31))>>>0; }
  return (h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0');
}
async function passwordHash(password,salt){ return sha256Hex(`${salt}:${password}`); }
async function verifyPassword(profile,password){
  if(!profile?.passwordHash || !profile?.passwordSalt) return false;
  return await passwordHash(password, profile.passwordSalt) === profile.passwordHash;
}
async function setProfilePassword(profile,password){
  profile.passwordSalt=cryptoBytesHex(16);
  profile.passwordHash=await passwordHash(password, profile.passwordSalt);
  profile.passwordUpdatedAt=nowIso();
  return profile;
}

function activationTokenForHabilitation(h){
  const base=[h?.id||'', h?.nip||h?.login||'', h?.email||'', Date.now(), cryptoBytesHex(8)].join(':');
  return btoa(unescape(encodeURIComponent(base))).replace(/[^A-Za-z0-9]/g,'').slice(0,48) || cryptoBytesHex(24);
}
function activationLinkForHabilitation(h){
  const token=h.activationToken || activationTokenForHabilitation(h);
  const origin=(location && location.origin) ? location.origin : 'URL Netlify à compléter';
  return `${origin}${location?.pathname||'/'}?activation=${encodeURIComponent(token)}&nip=${encodeURIComponent(h?.nip||h?.login||'')}`;
}
function formatDateTimeCH(value){
  const d=value ? new Date(value) : new Date();
  if(Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-CH',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',', '');
}
function syncHabilitationEmailFromProfile(profile){
  const p=normalizeProfile(profile||loadLocalProfile()||{});
  const email=String(p.email||'').trim();
  if(!email) return false;
  const login=norm(profileIdentifier(p));
  const list=loadHabilitations();
  const idx=list.findIndex(h=>[h.nip,h.login,h.email,h.nom,h.fullName].map(norm).some(k=>k && (k===login || k===norm(p.nip) || k===norm(p.email) || k===norm(profileDisplayName(p)))));
  if(idx<0) return false;
  const old=String(list[idx].email||'').trim();
  if(old===email) return false;
  list[idx].email=email;
  list[idx].emailUpdatedAt=nowIso();
  list[idx].emailUpdatedSource='profil-utilisateur';
  saveHabilitations(list,{skipProfileSync:true});
  auditLocal('profile-email-sync-to-habilitation',{nip:list[idx].nip||'', oldEmail:old ? 'renseigné' : '', newEmail:'renseigné', destructive:false},'AUDIT');
  return true;
}
function isProfileComplete(profile){
  const p=normalizeProfile(profile||{});
  return ['grade','prenom','nom','nip','email'].every(k=>String(p[k]||'').trim().length>0);
}
function startSession(profile,options={}){
  const p=normalizeProfile(profile);
  saveLocalProfile(p);
  safeSetLocalStorage(APP.SESSION_KEY, profileIdentifier(p), 'session-locale');
  APP.state.user=p;
  APP.state.profileCompletionRequired=!!options.requireProfileCompletion;
  APP.state.activeModule=APP.state.profileCompletionRequired ? 'profile' : 'home';
  APP.state.activeTab=APP.state.profileCompletionRequired ? 'profile' : (APP.state.activeTab || 'generalites');
  render();
}
function endSession(){ localStorage.removeItem(APP.SESSION_KEY); APP.state.user=null; renderLogin(); }
function loginMessage(text,type='info'){
  const el=$('#loginMessage');
  if(el){ el.className=`alert ${type}`; el.textContent=text||''; el.style.display=text?'block':'none'; }
}

const LibraryStore = (()=>{
  const DB_NAME='DL_CREATOR_WEB_DB_V1';
  const STORE='library';
  let dbPromise=null;
  function open(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)) return reject(new Error('IndexedDB indisponible'));
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'id'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Ouverture IndexedDB impossible'));
    });
    return dbPromise;
  }
  async function all(){
    try{
      const db=await open();
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readonly');
        const req=tx.objectStore(STORE).getAll();
        req.onsuccess=()=>resolve(req.result||[]);
        req.onerror=()=>reject(req.error||new Error('Lecture bibliothèque impossible'));
      });
    }catch(e){
      console.warn('[LibraryStore] lecture IndexedDB impossible',e);
      return null;
    }
  }
  async function replaceAll(items){
    const db=await open();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      const store=tx.objectStore(STORE);
      store.clear();
      (items||[]).forEach(item=>store.put(structuredClone(item)));
      tx.oncomplete=()=>resolve(true);
      tx.onerror=()=>reject(tx.error||new Error('Écriture bibliothèque impossible'));
      tx.onabort=()=>reject(tx.error||new Error('Écriture bibliothèque interrompue'));
    });
  }
  return {all,replaceAll};
})();

function mergeLibrarySnapshots(primary=[], secondary=[]){
  const map=new Map();
  [...(secondary||[]), ...(primary||[])].forEach(item=>{
    if(!item || typeof item!=='object') return;
    const key=String(item.id || item.referenceDL || uid());
    const previous=map.get(key);
    if(!previous){ map.set(key,item); return; }
    const a=Date.parse(item.dateModification || item.updatedAt || item.dateCreation || '') || 0;
    const b=Date.parse(previous.dateModification || previous.updatedAt || previous.dateCreation || '') || 0;
    map.set(key, a>=b ? item : previous);
  });
  return Array.from(map.values());
}
async function loadLibrary(){
  const idb=await LibraryStore.all();
  const legacy=loadJson(APP.STORAGE_KEY, []);
  const merged=mergeLibrarySnapshots(Array.isArray(idb)?idb:[], Array.isArray(legacy)?legacy:[]);
  window.DLCreatorCore?.migrationService?.recordStartupMigration?.(merged);
  if(merged.length){
    try{
      await LibraryStore.replaceAll(merged);
      safeRemoveLocalStorage(APP.STORAGE_KEY, 'library-idb-priority');
    }catch(e){
      console.warn('[LibraryStore] consolidation IndexedDB/localStorage impossible',e);
    }
    return merged;
  }
  return [];
}
async function saveLibrary(){
  let idbOk=false, lsOk=false, idbError=null;
  try{
    await LibraryStore.replaceAll(APP.state.library);
    idbOk=true;
    safeRemoveLocalStorage(APP.STORAGE_KEY, 'library-idb-priority');
  }catch(e){
    idbError=e;
    console.warn('[LibraryStore] IndexedDB indisponible, fallback localStorage',e);
  }
  if(!idbOk){
    lsOk=safeSetLocalStorage(APP.STORAGE_KEY, JSON.stringify(APP.state.library||[]), 'library-fallback');
  }
  window.DLCreatorCore?.migrationService?.write?.('sauvegarde-bibliothèque',{count:(APP.state.library||[]).length,indexedDB:idbOk,localStorage:lsOk,fallbackLocalStorage:!idbOk&&lsOk,error:idbError?.message||'',quotaGuardV904:true}, idbOk||lsOk?'INFO':'ERROR');
  if(!idbOk && !lsOk) throw idbError || new Error('Aucun stockage local disponible');
}
function tryPersistDraft(){
  try{
    const dl=APP?.state?.current;
    if(!dl || typeof dl !== 'object') return false;
    ensureDLModel(dl);
    dl.dateModification=nowIso();
    computeReference(dl);
    try{ safeSetLocalStorage(APP.DRAFT_KEY, JSON.stringify(dl), 'brouillon'); }catch(storageError){
      console.warn('[DL creator] Brouillon localStorage non persistant', storageError);
      return false;
    }
    if(APP.state) APP.state.lastAutosave=new Date();
    return true;
  }catch(e){
    console.warn('[DL creator] Persistance brouillon ignorée sans interruption du démarrage', e);
    return false;
  }
}

function updateSaveIndicator(){
  const el=$('#saveState');
  if(el) el.textContent = APP.state.dirty ? 'Modifications non sauvegardées' : 'Sauvegardé';
}
function setDirty(v=true){
  APP.state.dirty=!!v;
  updateSaveIndicator();
  if(v) scheduleAutosave();
  else clearTimeout(APP.state.saveTimer);
}
function scheduleAutosave(){ clearTimeout(APP.state.saveTimer); APP.state.saveTimer=setTimeout(()=>{ saveCurrent(false); APP.state.lastAutosave=new Date(); }, 900); }
function actionStatus(msg,type='ok'){
  const el=$('#actionStatus');
  if(!el) return;
  clearTimeout(APP.state.actionStatusTimer);
  el.textContent=msg||'';
  el.className=`action-status ${type}`;
  if(msg){
    APP.state.actionStatusTimer=setTimeout(()=>{
      el.textContent='';
      el.className='action-status';
    },2200);
  }
}
function toast(msg,type='ok'){ actionStatus(msg,type); }

function institutionalConfirm({title='Confirmation', message='', confirmText='Confirmer', cancelText='Annuler', warn=false}={}){
  return new Promise(resolve=>{
    const overlay=document.createElement('div');
    overlay.className='modal-overlay no-print';
    overlay.innerHTML=`<div class="modal-card institutional-confirm ${warn?'warn':''}" role="dialog" aria-modal="true" aria-labelledby="institutionalConfirmTitle"><h3 id="institutionalConfirmTitle">${esc(title)}</h3><p>${esc(message).replace(/\n/g,'<br>')}</p><div class="modal-actions row-actions"><button class="btn" data-confirm-cancel type="button">${esc(cancelText)}</button><button class="btn red" data-confirm-ok type="button">${esc(confirmText)}</button></div></div>`;
    const cleanup=(value)=>{ overlay.remove(); resolve(value); };
    overlay.addEventListener('click',e=>{ if(e.target===overlay) cleanup(false); });
    overlay.querySelector('[data-confirm-cancel]').addEventListener('click',()=>cleanup(false));
    overlay.querySelector('[data-confirm-ok]').addEventListener('click',()=>cleanup(true));
    document.body.appendChild(overlay);
    setTimeout(()=>overlay.querySelector('[data-confirm-ok]')?.focus(),0);
  });
}

function dlHasMinimumDraftFields(dl=APP.state.current){
  const id=dl?.identification||{};
  return !!String(normalizeLegacyDomain(id.domaine)||'').trim() && !!String(id.theme||'').trim();
}
function removeCurrentTemporaryDraft(){
  try{ localStorage.removeItem(APP.DRAFT_KEY); }catch{}
  const id=APP.state.current?.id;
  if(id) APP.state.library=APP.state.library.filter(x=>String(x.id)!==String(id));
}
async function confirmIncompleteDraftIfNeeded({reason='navigation'}={}){
  const dl=APP.state.current;
  if(!dl || dlHasMinimumDraftFields(dl) || dl.__incompleteDraftConfirmed) return true;
  const keep=await institutionalConfirm({
    title:'DL incomplète',
    message:'Cette DL semble incomplète.\nVoulez-vous conserver cette DL comme brouillon afin d’y apporter des modifications ultérieurement ?',
    confirmText:'Conserver brouillon',
    cancelText:'Ne pas conserver',
    warn:true
  });
  if(keep){
    dl.__incompleteDraftConfirmed=true;
    dl.statut='Brouillon';
    if(!dl.validation) dl.validation={};
    dl.validation.statut='Brouillon';
    await saveCurrent(false,{forceIncompleteDraft:true});
    return true;
  }
  removeCurrentTemporaryDraft();
  await saveLibrary().catch(()=>{});
  setDirty(false);
  return false;
}

async function init(){
  APP.state.library = await loadLibrary();
  APP.state.motsCles = loadKeywordLibrary();
  const storedProfile = normalizeProfile(loadLocalProfile());
  const storedSession = localStorage.getItem(APP.SESSION_KEY);
  APP.state.user = storedProfile && storedProfile.passwordHash && profileIdentifier(storedProfile) === storedSession ? storedProfile : null;
  await loadCatalogs();
  APP.state.current = defaultDL();
  syncPlanHoraireFromFilRouge(APP.state.current);
  computeReference(APP.state.current);
  render();
}

async function loadCatalogs(){
  await CSVStore.loadAll(['PersonnelSDIS.csv','ListeVehiculeSDIS.csv','Materiel.csv','Fournitures.csv']);
  APP.state.personnel = CSVStore.get('PersonnelSDIS.csv');
  APP.state.vehicules = CSVStore.get('ListeVehiculeSDIS.csv');
  APP.state.materiel = CSVStore.get('Materiel.csv');
  APP.state.fournitures = CSVStore.get('Fournitures.csv');
}
function personLabel(p){ return personResponsabilityLabel(p); }
function vehLabel(v){ return vehicleFullLabel(v); }

function sfIcon(name){
  const common='class="sf-action-icon" aria-hidden="true" focusable="false" viewBox="0 0 64 64"';
  const icons={
    save:`<svg ${common} data-sf-symbol="externaldrive.fill"><path d="M12 8h34l6 6v42H12z"></path><rect x="19" y="12" width="22" height="14" rx="2" fill="#fff" opacity=".92"></rect><rect x="20" y="36" width="24" height="14" rx="3" fill="#fff" opacity=".92"></rect><rect x="25" y="40" width="14" height="3" rx="1.5" fill="currentColor"></rect></svg>`,
    exportJson:`<svg ${common} data-sf-symbol="square.and.arrow.up.badge.checkmark.fill"><rect x="10" y="15" width="34" height="36" rx="7"></rect><path d="M27 34V8M18 17l9-9 9 9" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"></path><circle cx="47" cy="43" r="11" fill="currentColor"></circle><path d="M41.8 43.2l3.6 3.8 7-8" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"></path></svg>`,
    importJson:`<svg ${common} data-sf-symbol="square.and.arrow.down.badge.checkmark.fill"><rect x="10" y="15" width="34" height="36" rx="7"></rect><path d="M27 7v26M18 24l9 9 9-9" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"></path><circle cx="47" cy="43" r="11" fill="currentColor"></circle><path d="M41.8 43.2l3.6 3.8 7-8" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"></path></svg>`,
    pdf:`<svg ${common} data-sf-symbol="printer.fill"><path d="M18 8h28v16H18z"></path><path d="M13 24h38a7 7 0 0 1 7 7v16H46v9H18v-9H6V31a7 7 0 0 1 7-7z"></path><rect x="23" y="39" width="18" height="13" rx="2" fill="#fff"></rect><circle cx="47" cy="33" r="3" fill="#fff"></circle></svg>`
  };
  return icons[name] || '';
}
function sfClockFillIcon(extraClass=''){
  return `<svg class="sf-clock-fill-icon ${extraClass}" aria-hidden="true" focusable="false" viewBox="0 0 64 64" data-sf-symbol="clock.fill"><circle cx="32" cy="32" r="25" fill="currentColor"></circle><path d="M32 17v16l11 7" stroke="var(--sf-clock-hand,#fff)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"></path></svg>`;
}
function sfPersonWave2FillIcon(extraClass=''){
  return `<svg class="sf-person-wave-icon ${extraClass}" aria-hidden="true" focusable="false" viewBox="0 0 64 64" data-sf-symbol="person.wave.2.fill"><circle cx="23" cy="21" r="8" fill="currentColor"></circle><path d="M8 51c3-12 9-18 15-18s12 6 15 18z" fill="currentColor"></path><path d="M42 18c4 4 4 10 0 14M49 12c7 8 7 21 0 29" stroke="currentColor" stroke-width="5" stroke-linecap="round" fill="none"></path></svg>`;
}
function sectionReorderIcon(direction){
  const symbol = direction < 0 ? 'arrow.up.document.fill' : 'arrow.down.document.fill';
  const arrow = direction < 0
    ? '<path d="M32 8 20 20h8v18h8V20h8L32 8Z" fill="currentColor"></path>'
    : '<path d="M32 52 20 40h8V22h8v18h8L32 52Z" fill="currentColor"></path>';
  return `<svg class="sf-action-icon filrouge-reorder-svg" aria-hidden="true" focusable="false" viewBox="0 0 64 64" data-sf-symbol="${symbol}"><path d="M17 6h25l10 10v42H17z" fill="currentColor" opacity=".20"></path><path d="M42 6v12h10" fill="currentColor" opacity=".38"></path>${arrow}</svg>`;
}
function renderFilRougeReorderControls(index,total){
  const upDisabled=index<=0, downDisabled=index>=total-1;
  return `<div class="filrouge-reorder" aria-label="Réorganisation section"><span class="filrouge-reorder-label">Réorganisation section</span><div class="filrouge-reorder-actions"><button class="btn small icon-only filrouge-reorder-btn" type="button" title="Monter cette section" aria-label="Monter cette section" onclick="moveFilRougeSection(${index},-1)" ${upDisabled?'disabled':''}>${sectionReorderIcon(-1)}</button><button class="btn small icon-only filrouge-reorder-btn" type="button" title="Descendre cette section" aria-label="Descendre cette section" onclick="moveFilRougeSection(${index},1)" ${downDisabled?'disabled':''}>${sectionReorderIcon(1)}</button></div></div>`;
}
function actionIconButton(action,icon,label,extra=''){
  return `<button class="btn icon-btn" data-action="${action}" data-tooltip="${esc(label)}" aria-label="${esc(label)}" type="button" ${extra}>${sfIcon(icon)}</button>`;
}
function actionIconLabel(inputId,icon,label){
  return `<label class="btn icon-btn" data-tooltip="${esc(label)}" aria-label="${esc(label)}">${sfIcon(icon)}<input type="file" id="${inputId}" accept=".json" hidden></label>`;
}
function render(){
  if(!APP.state.user) return renderLogin();
  const mustCompleteProfile=!!APP.state.profileCompletionRequired;
  if(mustCompleteProfile) APP.state.activeModule='profile';
  const isDLModule=APP.state.activeModule==='dl' && !mustCompleteProfile;
  const tabsHtml=isDLModule ? `<div class="tabs no-print">${['generalites','objectifs','filrouge','plan','distribution','materiel','validation'].map(t=>`<button class="tab ${APP.state.activeTab===t?'active':''}" data-tab="${t}">${tabTitle(t)}</button>`).join('')}</div>` : '';
  const toolbarHtml=isDLModule
    ? `<div class="toolbar no-print action-toolbar"><button class="btn red new-dl-btn" data-action="new" type="button">Nouvelle DL</button>${actionIconButton('save','save','Sauvegarde DL')}${actionIconButton('jsonExport','exportJson','Export JSON')}${actionIconLabel('jsonImport','importJson','Import JSON')}${actionIconButton('pdf','pdf','Générer PDF')}<span id="actionStatus" class="action-status" aria-live="polite"></span><span id="saveState" class="status-line">${APP.state.dirty?'Modifications non sauvegardées':'Sauvegardé'}</span><span class="status-line dl-ref">${esc(computeReference(APP.state.current))}</span></div>`
    : `<div class="toolbar no-print action-toolbar module-toolbar"><span id="actionStatus" class="action-status" aria-live="polite"></span>${mustCompleteProfile?'<span class="status-line">Configuration du profil requise</span>':`<span class="status-line">${esc(moduleTitle(APP.state.activeModule))}</span>`}</div>`;
  document.getElementById('app').innerHTML = `
  <div class="topbar"><div class="topbar-inner">
    <button class="brand-home" type="button" data-action="home" aria-label="Retour à l’accueil DL Creator Web"><img src="assets/LogoSDISblanc.png" class="brand-logo" alt="SDIS"><span><span class="brand-title">DL creator</span><span class="app-version-badge">Version ${esc(APP.VERSION)}</span><span class="brand-subtitle">SDIS régional du Nord vaudois · Descente de leçon</span></span></button>
    <div class="top-actions no-print"><span>${esc(profileDisplayName(APP.state.user))}</span>${mustCompleteProfile?'':`<div class="header-menu" aria-label="Menu entête DL Creator Web"><button class="btn ghost header-menu-btn" data-header-menu-toggle type="button">Menu</button><div class="header-menu-panel">${allowedModules().map(m=>`<button class="header-menu-item ${APP.state.activeModule===m?'active':''}" data-header-action="${m}" type="button"><span class="header-menu-icon">${moduleIcon(m)}</span><span>${esc(moduleLabel(m))}</span></button>`).join('')}</div></div>`}<button class="btn ghost" data-action="logout">Déconnexion</button></div>
  </div></div>
  ${productionModeBanner()}
  ${tabsHtml}
  <main class="container">${toolbarHtml}<section id="panel" class="tab-panel"></section></main>`;
  bindGlobal(); renderPanel();
}


function productionModeBanner(){
  const cfg=window.DLCreatorCore?.getConfig?.() || {};
  const vi=window.DLCreatorCore?.getVersionInfo?.() || {version:APP.VERSION};
  const mode=cfg.productionMode || 'pilote';
  const storage=cfg.storageMode || 'local';
  const backend=cfg.backendEnabled ? 'backend actif' : 'backend préparé / désactivé';
  return `<div class="system-banner no-print"><strong>Mode ${esc(mode)} — pilote serveur contrôlé</strong> — stockage ${esc(storage)} navigateur · backend ${esc(backend)} · auth ${esc(cfg.authMode||'local')} · audit local · version ${esc(vi.version||APP.VERSION)} · build ${esc(vi.build||'local')}</div>`;
}
function moduleLabel(module){ return ({home:'Accueil',dl:'Descente de leçon',bibliotheque:'Bibliothèque DL',mesdl:'Mes descentes de leçon',habilitations:'Gestion des accès',outils:'Outils',motscles:'Mots clés',import:'Import Word',diagnosticProduction:'Diagnostic production',profile:'Profil utilisateur'})[module] || 'Accueil'; }
function moduleIcon(module){
  const common='class="sf-symbol" aria-hidden="true" focusable="false" viewBox="0 0 64 64"';
  const icons={
    dl:`<svg ${common} data-sf-symbol="text.document.fill"><rect x="15" y="7" width="34" height="50" rx="6"></rect><path d="M39 7v14h10" opacity=".82"></path><rect x="22" y="26" width="20" height="4" rx="2" fill="#fff"></rect><rect x="22" y="34" width="20" height="4" rx="2" fill="#fff"></rect><rect x="22" y="42" width="14" height="4" rx="2" fill="#fff"></rect></svg>`,
    bibliotheque:`<svg ${common} data-sf-symbol="square.grid.3x1.folder.fill.badge.plus"><rect x="7" y="16" width="13" height="20" rx="3"></rect><rect x="25" y="16" width="13" height="20" rx="3"></rect><rect x="43" y="16" width="13" height="20" rx="3"></rect><path d="M8 43h25l4-5h19v14a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z"></path><circle cx="48" cy="43" r="10" fill="currentColor"></circle><path d="M48 37v12M42 43h12" stroke="#fff" stroke-width="4" stroke-linecap="round"></path></svg>`,
    motscles:`<svg ${common} data-sf-symbol="tag.fill"><path d="M8 12v18l24 24 22-22L30 8H12a4 4 0 0 0-4 4z"></path><circle cx="22" cy="22" r="5" fill="#fff"></circle></svg>`,
    habilitations:`<svg ${common} data-sf-symbol="person.crop.circle.badge.checkmark"><circle cx="27" cy="24" r="12"></circle><path d="M8 56c4-13 12-20 19-20s15 7 19 20z"></path><circle cx="47" cy="43" r="11" fill="currentColor"></circle><path d="M41.5 43.5l4 4 7-8" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"></path></svg>`,
    import:`<svg ${common} data-sf-symbol="square.and.arrow.down.badge.checkmark.fill"><rect x="10" y="15" width="34" height="36" rx="7"></rect><path d="M27 7v26M18 24l9 9 9-9" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"></path><circle cx="47" cy="43" r="11" fill="currentColor"></circle><path d="M41.8 43.2l3.6 3.8 7-8" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"></path></svg>`,
    mesdl:`<svg ${common} data-sf-symbol="person.text.rectangle.fill"><rect x="9" y="12" width="46" height="40" rx="7"></rect><circle cx="24" cy="27" r="6" fill="#fff"></circle><path d="M14 44c2-7 6-10 10-10s8 3 10 10z" fill="#fff"></path><rect x="36" y="23" width="12" height="4" rx="2" fill="#fff"></rect><rect x="36" y="33" width="12" height="4" rx="2" fill="#fff"></rect></svg>`,
    outils:`<svg ${common} data-sf-symbol="wrench.and.screwdriver.fill"><path d="M14 48l19-19 6 6-19 19a6 6 0 0 1-8-8z"></path><path d="M37 10l17 17-6 6-17-17z" opacity=".75"></path></svg>`,
    diagnosticProduction:`<svg ${common} data-sf-symbol="stethoscope.circle.fill"><circle cx="32" cy="32" r="24"></circle><path d="M22 18v14a10 10 0 0 0 20 0V18" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"></path><path d="M42 32c8 1 10 6 10 12a8 8 0 0 1-16 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"></path></svg>`,
    profile:`<svg ${common} data-sf-symbol="person.badge.key.fill"><circle cx="27" cy="22" r="9"></circle><path d="M10 51c3-11 10-17 17-17s14 6 17 17z"></path><circle cx="47" cy="40" r="10" fill="currentColor"></circle><path d="M42 40h11M51 40v4M46 40v3" stroke="#fff" stroke-width="3.5" stroke-linecap="round"></path></svg>`
  };
  return icons[module] || '';
}

function moduleTitle(module){ return moduleLabel(module); }
function homeModuleDescription(m){
  return m==='dl'?'Préparer et structurer une DL complète':
    m==='bibliotheque'?'Rechercher, charger, dupliquer ou archiver':
    m==='mesdl'?'Accès direct aux DL dont vous êtes rédacteur':
    m==='motscles'?'Centraliser et corriger les mots clés métier':
    m==='import'?'Importer une DL Word existante':
    m==='outils'?'Mots clés et Import Word':
    m==='diagnosticProduction'?'État version, stockage, backend, sécurité et RGPD':
    m==='profile'?'Gérer l’utilisateur local et le mot de passe':'';
}
function renderHome(){
  const modules=allowedModules();
  // Accueil volontairement métier : pas de Gestion des accès ni Outils.
  // Mes descentes de leçon reste juste à côté de Bibliothèque DL.
  const homeOrder=['dl','bibliotheque','mesdl','outils','diagnosticProduction','profile'];
  const primary=homeOrder.filter(m=>modules.includes(m));
  $('#panel').innerHTML=`<section class="home-hero"><div class="home-hero-text"><span class="home-kicker">Application métier SDIS</span><h1>Bienvenue dans DL Creator Web</h1><p>Choisir un module pour préparer, importer, gérer ou configurer les descentes de leçon. Les données restent conservées localement sur ce poste.</p></div><div class="home-hero-badge">Offline-first<br><small>Version ${esc(APP.VERSION)}</small></div></section><section class="home-grid no-print">${primary.map(m=>`<button class="home-card ${m==='dl'?'primary':''}" data-home-module="${m}" type="button"><span class="home-card-icon">${moduleIcon(m)}</span><strong>${esc(moduleLabel(m))}</strong><small>${homeModuleDescription(m)}</small></button>`).join('')}</section>`;
  $$('[data-home-module]').forEach(btn=>btn.addEventListener('click',()=>navigateModule(btn.dataset.homeModule)));
}
async function navigateModule(module){
  const target=module || 'home';
  if(APP.state.activeModule==='dl' && target!=='dl'){
    const leave=await institutionalConfirm({title:'Quitter cette descente de leçon ?',message:'Les modifications non enregistrées pourraient être perdues.',confirmText:'Quitter',cancelText:'Annuler',warn:true});
    if(!leave) return;
    const ok=await confirmIncompleteDraftIfNeeded({reason:'navigation'});
    if(!ok){
      APP.state.current=defaultDL();
      syncPlanHoraireFromFilRouge(APP.state.current);
      computeReference(APP.state.current);
    }
  }
  const modulesAllowed=allowedModules();
  const toolChildAllowed=(target==='motscles'||target==='import') && modulesAllowed.includes('outils');
  if(['motscles','habilitations','outils','import','diagnosticProduction'].includes(target) && !modulesAllowed.includes(target) && !toolChildAllowed){ actionStatus?.('Accès réservé aux responsables habilités','warn'); APP.state.activeModule='home'; render(); return; }
  APP.state.activeModule=target;
  if(APP.state.activeModule==='dl' && !['generalites','objectifs','filrouge','plan','materiel','distribution','validation'].includes(APP.state.activeTab)) APP.state.activeTab='generalites';
  if(APP.state.activeModule==='profile') APP.state.activeTab='profile';
  render();
}
function tabTitle(t){ return ({generalites:'Généralités',objectifs:'Buts & évaluations',plan:'Plan horaire',filrouge:'Fil rouge',materiel:'Matériel & véhicules',distribution:'Conclusion & diffusion',validation:'Validation',bibliotheque:'Bibliothèque DL',import:'Import Word'})[t]||t; }
function renderLogin(mode='login'){
  const profile=normalizeProfile(loadLocalProfile());
  const hasProfile=!!(profile && profileIdentifier(profile) && profile.passwordHash);
  const isReset=mode==='reset';
  const isRegister=mode==='register' || mode==='create' || !hasProfile;
  const title=isReset ? 'Réinitialisation locale' : (isRegister ? 'Inscription' : 'Connexion');
  const intro=isReset
    ? 'Réinitialisation locale offline-first sur ce poste. Aucun réseau ni e-mail n’est utilisé.'
    : (isRegister ? 'Créer un compte local offline-first. Le NIP devient l’identifiant de connexion par défaut et complète directement le profil utilisateur.' : 'Saisir directement l’identifiant et le mot de passe. Les DL restent stockées localement sur ce poste.');
  const registerFields=isRegister && !isReset ? `<div class="form-grid login-register-grid">
      <div class="span-4"><label>NIP</label><input id="registerNip" autocomplete="username" placeholder="NIP"></div>
      <div class="span-4"><label>Grade</label><select id="registerGrade">${APP.GRADES.map(g=>`<option>${esc(g)}</option>`).join('')}</select></div>
      <div class="span-6"><label>Prénom</label><input id="registerPrenom" autocomplete="given-name"></div>
      <div class="span-6"><label>Nom</label><input id="registerNom" autocomplete="family-name"></div>
      <div class="span-12"><label>e-mail</label><input id="registerEmail" type="email" autocomplete="email" placeholder="prenom.nom@sdisnv.ch"></div>
    </div>` : '';
  document.getElementById('app').innerHTML=`<div class="login-wrap"><div class="login-card login-card-modern"><div class="login-logo-block"><img src="assets/LogoDLcreatorweb.png" alt="DL Creator Web" class="login-logo"></div><div class="login-title-row"><h2>${title}</h2><span class="login-badge">Offline · Version ${esc(APP.VERSION)}</span></div><div class="alert info">${intro}</div><div id="loginMessage" class="alert info" style="display:none"></div>${registerFields}<div class="form-grid login-grid"><div class="span-12"><label>Identifiant</label><input id="loginIdentifier" autocomplete="username" placeholder="Identifiant / NIP" value="${esc(!isRegister && profile ? profileIdentifier(profile) : '')}"></div><div class="span-12"><label>${isReset||isRegister?'Mot de passe':'Mot de passe'}</label><input id="loginPassword" type="password" autocomplete="${isReset||isRegister?'new-password':'current-password'}"></div>${isReset||isRegister?`<div class="span-12"><label>Confirmer le mot de passe</label><input id="loginPasswordConfirm" type="password" autocomplete="new-password"></div>`:''}<div class="span-12 login-actions"><button class="btn red" id="loginBtn" type="button">${isReset?'RÉINITIALISER':(isRegister?'CRÉER LE COMPTE':'CONNEXION')}</button>${!isRegister?`<button class="btn ghost login-link-btn" id="registerBtn" type="button">S’inscrire</button>`:''}${hasProfile&&!isReset&&!isRegister?`<button class="btn ghost login-link-btn" id="forgotBtn" type="button">Mot de passe oublié ?</button>`:''}${hasProfile&&(isRegister||isReset)?`<button class="btn ghost login-link-btn" id="backLoginBtn" type="button">Retour connexion</button>`:''}</div></div></div></div>`;
  const submit=async()=>{
    const password=$('#loginPassword').value;
    const confirm=$('#loginPasswordConfirm')?.value;
    if(!password || password.length<4){ loginMessage('Le mot de passe doit contenir au minimum 4 caractères.', 'warn'); return; }
    if((isRegister||isReset) && password!==confirm){ loginMessage('La confirmation du mot de passe ne correspond pas.', 'warn'); return; }
    const current=normalizeProfile(loadLocalProfile());
    if(isRegister && !isReset){
      const nip=$('#registerNip').value.trim();
      const grade=$('#registerGrade').value;
      const prenom=$('#registerPrenom').value.trim();
      const nom=$('#registerNom').value.trim();
      const email=$('#registerEmail').value.trim();
      if(!nip || !grade || !prenom || !nom || !email){ loginMessage('Compléter NIP, grade, prénom, nom, e-mail et mot de passe.', 'warn'); return; }
      const next=normalizeProfile({createdAt:nowIso(), identifier:nip, nip, grade, prenom, nom, email});
      await setProfilePassword(next,password);
      next.updatedAt=nowIso();
      startSession(next,{requireProfileCompletion:false});
      return;
    }
    const identifier=$('#loginIdentifier').value.trim();
    if(!identifier){ loginMessage('Saisir un identifiant.', 'warn'); return; }
    if(!isReset){
      if(!current || norm(profileIdentifier(current))!==norm(identifier)){ loginMessage('Identifiant inconnu sur ce poste. Utiliser S’inscrire pour créer un compte local.', 'warn'); return; }
      if(!(await verifyPassword(current,password))){ loginMessage('Mot de passe incorrect.', 'warn'); return; }
      startSession(current, {requireProfileCompletion: !isProfileComplete(current)}); return;
    }
    if(!current || norm(profileIdentifier(current))!==norm(identifier)){ loginMessage('Identifiant local introuvable sur ce poste.', 'warn'); return; }
    const next=normalizeProfile(current);
    await setProfilePassword(next,password);
    next.updatedAt=nowIso();
    startSession(next, {requireProfileCompletion: !isProfileComplete(next)});
  };
  $('#loginBtn').onclick=submit;
  $('#registerBtn')?.addEventListener('click',()=>renderLogin('register'));
  $('#forgotBtn')?.addEventListener('click',()=>renderLogin('reset'));
  $('#backLoginBtn')?.addEventListener('click',()=>renderLogin('login'));
  $('#registerNip')?.addEventListener('input',e=>{ $('#loginIdentifier').value=e.target.value.trim(); });
  $('#loginIdentifier')?.addEventListener('keydown',e=>{ if(e.key==='Enter') $('#loginPassword')?.focus(); });
  $('#loginPassword')?.addEventListener('keydown',e=>{ if(e.key==='Enter') submit(); });
  $('#loginPasswordConfirm')?.addEventListener('keydown',e=>{ if(e.key==='Enter') submit(); });
}
function renderProfile(){
  const u=normalizeProfile(loadLocalProfile());
  const must=!!APP.state.profileCompletionRequired;
  const saveLabel=must?'Enregistrer le profil et continuer':'Enregistrer le profil';
  const right=currentUserAccessRight();
  const h=currentUserHabilitation();
  const display=profileDisplayName(u);
  const login=profileIdentifier(u) || currentUserLogin() || '—';
  $('#panel').innerHTML=`${must?'<div class="alert warn">Compléter le profil utilisateur avant d’utiliser DL Creator Web.</div>':''}
  <div class="profile-layout">
    <div class="card profile-summary-card">
      <div class="profile-avatar" aria-hidden="true">${esc((u.prenom||u.nom||'P').charAt(0).toUpperCase())}</div>
      <div><h3>Profil utilisateur</h3><h2>${esc(display)}</h2><p class="muted">Compte local DL Creator Web · ${droitBadgeHtml(right)}</p></div>
    </div>
    <div class="card profile-form-card"><h3>Identité</h3><div class="form-grid">
      <div class="span-3"><label>Grade</label><select data-profile="grade" disabled>${APP.GRADES.map(g=>`<option ${u.grade===g?'selected':''}>${esc(g)}</option>`).join('')}</select></div>
      <div class="span-3"><label>Prénom</label><input data-profile="prenom" readonly value="${esc(u.prenom||'')}" autocomplete="given-name"></div>
      <div class="span-3"><label>Nom</label><input data-profile="nom" readonly value="${esc(String(u.nom||'').trim().toLowerCase()==='profil'?'':u.nom||'')}" autocomplete="family-name"></div>
      <div class="span-3"><label>NIP</label><input data-profile="nip" readonly value="${esc(u.nip||'')}"></div>
      <div class="span-6"><label>Login / identifiant</label><input data-profile="identifier" readonly value="${esc(login==='—'?'':login)}"></div>
      <div class="span-6"><label>e-mail</label><input data-profile="email" type="email" value="${esc(u.email||'')}" autocomplete="email"></div>
      <div class="span-12"><button class="btn red" data-action="saveProfile">${saveLabel}</button></div>
    </div></div>
    <div class="card"><h3>Droits / niveau d’accès</h3><div class="profile-rights-grid">
      <p><strong>Niveau détecté</strong><br>${esc(right)}</p>
      <p><strong>Fonction</strong><br>${esc(h?.fonction || u.fonction || u.function || '—')}</p>
      <p><strong>Habilitation locale</strong><br>${h?esc(h.nom||'—'):'Aucune habilitation nominative trouvée'}</p>
      <p><strong>Login</strong><br>${esc(login)}</p>
    </div><div class="alert info">Le profil sert à identifier les DL personnelles, les droits de consultation/modification et les actions de validation.</div></div>
    <div class="card"><h3>Modifier le mot de passe</h3><div class="form-grid">
      <div class="span-4"><label>Ancien mot de passe</label><input type="password" data-password="old" autocomplete="current-password"></div>
      <div class="span-4"><label>Nouveau mot de passe</label><input type="password" data-password="new" autocomplete="new-password"></div>
      <div class="span-4"><label>Confirmer le nouveau mot de passe</label><input type="password" data-password="confirm" autocomplete="new-password"></div>
      <div class="span-12"><button class="btn" data-action="changePassword">Modifier le mot de passe</button></div>
    </div></div>
  </div>`;
  $$('[data-profile]').forEach(el=>el.oninput=()=>{u[el.dataset.profile]=el.value;});
  $('[data-action=saveProfile]')?.addEventListener('click',()=>{
    const previous=normalizeProfile(loadLocalProfile()||{});
    u.emailUpdatedAt=nowIso();
    u.emailUpdatedSource='profil-utilisateur';
    saveLocalProfile(u);
    APP.state.user=normalizeProfile(u);
    if(String(previous.email||'').trim()!==String(u.email||'').trim()) syncHabilitationEmailFromProfile(APP.state.user);
    APP.state.profileCompletionRequired=!isProfileComplete(APP.state.user);
    if(APP.state.profileCompletionRequired) actionStatus('Profil incomplet : prénom, nom et identifiant sont requis.','warn'); else { actionStatus('Profil utilisateur enregistré.'); render(); }
  });
  $('[data-action=changePassword]')?.addEventListener('click',()=>changeLocalPassword());
}
function datalistPersonnel(){ return `<datalist id="personnelList">${APP.state.personnel.slice(0,400).map(p=>`<option value="${esc(personLabel(p))}"></option>`).join('')}</datalist>`; }
function datalistVehicules(){ return `<datalist id="vehiculeList">${APP.state.vehicules.map(v=>`<option value="${esc(vehLabel(v))}"></option>`).join('')}</datalist>`; }

function bindGlobal(){
  // Navigation robuste : l'onglet doit toujours réagir au clic, y compris après un rendu dynamique.
  $$('.tab').forEach(b=>b.onclick=(e)=>{
    e.preventDefault();
    const tab=b.dataset.tab;
    if(!tab) return;
    if(typeof saveAllRichBeforeExport==='function') saveAllRichBeforeExport();
    APP.state.activeTab=tab;
    $$('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
    renderPanel();
  });
  $('[data-action=logout]')?.addEventListener('click',()=>endSession());
  $('[data-action=home]')?.addEventListener('click',()=>navigateModule('home'));
  const headerMenu=$('.header-menu');
  $('[data-header-menu-toggle]')?.addEventListener('click',(e)=>{
    e.preventDefault(); e.stopPropagation(); headerMenu?.classList.toggle('open');
    if(headerMenu?.classList.contains('open')) setTimeout(()=>document.addEventListener('click',()=>headerMenu.classList.remove('open'),{once:true}),0);
  });
  $$('[data-header-action]').forEach(btn=>btn.addEventListener('click',(e)=>{
    e.preventDefault();
    const target=btn.dataset.headerAction;
    headerMenu?.classList.remove('open');
    navigateModule(target);

  }));
  $('[data-action=new]')?.addEventListener('click',async ()=>{ if(APP.state.activeModule==='dl'){ const ok=await confirmIncompleteDraftIfNeeded({reason:'new'}); if(!ok) actionStatus('DL incomplète non conservée.','warn'); } else if(APP.state.dirty&&!confirm('Créer une nouvelle DL sans sauvegarder les modifications ?')) return; localStorage.removeItem(APP.DRAFT_KEY); APP.state.current=defaultDL(); syncPlanHoraireFromFilRouge(APP.state.current); computeReference(APP.state.current); setDirty(false); APP.state.activeModule='dl'; APP.state.activeTab='generalites'; render(); actionStatus('Nouvelle DL prête'); });
  $('[data-action=save]')?.addEventListener('click',()=>saveCurrent(true));
  $('[data-action=jsonExport]')?.addEventListener('click',async ()=>{ if(typeof saveAllRichBeforeExport==='function') saveAllRichBeforeExport(); await exportJsonDocument(APP.state.current); });
  const jsonImport=$('#jsonImport');
  if(jsonImport) jsonImport.onchange=e=>importJsonFile(e.target.files[0]);
  $('[data-action=pdf]')?.addEventListener('click',()=>{ exportPdf(); });
  if(!window.__dlCreatorBeforeUnloadBound){
    window.__dlCreatorBeforeUnloadBound=true;
    window.addEventListener('beforeunload',e=>{
      if(APP.state.activeModule==='dl' && APP.state.current && APP.state.dirty){
        e.preventDefault();
        e.returnValue='Quitter cette descente de leçon ? Les modifications non enregistrées pourraient être perdues.';
      }
    });
  }
}
function bindDurationInputs(){
  $$('[data-duration]').forEach(el=>{
    el.onfocus=()=>{ el.value=String(el.value||'').replace(/\D/g,''); };
    el.oninput=()=>{
      el.value=String(el.value||'').replace(/\D/g,'').slice(0,3);
      setByPath(APP.state.current,el.dataset.duration,el.value);
      syncPlanHoraireFromFilRouge(APP.state.current);
      recalcPlanHoraireFrom(0,'');
      updateComputedDurations(APP.state.current);
      refreshLiveGeneralites();
      setDirty();
    };
    el.onblur=()=>{ el.value=formatDurationDisplay(el.value); };
  });
}
function applyReadOnlyModeIfNeeded(){
  if(!APP.state.readOnlyMode || APP.state.activeModule!=='dl') return;
  const panel=$('#panel'); if(!panel) return;
  panel.querySelectorAll('input, textarea, select').forEach(el=>{ el.disabled=true; el.readOnly=true; });
  panel.querySelectorAll('[contenteditable="true"]').forEach(el=>el.setAttribute('contenteditable','false'));
  panel.querySelectorAll('button, .btn').forEach(btn=>{
    const text=String(btn.textContent||btn.title||'').toLowerCase();
    if(text.includes('export') || text.includes('fermer') || text.includes('aperçu')) return;
    btn.disabled=true;
    btn.classList.add('disabled');
  });
  panel.insertAdjacentHTML('afterbegin','<div class="alert info no-print">Mode consultation — aucune modification ne sera enregistrée.</div>');
}
function renderPanel(){
  if(APP.state.activeModule==='home') return renderHome();
  if(APP.state.activeModule==='profile') return renderProfile();
  if(APP.state.activeModule==='bibliotheque') return renderModulePanel(renderBibliotheque);
  if(APP.state.activeModule==='motscles') return canManageKeywords() ? renderModulePanel(renderMotsCles) : accessDeniedPanel();
  if(APP.state.activeModule==='habilitations') return canManageHabilitations() ? renderModulePanel(renderHabilitations) : accessDeniedPanel();
  if(APP.state.activeModule==='mesdl') return renderModulePanel(renderMesDescentes);
  if(APP.state.activeModule==='outils') return renderOutils();
  if(APP.state.activeModule==='diagnosticProduction') return renderDiagnosticProduction();
  if(APP.state.activeModule==='import') return renderModulePanel(renderImport);
  if(APP.state.activeModule!=='dl') return renderHome();
  const renderers={generalites:renderGeneralites,objectifs:renderObjectifs,plan:renderPlan,filrouge:renderFilRouge,materiel:renderMateriel,distribution:renderDistribution,validation:renderValidation};
  const renderer=renderers[APP.state.activeTab] || renderers.generalites;
  renderModulePanel(renderer);
}
function renderModulePanel(renderer){
  try{
    renderer();
    bindInputs();
    initCodeDropdownFields();
    initAutocompleteFields();
    $$('.auto-expand').forEach(autoResizeTextarea);
    bindDurationInputs();
    applyReadOnlyModeIfNeeded();
  }catch(err){
    console.error('Erreur affichage module/onglet', APP.state.activeModule, APP.state.activeTab, err);
    const panel=$('#panel');
    if(panel) panel.innerHTML=`<div class="card"><h3>Erreur d’affichage</h3><div class="alert warn">La vue ${esc(moduleTitle(APP.state.activeModule))} n’a pas pu être affichée. Détail : ${esc(err?.message||err)}</div></div>`;
  }
}

function initCodeDropdownFields(){
  $$('.code-select-field').forEach(root=>{
    if(root.dataset.codeBound==='1') return;
    root.dataset.codeBound='1';
    const input=$('input[data-path]',root);
    const panel=$('.code-suggestions',root);
    if(!input || !panel) return;
    const listKey=root.dataset.codeList;
    const source=()=>APP.CODE_OPTIONS?.[listKey]||[];
    let active=-1;
    const allButtons=()=>$$('.code-option',panel);
    const setActive=(idx)=>{
      const buttons=allButtons();
      active=Math.max(0,Math.min(idx,buttons.length-1));
      buttons.forEach((b,i)=>b.classList.toggle('active',i===active));
      buttons[active]?.scrollIntoView?.({block:'nearest'});
    };
    const render=(q='')=>{
      const needle=norm(q);
      const items=source().filter(([code,desc])=>!needle || norm(code).includes(needle) || norm(desc).includes(needle));
      panel.innerHTML=items.map(([code,desc])=>`<button type="button" class="addr-suggestion code-option" data-code="${esc(code)}" role="option"><span><strong>${esc(code)}</strong> — ${esc(desc)}</span></button>`).join('');
      active=items.length?0:-1;
      allButtons().forEach((b,i)=>b.classList.toggle('active',i===active));
      panel.classList.toggle('open',items.length>0);
      panel.classList.toggle('show',items.length>0);
      root.classList.toggle('code-dropdown-open',items.length>0);
    };
    const close=()=>{ panel.classList.remove('open','show'); root.classList.remove('code-dropdown-open'); active=-1; };
    const commit=(code)=>{
      const clean=cleanCodeValue(code, Number(input.dataset.maxlen||12));
      input.value=clean;
      setByPath(APP.state.current,input.dataset.path,clean);
      APP.state.current.dateModification=nowIso();
      computeReference(APP.state.current);
      refreshLiveGeneralites();
      setDirty();
      close();
    };
    input.addEventListener('focus',()=>render(input.value));
    input.addEventListener('click',()=>render(input.value));
    input.addEventListener('input',()=>render(input.value));
    input.addEventListener('keydown',e=>{
      const buttons=allButtons();
      if(e.key==='ArrowDown' && buttons.length){ e.preventDefault(); setActive(active<0?0:active+1); }
      else if(e.key==='ArrowUp' && buttons.length){ e.preventDefault(); setActive(active<0?buttons.length-1:active-1); }
      else if(e.key==='Enter' && buttons.length && active>=0){ e.preventDefault(); commit(buttons[active].dataset.code); }
      else if(e.key==='Escape') close();
    });
    panel.addEventListener('mousedown',e=>e.preventDefault());
    panel.addEventListener('mousemove',e=>{
      const btn=e.target.closest('.code-option');
      if(!btn) return;
      const idx=allButtons().indexOf(btn);
      if(idx>=0) setActive(idx);
    });
    panel.addEventListener('click',e=>{
      const btn=e.target.closest('.code-option');
      if(btn) commit(btn.dataset.code);
    });
    document.addEventListener('mousedown',e=>{ if(!root.contains(e.target)) close(); });
  });
}

function bindInputs(){
  $$('[data-path]').forEach(el=>{el.oninput=()=>{
    if(el.dataset.transform==='upper') el.value=el.value.toUpperCase();
    if(el.dataset.transform==='code') el.value=cleanCodeValue(el.value, Number(el.dataset.maxlen||5));
    if(el.dataset.transform==='camel') el.value=toCamelCaseStrict(el.value);
    const path=el.dataset.path;
    if(!safePathParts(path,'bindInputs').length){ actionStatus('Champ ignoré : chemin de donnée invalide, application conservée.', 'warn'); return; }
    let nextValue=el.type==='number'?Number(el.value):el.value;
    if(/^evaluations\.\d+\.butsLies$/.test(path)){
      nextValue=normalizeLinkedGoalsInput(el.value);
    }
    if(path==='validation.statut' || path==='statut'){
      const display=normalizeDLStatus(nextValue)||'Brouillon';
      applyValidationStatus(display, workflowStateForDisplayStatus(display), { refresh:false, comment:'Changement manuel du statut validation' });
      return;
    }
    if(path==='version'){
      const raw=String(el.value||'').trim().toLowerCase();
      el.value=raw;
      el.classList.toggle('invalid', raw.length>0 && !isValidDLVersion(raw));
      if(isValidDLVersion(raw)){
        APP.state.current.version=raw;
        APP.state.current.dateModification=nowIso();
        el.dataset.lastValid=raw;
        setDirty();
        computeReference(APP.state.current);
        refreshLiveGeneralites();
      }
      return;
    }
    setByPath(APP.state.current,path, nextValue);
    if(path==='identification.publicCibleLibre' || path==='identification.publicCibleSelections' || path==='identification.publicCible') syncPublicCibleLegacy(APP.state.current);
    if(path==='planFormateurLecon'){ applyLessonTrainerToSchedule(nextValue, {render:false}); return; }
    if(path==='identification.niveauBloom') syncBloomCode(APP.state.current);
    if(path==='responsables.redacteurs' || path==='responsables.formateurs') sortDLResponsables(APP.state.current);
    const trancheMatch=path.match(/^planTranchesHoraires\.(\d+)\.debut$/);
    if(trancheMatch){
      computePlanRowTranches(APP.state.current);
      refreshPlanHoraireInputs();
      APP.state.current.dateModification=nowIso();
      updateComputedDurations(APP.state.current);
      refreshLiveGeneralites();
      setDirty();
      return;
    }
    const planMatch=path.match(/^planHoraire\.(\d+)\.(debut|fin|duree)$/);
    if(planMatch){
      const idx=Number(planMatch[1]);
      const field=planMatch[2];
      const isPartialTime=(field==='debut' || field==='fin') && el.value && !isCompletePlanTime(el.value);
      if(!isPartialTime){
        recalcPlanHoraireFrom(idx, field);
        refreshPlanHoraireInputs();
      }
      APP.state.current.dateModification=nowIso();
      updateComputedDurations(APP.state.current);
      refreshLiveGeneralites();
      setDirty();
      return;
    }
    if(/^buts\.\d+\.niveauBloom$/.test(path)){ setDirty(); renderPanel(); return; }
    if(String(path).startsWith('filRouge.')){ syncPlanHoraireFromFilRouge(APP.state.current); recalcPlanHoraireFrom(0,''); }
    if(String(path).startsWith('conclusion.')){ syncPlanHoraireFromFilRouge(APP.state.current); recalcPlanHoraireFrom(0,''); }
    APP.state.current.dateModification=nowIso();
    computeReference(APP.state.current);
    refreshLiveGeneralites();
    setDirty();
  };
  if(el.dataset.path==='version'){
    el.onblur=()=>{
      const raw=String(el.value||'').trim().toLowerCase();
      if(isValidDLVersion(raw)){
        APP.state.current.version=raw;
        APP.state.current.dateModification=nowIso();
        el.value=raw;
        el.dataset.lastValid=raw;
        el.classList.remove('invalid');
      }else{
        const fallback=normalizeVersionValue(el.dataset.lastValid||APP.state.current.version||DEFAULT_DL_VERSION);
        APP.state.current.version=fallback;
        APP.state.current.dateModification=nowIso();
        el.value=fallback;
        el.dataset.lastValid=fallback;
        el.classList.remove('invalid');
        actionStatus('Format version invalide. Utiliser le format v1.00, v1.01 ou v8.11.', 'warn');
      }
      computeReference(APP.state.current);
      refreshLiveGeneralites();
      tryPersistDraft();
    };
  }
  el.onchange=el.oninput;
  });
  $$('[data-public-cible-select]').forEach(el=>{
    el.onchange=()=>window.setPublicCibleSelection(el.value);
  });
  $$('[data-tags-editor]').forEach(editor=>{
    const input=editor.querySelector('[data-tags-input]');
    const badges=editor.querySelector('[data-tag-badges]');
    const panel=editor.querySelector('[data-keyword-suggestions]');
    const tags=()=>normalizeKeywordList(APP.state.current?.tags||[]);
    const saveTags=(values)=>{
      const normalized=normalizeKeywordList(values);
      APP.state.current.tags=normalized;
      addKeywordsToLibrary(normalized);
      APP.state.current.dateModification=nowIso();
      computeReference(APP.state.current);
      refreshLiveGeneralites();
      setDirty();
      renderBadges();
      renderSuggestions();
    };
    const renderBadges=()=>{
      if(!badges) return;
      const values=tags();
      badges.innerHTML=values.map(k=>`<span class="keyword-chip keyword-dl-chip"><button type="button" class="keyword-remove" data-remove-keyword="${esc(k)}" aria-label="Supprimer ${esc(keywordDisplay(k))}">×</button><span>${esc(keywordDisplay(k))}</span></span>`).join('');
    };
    const commitValues=(values)=>{
      const incoming=Array.isArray(values)?values:splitKeywordEntry(values);
      const merged=[...tags()];
      incoming.forEach(raw=>{
        const clean=normalizeKeyword(raw);
        if(clean.length<3){ if(String(raw||'').trim()) actionStatus('Mot clé refusé : minimum 3 caractères.','warn'); return; }
        if(!merged.some(k=>norm(k)===norm(clean))) merged.push(clean);
      });
      input.value='';
      saveTags(merged);
    };
    const renderSuggestions=()=>{
      if(!panel) return;
      const suggestions=keywordSuggestions(input.value).filter(k=>!tags().some(v=>norm(v)===norm(k)));
      panel.innerHTML=suggestions.map(k=>`<button type="button" class="keyword-suggestion" data-keyword="${esc(k)}">${esc(keywordDisplay(k))}</button>`).join('');
      panel.classList.toggle('open', suggestions.length>0 && document.activeElement===input);
    };
    input.addEventListener('keydown',e=>{
      if(['Enter','Tab',' '].includes(e.key)){
        const first=panel?.querySelector('.keyword-suggestion');
        e.preventDefault();
        if(first) commitValues([first.dataset.keyword]);
        else commitValues(splitKeywordEntry(input.value));
      }
    });
    input.addEventListener('input',()=>{
      if(/[;\n\t, ]/.test(input.value)) commitValues(splitKeywordEntry(input.value));
      else renderSuggestions();
    });
    input.addEventListener('paste',()=>setTimeout(()=>{ if(/[;\n\t, ]/.test(input.value)) commitValues(splitKeywordEntry(input.value)); else renderSuggestions(); },0));
    input.addEventListener('focus',renderSuggestions);
    input.addEventListener('blur',()=>setTimeout(()=>{ if(input.value.trim()) commitValues(splitKeywordEntry(input.value)); panel?.classList.remove('open'); },140));
    panel?.addEventListener('mousedown',e=>e.preventDefault());
    panel?.addEventListener('click',e=>{ const b=e.target.closest('[data-keyword]'); if(b) commitValues([b.dataset.keyword]); });
    badges?.addEventListener('click',e=>{
      const b=e.target.closest('[data-remove-keyword]');
      if(!b) return;
      saveTags(tags().filter(k=>norm(k)!==norm(b.dataset.removeKeyword)));
    });
    renderBadges();
  });
}
function auditInvalidPath(source,path){
  try{
    window.DLCreatorCore?.auditService?.write?.('path-invalide-non-bloquant',{source,pathType:typeof path,path:String(path??''),destructive:false},'WARN');
  }catch(e){ console.warn('[DL Creator] path invalide non bloquant',source,path); }
}
function safePathParts(path,source='path'){
  if(path == null){ auditInvalidPath(source,path); return []; }
  const raw=(typeof path==='string') ? path : String(path||'');
  if(!raw.trim()){ auditInvalidPath(source,path); return []; }
  return raw.split('.').map(p=>p.trim()).filter(Boolean);
}
function safeGetByPath(o,path,fallback=undefined){
  const parts=safePathParts(path,'getByPath');
  if(!parts.length) return fallback;
  return parts.reduce((a,k)=> (a && Object.prototype.hasOwnProperty.call(Object(a),k)) ? a[k] : undefined, o) ?? fallback;
}
function getByPath(o,path){ return safeGetByPath(o,path); }
function splitValueList(v){
  if(Array.isArray(v)) return v.map(x=>String(x||'').trim()).filter(Boolean);
  const raw=String(v||'').trim();
  if(!raw) return [];
  // Le point-virgule devient le séparateur UI des listes pour ne pas casser les libellés CSV contenant des virgules (ex. dimensions 3,05 m).
  if(raw.includes(';')) return raw.split(';').map(x=>x.trim()).filter(Boolean);
  if(/\n/.test(raw)) return raw.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  return raw.split(',').map(x=>x.trim()).filter(Boolean); // compatibilité anciens JSON saisis avec virgules
}
function listText(v){return Array.isArray(v)?v.filter(Boolean).join(';'):(v||'')}
function normalizeLinkedGoalsInput(value){
  const raw=String(Array.isArray(value)?value.join(', '):(value||'')).trim();
  if(!raw) return [];
  const tokens=raw
    .replace(/[;\n\t]+/g, ',')
    .replace(/\s*,\s*/g, ',')
    .split(/[ ,]+/)
    .map(v=>v.trim())
    .filter(Boolean);
  const out=[];
  tokens.forEach(token=>{
    if(/^\d+$/.test(token) && token.length>1 && !raw.match(/[;,\s]/)){
      token.split('').forEach(ch=>{ if(!out.includes(ch)) out.push(ch); });
    }else if(!out.includes(token)){
      out.push(token);
    }
  });
  return out;
}
function formatLinkedGoals(value){ return normalizeLinkedGoalsInput(value).join(', '); }
function refreshCoherenceChecks(){
  const target=document.getElementById('coherenceChecksBody');
  if(target) target.innerHTML=renderChecks();
}
function safeSetByPath(o,path,val){
  const parts=safePathParts(path,'setByPath');
  if(!o || !parts.length) return false;
  let a=o;
  while(parts.length>1){
    const k=parts.shift();
    if(a[k]==null || typeof a[k] !== 'object') a[k]={};
    a=a[k];
  }
  a[parts[0]]=val;
  return true;
}
function setByPath(o,path,val){ return safeSetByPath(o,path,val); }
function input(path,label,type='text',span=4,attrs=''){ const v=getByPath(APP.state.current,path)??''; return `<div class="span-${span}"><label>${label}</label><input type="${type}" data-path="${path}" value="${esc(v)}" ${attrs}></div>`; }
function select(path,label,opts,span=4){ const v=getByPath(APP.state.current,path)??''; return `<div class="span-${span}"><label>${label}</label><select data-path="${path}">${opts.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`; }
function textarea(path,label,span=12){ const v=getByPath(APP.state.current,path)??''; return `<div class="span-${span}"><label>${label}</label><textarea data-path="${path}">${esc(v)}</textarea></div>`; }


function codeDropdownField(label,path,listKey,value){
  const items=(APP.CODE_OPTIONS?.[listKey]||[]).map(([code,desc])=>({code,desc}));
  const options=items.map(({code,desc})=>`<button type="button" class="addr-suggestion code-option" data-code="${esc(code)}" role="option"><span><strong>${esc(code)}</strong> — ${esc(desc)}</span></button>`).join('');
  return `<div class="g-field g-code coded-field code-select-field" data-code-list="${esc(listKey)}">
    <label>${esc(label)}</label>
    <div class="code-select-box">
      <input data-path="${esc(path)}" data-transform="code" data-maxlen="12" maxlength="12" autocomplete="off" aria-haspopup="listbox" value="${esc(value||'')}">
      <div class="lookup-suggestions code-suggestions" role="listbox">${options}</div>
    </div>
  </div>`;
}

function confirmResetDL(){
  return new Promise(resolve=>{
    const overlay=document.createElement('div');
    overlay.className='modal-overlay reset-dl-confirm-overlay';
    overlay.innerHTML=`<div class="modal-card reset-dl-confirm-card" role="dialog" aria-modal="true" aria-labelledby="resetDLTitle"><h3 id="resetDLTitle">Remise à zéro de la DL</h3><p>Cette action va effacer les formateurs de l’onglet Généralités ainsi que les horaires, multi-horaires, formateurs et remarques du Plan horaire. Continuer ?</p><div class="modal-actions row-actions"><button class="btn" type="button" data-cancel>Annuler</button><button class="btn red" type="button" data-confirm>Confirmer</button></div></div>`;
    const close=value=>{ overlay.remove(); resolve(value); };
    overlay.addEventListener('click',e=>{ if(e.target===overlay) close(false); });
    overlay.querySelector('[data-cancel]').onclick=()=>close(false);
    overlay.querySelector('[data-confirm]').onclick=()=>close(true);
    document.addEventListener('keydown',function onKey(e){
      if(!document.body.contains(overlay)){ document.removeEventListener('keydown',onKey); return; }
      if(e.key==='Escape'){ document.removeEventListener('keydown',onKey); close(false); }
    });
    document.body.appendChild(overlay);
    overlay.querySelector('[data-cancel]')?.focus();
  });
}
async function resetDLFields(){
  const dl=APP.state.current;
  if(!dl) return;
  const ok=await confirmResetDL();
  if(!ok) return;

  if(!dl.responsables) dl.responsables={responsable:'',redacteurs:[],formateurs:[]};
  dl.responsables.formateurs=[];

  if(!Array.isArray(dl.planHoraire)) dl.planHoraire=[];
  dl.planTrancheCount=1;
  dl.planTranchesHoraires=[{debut:''},{debut:''},{debut:''},{debut:''}];
  dl.planFormateurLecon='';
  dl.planHoraire.forEach(row=>{
    if(!row || typeof row!=='object') return;
    row.debut='';
    row.fin='';
    row.tranches=[{debut:'',fin:''},{debut:'',fin:''},{debut:'',fin:''},{debut:'',fin:''}];
    row.formateur='';
    row.remarques='';
  });

  dl.dateModification=nowIso();
  updateComputedDurations(dl);
  setDirty();
  renderPanel();
  actionStatus('Remise à zéro DL effectuée');
}
window.resetDLFields=resetDLFields;

function renderGeneralites(){
  const dl=ensureDLModel(APP.state.current);
  syncPlanHoraireFromFilRouge(dl);
  computeReference(dl);
  const id=dl.identification;
  const stamp=`Créé ${new Date(dl.dateCreation).toLocaleDateString('fr-CH')} · Modifié ${new Date(dl.dateModification).toLocaleString('fr-CH')}`;
  $('#panel').innerHTML=`<div class="card generalites-card"><div class="section-title-row"><h3>Identification de la descente de leçon</h3><button class="btn small reset-dl-btn" type="button" onclick="resetDLFields()"><span class="reset-dl-icon" data-sf-symbol="arrow.counterclockwise.circle.fill" aria-hidden="true">↻</span><span>Remise à zéro DL</span></button></div>
    <div class="generalites-grid">
      <div class="bloom-pyramid-panel" aria-label="Pyramide de Bloom"><img src="assets/PyramideBLOOM.png" alt="Pyramide Bloom"></div>
      <div class="g-field g-domain"><label>DOMAINE</label><select data-path="identification.domaine">${[''].concat(APP.DOMAINS).map(d=>`<option ${d===normalizeLegacyDomain(id.domaine)?'selected':''}>${esc(d)}</option>`).join('')}</select></div>
      <div class="g-field g-theme"><label>THÈME</label><input data-path="identification.theme" value="${esc(id.theme||'')}"></div>
      ${codeDropdownField('CODE THÈME','identification.codeTheme','theme',id.codeTheme)}

      <div class="g-spacer"></div>
      <div class="g-field g-theme"><label>SOUS-THÈME</label><input data-path="identification.sousTheme" value="${esc(id.sousTheme||'')}"></div>
      ${codeDropdownField('CODE SOUS-THÈME','identification.codeSousTheme','sousTheme',id.codeSousTheme)}

      <div class="g-spacer"></div>
      <div class="g-field g-lesson-info"><label>INFORMATION LEÇON (RÉSUMÉ SUCCINT)</label><textarea class="auto-expand" data-path="identification.informationLecon" maxlength="300" placeholder="Résumé succinct de la leçon (100 à 300 caractères)">${esc(id.informationLecon||'')}</textarea></div>

      <div class="g-spacer"></div>
      <div class="g-field g-theme"><label>RÉSUMÉ CAMEL CASE</label><input data-path="identification.resumeCamelCase" data-transform="camel" value="${esc(id.resumeCamelCase||'')}" placeholder="Ex. BHetTuyaux"></div>
      <div class="g-field g-code g-type-doc coded-field"><label>TYPE DOC</label><input data-path="identification.typeDoc" data-transform="code" data-maxlen="12" maxlength="12" value="${esc(id.typeDoc||'DL')}"></div>

      ${renderPublicCibleBlock(id)}
      ${codeDropdownField('CODE PUBLIC','identification.codePublic','public',id.codePublic)}

      <div class="g-field g-theme"><label>NIVEAU BLOOM GLOBAL</label><select data-path="identification.niveauBloom" maxlength="20"><option></option>${APP.BLOOM.map(b=>`<option ${b===id.niveauBloom?'selected':''}>${esc(b)}</option>`).join('')}</select></div>
      <div class="g-field g-code coded-field calculated-code"><label>CODE BLOOM</label><input id="generalitesCodeBloom" value="${esc(id.codeBloom||'')}" readonly aria-readonly="true" title="Calculé automatiquement depuis le niveau Bloom global"></div>

      <div class="g-spacer"></div>
      <div class="g-field g-theme g-type-formation"><label>TYPE DE FORMATION</label><select data-path="identification.typeFormation"><option></option>${APP.TYPES.map(t=>`<option ${t===id.typeFormation?'selected':''}>${esc(t)}</option>`).join('')}</select></div>
      <div class="g-field g-participants"><label>PARTICIPANTS PAR CLASSE</label><input data-path="identification.participantsClasses" maxlength="12" value="${esc(id.participantsClasses||'')}"></div>
      <div class="g-field g-duration computed"><label>⏱️ DURÉE TOTALE PRÉVUE</label><input id="generalitesDureeTotal" value="${esc(formatMinutesDisplay(id.dureeTotale||0))}" readonly></div>

      <div class="g-field g-created computed"><label>CRÉATION / MODIFICATION</label><div class="field readonly-field">${esc(stamp)}</div></div>
      <div class="g-field g-status computed"><label>STATUT</label><input id="generalitesStatus" value="${esc(effectiveDLStatus(dl))}" readonly aria-readonly="true" title="Statut calculé automatiquement depuis l’onglet Validation"></div>
      <div class="g-field g-version"><label>VERSION</label><input data-path="version" value="${esc(dl.version||'v1.00')}" placeholder="v1.00" pattern="^v[1-9][0-9]*\\.[0-9]{2}$" title="Format attendu : v1.00, v1.01, v8.11"></div>
      <div class="g-field g-reference computed"><label>RÉFÉRENCE AUTOMATIQUE</label><input id="generalitesReference" value="${esc(dl.referenceDL||'')}" readonly></div>

      <div class="g-field g-tags keyword-field"><label>TAGS / MOTS-CLÉS</label><div class="keyword-tag-editor" data-tags-editor><div class="keyword-tag-badges" data-tag-badges></div><input data-tags-input autocomplete="off" value="" placeholder="Ajouter un mot clé…"><div class="keyword-suggestions" data-keyword-suggestions></div></div><div class="ac-help">Espace, Enter ou Tab valide le mot clé. Les badges sont enregistrés dans la Bibliothèque mots clés.</div></div>
    </div></div>
    <div class="card"><h3>Responsabilités</h3><div class="form-grid">${singleAutocompleteField('responsables.responsable','Responsable','personnel',false,4)}${multiAutocompleteField('responsables.redacteurs','Rédacteurs','personnel',false,4)}${multiAutocompleteField('responsables.formateurs','Formateurs','personnel',true,4)}</div></div>`;
}

function renderPublicCibleBlock(id){
  normalizePublicCibleModel(APP.state.current);
  const selected=uniqueNormalized(id.publicCibleSelections||[]);
  const selectValue=selected[0] || '';
  const options=PUBLIC_CIBLE_GROUPS.map(group=>`<optgroup label="${esc(group.title)}">${group.items.map(item=>`<option value="${esc(item)}" ${norm(item)===norm(selectValue)?'selected':''}>${esc(item)}</option>`).join('')}</optgroup>`).join('');
  return `<div class="g-field g-public-cible public-cible-block"><label>PUBLIC CIBLE</label><div class="public-cible-card compact"><select class="public-cible-select" data-public-cible-select aria-label="Sélectionner un public cible métier"><option value="">Sélectionner un public cible…</option>${options}</select></div></div>`;
}
window.setPublicCibleSelection=(value)=>{
  const dl=ensureDLModel(APP.state.current);
  const id=dl.identification;
  const label=publicCibleKnownLabel(value) || '';
  id.publicCibleSelections = label ? [label] : [];
  syncPublicCibleLegacy(dl);
  setDirty();
  renderPanel();
};
function valueArray(path){
  const v=getByPath(APP.state.current,path);
  if(Array.isArray(v)) return v;
  return splitValueList(v);
}
function singleAutocompleteField(path,label,key,allowFree=false,span=4){
  const value=getByPath(APP.state.current,path)||'';
  return `<div class="span-${span} ac-field" data-ac-path="${path}" data-ac-key="${key}" data-ac-mode="single" data-ac-free="${allowFree?'1':'0'}"><label>${label}</label><div class="ac-box"><input class="ac-input" autocomplete="off" placeholder="Rechercher puis sélectionner…" value="${esc(value)}"><div class="lookup-suggestions" role="listbox"></div></div></div>`;
}
function compactAutocompleteField(path,key,allowFree=false,placeholder='Rechercher puis sélectionner…'){
  const value=getByPath(APP.state.current,path)||'';
  return `<div class="ac-field ac-inline" data-ac-path="${path}" data-ac-key="${key}" data-ac-mode="single" data-ac-free="${allowFree?'1':'0'}"><div class="ac-box"><input class="ac-input" autocomplete="off" placeholder="${esc(placeholder)}" value="${esc(value)}"><div class="lookup-suggestions" role="listbox"></div></div></div>`;
}
function multiAutocompleteField(path,label,key,allowFree=false,span=4){
  let values=valueArray(path).filter(Boolean);
  if(String(key||'').toLowerCase()==='personnel') values=sortPersonLabels(values);
  const currentStored=getByPath(APP.state.current,path);
  if(String(key||'').toLowerCase()==='personnel' && values.length && JSON.stringify(values)!==JSON.stringify(valueArray(path).filter(Boolean))){
    setByPath(APP.state.current,path, Array.isArray(currentStored) ? values : values.join(' ; '));
  }
  const chips=values.length
    ? `<div class="selected-personnel-list">${values.map((v,i)=>`<div class="selected-personnel-row"><span>${esc(v)}</span><button class="btn small icon-only" type="button" title="Supprimer" aria-label="Supprimer" onclick="removeMulti('${path}',${i})">${sfTrashIcon()}</button></div>`).join('')}</div>`
    : `<div class="ac-help">Aucun personnel ajouté.</div>`;
  return `<div class="span-${span} ac-field" data-ac-path="${path}" data-ac-key="${key}" data-ac-mode="multi" data-ac-free="${allowFree?'1':'0'}"><label>${label}</label><div class="ac-box"><input class="ac-input" autocomplete="off" placeholder="Rechercher un personnel…" value=""><button class="btn small ac-add" type="button" title="Ajouter le personnel sélectionné">+</button><div class="lookup-suggestions" role="listbox"></div></div>${chips}<div class="ac-help">${key==='public'?'Sélections ajoutées sous le champ.':'Rechercher, sélectionner dans la liste, puis cliquer sur + ou Entrée.'}</div></div>`;
}
function initAutocompleteFields(){
  $$('.ac-field').forEach(root=>{
    if(root.dataset.bound==='1') return; root.dataset.bound='1';
    const input=$('.ac-input',root), panel=$('.lookup-suggestions',root), addBtn=$('.ac-add',root);
    const path=root.dataset.acPath, key=root.dataset.acKey, mode=root.dataset.acMode, allowFree=root.dataset.acFree==='1';
    const min=1, limit=16; let active=-1, items=[], timer=null;
    const isPlanAutocomplete=!!root.closest('.plan-table');
    const originalPanelParent=panel?.parentElement || null;
    const placeFloatingPanel=()=>{
      if(!panel || !input || !isPlanAutocomplete) return;
      if(panel.parentElement!==document.body) document.body.appendChild(panel);
      const r=input.getBoundingClientRect();
      panel.classList.add('plan-ac-floating');
      panel.style.left=Math.round(r.left)+'px';
      panel.style.top=Math.round(r.bottom+4)+'px';
      panel.style.width=Math.max(360, Math.round(r.width))+'px';
      panel.style.maxWidth='min(560px, calc(100vw - '+Math.max(16, Math.round(r.left))+'px - 16px))';
    };
    const restoreFloatingPanel=()=>{
      if(!panel || !isPlanAutocomplete) return;
      panel.classList.remove('plan-ac-floating');
      panel.style.left=''; panel.style.top=''; panel.style.width=''; panel.style.maxWidth='';
      if(originalPanelParent && panel.parentElement!==originalPanelParent) originalPanelParent.appendChild(panel);
    };
    const close=()=>{ if(!panel)return; panel.innerHTML=''; panel.classList.remove('open','show'); active=-1; restoreFloatingPanel(); };
    const open=()=>{ if(!panel)return; const visible=!!panel.children.length; if(visible) placeFloatingPanel(); panel.classList.toggle('open',visible); panel.classList.toggle('show',visible); };
    if(isPlanAutocomplete){
      window.addEventListener('scroll',()=>{ if(panel?.classList.contains('show')) placeFloatingPanel(); }, true);
      window.addEventListener('resize',()=>{ if(panel?.classList.contains('show')) placeFloatingPanel(); });
    }
    const optionHtml=(item,i)=>`<button type="button" class="addr-suggestion person-ac-option ${i===active?'active':''}" data-index="${i}"><span>${esc(item.label)}</span>${item.detail?`<small>${esc(item.detail)}</small>`:''}</button>`;
    const currentToken=()=>{
      if(mode!=='multi') return input.value || '';
      const raw=String(input.value||'');
      const parts=raw.split(';');
      return parts.length ? parts[parts.length-1].trim() : raw.trim();
    };
    const writeMultiInput=(clean)=>{
      const existing=valueArray(path);
      const dedup=[];
      existing.forEach(v=>{ if(v && !dedup.some(x=>norm(x)===norm(v))) dedup.push(v); });
      if(!dedup.some(x=>norm(x)===norm(clean))) dedup.push(clean);
      if(String(key||'').toLowerCase()==='personnel') dedup.splice(0,dedup.length,...sortPersonLabels(dedup));
      input.value=dedup.join(' ; ');
      setByPath(APP.state.current,path, Array.isArray(getByPath(APP.state.current,path)) ? dedup : dedup.join(' ; '));
    };
    async function refreshNow(){
      const q=currentToken(); panel.innerHTML='';
      if(q.trim().length<min){ close(); return; }
      const cfg=AutocompleteService.config(key);
      if(cfg.csv && !CSVStore.has(cfg.csv)) await CSVStore.load(cfg.csv);
      items=AutocompleteService.search(key,q,{limit}); active=items.length?0:-1;
      panel.innerHTML=items.map(optionHtml).join('');
      if(!items.length && allowFree && q.trim()){
        panel.innerHTML=`<button type="button" class="addr-suggestion person-ac-option active" data-free="1"><span>Ajouter en saisie libre : ${esc(q.trim())}</span></button>`;
      }
      open();
    }
    const refresh=()=>{ clearTimeout(timer); timer=setTimeout(refreshNow,60); };
    function persistRawFree(){
      if(mode==='single' && allowFree){
        // Ne jamais stocker ni propager la recherche temporaire du formateur de la leçon
        // (ex. « m ») : elle doit rester un simple filtre jusqu'à sélection/validation.
        if(path==='planFormateurLecon') return;
        const planRowIdx=planTrainerRowIndexFromPath(path);
        if(planRowIdx!==null){
          applyManualPlanTrainer(planRowIdx, input.value, {render:false});
          return;
        }
        setByPath(APP.state.current,path,input.value);
        setDirty();
      }
      // IMPORTANT terrain : en mode multi (Rédacteurs / Formateurs), la saisie en cours sert uniquement à rechercher.
      // Elle ne doit pas être enregistrée comme personne ajoutée tant que l'utilisateur n'a pas validé avec + ou Entrée.
      // Cela évite le doublon « lettres recherchées » + « personne sélectionnée ».
    }
    function exactLabelForToken(token){
      const clean=String(token||'').trim();
      if(!clean) return '';
      const exact=AutocompleteService.findExact(key,clean);
      if(exact) return AutocompleteService.label(key,exact) || clean;
      const found=(items||[]).find(x=>norm(x.label)===norm(clean));
      return found ? found.label : '';
    }
    function commit(value){
      const clean=String(value||'').trim(); if(!clean)return false;
      if(mode==='single'){
        setByPath(APP.state.current,path,clean);
        input.value=clean;
      }else{
        writeMultiInput(clean);
        input.value='';
      }
      APP.state.current.dateModification=nowIso(); computeReference(APP.state.current);
      const planTrainerIdx=planTrainerRowIndexFromPath(path);
      if(path==='planFormateurLecon'){
        applyLessonTrainerToSchedule(clean, {render:false});
      }else if(planTrainerIdx!==null){
        applyManualPlanTrainer(planTrainerIdx, clean, {render:false});
      }else{
        setDirty();
      }
      close();
      if(mode==='multi' || path==='planFormateurLecon') renderPanel();
      return true;
    }
    function choose(){
      const token=currentToken();
      if(items[active]) return commit(items[active].label);
      if(!allowFree){
        const exact=exactLabelForToken(token);
        if(exact) return commit(exact);
      }
      if(allowFree && token.trim()) return commit(token.trim());
      if(!allowFree && token.trim()) toast('Sélection obligatoire depuis la liste.');
      return false;
    }
    input.addEventListener('input',()=>{ persistRawFree(); refresh(); });
    input.addEventListener('focus',refresh);
    input.addEventListener('blur',()=>setTimeout(()=>{
      close();
      if((path==='planFormateurLecon' || planTrainerRowIndexFromPath(path)!==null) && allowFree){
        const clean=normalizeTrainerDisplayName(input.value);
        const rowIdx=planTrainerRowIndexFromPath(path);
        if(path==='planFormateurLecon'){
          const exact=exactLabelForToken(clean);
          if(exact) commit(exact);
          else input.value=getByPath(APP.state.current,path)||'';
        }else if(clean.length>=2) commit(clean);
        else if(rowIdx!==null && clean.length===0) applyManualPlanTrainer(rowIdx, '', {render:false});
        else input.value=getByPath(APP.state.current,path)||'';
        return;
      }
      if(!allowFree && input.value.trim()){
        const currentVal=getByPath(APP.state.current,path);
        const vals=mode==='multi'?(Array.isArray(currentVal)?currentVal:splitValueList(input.value)):[input.value.trim()];
        const valid=vals.filter(v=>AutocompleteService.findExact(key,v));
        if(mode==='multi'){
          const original=String(input.value).trim();
          if(valid.length!==vals.length && original) toast('Certaines valeurs doivent être sélectionnées depuis la liste.');
          if(String(key||'').toLowerCase()==='personnel') valid.splice(0,valid.length,...sortPersonLabels(valid));
          input.value=valid.join(' ; ');
          setByPath(APP.state.current,path, Array.isArray(getByPath(APP.state.current,path)) ? valid : valid.join(' ; '));
        }else if(!AutocompleteService.findExact(key,input.value.trim())){
          input.value=getByPath(APP.state.current,path)||'';
        }
      }
    },180));
    input.addEventListener('keydown',e=>{
      const buttons=$$('.addr-suggestion',panel);
      if(e.key==='ArrowDown' && buttons.length){ e.preventDefault(); active=Math.min(buttons.length-1,active+1); buttons.forEach((b,i)=>b.classList.toggle('active',i===active)); }
      else if(e.key==='ArrowUp' && buttons.length){ e.preventDefault(); active=Math.max(0,active-1); buttons.forEach((b,i)=>b.classList.toggle('active',i===active)); }
      else if(e.key==='Enter'){ e.preventDefault(); choose(); }
      else if(e.key==='Escape') close();
    });
    panel.addEventListener('mousedown',e=>e.preventDefault());
    panel.addEventListener('click',e=>{ const btn=e.target.closest('.addr-suggestion'); if(!btn)return; if(btn.dataset.free==='1') commit(currentToken()); else {active=Number(btn.dataset.index); choose();} });
    addBtn?.addEventListener('click',choose);
  });
}
function autoResizeTextarea(el){
  if(!el) return;
  const resize=()=>{
    const min=el.classList.contains('plan-remarks-input')
      ? 38
      : (el.classList.contains('one-line-textarea') ? 38 : 74);
    el.style.height='auto';
    el.style.height=Math.max(min, el.scrollHeight)+'px';
  };
  resize();
  el.removeEventListener('input', el.__dlAutoResizeHandler || (()=>{}));
  el.__dlAutoResizeHandler=resize;
  el.addEventListener('input', resize);
}

function hasPlanRowContent(row){
  return !!String(row?.debut||row?.fin||row?.duree||row?.theme||row?.formateur||row?.remarques||'').trim();
}
function confirmDeleteFilled(message,filled){
  return !filled || confirm(message || 'Des données sont renseignées. Confirmer la suppression ?');
}
window.removeMulti=(path,i)=>{
  const arr=valueArray(path);
  const value=arr[i];
  if(!confirmDeleteFilled('Confirmer la suppression de ce personnel ?', !!String(value||'').trim())) return;
  arr.splice(i,1);
  const sorted=sortPersonLabels(arr);
  setByPath(APP.state.current,path, Array.isArray(getByPath(APP.state.current,path)) ? sorted : sorted.join(' ; '));
  setDirty();
  renderPanel();
};


function renderChecks(){
  const dl=ensureDLModel(APP.state.current);
  const checks=checkDL(dl,{context:'objectifs'});
  const errors=Array.isArray(checks?.errors) ? checks.errors : [];
  const warnings=Array.isArray(checks?.warnings) ? checks.warnings : [];
  const info=Array.isArray(checks?.info) ? checks.info : [];
  const parts=[];
  if(!errors.length){
    parts.push('<div class="alert ok">Aucune incohérence bloquante détectée.</div>');
  }else{
    parts.push(`<div class="alert warn"><strong>${errors.length} incohérence${errors.length>1?'s':''} bloquante${errors.length>1?'s':''}</strong></div><ul class="check-list">${errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`);
  }
  if(warnings.length){
    parts.push(`<div class="alert info"><strong>${warnings.length} avertissement${warnings.length>1?'s':''} non bloquant${warnings.length>1?'s':''}</strong></div><ul class="check-list muted">${warnings.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`);
  }
  if(info.length){
    parts.push(`<div class="muted diagnostic-note">${info.map(esc).join(' · ')}</div>`);
  }
  return parts.join('');
}

function renderObjectifs(){
  const dl=ensureDLModel(APP.state.current);
  APP.state.current=dl;
  $('#panel').innerHTML=`<div class="card"><h3>Buts à atteindre (maximum 3)</h3><div class="toolbar"><button class="btn" onclick="addBut()" ${dl.buts.length>=3?'disabled':''}>Ajouter un but</button></div>${dl.buts.map((b,i)=>`<div class="card objectif-item"><div class="form-grid"><div class="span-8"><label>But ${i+1}</label><textarea class="auto-expand one-line-textarea" data-path="buts.${i}.texte">${esc(b.texte)}</textarea></div><div class="span-3"><label>Niveau Bloom</label><select data-path="buts.${i}.niveauBloom">${APP.BLOOM.map(o=>`<option ${o===b.niveauBloom?'selected':''}>${esc(o)}</option>`).join('')}</select></div><div class="span-1"><label>&nbsp;</label><button class="btn small icon-only" title="Supprimer" aria-label="Supprimer" onclick="removeBut(${i})">${sfTrashIcon()}</button></div><div class="span-12">${renderBloomHelp(b.niveauBloom)}</div></div></div>`).join('')}</div><div class="card"><h3>Points d’évaluation mesurables (maximum 3 idéalement)</h3><div class="toolbar"><button class="btn" onclick="addEval()" ${dl.evaluations.length>=3?'disabled':''}>Ajouter une évaluation</button></div>${dl.evaluations.map((e,i)=>`<div class="card objectif-item"><div class="form-grid"><div class="span-6"><label>Point d’évaluation ${i+1}</label><textarea class="auto-expand one-line-textarea eval-point-textarea" data-path="evaluations.${i}.texte">${esc(e.texte)}</textarea></div><div class="span-2"><label>Mesurable</label><select data-path="evaluations.${i}.mesurable"><option value="true" ${e.mesurable!==false?'selected':''}>Oui</option><option value="false" ${e.mesurable===false?'selected':''}>Non</option></select></div><div class="span-3"><label>Lié aux buts</label><input class="linked-goals-input" data-path="evaluations.${i}.butsLies" value="${esc(formatLinkedGoals(e.butsLies))}" placeholder="1, 2, 3" inputmode="numeric" autocomplete="off"></div><div class="span-1"><label>&nbsp;</label><button class="btn small icon-only" title="Supprimer" aria-label="Supprimer" onclick="removeEval(${i})">${sfTrashIcon()}</button></div></div></div>`).join('')}</div><div class="card"><h3>Contrôles de cohérence</h3><div id="coherenceChecksBody">${renderChecks()}</div></div>`;
  $$('.auto-expand').forEach(autoResizeTextarea);
}
window.addBut=()=>{if(APP.state.current.buts.length<3){APP.state.current.buts.push({texte:'',niveauBloom:'Appliquer',evaluationsLiees:[]});setDirty();renderPanel();}}; window.removeBut=i=>{APP.state.current.buts.splice(i,1);setDirty();renderPanel();}; window.addEval=()=>{if(APP.state.current.evaluations.length<3){APP.state.current.evaluations.push({texte:'',mesurable:true,butsLies:[]});setDirty();renderPanel();}}; window.removeEval=i=>{APP.state.current.evaluations.splice(i,1);setDirty();renderPanel();};

function objectiveDiagnostics(dl){
  dl=ensureDLModel(dl);
  const buts=(dl.buts||[]).map(b=>({...b,texte:strip(b.texte)}));
  const evaluations=(dl.evaluations||[]).map(e=>({...e,texte:strip(e.texte),butsLies:normalizeLinkedGoalsInput(e.butsLies)}));
  const filledButs=buts.filter(b=>b.texte);
  const filledEvaluations=evaluations.filter(e=>e.texte || e.butsLies.length || e.mesurable===false || String(e.mesurable)==='false');
  const orphanEvaluations=filledEvaluations.filter(e=>e.texte && !e.butsLies.length);
  const nonMesurable=filledEvaluations.filter(e=>String(e.mesurable)==='false'||e.mesurable===false);
  const invalidLinks=[];
  filledEvaluations.forEach((e,i)=>e.butsLies.forEach(n=>{if(n<1||n>buts.length||!buts[n-1]?.texte)invalidLinks.push(`Évaluation ${i+1} liée au but ${n}, non renseigné.`);}));
  return {
    schema:'dl.creator.objectives.diagnostic.v3',
    hydrated:true,
    butsTotal:buts.length,
    butsRenseignes:filledButs.length,
    evaluationsTotal:evaluations.length,
    evaluationsRenseignees:filledEvaluations.length,
    evaluationsOrphelines:orphanEvaluations.length,
    evaluationsNonMesurables:nonMesurable.length,
    liensInvalides:invalidLinks.length,
    initialisationStable:true,
    fauxPositifInitialCorrige:true,
    readyForBlockingDiagnostic:filledEvaluations.length>0 || filledButs.length>0
  };
}
function checkDL(dl,opts={}){
  dl=ensureDLModel(dl);
  const errors=[];
  const warnings=[];
  const info=[];
  const od=objectiveDiagnostics(dl);
  if(dl.buts.length>3)errors.push('Plus de 3 buts.');
  if(dl.evaluations.length>3)errors.push('Plus de 3 évaluations.');
  (dl.evaluations||[]).forEach((e,i)=>{
    const texte=strip(e.texte);
    const butsLies=normalizeLinkedGoalsInput(e.butsLies);
    const touched=texte || butsLies.length || e.mesurable===false || String(e.mesurable)==='false';
    if(!touched) return;
    if(!texte){ warnings.push(`Évaluation ${i+1} créée mais non renseignée.`); return; }
    if(String(e.mesurable)==='false'||e.mesurable===false)warnings.push(`Évaluation ${i+1} non marquée comme mesurable.`);
    if(!butsLies.length)warnings.push(`Évaluation ${i+1} non liée à un but.`);
    butsLies.forEach(n=>{ if(n<1 || n>(dl.buts||[]).length || !strip(dl.buts[n-1]?.texte)) warnings.push(`Évaluation ${i+1} liée au but ${n}, non renseigné.`); });
  });
  const sum=(dl.planHoraire||[]).reduce((a,s)=>a+Number(s.duree||0),0);
  if(Number(dl.identification.dureeTotale||0)&&Math.abs(sum-Number(dl.identification.dureeTotale))>5) warnings.push(`Durée plan horaire (${sum} min) différente de la durée totale (${dl.identification.dureeTotale} min).`);
  const lessonTrainer=normalizeTrainerDisplayName(dl.planFormateurLecon);
  if(lessonTrainer){
    const customRows=(dl.planHoraire||[]).filter(row=>row && normalizeTrainerDisplayName(row.formateur) && normalizeTrainerDisplayName(row.formateur)!==lessonTrainer);
    if(customRows.length) info.push(`Plan horaire : ${customRows.length} ligne(s) avec formateur personnalisé conservé.`);
    else info.push('Plan horaire : formateur de la leçon synchronisé avec toutes les lignes.');
  }
  info.push(`Buts renseignés : ${od.butsRenseignes}/${od.butsTotal}`);
  info.push(`Évaluations renseignées : ${od.evaluationsRenseignees}/${od.evaluationsTotal}`);
  return {errors,warnings,info,objectives:od};
}

function renderPlanContent({embedded=false}={}){
  syncPlanHoraireFromFilRouge(APP.state.current);
  computePlanRowTranches(APP.state.current);
  const rows=APP.state.current.planHoraire;
  const tranches=ensurePlanTranchesHoraires(APP.state.current);
  const total=rows.reduce((a,s)=>a+Number(s.duree||0),0);
  const usedCount=usedPlanTrancheCount(APP.state.current);
  const visibleIndexes=Array.from({length:usedCount},(_,i)=>i);
  const formateurLeconField=`<label class="plan-global-trainer-label"><span class="plan-global-trainer-icon" title="Formateur de la leçon">${sfPersonWave2FillIcon('plan-global-trainer-sf')}<span class="sr-only">Formateur de la leçon</span></span><span class="plan-global-trainer-field"><span class="plan-global-trainer-title">FORMATEUR DE LA LEÇON</span>${compactAutocompleteField('planFormateurLecon','personnel',true,'Choisir un formateur…')}</span></label>`;
  const trancheInputs=`<div class="plan-tranches-card"><strong>FORMATEUR ET TRANCHES HORAIRES DE LA LEÇON</strong><div class="plan-tranche-compact plan-tranche-compact-with-trainer">${formateurLeconField}<label class="plan-passages-count">Nombre sessions<input type="number" min="1" max="4" step="1" data-plan-tranche-count value="${esc(usedCount)}" onchange="setPlanTrancheCount(this.value)"></label><button class="btn small" type="button" onclick="applyPlanTrancheSuggestion()">Proposer les horaires</button><div class="plan-tranches-inline">${visibleIndexes.map(i=>`<label class="plan-tranche-time-label"><span class="plan-tranche-icon-label" title="Horaire ${i+1}">${sfClockFillIcon('plan-tranche-input-icon')}<span class="sr-only">Horaire ${i+1}</span></span><input class="plan-time-compact" type="text" inputmode="numeric" maxlength="5" placeholder="HH:MM" data-path="planTranchesHoraires.${i}.debut" value="${esc(tranches[i]?.debut||'')}" title="Début session ${i+1}" onblur="normalizePlanTrancheInput(this)"></label>`).join('')}</div></div></div>`;
  const hourHeaders=visibleIndexes.map(i=>`<th class="plan-hour-header" title="Session ${i+1}">${sfClockFillIcon('plan-hour-icon')}</th>`).join('');
  const hourCells=(r,i)=>visibleIndexes.map(h=>`<td class="plan-range-cell" data-plan-range="${i}.${h}">${formatPlanRangeHtml(r,h)}</td>`).join('');
  return `<div class="card plan-card ${embedded?'embedded-plan-card':''}"><h3>Plan horaire détaillé</h3><div class="toolbar"><button class="btn" onclick="addSequence()">Ajouter une séquence manuelle</button><span class="muted">Jusqu’à 4 sessions horaires possibles pour une même leçon, sans duplication du programme.</span></div>${trancheInputs}<div class="plan-total"><strong>TOTAL DURÉE</strong><span>${esc(total)} minutes</span></div><div class="plan-scroll"><table class="data plan-table plan-table-multi plan-hours-${usedCount}"><thead><tr><th class="plan-theme-header">Section / thème</th><th class="plan-duration-header">Durée</th>${hourHeaders}<th>Formateur</th><th>Remarques</th><th></th></tr></thead><tbody>${rows.map((r,i)=>`<tr class="${r._source==='filRouge'?'auto-sequence':(r._source==='conclusion'?'auto-sequence conclusion-sequence':'')}"><td class="plan-theme-cell"><textarea class="plan-theme-input auto-expand one-line-textarea" data-path="planHoraire.${i}.theme" readonly tabindex="-1" title="Thème synchronisé automatiquement avec le Fil rouge">${esc(r.theme)}</textarea></td><td><input class="plan-duration-input" type="number" max="99999" data-path="planHoraire.${i}.duree" value="${esc(r.duree)}" ${r._source==='filRouge'||r._source==='conclusion'?'readonly title="Durée synchronisée automatiquement"':''}></td>${hourCells(r,i)}<td class="plan-formateur-cell">${compactAutocompleteField(`planHoraire.${i}.formateur`,`personnel`,true,`Formateur`)}</td><td class="plan-remarks-cell"><textarea class="plan-remarks-input auto-expand" rows="1" data-path="planHoraire.${i}.remarques">${esc(r.remarques)}</textarea></td><td>${(r._source==='filRouge'||r._source==='conclusion')?'<span class="muted">Auto</span>':`<div class="row-actions compact-actions"><button class="btn small" onclick="moveSequence(${i},-1)" title="Monter">↑</button><button class="btn small" onclick="moveSequence(${i},1)" title="Descendre">↓</button><button class="btn small icon-only" onclick="removeSequence(${i})" title="Supprimer" aria-label="Supprimer">${sfTrashIcon()}</button></div>`}</td></tr>`).join('')}</tbody></table></div>${datalistPersonnel()}</div>`;
}
function renderPlan(){
  $('#panel').innerHTML=renderPlanContent();
}

window.addSequence=()=>{
  syncPlanHoraireFromFilRouge(APP.state.current);
  APP.state.current.planHoraire.push({debut:'',fin:'',duree:'',theme:'',formateur:String(APP.state.current.planFormateurLecon||'').trim(),remarques:'',tranches:[{debut:'',fin:''},{debut:'',fin:''},{debut:'',fin:''},{debut:'',fin:''}]});
  recalcPlanHoraireFrom(Math.max(0,APP.state.current.planHoraire.length-2),'');
  setDirty();
  renderPanel();
};
window.removeSequence=i=>{
  const row=APP.state.current.planHoraire[i];
  if(row?._source==='filRouge' || row?._source==='conclusion') return;
  if(!confirmDeleteFilled('Cette séquence contient des données. Confirmer la suppression ?', hasPlanRowContent(row))) return;
  APP.state.current.planHoraire.splice(i,1);
  recalcPlanHoraireFrom(Math.max(0,i-1),'');
  setDirty();
  renderPanel();
};
window.moveSequence=(i,delta)=>{
  const rows=APP.state.current.planHoraire;
  const target=i+delta;
  if(target<0 || target>=rows.length) return;
  if(rows[i]?._source==='filRouge' || rows[i]?._source==='conclusion') return;
  [rows[i],rows[target]]=[rows[target],rows[i]];
  recalcPlanHoraireFrom(Math.min(i,target),'');
  setDirty();
  renderPanel();
};
function recalcDurations(){ APP.state.current.planHoraire.forEach(s=>{ if(s._source==='filRouge' || s._source==='conclusion') return; if(s.debut&&s.fin){ const [h1,m1]=s.debut.split(':').map(Number), [h2,m2]=s.fin.split(':').map(Number); let d=(h2*60+m2)-(h1*60+m1); if(d<0)d+=1440; s.duree=d; }}); setDirty(); renderPanel(); }

function formatDurationDisplay(v){
  const n=String(v??'').replace(/\D/g,'').slice(0,3);
  return n ? `${n} minutes` : '';
}
function chantierHeaderIcon(kind){
  if(kind==='place') return `<svg class="field-label-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.75c-3.45 0-6.25 2.67-6.25 5.96 0 4.19 4.88 9.26 5.82 10.2a.6.6 0 0 0 .86 0c.94-.94 5.82-6.01 5.82-10.2 0-3.29-2.8-5.96-6.25-5.96Zm0 8.38a2.33 2.33 0 1 1 0-4.66 2.33 2.33 0 0 1 0 4.66Z" fill="currentColor"/><path d="M5.1 18.1c-1.25.42-2.1 1.05-2.1 1.8 0 1.35 4.03 2.35 9 2.35s9-1 9-2.35c0-.75-.85-1.38-2.1-1.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  return `<svg class="field-label-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.1 4.4 9 2.5h6l.9 1.9 2.1.8 2-.7 3 5.2-1.6 1.3v2l1.6 1.3-3 5.2-2-.7-2.1.8-.9 1.9H9l-.9-1.9-2.1-.8-2 .7-3-5.2L2.6 13v-2L1 9.7l3-5.2 2 .7 2.1-.8ZM12 15.8a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Z" fill="currentColor"/></svg>`;
}
function chantierLabel(text,kind){
  return `<span class="field-label-with-icon">${chantierHeaderIcon(kind)}<span>${esc(text)}</span></span>`;
}
function renderFilRouge(){
  const dl=APP.state.current;
  ensureDLModel(dl);
  const fr=dl.filRouge||[];
  fr.forEach(normalizeFilRougeSection);
  const generalHeader=`<div class="filrouge-general-header form-grid"><div class="span-6"><label>${chantierLabel('EMPLACEMENT CHANTIER','place')}</label><textarea class="auto-expand" data-path="filRougeEmplacementChantierGeneral">${esc(dl.filRougeEmplacementChantierGeneral||'')}</textarea></div><div class="span-6"><label>${chantierLabel('PRÉPARATION CHANTIER','prep')}</label><textarea class="chantier auto-expand" data-path="filRougePreparationChantierGeneral">${esc(dl.filRougePreparationChantierGeneral||'')}</textarea></div></div>`;
  $('#panel').innerHTML=`<div class="card"><h3>Fil rouge libre</h3><div class="alert info">FIL ROUGE : texte formaté, couleurs rapides, listes et images intégrées dans le corps. Les annexes PDF documentaires sont liées à chaque section et seront ajoutées automatiquement à la fin de la DL exportée.</div>${generalHeader}${fr.map((s,i)=>`<div class="card filrouge-section"><div class="form-grid"><div class="span-2"><label>Durée</label><div class="duration-field"><span aria-hidden="true">⏱</span><input type="text" inputmode="numeric" maxlength="3" data-duration="filRouge.${i}.duree" value="${esc(formatDurationDisplay(s.duree))}" placeholder="minutes"></div></div><div class="span-9 filrouge-title-row"><div class="filrouge-title-field"><label>Titre section</label><input class="section-title-input" data-path="filRouge.${i}.titre" data-transform="upper" value="${esc((s.titre||'').toUpperCase())}"></div>${renderFilRougeReorderControls(i,fr.length)}</div><div class="span-1 filrouge-trash-cell"><button class="btn small icon-only filrouge-trash-btn" title="Supprimer" aria-label="Supprimer" onclick="removeFilRouge(${i})">${sfTrashIcon()}</button></div><div class="span-6"><label>EMPLACEMENT CHANTIER (spécifique)</label><textarea class="auto-expand" data-path="filRouge.${i}.emplacementChantier">${esc(s.emplacementChantier)}</textarea></div><div class="span-6"><label>PRÉPARATION CHANTIER (spécifique)</label><textarea class="chantier auto-expand" data-path="filRouge.${i}.preparationChantier">${esc(s.preparationChantier)}</textarea></div><div class="span-12">${renderLinkedSelector('BUTS LIÉS À CETTE SECTION',dl.buts,`filRouge.${i}.butsLies`,'Aucun but renseigné dans Buts & évaluations.')}</div><div class="span-12"><label>FIL ROUGE</label><div class="rich-editor-shell"><div class="rich-toolbar" role="toolbar" aria-label="Outils FIL ROUGE"><button type="button" class="btn small" title="Augmenter taille" onclick="changeSelectionFontSize(1)">A+</button><button type="button" class="btn small" title="Diminuer taille" onclick="changeSelectionFontSize(-1)">A-</button><span class="font-size-indicator" role="status" aria-live="polite" aria-label="Taille de police active" title="Taille de police active">11</span><button class="btn small color-tool color-black" title="Texte noir" onclick="setRichColor('#1f2730')" aria-label="Texte noir"></button><button class="btn small color-tool color-blue" title="Texte bleu" onclick="setRichColor('#005eb8')" aria-label="Texte bleu"></button><button class="btn small color-tool color-red" title="Texte rouge" onclick="setRichColor('#b8141d')" aria-label="Texte rouge"></button><button class="btn small" onclick="cmd('bold')">Gras</button><button class="btn small" onclick="cmd('italic')">Italique</button><button class="btn small" onclick="cmd('indent')">Indenter</button><button class="btn small" onclick="cmd('outdent')">Désindenter</button><select class="btn small list-select" onchange="insertFilRougeList(this.value);this.value=''" aria-label="Liste"><option value="">Liste</option><option value="dot">·</option><option value="dash">-</option><option value="number">1., 2., 3.</option></select><button class="btn small" onclick="applyRemark()">Formatage remarque</button><button class="btn small" onclick="insertLink()">Insérer un lien</button><label class="btn small"><input type="file" hidden accept="image/*" onchange="attachToRich(event,${i})">Import image</label><label class="btn small"><input type="file" hidden accept="application/pdf,.pdf" onchange="attachPdfPageToRich(event,${i})">Import PDF</label></div><div class="rich" contenteditable="true" data-rich="${i}">${s.contenuHtml||''}</div></div></div><div class="span-12"><label>Remarques liées à cette section</label><textarea data-path="filRouge.${i}.remarques">${esc(s.remarques)}</textarea></div><div class="span-12">${renderPdfAnnexes(i,s)}</div></div></div>`).join('')}<div class="toolbar filrouge-add-bottom"><button class="btn filrouge-add-section-btn" onclick="addFilRouge()"><span class="filrouge-add-plus" aria-hidden="true">+</span><strong>Ajouter une section</strong></button></div></div>`;
  $$('.rich').forEach(r=>{r.onfocus=()=>{rememberRichSelection(r); updateFontSizeIndicator();}; r.onmouseup=()=>{rememberRichSelection(r); updateFontSizeIndicator();}; r.onkeyup=()=>{rememberRichSelection(r); updateFontSizeIndicator();}; r.onblur=()=>rememberRichSelection(r); r.oninput=()=>saveRichNode(r); r.oncopy=e=>handleRichCopy(e,false); r.oncut=e=>handleRichCopy(e,true); r.onpaste=handleRichPaste; r.ondragover=e=>{e.preventDefault();r.classList.add('drag')}; r.ondragleave=()=>r.classList.remove('drag'); r.ondrop=e=>{r.classList.remove('drag');dropRich(e)};});
  bindRichToolbarSelectionGuards($('#panel'));
  $$('[data-duration]').forEach(el=>{el.onfocus=()=>{el.value=String(el.value||'').replace(/\D/g,'');}; el.oninput=()=>{el.value=String(el.value||'').replace(/\D/g,'').slice(0,3); setByPath(APP.state.current,el.dataset.duration,el.value); syncPlanHoraireFromFilRouge(APP.state.current); updateComputedDurations(APP.state.current); refreshLiveGeneralites(); setDirty();}; el.onblur=()=>{el.value=formatDurationDisplay(el.value);};});
  initMediaWidgets(); initPdfWidgets();
}
function richIndex(r){
  if(!r) return null;
  if(r.dataset.rich !== undefined) return Number(r.dataset.rich);
  if(r.dataset.conclusionRich !== undefined) return 'conclusion-' + Number(r.dataset.conclusionRich);
  if(r.dataset.verifyRich !== undefined) return 'verify-' + Number(r.dataset.verifyRich);
  if(r.dataset.generalRemarkRich !== undefined) return 'general-remark';
  return null;
}
function rememberRichSelection(r){
  if(!r || !r.isContentEditable) return;
  APP.activeRich = r;
  const sel = window.getSelection();
  if(sel && sel.rangeCount){
    const range = sel.getRangeAt(0);
    if(r.contains(range.commonAncestorContainer)){
      APP.savedRange = range.cloneRange();
      APP.savedRichKey = richIndex(r);
    }
  }
}
function getRichFromSavedKey(){
  const key = APP.savedRichKey;
  if(key === null || key === undefined) return null;
  if(String(key).startsWith('conclusion-')) return document.querySelector(`[data-conclusion-rich="${String(key).replace('conclusion-','')}"]`);
  if(String(key).startsWith('verify-')) return document.querySelector(`[data-verify-rich="${String(key).replace('verify-','')}"]`);
  if(String(key)==='general-remark') return document.querySelector('[data-general-remark-rich]');
  return document.querySelector(`[data-rich="${key}"]`);
}
function getActiveRich(){
  const sel = window.getSelection();
  if(sel && sel.rangeCount){
    const node = sel.anchorNode?.nodeType === 1 ? sel.anchorNode : sel.anchorNode?.parentElement;
    const rich = node?.closest?.('.rich');
    if(rich){ rememberRichSelection(rich); return rich; }
  }
  if(APP.activeRich && document.body.contains(APP.activeRich)) return APP.activeRich;
  const saved = getRichFromSavedKey();
  if(saved) return saved;
  return document.querySelector('.rich[contenteditable="true"]');
}
function restoreRichRange(r){
  if(!r) return false;
  r.focus({preventScroll:true});
  const sel = window.getSelection();
  if(!sel) return false;
  if(APP.savedRange && document.body.contains(r) && r.contains(APP.savedRange.commonAncestorContainer)){
    sel.removeAllRanges();
    sel.addRange(APP.savedRange.cloneRange());
    APP.activeRich = r;
    return true;
  }
  if(!sel.rangeCount || !r.contains(sel.anchorNode)){
    const range = document.createRange();
    range.selectNodeContents(r);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    APP.savedRange = range.cloneRange();
    APP.savedRichKey = richIndex(r);
  }
  APP.activeRich = r;
  return true;
}
function insertHtmlAtCursor(r,html){
  if(!r) return;
  restoreRichRange(r);
  const clean = sanitizeRichHtml(html);
  if(document.queryCommandSupported && document.queryCommandSupported('insertHTML')){
    document.execCommand('insertHTML', false, clean);
  }else{
    const sel = window.getSelection();
    if(!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const tpl = document.createElement('template');
    tpl.innerHTML = clean;
    const frag = tpl.content.cloneNode(true);
    const last = frag.lastChild;
    range.insertNode(frag);
    if(last){
      const nr = document.createRange();
      nr.setStartAfter(last);
      nr.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nr);
    }
  }
  rememberRichSelection(r);
  saveAnyRichNode(r);
  initMediaWidgets();
  initPdfWidgets();
}
function saveAllRichBeforeExport(){
  $$('.rich').forEach(r=>saveAnyRichNode(r));
}
function bindRichToolbarSelectionGuards(root=document){
  $$('.rich-toolbar',root).forEach(tb=>{
    tb.addEventListener('mousedown',e=>{
      const shell=tb.closest('.rich-editor-shell') || tb.closest('.conclusion-card') || tb.parentElement;
      const rich=shell?.querySelector?.('.rich') || APP.activeRich || getActiveRich();
      if(rich) rememberRichSelection(rich);
      if(e.target.closest('button,label') && !e.target.closest('select')) e.preventDefault();
    });
    tb.addEventListener('click',e=>{
      const shell=tb.closest('.rich-editor-shell') || tb.closest('.conclusion-card') || tb.parentElement;
      const rich=shell?.querySelector?.('.rich') || APP.activeRich || getActiveRich();
      if(rich){ APP.activeRich=rich; restoreRichRange(rich); }
    },true);
  });
}
function saveRichNode(r){ if(!r)return; const idx=Number(r.dataset.rich); if(APP.state.current.filRouge[idx]) APP.state.current.filRouge[idx].contenuHtml=r.innerHTML; setDirty(); }
function saveVerifyNode(r){ if(!r)return; const i=Number(r.dataset.verifyRich); const c=APP.state.current.conclusion[i]; if(!c)return; c.pointsAVerifierHtml=r.innerHTML; c.pointsAVerifier=strip(r.innerHTML); setDirty(); }
function saveGeneralRemarkNode(r){ if(!r)return; ensureDLModel(APP.state.current); APP.state.current.distribution.remarqueGeneraleHtml=r.innerHTML; APP.state.current.distribution.remarqueGeneraleText=strip(r.innerHTML); setDirty(); }
function saveAnyRichNode(r){ if(!r)return; if(r.dataset.conclusionRich!==undefined) saveConclusionNode(r); else if(r.dataset.verifyRich!==undefined) saveVerifyNode(r); else if(r.dataset.generalRemarkRich!==undefined) saveGeneralRemarkNode(r); else saveRichNode(r); }
function execRich(fn){ const r=getActiveRich(); if(!r) return; restoreRichRange(r); fn(); rememberRichSelection(r); saveAnyRichNode(r); }
function selectionHtml(){
  const sel=window.getSelection(); if(!sel || !sel.rangeCount || sel.isCollapsed)return '';
  const div=document.createElement('div'); div.appendChild(sel.getRangeAt(0).cloneContents()); return div.innerHTML;
}
function sanitizeRichHtml(html){
  const tpl=document.createElement('template'); tpl.innerHTML=html||'';
  tpl.content.querySelectorAll('script,style,iframe,embed').forEach(n=>n.remove());
  tpl.content.querySelectorAll('*').forEach(n=>{
    [...n.attributes].forEach(a=>{ if(/^on/i.test(a.name)) n.removeAttribute(a.name); });
    if(n.tagName==='IMG' && !/^data:image\//i.test(n.getAttribute('src')||'')) n.removeAttribute('src');
    if(n.tagName==='OBJECT' && !/^data:application\/pdf/i.test(n.getAttribute('data')||'')) n.remove();
  });
  return tpl.innerHTML;
}
function handleRichCopy(e,cut=false){
  const r=getActiveRich(); if(!r)return;
  const html=selectionHtml(); if(!html)return;
  e.preventDefault();
  e.clipboardData.setData('text/html',html);
  e.clipboardData.setData('text/plain',strip(html));
  if(cut){ document.execCommand('delete'); saveAnyRichNode(r); }
}
function normalizeDiscussionConclusionPasteHtml(html){
  const tpl=document.createElement('template');
  tpl.innerHTML=html||'';
  tpl.content.querySelectorAll('*').forEach(n=>{
    const st=n.style;
    if(st){
      st.removeProperty('margin-left');
      st.removeProperty('margin-right');
      st.removeProperty('text-indent');
      st.removeProperty('padding-left');
      st.removeProperty('mso-list');
      if(!n.getAttribute('style')?.trim()) n.removeAttribute('style');
    }
    n.removeAttribute('class');
    n.removeAttribute('width');
  });
  return tpl.innerHTML;
}
function isDiscussionConclusionRich(r){
  return !!(r && (r.classList.contains('conclusion-rich') || r.classList.contains('conclusion-verify-rich') || r.classList.contains('general-remark-rich')));
}
function handleRichPaste(e){
  const r=getActiveRich(); if(!r)return;
  const files=[...(e.clipboardData?.files||[])];
  const image=files.find(f=>f.type.startsWith('image/'));
  if(image){ e.preventDefault(); insertFileInRich(image,Number(r.dataset.rich),r); return; }
  const html=e.clipboardData?.getData('text/html');
  if(html){
    e.preventDefault();
    const clean=sanitizeRichHtml(html);
    insertHtmlAtCursor(r,isDiscussionConclusionRich(r)?normalizeDiscussionConclusionPasteHtml(clean):clean);
    return;
  }
}
function sfEyeIcon(){ return '<span class="sf-eye-icon" aria-hidden="true">◉</span>'; }
function sfTrashIcon(){ return '<span class="sf-trash-icon" aria-hidden="true" title="trash.fill"><svg viewBox="0 0 24 24" focusable="false"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm3 2v8h2v-8H9Zm4 0v8h2v-8h-2Z"></path></svg></span>'; }
function initMediaWidgets(){
  $$('.rich figure.resizable-media').forEach(fig=>{
    if(!fig.querySelector('.media-preview-btn') && fig.querySelector('img')){
      const btn=document.createElement('button');
      btn.type='button'; btn.className='media-preview-btn no-print'; btn.title='Aperçu grand format';
      btn.innerHTML=sfEyeIcon();
      fig.insertBefore(btn,fig.firstChild);
    }
    if(!fig.querySelector('.media-delete-btn')){
      const del=document.createElement('button');
      del.type='button'; del.className='media-delete-btn no-print'; del.title='Supprimer cette image';
      del.innerHTML=sfTrashIcon();
      const after=fig.querySelector('.media-preview-btn');
      if(after) after.insertAdjacentElement('afterend',del); else fig.insertBefore(del,fig.firstChild);
    }
    if(!fig.__mediaPreviewBound){
      fig.__mediaPreviewBound=true;
      fig.addEventListener('click',e=>{
        const del=e.target.closest('.media-delete-btn');
        if(del){
          e.preventDefault(); e.stopPropagation();
          if(!confirm('Confirmer la suppression de cette image importée ?')) return;
          const rich=fig.closest('.rich');
          const next=fig.nextElementSibling;
          fig.remove();
          if(next && next.matches('p') && !strip(next.innerHTML)) next.remove();
          if(rich) saveAnyRichNode(rich);
          actionStatus('Image importée supprimée','ok');
          return;
        }
        const btn=e.target.closest('.media-preview-btn');
        if(!btn) return;
        e.preventDefault(); e.stopPropagation();
        const img=fig.querySelector('img');
        openMediaPreview(img?.src, fig.querySelector('figcaption')?.textContent||'Aperçu');
      });
    }
  });
}

function openMediaPreview(src,title='Aperçu'){
  if(!src)return;
  const overlay=document.createElement('div'); overlay.className='preview-overlay';
  overlay.innerHTML=`<div class="preview-modal"><button class="preview-close" type="button" aria-label="Fermer">×</button><img src="${src}" alt="${esc(title)}"><div class="preview-caption">${esc(title)}</div></div>`;
  document.body.appendChild(overlay);
  const close=()=>overlay.remove(); overlay.onclick=e=>{if(e.target===overlay)close();}; overlay.querySelector('.preview-close').onclick=close;
}
window.cmd=c=>execRich(()=>{
  const isListMove=c==='indent' || c==='outdent';
  if(isListMove) normalizeActiveListBeforeIndent();
  document.execCommand(c,false,null);
  if(isListMove) normalizeActiveListAfterIndent();
  updateFontSizeIndicator();
});
window.setRichColor=color=>execRich(()=>{document.execCommand('foreColor',false,color); updateFontSizeIndicator();});
window.applyRemark=()=>execRich(()=>{document.execCommand('italic'); document.execCommand('foreColor',false,'#b8141d'); updateFontSizeIndicator();});
function selectionTextLines(){
  const sel=window.getSelection();
  const txt=(sel && sel.rangeCount && !sel.isCollapsed)?sel.toString():'';
  return txt.split(/\n+/).map(x=>x.trim()).filter(Boolean);
}
function normalizeActiveListBeforeIndent(){
  const sel=window.getSelection();
  if(!sel || !sel.rangeCount)return;
  const node=sel.anchorNode?.nodeType===1?sel.anchorNode:sel.anchorNode?.parentElement;
  const list=node?.closest?.('ul.fr-list,ol.fr-list');
  if(!list)return;
  list.querySelectorAll('ul,ol').forEach(child=>{
    child.classList.add('fr-list');
    if(list.classList.contains('fr-list-dash')) child.classList.add('fr-list-dash');
    else if(list.classList.contains('fr-list-dot')) child.classList.add('fr-list-dot');
    else child.classList.add('fr-list-number');
  });
}
function normalizeActiveListAfterIndent(){
  const r=getActiveRich();
  if(!r)return;
  r.querySelectorAll('ul,ol').forEach(list=>{
    const parent=list.parentElement?.closest?.('ul.fr-list,ol.fr-list');
    list.classList.add('fr-list');
    if(parent?.classList.contains('fr-list-dash')){
      list.classList.remove('fr-list-dot','fr-list-number');
      list.classList.add('fr-list-dash');
    }else if(parent?.classList.contains('fr-list-dot')){
      list.classList.remove('fr-list-dash','fr-list-number');
      list.classList.add('fr-list-dot');
    }else if(parent?.classList.contains('fr-list-number') || list.tagName==='OL'){
      list.classList.remove('fr-list-dash','fr-list-dot');
      list.classList.add('fr-list-number');
    }
  });
}
function closestListContext(){
  const sel=window.getSelection();
  if(!sel || !sel.rangeCount) return null;
  const node=sel.anchorNode?.nodeType===1?sel.anchorNode:sel.anchorNode?.parentElement;
  return node?.closest?.('ul.fr-list,ol.fr-list') || null;
}
function listClassForType(type){
  if(type==='number') return 'fr-list-number';
  if(type==='dash') return 'fr-list-dash';
  return 'fr-list-dot';
}
function normalizeRichLists(r){
  if(!r) return;
  r.querySelectorAll('ul,ol').forEach(list=>{
    list.classList.add('fr-list');
    if(list.tagName==='OL') list.classList.add('fr-list-number');
    if(!list.classList.contains('fr-list-number') && !list.classList.contains('fr-list-dash') && !list.classList.contains('fr-list-dot')) list.classList.add('fr-list-dot');
  });
}
window.insertFilRougeList=type=>{
  if(!type)return;
  execRich(()=>{
    const r=getActiveRich();
    const existing=closestListContext();
    if(existing){
      const nextTag=type==='number'?'OL':'UL';
      const cls=listClassForType(type);
      if(existing.tagName!==nextTag){
        const replacement=document.createElement(nextTag.toLowerCase());
        replacement.innerHTML=existing.innerHTML;
        existing.replaceWith(replacement);
        replacement.className='fr-list '+cls;
      }else{
        existing.classList.remove('fr-list-dot','fr-list-dash','fr-list-number');
        existing.classList.add('fr-list',cls);
      }
      normalizeRichLists(r);
      return;
    }
    const lines=selectionTextLines();
    const items=(lines.length?lines:['']).map(l=>`<li>${esc(l) || '&nbsp;'}</li>`).join('');
    const tag=type==='number'?'ol':'ul';
    const cls=listClassForType(type);
    insertHtmlAtCursor(r,`<${tag} class="fr-list ${cls}">${items}</${tag}><p><br></p>`);
    normalizeRichLists(r);
  });
  updateFontSizeIndicator();
};
function ptFromComputedFontSize(el){
  const px=parseFloat(window.getComputedStyle(el).fontSize)||14.666;
  return Math.max(8,Math.min(24,Math.round(px*72/96)));
}
function firstSelectedTextNode(range,rich){
  if(!range || !rich) return null;
  if(range.startContainer?.nodeType===Node.TEXT_NODE && range.startContainer.nodeValue) return range.startContainer;
  const walker=document.createTreeWalker(rich,NodeFilter.SHOW_TEXT,{acceptNode(node){
    if(!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
    try{return range.intersectsNode(node)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;}catch(e){return NodeFilter.FILTER_SKIP;}
  }});
  return walker.nextNode();
}
function currentRichFontSize(){
  const sel=window.getSelection();
  let rich=APP.activeRich;
  let target=null;
  if(sel && sel.rangeCount){
    const range=sel.getRangeAt(0);
    const node=firstSelectedTextNode(range,rich || document.querySelector('.rich[contenteditable="true"]'));
    if(node){ target=node.parentElement; rich=target?.closest?.('.rich') || rich; }
    if(!target){
      const anchor=sel.anchorNode?.nodeType===1?sel.anchorNode:sel.anchorNode?.parentElement;
      target=anchor?.closest?.('span,[style],li,p,div') || anchor;
      rich=anchor?.closest?.('.rich') || rich;
    }
  }
  if(!rich) rich=getActiveRich();
  if(!target || !rich?.contains?.(target)) target=rich;
  return target ? ptFromComputedFontSize(target) : 11;
}
function updateFontSizeIndicator(){
  const value=currentRichFontSize();
  $$('.font-size-indicator').forEach(el=>{el.textContent=String(value||11);});
}
function selectedTextRanges(range,rich){
  const ranges=[];
  if(!range || !rich) return ranges;
  const walker=document.createTreeWalker(rich,NodeFilter.SHOW_TEXT,{acceptNode(node){
    if(!node.nodeValue) return NodeFilter.FILTER_SKIP;
    try{return range.intersectsNode(node)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;}catch(e){return NodeFilter.FILTER_SKIP;}
  }});
  let node;
  while((node=walker.nextNode())){
    let start=0,end=node.nodeValue.length;
    if(node===range.startContainer) start=range.startOffset;
    if(node===range.endContainer) end=range.endOffset;
    if(start<end) ranges.push({node,start,end});
  }
  return ranges;
}
function wrapTextNodeRange(item,sizePt){
  const {node,start,end}=item;
  let selected=node;
  if(end<node.nodeValue.length) node.splitText(end);
  if(start>0) selected=node.splitText(start);
  const span=document.createElement('span');
  span.style.fontSize=sizePt+'pt';
  selected.parentNode.insertBefore(span,selected);
  span.appendChild(selected);
  return span;
}
function nearestEditableTextScope(range,rich){
  const node=range.startContainer?.nodeType===1?range.startContainer:range.startContainer?.parentElement;
  const scope=node?.closest?.('li,p,div');
  if(scope && rich.contains(scope) && scope!==rich) return scope;
  return null;
}
function applyFontSizeToScope(scope,sizePt){
  if(!scope) return [];
  const spans=[];
  const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT,{acceptNode(node){
    if(!node.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
    if(node.parentElement?.closest?.('ul,ol') && node.parentElement.closest('ul,ol')!==scope.closest('ul,ol')) return NodeFilter.FILTER_SKIP;
    return NodeFilter.FILTER_ACCEPT;
  }});
  const items=[]; let n;
  while((n=walker.nextNode())) items.push({node:n,start:0,end:n.nodeValue.length});
  items.reverse().forEach(item=>spans.unshift(wrapTextNodeRange(item,sizePt)));
  return spans;
}
window.changeSelectionFontSize=delta=>{
  execRich(()=>{
    const sel=window.getSelection();
    if(!sel || !sel.rangeCount)return;
    const range=sel.getRangeAt(0);
    const parent=(range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement);
    const rich=parent?.closest?.('.rich') || APP.activeRich;
    if(!rich)return;
    const basePt=currentRichFontSize() || 11;
    const sizePt=Math.max(8,Math.min(24,basePt+delta));
    let spans=[];
    if(range.collapsed){
      spans=applyFontSizeToScope(nearestEditableTextScope(range,rich),sizePt);
    }else{
      const items=selectedTextRanges(range,rich);
      items.reverse().forEach(item=>spans.unshift(wrapTextNodeRange(item,sizePt)));
    }
    normalizeRichLists(rich);
    if(spans.length){
      const nr=document.createRange();
      nr.setStartBefore(spans[0]);
      nr.setEndAfter(spans[spans.length-1]);
      sel.removeAllRanges();
      sel.addRange(nr);
      APP.savedRange=nr.cloneRange();
      APP.activeRich=rich;
    }
  });
  updateFontSizeIndicator();
};
window.insertLink=()=>{const u=prompt('Adresse du lien'); if(u)execRich(()=>document.execCommand('createLink',false,u));};
window.addFilRouge=()=>{APP.state.current.filRouge.push({titre:'',duree:'',contenuHtml:'',documents:[],annexesPdf:[],remarques:'',preparationChantier:'',emplacementChantier:'',butsLies:[]});syncPlanHoraireFromFilRouge(APP.state.current);setDirty();renderPanel();};
window.removeFilRouge=i=>{APP.state.current.filRouge.splice(i,1);syncPlanHoraireFromFilRouge(APP.state.current);setDirty();renderPanel();};
window.moveFilRougeSection=(index,delta)=>{
  if(typeof saveAllRichBeforeExport==='function') saveAllRichBeforeExport();
  const rows=APP.state.current?.filRouge;
  if(!Array.isArray(rows)) return;
  const from=Number(index), to=from+Number(delta||0);
  if(!Number.isInteger(from) || !Number.isInteger(to) || from<0 || to<0 || from>=rows.length || to>=rows.length) return;
  const [section]=rows.splice(from,1);
  rows.splice(to,0,section);
  syncPlanHoraireFromFilRouge(APP.state.current,{forceFilRougeOrder:true});
  updateComputedDurations(APP.state.current);
  setDirty();
  renderPanel();
  actionStatus('Section réorganisée');
};
function dropRich(e){e.preventDefault(); const i=Number(e.currentTarget.dataset.rich); [...e.dataTransfer.files].forEach(f=>insertFileInRich(f,i,e.currentTarget));}
window.attachToRich=(e,i)=>{[...e.target.files].forEach(f=>insertFileInRich(f,i,$(`[data-rich="${i}"]`))); e.target.value='';};
async function insertFileInRich(file,i,el){
  if(!file || !el)return;
  const name=esc(file.name);
  if(file.type.startsWith('image/')){
    const reader=new FileReader();
    reader.onload=()=>{
      insertHtmlAtCursor(el,`<figure class="resizable-media image-media" contenteditable="false"><button type="button" class="media-preview-btn no-print" title="Aperçu">👁</button><img src="${reader.result}" alt="${name}"><figcaption>${name}</figcaption></figure><p><br></p>`);
    };
    reader.readAsDataURL(file);
    return;
  }
  if(file.type==='application/pdf' || /\.pdf$/i.test(file.name)){
    await insertPdfPageImageInRich(file,i,el);
    return;
  }
  const reader=new FileReader();
  reader.onload=()=>{
    insertHtmlAtCursor(el,`<p><a href="${reader.result}" download="${name}">📎 ${name}</a></p>`);
  };
  reader.readAsDataURL(file);
}
window.attachPdfPageToRich=async (e,i)=>{
  const file=e?.target?.files?.[0];
  if(e?.target) e.target.value='';
  if(!file) return;
  const rich=document.querySelector(`[data-rich="${i}"]`);
  try{ await insertPdfPageImageInRich(file,i,rich); }
  catch(err){ console.error(err); actionStatus('Import PDF toolbar impossible : '+(err?.message||err),'warn'); }
};
async function loadPdfJs(){
  if(window.pdfjsLib) return window.pdfjsLib;
  if(APP.pdfJsPromise) return APP.pdfJsPromise;
  const candidates=['assets/pdf.min.js','pdf.min.js','lib/pdf.min.js','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'];
  APP.pdfJsPromise=new Promise((resolve,reject)=>{
    let n=0;
    const tryNext=()=>{
      if(n>=candidates.length){ reject(new Error('moteur PDF.js indisponible localement')); return; }
      const src=candidates[n++];
      const script=document.createElement('script'); script.src=src; script.async=true;
      script.onload=()=>{ if(window.pdfjsLib){ try{ window.pdfjsLib.GlobalWorkerOptions.workerSrc=src.replace(/pdf\.min\.js$/, 'pdf.worker.min.js'); }catch{} resolve(window.pdfjsLib); } else tryNext(); };
      script.onerror=tryNext; document.head.appendChild(script);
    };
    tryNext();
  });
  return APP.pdfJsPromise;
}
async function choosePdfPageWithPreview(pdf,total,fileName){
  return new Promise(resolve=>{
    const overlay=document.createElement('div');
    overlay.className='pdf-page-picker-overlay no-print';
    overlay.innerHTML=`<div class="pdf-page-picker-modal" role="dialog" aria-modal="true" aria-label="Choix page PDF"><div class="pdf-page-picker-head"><div><strong>Importer une page PDF</strong><span>${esc(fileName||'PDF')} · ${total} page${total>1?'s':''}</span></div><button class="preview-close" type="button" aria-label="Fermer">×</button></div><div class="pdf-page-picker-help">Sélectionner la page à insérer comme image à l’emplacement du curseur.</div><div class="pdf-page-grid" data-pages></div><div class="pdf-page-picker-actions"><button class="btn small" type="button" data-cancel>Annuler</button><button class="btn small red" type="button" data-import disabled>Importer la page</button></div></div>`;
    document.body.appendChild(overlay);
    const grid=overlay.querySelector('[data-pages]');
    const importBtn=overlay.querySelector('[data-import]');
    let selected=null;
    const close=value=>{ document.removeEventListener('keydown',onKey); overlay.remove(); resolve(value); };
    const onKey=e=>{ if(e.key==='Escape') close(null); };
    document.addEventListener('keydown',onKey);
    overlay.addEventListener('click',e=>{ if(e.target===overlay) close(null); });
    overlay.querySelector('.preview-close').onclick=()=>close(null);
    overlay.querySelector('[data-cancel]').onclick=()=>close(null);
    importBtn.onclick=()=>close(selected);
    const selectCard=pageNo=>{ selected=pageNo; grid.querySelectorAll('.pdf-page-thumb').forEach(c=>c.classList.toggle('selected',Number(c.dataset.page)===pageNo)); importBtn.disabled=false; importBtn.textContent=`Importer page ${pageNo}`; };
    (async()=>{
      for(let pageNo=1; pageNo<=total; pageNo++){
        const card=document.createElement('button');
        card.type='button'; card.className='pdf-page-thumb'; card.dataset.page=String(pageNo);
        card.innerHTML=`<span class="pdf-page-thumb-loading">Page ${pageNo}</span><strong>Page ${pageNo}</strong>`;
        card.onclick=()=>selectCard(pageNo);
        grid.appendChild(card);
        try{
          const page=await pdf.getPage(pageNo);
          const viewport=page.getViewport({scale:0.22});
          const canvas=document.createElement('canvas');
          canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height);
          await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport}).promise;
          card.querySelector('.pdf-page-thumb-loading')?.remove();
          card.insertBefore(canvas,card.firstChild);
        }catch(err){ const fallback=card.querySelector('.pdf-page-thumb-loading'); if(fallback) fallback.textContent=`Aperçu indisponible · page ${pageNo}`; }
      }
      if(total===1) selectCard(1);
    })().catch(()=>{});
  });
}
async function insertPdfPageImageInRich(file,i,el){
  if(!file || !(file.type==='application/pdf' || /\.pdf$/i.test(file.name||''))) throw new Error('sélectionner un fichier PDF');
  if(!el) throw new Error('zone FIL ROUGE introuvable');
  rememberRichSelection(el);
  const arrayBuffer=await file.arrayBuffer();
  const pdfjs=await loadPdfJs();
  const pdf=await pdfjs.getDocument({data:arrayBuffer.slice(0)}).promise;
  const total=pdf.numPages||1;
  const pageNo=total>1 ? await choosePdfPageWithPreview(pdf,total,file.name||'PDF') : 1;
  if(!pageNo) return;
  restoreRichRange(el);
  const page=await pdf.getPage(pageNo);
  const viewport=page.getViewport({scale:2});
  const canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport}).promise;
  const dataUrl=canvas.toDataURL('image/png');
  const name=esc(file.name||'PDF');
  insertHtmlAtCursor(el,`<figure class="resizable-media pdf-page-image" contenteditable="false" style="width:620px"><button type="button" class="media-preview-btn no-print" title="Aperçu grand format">${sfEyeIcon()}</button><button type="button" class="media-delete-btn no-print" title="Supprimer cette image">${sfTrashIcon()}</button><img src="${dataUrl}" alt="${name} page ${pageNo}"><figcaption>${name} · page ${pageNo}/${total}</figcaption></figure><p><br></p>`);
  actionStatus(`Page PDF ${pageNo}/${total} insérée comme image`,'ok');
}
// Les PDF sont intégrés en Data URL locale dans un conteneur redimensionnable.
// Aucune dépendance réseau n’est requise pour l’import PDF.
function pdfPreviewSrc(src,page=1,zoom=100){ return src; }
window.updatePdfZoom=(figure,value)=>{};
window.updatePdfWidget=(figure)=>{};
function initPdfWidgets(){
  // Migration douce : les anciens aperçus PDF bruts restent visibles, mais tout nouvel import PDF est converti en image.
  $$('.pdf-media').forEach(fig=>{
    fig.classList.add('legacy-pdf-media');
    const rich=fig.closest('.rich');
    if(rich) saveRichNode(rich);
  });
}
function normalizeMaterialRow(row,labelField='designation'){
  if(row && typeof row==='object' && !Array.isArray(row)) return { [labelField]: row[labelField] || row.designation || row.description || row.nom || '', quantite: row.quantite ?? row.qte ?? '', affectation: row.affectation || row.lieu || 'Classe', etat: row.etat || row.statut || 'Reste opérationnel', remarque: row.remarque || row.remarques || '' };
  return { [labelField]: String(row||''), quantite:'', affectation:'Classe', etat:'Reste opérationnel', remarque:'' };
}
function ensureMaterielModel(dl=APP.state.current){
  if(!dl.materiel) dl.materiel={};
  const m=dl.materiel;
  if(!Array.isArray(m.didactique)) m.didactique = String(m.didactique||'').trim() ? [{description:String(m.didactique),quantite:'',affectation:'Classe',remarque:''}] : [];
  if(!Array.isArray(m.materielEngage)) m.materielEngage=[];
  if(!Array.isArray(m.fournitures)) m.fournitures=[];
  if(!Array.isArray(m.vehiculesEngages)) m.vehiculesEngages = Array.isArray(m.vehiculesACommander) ? m.vehiculesACommander : [];
  m.didactique=m.didactique.map(r=>normalizeMaterialRow(r,'description'));
  m.materielEngage=m.materielEngage.map(r=>normalizeMaterialRow(r,'designation'));
  m.fournitures=m.fournitures.map(r=>normalizeMaterialRow(r,'designation'));
  m.vehiculesEngages=m.vehiculesEngages.map(r=>normalizeMaterialRow(r,'designation'));
}
function renderMaterialTable(title,path,label,kind,options){
  const rows=getByPath(APP.state.current,path)||[];
  const isFree=kind==='free';
  const allowCatalogFree=kind==='materiel' || kind==='fournitures';
  const statusOptions=options||['Classe','Chantier'];
  return `<div class="card material-section"><div class="material-section-head"><h3>${title}</h3><button class="btn small" onclick="addMaterialRow('${path}','${kind}')">Ajouter une ligne</button></div><table class="data material-table"><thead><tr><th>${label}</th><th>Quantité</th><th>Choix</th><th>Remarque</th><th></th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${isFree?`<input data-path="${path}.${i}.description" value="${esc(r.description||'')}">`:compactAutocompleteField(`${path}.${i}.designation`,kind,allowCatalogFree,label)}</td><td><input class="qty-input" data-path="${path}.${i}.quantite" value="${esc(r.quantite||'')}"></td><td><select data-path="${path}.${i}.${kind==='vehicles'?'etat':'affectation'}">${statusOptions.map(o=>`<option ${o===(kind==='vehicles'?(r.etat||'Reste opérationnel'):(r.affectation||'Classe'))?'selected':''}>${esc(o)}</option>`).join('')}</select></td><td><input data-path="${path}.${i}.remarque" value="${esc(r.remarque||'')}"></td><td><button class="btn small icon-only" title="Supprimer" aria-label="Supprimer" onclick="removeMaterialRow('${path}',${i})">${sfTrashIcon()}</button></td></tr>`).join('')||`<tr><td colspan="5" class="muted">Aucune ligne. Utiliser “Ajouter une ligne”.</td></tr>`}</tbody></table></div>`;
}
function renderMateriel(){
  ensureMaterielModel(APP.state.current);
  $('#panel').innerHTML=`<div class="card"><h3>Matériel & véhicules</h3><div class="alert info">Les sections Matériel engagé, Fournitures et Véhicules engagés utilisent les CSV locaux du dossier /data avec séparateur point-virgule. La sélection dans les listes est proposée par autocomplete. Matériel engagé et fournitures acceptent également une saisie libre. La commande logistique regroupe les lignes par type et génère une check-list A4 imprimable ou exportable en HTML.</div></div>${renderMaterialTable('Matériel didactique','materiel.didactique','Description','free')}${renderMaterialTable('Matériel engagé','materiel.materielEngage','Matériel engagé','materiel')}${renderMaterialTable('Fournitures','materiel.fournitures','Fournitures','fournitures')}${renderMaterialTable('Véhicules engagés','materiel.vehiculesEngages','Véhicules engagés','vehicles',['Hors service','Reste opérationnel'])}<div class="card logistics-remarks-card"><div class="logistics-remarks-row"><div class="logistics-remarks-field">${textarea('materiel.remarquesLogistiques','Remarques logistiques',12)}</div><button class="btn red logistics-order-btn" type="button" onclick="generateLogisticsOrder()">Générer commande logistique</button></div></div>`;
}
window.addMaterialRow=(path,kind)=>{
  ensureMaterielModel(APP.state.current);
  const arr=getByPath(APP.state.current,path)||[];
  const row=kind==='free'?{description:'',quantite:'',affectation:'Classe',remarque:''}:{designation:'',quantite:'',affectation:'Classe',etat:'Reste opérationnel',remarque:''};
  arr.push(row); setByPath(APP.state.current,path,arr); setDirty(); renderPanel();
};
window.removeMaterialRow=(path,i)=>{
  const arr=getByPath(APP.state.current,path)||[];
  const row=arr[i]||{};
  const filled=!!String(row.description||row.designation||row.quantite||row.remarque||'').trim();
  if(!confirmDeleteFilled('Cette ligne contient des données. Confirmer la suppression ?', filled)) return;
  arr.splice(i,1);
  setByPath(APP.state.current,path,arr);
  setDirty();
  renderPanel();
};

function logisticsLabel(row, field='designation'){
  return String(row?.[field] || row?.designation || row?.description || '').trim();
}
function logisticsRows(dl=APP.state.current){
  ensureMaterielModel(dl);
  const sections=[
    {title:'Matériel didactique', rows:dl.materiel.didactique||[], labelField:'description', type:'Matériel didactique'},
    {title:'Matériel engagé', rows:dl.materiel.materielEngage||[], labelField:'designation', type:'Matériel engagé'},
    {title:'Fournitures', rows:dl.materiel.fournitures||[], labelField:'designation', type:'Fournitures'},
    {title:'Véhicules engagés', rows:dl.materiel.vehiculesEngages||[], labelField:'designation', type:'Véhicules engagés', vehicle:true}
  ];
  return sections.map(section=>({
    ...section,
    rows:section.rows.map(r=>({
      designation:logisticsLabel(r, section.labelField),
      quantite:String(r.quantite||'').trim(),
      affectation:section.vehicle?'':String(r.affectation||'').trim(),
      etat:section.vehicle?String(r.etat||'Reste opérationnel').trim():'',
      remarque:String(r.remarque||'').trim()
    })).filter(r=>r.designation || r.quantite || r.affectation || r.etat || r.remarque)
  })).filter(section=>section.rows.length);
}
function buildLogisticsOrderHtml(dl=APP.state.current){
  const sections=logisticsRows(dl);
  const id=dl.identification||{};
  const ref=computeReference(dl)||dl.referenceDL||'';
  const generated=new Date().toLocaleString('fr-CH');
  const sectionHtml=sections.length ? sections.map(section=>`<section class="log-section"><h2>${esc(section.title)}</h2><table><thead><tr><th class="check">☐</th><th>Type / catégorie</th><th>Désignation</th><th>Quantité</th><th>Classe / Chantier</th><th>Statut véhicule</th><th>Remarque DL</th><th>Remarque logistique</th></tr></thead><tbody>${section.rows.map(r=>`<tr><td class="check">☐</td><td>${esc(section.type)}</td><td>${esc(r.designation)}</td><td>${esc(r.quantite)}</td><td>${esc(r.affectation)}</td><td>${esc(r.etat)}</td><td>${esc(r.remarque)}</td><td class="write-line"></td></tr>`).join('')}</tbody></table></section>`).join('') : `<div class="empty">Aucun matériel ou véhicule renseigné dans la DL.</div>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Commande logistique - ${esc(ref||'DL')}</title><style>
  @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#1f2730;background:#f3f4f6}.sheet{max-width:1120px;margin:0 auto;background:#fff;min-height:100vh;padding:18mm 14mm}.doc-head{display:flex;align-items:center;gap:14px;border-bottom:4px solid #e30613;padding-bottom:12px;margin-bottom:14px}.logo-block{width:72px;height:72px;background:#e30613;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:22px}.doc-head h1{margin:0;color:#e30613;font-size:24px;text-transform:uppercase;letter-spacing:.03em}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0 16px}.meta div{border:1px solid #d9dde3;border-radius:8px;padding:8px;background:#fafafa}.meta strong{display:block;font-size:10px;text-transform:uppercase;color:#6b7280;margin-bottom:3px}.log-section{break-inside:avoid;margin-top:14px}.log-section h2{font-size:15px;margin:0 0 6px;color:#e30613;text-transform:uppercase}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #cfd4dc;padding:6px 5px;vertical-align:top}th{background:#f2f3f5;text-transform:uppercase;font-size:9.5px;letter-spacing:.03em}.check{width:28px;text-align:center;font-size:16px;font-weight:900}.write-line{min-width:140px;height:30px}.remarks{border:1px solid #d9dde3;border-radius:8px;padding:10px;min-height:54px;margin-top:16px}.remarks strong{display:block;margin-bottom:4px;color:#e30613}.printbar{position:sticky;top:0;background:#fff;border-bottom:1px solid #ddd;padding:8px;text-align:right}.printbar button{border:1px solid #cfd4dc;background:#fff;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer}.printbar .red{background:#e30613;color:#fff;border-color:#e30613}.empty{padding:14px;border:1px dashed #cfd4dc;border-radius:8px;color:#6b7280}@media print{body{background:#fff}.sheet{max-width:none;margin:0;padding:0}.printbar{display:none}.doc-head{break-after:avoid}.log-section{break-inside:avoid}th{background:#eee!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.logo-block{background:#e30613!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><div class="printbar"><button onclick="downloadHtml()">Exporter HTML</button> <button class="red" onclick="window.print()">Imprimer / PDF</button></div><main class="sheet"><header class="doc-head"><div class="logo-block">DL</div><div><h1>Commande logistique</h1><div>Check-list matériel & véhicules · SDIS régional du Nord vaudois</div></div></header><div class="meta"><div><strong>Référence DL</strong>${esc(ref)}</div><div><strong>Domaine</strong>${esc(id.domaine||'')}</div><div><strong>Thème</strong>${esc(id.theme||'')}</div><div><strong>Généré le</strong>${esc(generated)}</div></div>${sectionHtml}<div class="remarks"><strong>Remarque logistique générale</strong>${esc(dl.materiel?.remarquesLogistiques||'')}</div></main><script>function downloadHtml(){const html='<!doctype html>'+document.documentElement.outerHTML;const blob=new Blob([html],{type:'text/html;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='commande-logistique-${String(ref||'DL').replace(/[^a-z0-9_-]+/gi,'_')}.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}</script></body></html>`;
}
window.generateLogisticsOrder=()=>{
  if(typeof saveAllRichBeforeExport==='function') saveAllRichBeforeExport();
  ensureMaterielModel(APP.state.current);
  const html=buildLogisticsOrderHtml(APP.state.current);
  const w=window.open('', '_blank');
  if(w){ w.document.open(); w.document.write(html); w.document.close(); actionStatus('Commande logistique générée'); }
  else{ download('commande-logistique.html', html, 'text/html;charset=utf-8'); actionStatus('Popup bloquée : fichier HTML téléchargé', 'warn'); }
};

function conclusionToolbar(i){
  return `<div class="conclusion-toolbar rich-toolbar" role="toolbar" aria-label="Outils conclusion point ${i+1}"><button type="button" class="btn small" title="Augmenter taille" onclick="changeSelectionFontSize(1)">A+</button><button type="button" class="btn small" title="Diminuer taille" onclick="changeSelectionFontSize(-1)">A-</button><span class="font-size-indicator" role="status" aria-live="polite" aria-label="Taille de police active" title="Taille de police active">11</span><button class="btn small color-tool color-black" title="Texte noir" onclick="setRichColor('#1f2730')" aria-label="Texte noir"></button><button class="btn small color-tool color-blue" title="Texte bleu" onclick="setRichColor('#005eb8')" aria-label="Texte bleu"></button><button class="btn small color-tool color-red" title="Texte rouge" onclick="setRichColor('#b8141d')" aria-label="Texte rouge"></button><button class="btn small" onclick="cmd('bold')">Gras</button><button class="btn small" onclick="cmd('italic')">Italique</button><button class="btn small" onclick="cmd('indent')">Indenter</button><button class="btn small" onclick="cmd('outdent')">Désindenter</button><select class="btn small list-select" onchange="insertFilRougeList(this.value);this.value=''" aria-label="Liste"><option value="">Liste</option><option value="dot">·</option><option value="dash">-</option><option value="number">1., 2., 3.</option></select><button class="btn small" onclick="applyRemark()">Formatage remarque</button><button class="btn small" onclick="insertLink()">Insérer un lien</button></div>`;
}
function renderLinkedSelector(title,items,path,empty){
  const choices=(items||[]).map((x,i)=>({label:strip(x.texte||x), value:String(i+1)})).filter(x=>x.label);
  const selected=asArray(getByPath(APP.state.current,path)).map(String);
  return `<div class="linked-summary linked-selector"><strong>${title}</strong>${choices.length?choices.map(x=>`<label class="checkline"><input type="checkbox" ${selected.includes(x.value)?'checked':''} onchange="toggleArrayValue('${path}','${x.value}',this.checked)"> <span>${esc(x.value)}. ${esc(x.label)}</span></label>`).join(''):`<div class="muted">${empty}</div>`}</div>`;
}
function renderCheckGroup(title,path,values,freePath){
  const selected=asArray(getByPath(APP.state.current,path));
  const free=getByPath(APP.state.current,freePath)||'';
  return `<div class="distribution-group"><h4>${title}</h4>${values.map(v=>`<label class="checkline"><input type="checkbox" ${selected.includes(v)?'checked':''} onchange="toggleArrayValue('${path}','${esc(v)}',this.checked)"> ${esc(v)}</label>`).join('')}<label class="free-field">Saisie libre<input data-path="${freePath}" value="${esc(free)}" placeholder="Ajouter une mention libre…"></label></div>`;
}
function renderDistribution(){
  const dl=ensureDLModel(APP.state.current);
  const destinataires=['État-major','Chef site','Chef DAP','Chef formation','Chef FOBA','Chef FOCA','Chef FOSPEC','Chef PR','Of auto'];
  const groupes=['Cadres FOBA','Cadres FOCA','Formateurs','Formateurs PR','Moniteur de conduite'];
  const fonctions=['Chef section'];
  const totalConclusion=conclusionTotalMinutes(dl);
  $('#panel').innerHTML=`<div class="card conclusion-card"><h3>Discussion / conclusion</h3><div class="toolbar"><button class="btn red" onclick="addConclusion()">+ Ajouter un point</button><span class="muted">Total conclusion : ${esc(totalConclusion)} min · report automatique dans le plan horaire.</span></div>${dl.conclusion.map((c,i)=>`<div class="card conclusion-point"><div class="point-head"><h4>Point ${i+1}</h4><div class="row-actions compact-actions"><div class="duration-field conclusion-duration"><span aria-hidden="true">⏱</span><input type="text" inputmode="numeric" maxlength="3" data-duration="conclusion.${i}.duree" value="${esc(formatDurationDisplay(c.duree))}" placeholder="min" title="Durée du point"></div><button class="btn small icon-only filrouge-reorder-btn" title="Monter ce point" aria-label="Monter ce point" onclick="moveConclusionPoint(${i},-1)" ${i<=0?'disabled':''}>${sectionReorderIcon(-1)}</button><button class="btn small icon-only filrouge-reorder-btn" title="Descendre ce point" aria-label="Descendre ce point" onclick="moveConclusionPoint(${i},1)" ${i>=dl.conclusion.length-1?'disabled':''}>${sectionReorderIcon(1)}</button><button class="btn small icon-only" title="Supprimer" aria-label="Supprimer" onclick="removeConclusion(${i})">${sfTrashIcon()}</button></div></div><label>CONCLUSION</label><div class="rich-editor-shell">${conclusionToolbar(i)}<div class="rich conclusion-rich" contenteditable="true" data-conclusion-rich="${i}">${c.texteHtml || esc(c.texte||'')}</div></div><div class="conclusion-linked">${renderLinkedSelector('BUTS LIÉS',dl.buts,`conclusion.${i}.butsLies`,'Aucun but renseigné.')}${renderLinkedSelector('ÉVALUATIONS LIÉES',dl.evaluations,`conclusion.${i}.evaluationsLiees`,'Aucun point d’évaluation renseigné.')}<div class="linked-summary verify-rich-block"><strong>À VÉRIFIER</strong><div class="rich-editor-shell">${conclusionToolbar(i)}<div class="rich conclusion-verify-rich" contenteditable="true" data-verify-rich="${i}">${c.pointsAVerifierHtml || esc(c.pointsAVerifier||'')}</div></div></div></div></div>`).join('')}</div><div class="card conclusion-card"><h3>REMARQUE GÉNÉRALE</h3><div class="rich-editor-shell">${conclusionToolbar(0)}<div class="rich general-remark-rich" contenteditable="true" data-general-remark-rich="1">${dl.distribution.remarqueGeneraleHtml || esc(dl.distribution.remarqueGeneraleText||'')}</div></div><div class="ac-help">Remarque globale de la leçon. Elle est sauvegardée dans le JSON et reprise dans l’export PDF.</div></div><div class="card"><h3>Distribution</h3><div class="distribution-grid">${renderCheckGroup('COMMANDEMENT','distribution.destinataires',destinataires,'distribution.destinatairesLibre')}${renderCheckGroup('FORMATEURS','distribution.groupes',groupes,'distribution.groupesLibre')}${renderCheckGroup('AUTRES','distribution.fonctions',fonctions,'distribution.fonctionsLibre')}</div>${textarea('distribution.remarques','Remarques de diffusion',12)}</div>`;
  $$('.conclusion-rich,.conclusion-verify-rich,.general-remark-rich').forEach(r=>{r.onfocus=()=>{rememberRichSelection(r); updateFontSizeIndicator();}; r.onmouseup=()=>{rememberRichSelection(r); updateFontSizeIndicator();}; r.onkeyup=()=>{rememberRichSelection(r); updateFontSizeIndicator();}; r.onblur=()=>rememberRichSelection(r); r.oninput=()=>saveAnyRichNode(r); r.oncopy=e=>handleRichCopy(e,false); r.oncut=e=>handleRichCopy(e,true); r.onpaste=handleRichPaste;});
  bindRichToolbarSelectionGuards($('#panel'));
  $$('.auto-expand').forEach(autoResizeTextarea);
}
function asArray(v){ return Array.isArray(v)?v:splitValueList(v); }
function saveConclusionNode(r){ if(!r)return; const i=Number(r.dataset.conclusionRich); const c=APP.state.current.conclusion[i]; if(!c)return; c.texteHtml=r.innerHTML; c.texte=strip(r.innerHTML); setDirty(); }
window.toggleArrayValue=(path,value,checked)=>{ const arr=asArray(getByPath(APP.state.current,path)); const clean=value.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"'); const next=checked?Array.from(new Set([...arr,clean])):arr.filter(x=>x!==clean); setByPath(APP.state.current,path,next); setDirty(); };
window.addConclusion=()=>{APP.state.current.conclusion.push({texte:'',texteHtml:'',duree:'',butsLies:[],evaluationsLiees:[],pointsAVerifier:'',pointsAVerifierHtml:''});syncPlanHoraireFromFilRouge(APP.state.current);setDirty();renderPanel();};
window.moveConclusionPoint=(i,dir)=>{ const rows=APP.state.current.conclusion||[]; const j=i+dir; if(j<0||j>=rows.length)return; [rows[i],rows[j]]=[rows[j],rows[i]]; syncPlanHoraireFromFilRouge(APP.state.current); setDirty(); renderPanel(); };
function hasConclusionContent(c){
  return !!String(strip(c?.texteHtml||'') || c?.texte || c?.pointsAVerifier || strip(c?.pointsAVerifierHtml||'') || listText(c?.butsLies||[]) || listText(c?.evaluationsLiees||[])).trim();
}
window.removeConclusion=i=>{
  const c=APP.state.current.conclusion[i];
  if(!c) return;
  if(!confirmDeleteFilled('Ce point contient des données. Confirmer la suppression ?', hasConclusionContent(c))) return;
  APP.state.current.conclusion.splice(i,1);
  syncPlanHoraireFromFilRouge(APP.state.current);
  setDirty();
  renderPanel();
};

function normalizeAccessRight(value){
  const raw=String(value||'').trim();
  const n=norm(raw);
  if(['admin','administrateur','admin structure application','admin structure'].includes(n)) return 'ADMIN STRUCTURE APPLICATION';
  if(['chef formation'].includes(n)) return 'ADMIN STRUCTURE APPLICATION';
  if(['gestion dl','gestionnaire dl','validator','validateur','responsable formation','officier instruction','responsable exercice','cadre habilite'].includes(n)) return 'GESTION DL';
  if(['redaction dl','redacteur','formateur'].includes(n)) return 'RÉDACTION DL';
  if(['consultation dl','consultant','consultation','lecteur'].includes(n)) return 'CONSULTATION DL';
  if(APP.ACCESS_RIGHTS.includes(raw)) return raw;
  return 'CONSULTATION DL';
}
function accessRank(right){ return {'CONSULTATION DL':1,'RÉDACTION DL':2,'GESTION DL':3,'ADMIN STRUCTURE APPLICATION':4}[normalizeAccessRight(right)]||0; }
function currentUserAccessRight(){
  const user=APP.state.user || {};
  const role=String(user.role||'').trim();
  const permissions=Array.isArray(user.permissions)?user.permissions:[];
  if(role==='admin' || permissions.includes('app:admin') || permissions.includes('app:structure')) return 'ADMIN STRUCTURE APPLICATION';
  if(role==='validator' || permissions.includes('dl:validate') || permissions.includes('dl:manage')) return 'GESTION DL';
  const h=currentUserHabilitation?.();
  if(h) return normalizeAccessRight(h.droitAcces || h.role || h.fonction);
  if(user.function==='Chef formation' || user.fonction==='Chef formation') return 'ADMIN STRUCTURE APPLICATION';
  return 'RÉDACTION DL';
}
function hasAccessAtLeast(right){ return accessRank(currentUserAccessRight()) >= accessRank(right); }
function canManageKeywords(){ return !!APP.state.user && hasAccessAtLeast('RÉDACTION DL'); }
function canManageHabilitations(){ return hasAccessAtLeast('GESTION DL'); }
function canDeleteDL(){ return hasAccessAtLeast('GESTION DL'); }
function allowedModules(){
  const modules=['dl','bibliotheque','mesdl'];
  if(canManageHabilitations()) modules.push('habilitations');
  if(canManageKeywords()) modules.push('outils');
  modules.push('diagnosticProduction');
  modules.push('profile');
  return modules;
}
function accessDeniedPanel(){
  const recovery = APP.state.activeModule==='habilitations' && recoveryAvailable()
    ? `<div class="card recovery-card"><h3>Mécanisme de secours métier</h3><div class="alert warn">Votre compte local n’a plus les droits suffisants pour gérer les habilitations sur ce poste.</div><p class="muted">Utiliser uniquement ce mode pour restaurer un accès de gestion après une erreur de modification des droits. Une confirmation forte et le mot de passe local sont requis.</p><button class="btn red" type="button" onclick="runHabilitationRecovery()">Récupérer mes droits localement</button></div>`
    : '';
  $('#panel').innerHTML=`<div class="card"><h3>Accès réservé</h3><div class="alert warn">Accès réservé aux responsables habilités</div></div>${recovery}`;
}
function loadHabilitations(){
  const list=loadJson(APP.HABILITATIONS_KEY, []);
  return Array.isArray(list) ? list.map(h=>normalizeHabilitationRow(h)) : [];
}
function normalizeHabilitationRow(h){
  const row={...(h||{})};
  row.id=row.id||uid();
  row.nom=String(row.nom||row.name||row.fullName||'').trim();
  row.email=String(row.email||row.mail||row.eMail||'').trim();
  row.nip=String(row.nip||row.NIP||row.login||row.identifier||'').trim();
  row.login=row.nip || String(row.login||row.identifier||'').trim();
  row.grade=String(row.grade||row.Grade||'').trim();
  row.prenom=String(row.prenom||row.Prenom||row['Prénom']||'').trim();
  row.nomFamille=String(row.nomFamille||row.lastName||'').trim();
  row.fullName=[row.grade,row.prenom,row.nomFamille].filter(Boolean).join(' ') || row.nom;
  row.fonction=normalizeHabilitationFunction(row.fonction||row.function);
  row.droitAcces=normalizeAccessRight(row.droitAcces||row.role||defaultAccessRightForFunction(row.fonction));
  row.role=row.droitAcces;
  row.forcePasswordChangeAtFirstLogin = row.forcePasswordChangeAtFirstLogin !== false;
  row.status=row.status||'actif';
  row.active=row.active!==false;
  return row;
}
function saveHabilitations(list, options={}){
  APP.state.habilitations=(Array.isArray(list)?list:APP.state.habilitations||[]).map(normalizeHabilitationRow);
  safeSetLocalStorage(APP.HABILITATIONS_KEY, JSON.stringify(APP.state.habilitations), 'habilitations');
  if(!options.skipProfileSync){
    const p=syncProfileFromHabilitation(APP.state.habilitations.find(h=>personMatchesCurrentUser(h.nom)||norm(h.nip)===norm(currentUserLogin())), loadLocalProfile());
    if(p){ saveLocalProfile(p); APP.state.user=normalizeProfile(p); }
  }
}

function habilitationManagers(list=loadHabilitations()){
  return (Array.isArray(list)?list:[]).filter(h=>accessRank(h.droitAcces||h.role)>=accessRank('GESTION DL'));
}
function hasCurrentUserHabilitationManager(){
  return !!currentUserHabilitation() && accessRank(currentUserHabilitation().droitAcces||currentUserHabilitation().role)>=accessRank('GESTION DL');
}
function currentUserRecoveryRow(right='ADMIN STRUCTURE APPLICATION'){
  const u=normalizeProfile(APP.state.user||loadLocalProfile()||{});
  return normalizeHabilitationRow({
    id:uid(),
    nom:profileDisplayName(u),
    fonction:'Gestion formation',
    email:currentUserEmail(),
    login:currentUserLogin(),
    droitAcces:right,
    role:right,
    recovery:true,
    recoveryAt:nowIso(),
    recoveryReason:'Mécanisme de secours local'
  });
}
function recoveryAvailable(){
  const user=normalizeProfile(APP.state.user||loadLocalProfile()||{});
  return !!(profileIdentifier(user) && user.passwordHash && !hasCurrentUserHabilitationManager());
}
function recoveryDialog(){
  return new Promise(resolve=>{
    const overlay=document.createElement('div');
    overlay.className='modal-overlay no-print';
    overlay.innerHTML=`<div class="modal-card institutional-confirm warn recovery-confirm" role="dialog" aria-modal="true" aria-labelledby="recoveryConfirmTitle"><h3 id="recoveryConfirmTitle">Récupération locale des droits</h3><p>Ce mécanisme de secours est réservé au déverrouillage métier local lorsque les habilitations ne permettent plus de gérer les droits sur ce poste.</p><div class="alert warn">L’opération va ajouter l’utilisateur courant dans les habilitations avec le droit <strong>ADMIN STRUCTURE APPLICATION</strong>.</div><label>Mot de passe du compte local</label><input type="password" data-recovery-password autocomplete="current-password"><label>Code de confirmation</label><input data-recovery-code autocomplete="off" placeholder="Saisir RECUPERATION"><div class="ac-help">Aucun réseau n’est utilisé. Les données restent dans le stockage local offline-first.</div><div class="modal-actions row-actions"><button class="btn" data-recovery-cancel type="button">Annuler</button><button class="btn red" data-recovery-ok type="button">Récupérer mes droits</button></div></div>`;
    const cleanup=(value)=>{ overlay.remove(); resolve(value); };
    overlay.addEventListener('click',e=>{ if(e.target===overlay) cleanup(null); });
    overlay.querySelector('[data-recovery-cancel]').addEventListener('click',()=>cleanup(null));
    overlay.querySelector('[data-recovery-ok]').addEventListener('click',()=>cleanup({password:overlay.querySelector('[data-recovery-password]').value, code:overlay.querySelector('[data-recovery-code]').value}));
    overlay.querySelector('[data-recovery-code]').addEventListener('keydown',e=>{ if(e.key==='Enter') overlay.querySelector('[data-recovery-ok]').click(); });
    document.body.appendChild(overlay);
    setTimeout(()=>overlay.querySelector('[data-recovery-password]')?.focus(),0);
  });
}
async function runHabilitationRecovery(){
  if(!recoveryAvailable()){ actionStatus('Récupération indisponible : vos droits sont déjà suffisants ou le profil local est incomplet.', 'warn'); return; }
  const payload=await recoveryDialog();
  if(!payload) return;
  const profile=normalizeProfile(loadLocalProfile()||{});
  if(!(await verifyPassword(profile,payload.password||''))){ actionStatus('Mot de passe local incorrect.', 'warn'); return; }
  if(norm(payload.code||'')!==norm('RECUPERATION')){ actionStatus('Code de confirmation incorrect.', 'warn'); return; }
  const list=loadHabilitations();
  const existingIndex=list.findIndex(h=>personMatchesCurrentUser(h.nom||''));
  const row=currentUserRecoveryRow('ADMIN STRUCTURE APPLICATION');
  if(existingIndex>=0) list[existingIndex]={...list[existingIndex],...row,id:list[existingIndex].id||row.id};
  else list.push(row);
  saveHabilitations(list);
  APP.state.activeModule='habilitations';
  render();
  actionStatus('Droits restaurés localement. Contrôler les habilitations.', 'ok');
}
window.runHabilitationRecovery=runHabilitationRecovery;
function canRemoveOrDowngradeHabilitation(index,nextRight=null){
  const list=loadHabilitations();
  const row=list[index];
  if(!row) return {ok:true};
  const currentRight=normalizeAccessRight(row.droitAcces||row.role);
  const after=list.map((h,i)=> i===index ? {...h,droitAcces:nextRight||'CONSULTATION DL',role:nextRight||'CONSULTATION DL'} : h);
  const managersAfter= nextRight===null ? list.filter((_,i)=>i!==index).filter(h=>accessRank(h.droitAcces||h.role)>=accessRank('GESTION DL')) : after.filter(h=>accessRank(h.droitAcces||h.role)>=accessRank('GESTION DL'));
  if(accessRank(currentRight)>=accessRank('GESTION DL') && !managersAfter.length){
    return {ok:false,message:'Impossible de supprimer ou réduire le dernier accès de gestion. Ajouter d’abord un autre responsable avec des droits GESTION DL ou ADMIN STRUCTURE APPLICATION.'};
  }
  return {ok:true};
}
function userValidationKeys(user=APP.state.user){
  const u=normalizeProfile(user||{});
  return [u.displayName, profileDisplayName(u), [u.prenom,u.nom].filter(Boolean).join(' '), [u.grade,u.prenom,u.nom].filter(Boolean).join(' '), u.email, u.nip]
    .map(v=>norm(v)).filter(Boolean);
}
function personMatchesCurrentUser(value){
  const n=norm(value);
  if(!n) return false;
  return userValidationKeys().some(k=>k && (n===k || n.includes(k) || k.includes(n)));
}
function currentUserIsResponsible(dl=APP.state.current){
  return personMatchesCurrentUser(dl?.responsables?.responsable || '');
}
function currentUserHabilitation(){
  const keys=userValidationKeys();
  const list=loadHabilitations();
  return list.find(h=>{ const hn=norm(h.nom); if(!hn) return false; return keys.includes(hn) || keys.some(k=>hn.includes(k) || k.includes(hn)); });
}
function currentUserIsChefFormation(){
  const user=APP.state.user || {};
  const role=String(user.role || '').trim();
  const permissions=Array.isArray(user.permissions) ? user.permissions : [];
  if(window.DLCreatorCore?.authClient?.hasPermission?.('dl:validate')) return true;
  if(['admin','validator'].includes(role)) return true;
  if(permissions.includes('dl:validate')) return true;
  if(String(user.function || user.fonction || '').trim() === 'Chef formation') return true;
  const h=currentUserHabilitation();
  return !!h && (norm(h.fonction).includes(norm('Chef formation')) || accessRank(h.droitAcces||h.role)>=accessRank('GESTION DL'));
}
function canValidateDL(){
  const h=currentUserHabilitation();
  return !!h && accessRank(h.droitAcces||h.role)>=accessRank('GESTION DL');
}
function validationRightMessage(){
  const h=currentUserHabilitation();
  if(canValidateDL()) return `Validation autorisée : droits ${esc(h.droitAcces||h.role)}.`;
  if(h) return 'Validation réservée aux responsables habilités : vos droits ne permettent pas de valider une DL.';
  return 'Validation réservée aux responsables habilités.';
}
function validationStatusSelect(){
  const v=getByPath(APP.state.current,'validation.statut')??'';
  const allowed=canValidateDL();
  return `<div class="span-3"><label>Statut validation</label><select data-path="validation.statut" data-validation-status="1" ${allowed?'':'aria-disabled="true"'}>${APP.STATUSES.map(o=>`<option ${o==='Validé'&&!allowed?'disabled':''} ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select><div class="ac-help">${allowed?'Statut “Validé” autorisé pour ce profil.':'Option “Validé” verrouillée pour ce profil.'}</div></div>`;
}
function ensureValidationDefaults(){
  const allowed=canValidateDL();
  if(!APP.state.current.validation) APP.state.current.validation={statut:'',validateur:'',dateValidation:'',commentaire:''};
  if(allowed && !APP.state.current.validation.validateur){ APP.state.current.validation.validateur=currentUserDisplayName(); setDirty(); }
  if(!allowed && APP.state.current.validation.statut==='Validé'){ APP.state.current.validation.statut='En validation'; APP.state.current.statut='En validation'; setDirty(); }
}
function renderValidation(){
  ensureValidationDefaults();
  const allowed=canValidateDL();
  const validateur=allowed ? (APP.state.current.validation.validateur || currentUserDisplayName()) : '';
  if(allowed) APP.state.current.validation.validateur=validateur;
  const validateurField=`<div class="span-3"><label>Validateur</label><input value="${esc(validateur)}" readonly aria-readonly="true" class="${allowed?'':'disabled-field'}"><div class="ac-help">${allowed?'Renseigné automatiquement avec l’utilisateur courant.':'Validation réservée aux responsables habilités.'}</div></div>`;
  $('#panel').innerHTML=`<div class="card"><h3>Validation avant diffusion</h3><div class="form-grid">${validationStatusSelect()}${validateurField}${input('validation.dateValidation','Date validation','date',3,'data-native-calendar="1"')}${textarea('validation.commentaire','Commentaire',12)}<div class="span-12"><div class="alert ${allowed?'info':'warn'}">${validationRightMessage()}</div><button class="btn red" ${allowed?'':'disabled'} onclick="validateDL()">Valider la DL</button><button class="btn" onclick="requestValidationDL()">Transmettre en validation</button><button class="btn" onclick="refuseValidationDL()">Refuser / à corriger</button><button class="btn" onclick="archiveValidationDL()">Archiver</button></div></div></div><div class="card"><h3>Synthèse qualité</h3>${renderChecks()}</div>`;
  bindInputs();
}
window.requestValidationDL=()=>{
  applyValidationStatus('En validation','validation responsable domaine',{comment:'Transmission en validation'});
};
window.validateDL=()=>{
  if(!canValidateDL()){
    actionStatus('Validation réservée aux responsables habilités.','warn');
    renderPanel();
    return;
  }
  applyValidationStatus('Validé','validé',{comment:'Validation DL'});
};
window.refuseValidationDL=()=>{
  applyValidationStatus('Refusé / à corriger','corrections demandées',{comment:'Refus / retour corrections'});
};
window.archiveValidationDL=()=>{
  applyValidationStatus('Archivé','archivé',{comment:'Archivage depuis validation'});
};
window.setStatus=s=>{
  setValidationStatus(s);
};


function renderHabilitations(){
  if(!canManageHabilitations()) return accessDeniedPanel();
  APP.state.habilitations=loadHabilitations();
  const rows=APP.state.habilitations.map((h,i)=>{
    h=normalizeHabilitationRow(h);
    const droit=normalizeAccessRight(h.droitAcces||h.role||defaultAccessRightForFunction(h.fonction));
    const suggested=defaultAccessRightForFunction(h.fonction);
    const manual=suggested!==droit;
    const mail=String(h.email || '').trim();
    const nip=String(h.nip || h.login || '').trim();
    return `<tr class="habilitation-row rank-${accessRank(droit)}">
      <td><div class="hab-person ac-field" data-hab-ac-index="${i}"><div class="ac-box"><label class="small-note">Personne</label><input class="ac-input hab-person-input" data-hab-field="nom" data-hab-index="${i}" value="${esc(h.nom||h.fullName||'')}" placeholder="Rechercher dans PersonnelSDIS.csv" autocomplete="off"><div class="lookup-suggestions" role="listbox"></div></div></div>
      <div class="habilitation-identity-grid"><label class="small-note">NIP<input data-hab-field="nip" data-hab-index="${i}" value="${esc(nip)}" placeholder="Identifiant NIP"></label><label class="small-note">Grade<input data-hab-field="grade" data-hab-index="${i}" value="${esc(h.grade||'')}"></label><label class="small-note">Prénom<input data-hab-field="prenom" data-hab-index="${i}" value="${esc(h.prenom||'')}"></label><label class="small-note">Nom<input data-hab-field="nomFamille" data-hab-index="${i}" value="${esc(h.nomFamille||'')}"></label></div><label class="small-note">e-mail</label><input type="email" data-hab-field="email" data-hab-index="${i}" value="${esc(mail)}" placeholder="prenom.nom@sdis.ch"><div class="small-note">Identifiant de connexion : <strong>NIP</strong></div></td>
      <td><select data-hab-field="fonction" data-hab-index="${i}">${APP.HABILITATION_FUNCTIONS.map(r=>`<option ${r===normalizeHabilitationFunction(h.fonction)?'selected':''}>${esc(r)}</option>`).join('')}</select><div class="rights-summary small-note">Droit proposé : <strong>${esc(suggested)}</strong></div></td>
      <td><select data-hab-field="droitAcces" data-hab-index="${i}">${APP.ACCESS_RIGHTS.map(r=>`<option ${r===droit?'selected':''}>${esc(r)}</option>`).join('')}</select>${manual?'<div class="alert warn rights-manual">Droit ajusté manuellement : contrôler la cohérence métier.</div>':''}<details class="rights-summary" open><summary><strong>${esc(accessRightLabel(droit))}</strong></summary><div><strong>Droits accordés :</strong> ${esc(accessRightsSummary(droit).join(' · '))}</div><p>${esc(accessRightExplanation(droit))}</p></details></td>
      <td class="access-actions"><button class="btn small" type="button" onclick="sendAccessEmail(${i})" ${(isValidEmail(mail)&&nip)?'':'disabled'}>Envoyer les accès par e-mail</button><div class="small-note access-last-send">${h.lastAccessEmailAt ? 'Dernier envoi : '+esc(formatDateTimeCH(h.lastAccessEmailAt)) : 'Aucun envoi effectué.'}</div><button class="btn small icon-only" title="Supprimer" aria-label="Supprimer" onclick="deleteHabilitation(${i})">${sfTrashIcon()}</button></td></tr>`;
  }).join('');
  $('#panel').innerHTML=`<div class="card habilitations-card"><h3>Gestion des accès</h3><div class="alert info">Gestion locale institutionnelle des droits. La personne est recherchée dans PersonnelSDIS.csv avec le même moteur que le champ Responsable des Généralités. Le NIP devient l’identifiant de connexion et alimente le Profil utilisateur.</div><div class="function-rights-matrix">${functionRightsMatrixHtml()}</div><div class="toolbar"><button class="btn red" onclick="addHabilitation()">Ajouter une personne</button><button class="btn" onclick="saveHabilitationsExplicit()">Enregistrer</button><span class="muted">${APP.state.habilitations.length} personne(s) enregistrée(s)</span></div><table class="data habilitations-table"><thead><tr><th>Personne</th><th>Fonction</th><th>Droits d’accès et explication</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="muted">Aucune personne habilitée. Ajouter au minimum le Chef formation ou les responsables autorisés.</td></tr>'}</tbody></table><div class="rights-help"><strong>Hiérarchie :</strong> ADMIN STRUCTURE APPLICATION &gt; GESTION DL &gt; RÉDACTION DL &gt; CONSULTATION DL.<br><strong>Chef formation :</strong> droits structure application équivalents à Admin, en tant que responsable fonctionnel de l’application.</div><div class="rights-details-grid">${rightsHierarchyHtml()}</div></div>`;
  $$('[data-hab-field]').forEach(el=>{
    el.dataset.previousValue=el.value;
    const applyTextValue=async()=>{
      const i=Number(el.dataset.habIndex), field=el.dataset.habField;
      if(field==='droitAcces') return;
      const list=loadHabilitations();
      if(!list[i]) return;
      const previousFunction=normalizeHabilitationFunction(list[i].fonction);
      const previousRight=normalizeAccessRight(list[i].droitAcces||list[i].role);
      const value=el.value;
      if(field==='fonction'){
        const nextFunction=normalizeHabilitationFunction(value);
        const nextRight=defaultAccessRightForFunction(nextFunction);
        const guard=canRemoveOrDowngradeHabilitation(i,nextRight);
        if(!guard.ok){ el.value=previousFunction; actionStatus(guard.message,'warn'); return; }
        const sensitive=accessRank(nextRight)>=accessRank('GESTION DL') || accessRank(previousRight)>=accessRank('GESTION DL') || nextFunction==='ADMIN STRUCTURE APPLICATION' || previousFunction==='ADMIN STRUCTURE APPLICATION';
        if(sensitive){
          const adminText=nextRight==='ADMIN STRUCTURE APPLICATION' ? '\n\nAttention : ce droit permet de modifier la structure de l’application. Confirmer l’attribution ?' : '';
          const ok=await institutionalConfirm({title:'Modification de fonction sensible',message:`Confirmer la modification de la fonction pour cette personne ?\n\nNouvelle fonction : ${nextFunction}\nDroit automatiquement proposé : ${nextRight}${adminText}`,confirmText:'Confirmer',cancelText:'Annuler',warn:nextRight==='ADMIN STRUCTURE APPLICATION'});
          if(!ok){ el.value=previousFunction; return; }
        }
        list[i].fonction=nextFunction; list[i].droitAcces=nextRight; list[i].role=nextRight;
        saveHabilitations(list); renderHabilitations(); return;
      }
      list[i][field]=value;
      if(field==='nip'){ list[i].login=value; }
      if(['grade','prenom','nomFamille','nom'].includes(field)) list[i].fullName=[list[i].grade,list[i].prenom,list[i].nomFamille].filter(Boolean).join(' ') || list[i].nom;
      if(field==='email' && value && !isValidEmail(value)) actionStatus('Adresse e-mail invalide : vérifier le format avant l’envoi des accès.','warn');
      saveHabilitations(list); el.dataset.previousValue=el.value;
    };
    if(['nom','email','nip','grade','prenom','nomFamille'].includes(el.dataset.habField)) el.addEventListener('input',applyTextValue);
    else if(el.dataset.habField==='fonction') el.addEventListener('change',applyTextValue);
    else if(el.dataset.habField==='droitAcces') el.addEventListener('change',async ()=>{
      const i=Number(el.dataset.habIndex); const list=loadHabilitations(); if(!list[i]) return;
      const previous=el.dataset.previousValue || normalizeAccessRight(list[i].droitAcces||list[i].role);
      const next=normalizeAccessRight(el.value); const guard=canRemoveOrDowngradeHabilitation(i,next);
      if(!guard.ok){ el.value=previous; actionStatus(guard.message,'warn'); return; }
      const self=personMatchesCurrentUser(list[i].nom||'');
      let msg=`Confirmer la modification des droits d’accès pour cette personne ?\n\nAncien droit : ${previous}\nNouveau droit : ${next}\n\n${accessRightExplanation(next)}`;
      if(next==='ADMIN STRUCTURE APPLICATION') msg+='\n\nAttention : ce droit permet de modifier la structure de l’application. Confirmer l’attribution ?';
      if(previous==='ADMIN STRUCTURE APPLICATION' && next!=='ADMIN STRUCTURE APPLICATION') msg+='\n\nAttention : vous retirez un droit administrateur structurel.';
      if(self) msg+='\n\nAttention : vous modifiez actuellement vos propres droits d’accès.';
      const ok=await institutionalConfirm({title:self?'Modification de vos propres droits':'Modification des droits d’accès',message:msg,confirmText:'Confirmer',cancelText:'Annuler',warn:self || next==='ADMIN STRUCTURE APPLICATION' || previous==='ADMIN STRUCTURE APPLICATION'});
      if(!ok){ el.value=previous; return; }
      list[i].droitAcces=next; list[i].role=next; saveHabilitations(list); renderHabilitations();
    });
  });
  bindHabilitationAutocomplete();
}
function bindHabilitationAutocomplete(){
  $$('[data-hab-ac-index]').forEach(box=>{
    const input=box.querySelector('.ac-input'); const panel=box.querySelector('.lookup-suggestions'); const idx=Number(box.dataset.habAcIndex);
    let items=[], active=-1, timer=null, mouseDownInPanel=false;
    if(!input || !panel) return;
    const close=()=>{ if(mouseDownInPanel) return; panel.innerHTML=''; panel.classList.remove('open','show'); active=-1; };
    const open=()=>{ const visible=!!panel.children.length; panel.classList.toggle('open',visible); panel.classList.toggle('show',visible); };
    const persist=(value,item=null)=>{
      const list=loadHabilitations(); if(!list[idx]) return;
      list[idx].nom=value;
      if(item?.row) list[idx]=hydrateHabilitationFromPersonnel(item.row, list[idx]);
      saveHabilitations(list);
      if(item?.row){
        const row=list[idx];
        ['nip','grade','prenom','nomFamille','email'].forEach(field=>{
          const el=document.querySelector(`[data-hab-field="${field}"][data-hab-index="${idx}"]`);
          if(el) el.value=row[field]||'';
        });
      }
    };
    const renderNow=async()=>{
      const q=String(input.value||'').trim(); panel.innerHTML='';
      if(q.length<1){ close(); return; }
      if(!CSVStore.has('PersonnelSDIS.csv')) await CSVStore.load('PersonnelSDIS.csv');
      const personnelRows=AutocompleteService.rows('personnel')||[];
      if(!personnelRows.length){ panel.innerHTML='<div class="addr-suggestion muted">PersonnelSDIS.csv non chargé — saisie manuelle conservée</div>'; open(); return; }
      items=AutocompleteService.search('personnel',q,{limit:16}); active=items.length?0:-1;
      panel.innerHTML=items.map((item,n)=>`<button type="button" class="addr-suggestion person-ac-option ${n===active?'active':''}" data-person-index="${n}"><span>${esc(item.label)}</span>${item.detail?`<small>${esc(item.detail)}</small>`:''}</button>`).join('');
      open();
    };
    const render=()=>{ clearTimeout(timer); timer=setTimeout(renderNow,60); };
    input.addEventListener('input',()=>{ persist(input.value); render(); });
    input.addEventListener('focus',render);
    input.addEventListener('blur',()=>setTimeout(close,260));
    input.addEventListener('keydown',e=>{
      const buttons=$$('.addr-suggestion',panel);
      if(e.key==='ArrowDown' && buttons.length){ e.preventDefault(); active=Math.min(buttons.length-1,active+1); buttons.forEach((b,i)=>b.classList.toggle('active',i===active)); }
      else if(e.key==='ArrowUp' && buttons.length){ e.preventDefault(); active=Math.max(0,active-1); buttons.forEach((b,i)=>b.classList.toggle('active',i===active)); }
      else if(e.key==='Enter' && items[active]){ e.preventDefault(); input.value=items[active].label; persist(input.value,items[active]); close(); renderHabilitations(); }
      else if(e.key==='Escape') close();
    });
    panel.addEventListener('pointerdown',()=>{ mouseDownInPanel=true; }); panel.addEventListener('mousedown',e=>e.preventDefault()); panel.addEventListener('pointerup',()=>setTimeout(()=>{ mouseDownInPanel=false; },0));
    panel.addEventListener('click',e=>{ const b=e.target.closest('[data-person-index]'); if(!b) return; const item=items[Number(b.dataset.personIndex)]; if(!item) return; input.value=item.label; persist(input.value,item); close(); renderHabilitations(); });
  });
}
window.saveHabilitationsExplicit=function(){
  try{
    const list=loadHabilitations().map(normalizeHabilitationRow);
    const managers=habilitationManagers(list);
    if(!managers.length){
      const recovery=currentUserRecoveryRow('ADMIN STRUCTURE APPLICATION');
      list.unshift(recovery);
      try{ window.DLCreatorCore?.auditService?.write?.('habilitation-admin-recovery-auto',{reason:'aucun gestionnaire restant',version:'v9.13',destructive:false},'WARN'); }catch{}
    }
    saveHabilitations(list);
    APP.state.habilitations=loadHabilitations();
    try{ window.DLCreatorCore?.auditService?.write?.('habilitations-save-explicit',{count:APP.state.habilitations.length,version:'v9.13',destructive:false},'AUDIT'); }catch{}
    actionStatus('Habilitations enregistrées. Droits conservés localement.', 'ok');
    renderHabilitations();
    return true;
  }catch(e){
    console.error('[DL creator][v9.13] Enregistrement habilitations impossible', e);
    try{ window.DLCreatorCore?.auditService?.write?.('habilitations-save-error',{message:e?.message||String(e),version:'v9.13',destructive:false},'ERROR'); }catch{}
    actionStatus('Erreur lors de l’enregistrement des habilitations. Gestion des accès reste accessible.', 'error');
    return false;
  }
};

window.addHabilitation=()=>{
  const list=loadHabilitations();
  list.push({id:uid(),nom:'',email:'',nip:'',login:'',grade:'',prenom:'',nomFamille:'',fonction:'Consultant',droitAcces:'CONSULTATION DL',role:'CONSULTATION DL',forcePasswordChangeAtFirstLogin:true,status:'actif',active:true});
  saveHabilitations(list);
  renderPanel();
};
window.deleteHabilitation=i=>{
  const list=loadHabilitations();
  if(!list[i]) return;
  const guard=canRemoveOrDowngradeHabilitation(i,null);
  if(!guard.ok){ actionStatus(guard.message,'warn'); return; }
  if(!confirm('Confirmer la suppression de cette habilitation ?\n\nCette action retire les droits d’accès associés à cette personne.')) return;
  list.splice(i,1);
  saveHabilitations(list);
  renderPanel();
};

function renderMotsCles(){
  if(!canManageKeywords()) return accessDeniedPanel();
  APP.state.motsCles=loadKeywordLibrary();
  const search=String(window.keywordLibrarySearch||'');
  const selected=new Set(window.selectedKeywords||[]);
  const canSearch=norm(search).length>=3;
  const filtered=canSearch?APP.state.motsCles.filter(k=>norm(k).includes(norm(search))):APP.state.motsCles;
  const grouped={};
  filtered.forEach(k=>{ const letter=(k[0]||'#').toLocaleUpperCase('fr-CH'); (grouped[letter]||(grouped[letter]=[])).push(k); });
  const info=search.trim() && !canSearch ? '<div class="alert info">Saisir au moins 3 caractères pour rechercher.</div>' : '';
  $('#panel').innerHTML=`<div class="card keyword-library"><h3>Bibliothèque mots clés</h3><div class="toolbar keyword-tools"><input id="keywordSearchInput" class="keyword-add-input" placeholder="Rechercher un mot clé…" autocomplete="off" value="${esc(search)}"><input id="keywordAddInput" class="keyword-add-input" placeholder="Ajouter un mot clé…" autocomplete="off"><button class="btn red" onclick="addKeywordManual()">Ajouter</button><button class="btn" onclick="editSelectedKeyword()" ${selected.size!==1?'disabled':''}>Corriger</button><button class="btn" onclick="deleteSelectedKeywords()" ${selected.size<1?'disabled':''}>Supprimer sélection</button><span class="muted">${filtered.length}/${APP.state.motsCles.length} mot(s) clé(s)</span></div>${info}<div class="keyword-index square-keyword-box">${Object.keys(grouped).sort((a,b)=>a.localeCompare(b,'fr')).map(letter=>`<section class="keyword-letter"><h4>${esc(letter)}</h4><div class="keyword-chip-list">${grouped[letter].sort((a,b)=>a.localeCompare(b,'fr',{sensitivity:'base'})).map(k=>`<label class="keyword-chip selectable ${selected.has(k)?'selected':''}"><input type="checkbox" data-keyword-select="${esc(k)}" ${selected.has(k)?'checked':''}><span>${esc(keywordDisplay(k))}</span><button type="button" title="Supprimer" aria-label="Supprimer ${esc(keywordDisplay(k))}" onclick="deleteKeyword('${jsString(k)}')">×</button></label>`).join('')}</div></section>`).join('')||'<div class="muted">Aucun mot clé enregistré.</div>'}</div></div>`;
  $('#keywordAddInput')?.addEventListener('keydown',e=>{ if(['Enter','Tab',';'].includes(e.key)){ e.preventDefault(); window.addKeywordManual(); }});
  const searchInput=$('#keywordSearchInput');
  if(searchInput){
    searchInput.addEventListener('input',e=>{
      window.keywordLibrarySearch=e.target.value;
      const pos=e.target.selectionStart;
      renderMotsCles();
      requestAnimationFrame(()=>{ const next=$('#keywordSearchInput'); if(next){ next.focus(); try{ next.setSelectionRange(pos,pos); }catch{} } });
    });
  }
  $$('[data-keyword-select]').forEach(cb=>cb.addEventListener('change',()=>{ const set=new Set(window.selectedKeywords||[]); cb.checked?set.add(cb.dataset.keywordSelect):set.delete(cb.dataset.keywordSelect); window.selectedKeywords=[...set]; renderMotsCles(); }));
}
window.addKeywordManual=()=>{
  const input=$('#keywordAddInput');
  const words=normalizeKeywordList(input?.value||'');
  if(!words.length){ actionStatus('Mot clé refusé : minimum 3 caractères.','warn'); return; }
  const existing=words.filter(w=>keywordExistsInLibrary(w));
  const toAdd=words.filter(w=>!keywordExistsInLibrary(w));
  if(existing.length){ alert(existing.length>1 ? `Ces mots clés sont déjà recensés : ${existing.map(keywordDisplay).join(', ')}` : `Le mot clé « ${keywordDisplay(existing[0])} » est déjà recensé.`); }
  if(toAdd.length){ addKeywordsToLibrary(toAdd); actionStatus(toAdd.length>1 ? `${toAdd.length} mots clés ajoutés séparément.` : 'Mot clé ajouté.'); }
  else actionStatus('Aucun nouveau mot clé ajouté.','warn');
  if(input) input.value='';
  window.selectedKeywords=[];
  renderPanel();
};
window.deleteKeyword=async (keyword)=>{
  const clean=normalizeKeyword(keyword);
  if(!confirm(`Supprimer le mot clé ${keywordDisplay(clean)} de la bibliothèque et de toutes les DL où il est renseigné ?`)) return;
  await propagateKeywordChange(clean, '');
  actionStatus('Mot clé supprimé de la bibliothèque et des DL concernées.');
  renderPanel();
};
window.deleteSelectedKeywords=async ()=>{
  const selected=window.selectedKeywords||[];
  if(!selected.length) return;
  if(!confirm(`Confirmer la suppression de ${selected.length} mot(s) clé(s) sélectionné(s) de la bibliothèque et de toutes les DL concernées ?`)) return;
  for(const k of selected){ await propagateKeywordChange(k, ''); }
  window.selectedKeywords=[];
  actionStatus('Mots clés supprimés de la bibliothèque et des DL concernées.');
  renderPanel();
};
window.editSelectedKeyword=async ()=>{
  const selected=window.selectedKeywords||[];
  if(selected.length!==1) return;
  const oldKeyword=selected[0];
  const next=normalizeKeyword(prompt('Corriger le mot clé sélectionné :', oldKeyword)||'');
  if(next.length<3){ actionStatus('Mot clé refusé : minimum 3 caractères.','warn'); return; }
  if(norm(next)===norm(oldKeyword)){ actionStatus('Aucune modification du mot clé.','warn'); return; }
  if(keywordExistsInLibrary(next)){
    if(!confirm(`Le mot clé « ${keywordDisplay(next)} » existe déjà. Remplacer « ${keywordDisplay(oldKeyword)} » par ce mot clé existant dans toutes les DL concernées ?`)) return;
  }
  await propagateKeywordChange(oldKeyword, next);
  window.selectedKeywords=[];
  actionStatus('Mot clé corrigé dans la bibliothèque et dans les DL concernées.');
  renderPanel();
};

function buildAccessEmail(h){
  const fullName=[h.grade,h.nom,h.prenom].filter(Boolean).join(' ').trim() || 'Utilisateur';
  const droit=normalizeAccessRight(h.droitAcces||h.role||defaultAccessRightForFunction(h.fonction));
  const rights=accessRightsSummary(droit).map(x=>`- ${x}`).join('\n') || '- Aucun droit détaillé';
  const admin=droit==='ADMIN STRUCTURE APPLICATION'?'\n\nAttention : ce compte dispose d’un niveau administrateur structure application.': '';
  const activationLink=activationLinkForHabilitation(h);
  const expiresAt=h.activationExpiresAt || new Date(Date.now()+1000*60*60*24*7).toISOString();
  const subject="SDIS régional du Nord vaudois : tes données d'accès à l'application DL creator web";
  const body=`Bonjour ${fullName},

Un accès à l'application DL creator web a été préparé pour toi.

Lien d'activation sécurisé :
${activationLink}

Identifiant de connexion (NIP) :
${h.nip||h.login||''}

Expiration du lien :
${formatDateTimeCH(expiresAt)}

Pour des raisons de sécurité, aucun mot de passe provisoire n'est transmis par e-mail. Le lien d'activation est à usage unique et te demandera de créer ton mot de passe personnel, puis de confirmer ton adresse e-mail avant activation effective du compte.

Fonction :
${h.fonction||'—'}

Droits attribués :
${rights}${admin}

Dans ton Profil utilisateur, tu pourras modifier uniquement ton adresse e-mail et ton mot de passe. Le NIP, le grade, le nom, le prénom, le rôle et le domaine sont gérés dans Gestion des accès.

Avec mes salutations.`;
  const titleLine=(label,value)=>`<p><strong>${esc(label)}</strong><br>${value}</p>`;
  const rightsHtml=accessRightsSummary(droit).map(x=>`<li>${esc(x)}</li>`).join('') || '<li>Aucun droit détaillé</li>';
  const html=`<div class="access-email-preview"><p>Bonjour ${esc(fullName)},</p><p>Un accès à l'application DL creator web a été préparé pour toi.</p>${titleLine("Lien d'activation sécurisé",`<span class="copyable-url">${esc(activationLink)}</span>`)}${titleLine('Identifiant de connexion (NIP)',esc(h.nip||h.login||''))}${titleLine('Expiration du lien',esc(formatDateTimeCH(expiresAt)))}<p>Pour des raisons de sécurité, aucun mot de passe provisoire n'est transmis par e-mail. Le lien d'activation est à usage unique et te demandera de créer ton mot de passe personnel, puis de confirmer ton adresse e-mail avant activation effective du compte.</p>${titleLine('Fonction',esc(h.fonction||'—'))}<p><strong>Droits attribués</strong></p><ul>${rightsHtml}</ul>${droit==='ADMIN STRUCTURE APPLICATION'?'<p><strong>Attention</strong><br>Ce compte dispose d’un niveau administrateur structure application.</p>':''}<p>Dans ton Profil utilisateur, tu pourras modifier uniquement ton adresse e-mail et ton mot de passe. Le NIP, le grade, le nom, le prénom, le rôle et le domaine sont gérés dans Gestion des accès.</p><p>Avec mes salutations.</p></div>`;
  return {subject, body, html};
}
function showAccessEmailPreviewModal(email,mailtoHref){
  const old=document.getElementById('accessEmailPreviewOverlay');
  if(old) old.remove();
  const overlay=document.createElement('div');
  overlay.id='accessEmailPreviewOverlay';
  overlay.className='modal-overlay';
  overlay.innerHTML=`<div class="modal-card access-email-preview-card" role="dialog" aria-modal="true"><h3>Prévisualisation de l’e-mail d’accès</h3><p class="muted">Aucun e-mail serveur n’est envoyé. Le bouton ouvre le client e-mail local avec le contenu texte prêt à copier/coller.</p><div class="access-email-subject"><strong>Objet :</strong> ${esc(email.subject)}</div><div class="access-email-preview-body">${email.html}</div><div class="modal-actions row-actions"><button class="btn" type="button" data-copy>Copier le texte</button><a class="btn red" href="${esc(mailtoHref)}" data-mailto>Ouvrir l’e-mail préparé</a><button class="btn" type="button" data-close>Fermer</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('[data-close]').onclick=()=>overlay.remove();
  overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
  const copy=overlay.querySelector('[data-copy]');
  copy.onclick=async()=>{
    try{ await navigator.clipboard.writeText(email.body); actionStatus('Contenu de l’e-mail copié.'); }
    catch{ actionStatus('Copie automatique impossible : sélectionner le texte de la prévisualisation.','warn'); }
  };
}
window.sendAccessEmail=async i=>{
  const list=loadHabilitations();
  const h=list[i];
  if(!h){ actionStatus('Personne introuvable dans la gestion des accès.','warn'); return; }
  const mail=String(h.email || '').trim();
  const nip=String(h.nip || h.login || '').trim();
  if(!isValidEmail(mail)){ actionStatus('Envoi impossible : aucune adresse e-mail valide n’est renseignée pour cette personne.','warn'); return; }
  if(!nip){ actionStatus('Envoi impossible : le NIP doit être renseigné comme identifiant de connexion.','warn'); return; }
  const droit=normalizeAccessRight(h.droitAcces||h.role||defaultAccessRightForFunction(h.fonction));
  if(!droit){ actionStatus('Envoi impossible : aucun droit n’est attribué.','warn'); return; }
  if(accessRightsSummary(droit).length===0){ actionStatus('Envoi impossible : aucun droit détaillé n’est attribué.','warn'); return; }
  if(droit==='ADMIN STRUCTURE APPLICATION'){
    const ok=await institutionalConfirm({title:'Envoi d’un accès administrateur',message:'Cette personne dispose du droit sensible ADMIN STRUCTURE APPLICATION. Confirmer la préparation de l’e-mail d’accès ?',confirmText:'Confirmer',cancelText:'Annuler',warn:true});
    if(!ok) return;
  }
  h.activationToken=activationTokenForHabilitation(h);
  h.activationCreatedAt=nowIso();
  h.activationExpiresAt=new Date(Date.now()+1000*60*60*24*7).toISOString();
  h.activationUsed=false;
  h.emailVerificationRequired=true;
  h.lastAccessEmailAt=nowIso();
  h.lastAccessEmailStatus='préparé-mailto';
  list[i]=h;
  saveHabilitations(list);
  const email=buildAccessEmail(h);
  const href=`mailto:${encodeURIComponent(mail)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
  auditLocal('access-email-prepared',{nip:h.nip||'', email:'renseigné', activationPrepared:true, passwordInClear:false, previewHtml:true, destructive:false},'AUDIT');
  actionStatus('E-mail d’activation préparé. Aucun mot de passe en clair n’est transmis.');
  renderHabilitations();
  showAccessEmailPreviewModal(email,href);
};

function personalDLList(){
  return (APP.state.library||[]).map(d=>ensureDLModel(d)).filter(isCurrentUserRedacteur).sort((a,b)=>String(b.dateModification||'').localeCompare(String(a.dateModification||'')));
}
function renderMesDescentes(){
  const list=personalDLList();
  const canEdit=hasAccessAtLeast('RÉDACTION DL');
  const canExport=hasAccessAtLeast('CONSULTATION DL');
  const canDel=canDeleteDL();
  const rows=list.map(d=>{
    const id=d.identification||{}; const safeId=jsString(d.id); const status=effectiveDLStatus(d);
    return `<tr><td><strong>${esc(dlTitle(d))}</strong><br><span class="muted">${esc(id.theme||'Sans thème')}</span></td><td>${esc(normalizeLegacyDomain(id.domaine)||'—')}</td><td>${esc(id.theme||'—')}</td><td>${esc(formatDateCH(id.date)||formatDateTimeCH(d.dateCreation)||'—')}</td><td><span class="badge ${statusBadgeClass(status)}">${esc(status)}</span></td><td>${esc(personLabelPdf(d.responsables?.responsable||'' )||'—')}</td><td class="row-actions"><button class="btn small red" onclick="consultPersonalDL('${safeId}')">Consulter</button><button class="btn small" ${canEdit?'':'disabled'} onclick="editPersonalDL('${safeId}')">Modifier</button><button class="btn small" ${canExport?'':'disabled'} onclick="exportLibPdf('${safeId}')">Exporter PDF</button><button class="btn small" ${canExport?'':'disabled'} onclick="exportLibJson('${safeId}')">Exporter JSON</button><button class="btn small icon-only" ${canDel?'':'disabled'} title="Supprimer" aria-label="Supprimer" onclick="deleteDL('${safeId}')">${sfTrashIcon()}</button></td></tr>`;
  }).join('');
  $('#panel').innerHTML=`<div class="card"><h3>Mes descentes de leçon</h3><div class="alert info">Consulter ouvre une DL en lecture seule. Modifier ouvre la DL en édition avec confirmation d’enregistrement. L’export PDF reprend le moteur PDF validé de la Bibliothèque DL.</div><table class="data personal-dl-table"><thead><tr><th>Titre DL</th><th>Domaine</th><th>Thème</th><th>Date</th><th>Statut</th><th>Responsable</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="muted">Aucune DL trouvée pour votre profil dans le champ Rédacteurs.</td></tr>'}</tbody></table></div>`;
}
window.consultPersonalDL=id=>{
  const src=libraryDLById(id); if(!src || !canConsultDL(src)){ actionStatus('Consultation impossible pour cette DL.','warn'); return; }
  APP.state.current=ensureDLModel(structuredClone(src)); APP.state.activeModule='dl'; APP.state.activeTab='generalites'; APP.state.readOnlyMode=true; APP.state.editModeFromMesDL=false; setDirty(false); render();
};
window.editPersonalDL=id=>{
  const src=libraryDLById(id); if(!src || !canEditDL(src)){ actionStatus('Modification impossible pour cette DL.','warn'); return; }
  APP.state.current=ensureDLModel(structuredClone(src)); APP.state.activeModule='dl'; APP.state.activeTab='generalites'; APP.state.readOnlyMode=false; APP.state.editModeFromMesDL=true; setDirty(false); render();
};
function renderOutils(){
  if(!(canManageKeywords() || hasAccessAtLeast('ADMIN STRUCTURE APPLICATION'))) return accessDeniedPanel();
  $('#panel').innerHTML=`<div class="card"><h3>Outils</h3><div class="alert info">Menu production v9.13 : les outils métier restent isolés sous Outils, après Gestion des accès, sans modifier les handlers ni les données existantes.</div><div class="tools-grid"><button class="home-card" type="button" onclick="navigateModule('motscles')"><span class="home-card-icon">${moduleIcon('motscles')}</span><strong>Mots clés</strong><small>Bibliothèque centralisée, correction et propagation dans les DL.</small></button><button class="home-card" type="button" onclick="navigateModule('import')"><span class="home-card-icon">${moduleIcon('import')}</span><strong>Import Word</strong><small>Importer une descente de leçon depuis un fichier Word.</small></button></div></div>`;
}

function renderDiagnosticProduction(){
  const cfg=window.DLCreatorCore?.getConfig?.() || {};
  const vi=window.DLCreatorCore?.getVersionInfo?.() || {version:APP.VERSION};
  const audit=window.DLCreatorCore?.auditService;
  const auditCount=audit?.list?.().length || 0;
  const syncCount=window.DLCreatorCore?.syncService?.queue?.().length || 0;
  const migration=window.DLCreatorCore?.migrationService?.diagnostic?.(APP.state.library||[]);
  const storageDiag=window.DLCreatorCore?.storageAdapter?.diagnostic?.() || {localStorage:!!window.localStorage,indexedDB:!!window.indexedDB};
  const coherence=checkDL(APP.state.current||defaultDL(),{context:'diagnostic-production-v4'});
  const workflowDiag=window.DLCreatorCore?.workflowService?.diagnostic?.(APP.state.library||[]);
  const validationDiag=window.DLCreatorCore?.distributedValidationService?.diagnostic?.(APP.state.library||[]);
  const rbacDiag=window.DLCreatorCore?.rbacService?.diagnostic?.();
  const collaborationDiag=window.DLCreatorCore?.collaborationStorage?.diagnostic?.(APP.state.library||[]);
  const fnDiag=window.DLCreatorCore?.functionsRegistry?.diagnostic?.();
  const backupZipDiag=window.DLCreatorCore?.backupZipService?.diagnostic?.();
  const workflowSupDiag=window.DLCreatorCore?.workflowSupervisionService?.diagnostic?.(APP.state.library||[]);
  const rows=[
    ['Version application', vi.version || APP.VERSION],
    ['Build', vi.build || '—'],
    ['Date build', vi.buildDateUTC || vi.buildDate || '—'],
    ['Mode', `${cfg.productionMode || 'pilote'} · ${cfg.environment || 'local'}`],
    ['État bibliothèque', `${(APP.state.library||[]).length} DL locale(s) · IndexedDB ${storageDiag.indexedDB?'OK':'indisponible'} · localStorage ${storageDiag.localStorage?'OK':'indisponible'}`],
    ['État migrations', migration ? `${migration.ok?'migration réussie':'à contrôler'} · ${migration.currentVersion} · journal ${migration.journalEntries}` : 'Service migration non chargé'],
    ['État conflits', collaborationDiag ? `${collaborationDiag.potentialConflicts||0} conflit(s) potentiel(s) · ${collaborationDiag.locked||0} verrou(s) actif(s) · JSON sûr` : 'Préparé'],
    ['État workflow', workflowDiag ? `${workflowDiag.total} DL · états suivis · workflow hiérarchique préparé` : 'Préparé'],
    ['État RBAC', rbacDiag ? `${rbacDiag.label} · ${rbacDiag.permissions.length} permission(s) · refus audités` : 'Non chargé'],
    ['État validation', validationDiag ? `Validation distribuée locale préparée · ${validationDiag.refusals||0} refus` : 'Préparée'],
    ['État offline-first', vi.flags?.offlineFirst ? 'Conservé · backend désactivé par défaut' : 'À contrôler'],
    ['État stockage', `${cfg.storageMode || 'local'} · fallback localStorage ↔ IndexedDB actif`],
    ['État synchronisation', `${syncCount} élément(s) queue future · distant désactivé`],
    ['État fonctions Netlify', fnDiag ? `${fnDiag.total} fonction(s) préparée(s) · désactivées par défaut · diagnostic non destructif ${fnDiag.lastDiagnostic?.status||'non lancé'}` : 'Fonctions préparées'],
    ['État notifications', window.DLCreatorCore?.mailService?.diagnostic?.() ? 'Templates e-mail préparés · providers désactivés · aucun secret frontend' : 'Préparé'],
    ['État supervision pilote', workflowSupDiag ? `${workflowSupDiag.issues.length} incohérence(s) workflow détectée(s) · transitions contrôlées` : 'Préparée'],
    ['État backup ZIP', backupZipDiag ? 'Manifest, contrôle compatibilité et restore guidé préparés' : 'Préparé'],
    ['État compatibilité', vi.compatibility?.legacyDL ? `anciennes DL compatibles depuis ${vi.minimumCompatibleVersion || 'v8.10'}` : 'À contrôler'],
    ['État sauvegarde', 'Sauvegarde miroir IndexedDB + localStorage avec fallback non destructif'],
    ['État corruption JSON', coherence.errors.length ? `${coherence.errors.length} erreur(s) bloquante(s)` : 'aucune corruption bloquante détectée'],
    ['État audit', `${auditCount} entrée(s) · rotation locale active · purge sécurisée`],
    ['État verrous', collaborationDiag ? `${collaborationDiag.expiredLocks||0} verrou(s) expiré(s) · verrou optimiste actif` : 'Préparé'],
    ['Erreurs bloquantes', coherence.errors.length ? coherence.errors.join(' | ') : 'Aucune'],
    ['Warnings', coherence.warnings.length ? coherence.warnings.join(' | ') : 'Aucun warning non bloquant'],
    ['Informations', `PDF verrouillé · aperçu A4 inchangé · import/export inchangés · Safari conservé`],
    ['Éléments préparés mais désactivés', 'Backend, stockage distant, auth serveur, e-mails transactionnels, sync distante'],
    ['PDF', vi.flags?.pdfEngineLocked ? 'Verrouillé : aucune modification moteur PDF' : 'À contrôler'],
    ['Garde-fous boot', 'Contrôle DEFAULT_DL_VERSION avant initialisation + tryPersistDraft présent + références critiques vérifiées'],
    ['Indicateur pilote', (vi.flags?.offlineFirst && vi.flags?.pdfEngineLocked && audit && window.DLCreatorCore?.workflowService) ? 'Prêt pilote contrôlé v9.13' : 'Pilote limité']
  ];
  $('#panel').innerHTML=`<div class="card"><h3>Diagnostic production v4</h3><div class="alert info">État de stabilisation institutionnelle v9.13. Ce diagnostic sépare erreurs bloquantes, warnings, informations et éléments préparés mais désactivés, sans modifier les données ni le moteur PDF.</div><table class="data"><tbody>${rows.map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table></div><div class="card"><h3>Confidentialité / stockage local</h3><div class="alert warn">Mode pilote offline-first — les DL, comptes pilotes, profils, habilitations, workflows, mots clés, migrations et journaux locaux restent stockés dans le navigateur de ce poste. Le futur mode serveur devra être activé uniquement après validation institutionnelle.</div><ul class="muted"><li>Bibliothèque, validations hiérarchiques, ownership, conflits, migrations et refus de permissions sont audités localement.</li><li>La synchronisation distante reste volontairement désactivée afin de préserver le comportement offline-first.</li></ul><div class="row-actions"><button class="btn" onclick="exportProductionDiagnostic()" type="button">Exporter diagnostic</button><button class="btn" onclick="exportLocalAuditTrail()" type="button">Exporter audit local</button><button class="btn" onclick="runFunctionsDiagnosticFromUI()" type="button">Diagnostic Functions</button><button class="btn" onclick="window.DLCreatorCore?.auditService?.purge?.(); renderDiagnosticProduction();" type="button">Purger audit local</button></div></div>`;
}

window.runFunctionsDiagnosticFromUI=async()=>{
  try{
    actionStatus('Diagnostic Functions non destructif en cours…','info');
    const result=await window.DLCreatorCore?.functionsRegistry?.runDiagnostic?.();
    const status=result?.status||'prepared';
    actionStatus(`Diagnostic Functions : ${status}${result?.durationMs!==undefined?' · '+result.durationMs+' ms':''}. Aucun envoi, aucune écriture serveur.`, status==='failed'?'warn':'ok');
    renderDiagnosticProduction();
  }catch(e){
    console.warn('[DL Creator] Diagnostic Functions non bloquant',e);
    window.DLCreatorCore?.auditService?.write?.('netlify-functions-diagnostic-error',{error:e?.message||String(e),destructive:false},'WARN');
    actionStatus('Diagnostic Functions indisponible — fallback offline conservé.','warn');
  }
};

window.exportProductionDiagnostic=()=>{
  const payload={schema:'dl.creator.production-diagnostic.v4',version:window.DLCreatorCore?.getVersionInfo?.(),config:window.DLCreatorCore?.getConfig?.(),session:window.DLCreatorCore?.sessionService?.describe?.(),users:window.DLCreatorCore?.pilotUsersService?.diagnostic?.()||window.DLCreatorCore?.userService?.diagnostic?.(),pilotUsers:window.DLCreatorCore?.pilotUsersService?.list?.(),library:{count:(APP.state.library||[]).length,selectedId:APP.state.selectedLibraryId||'',currentId:APP.state.current?.id||''},migration:window.DLCreatorCore?.migrationService?.diagnostic?.(APP.state.library||[]),migrationJournal:window.DLCreatorCore?.migrationService?.journal?.(),workflow:window.DLCreatorCore?.workflowService?.diagnostic?.(APP.state.library||[]),validation:window.DLCreatorCore?.distributedValidationService?.diagnostic?.(APP.state.library||[]),collaboration:window.DLCreatorCore?.collaborationStorage?.diagnostic?.(APP.state.library||[]),workflowSupervision:window.DLCreatorCore?.workflowSupervisionService?.diagnostic?.(APP.state.library||[]),netlifyFunctions:window.DLCreatorCore?.functionsRegistry?.diagnostic?.(),backupZip:window.DLCreatorCore?.backupZipService?.diagnostic?.(),notifications:window.DLCreatorCore?.notificationService?.diagnostic?.(),rbac:window.DLCreatorCore?.rbacService?.diagnostic?.(),api:window.DLCreatorCore?.apiConfig?.validateCritical?.(),objectives:objectiveDiagnostics(APP.state.current||defaultDL()),coherence:checkDL(APP.state.current||defaultDL(),{context:'export-diagnostic-v4'}),audit:window.DLCreatorCore?.auditService?.diagnostic?.(),sync:window.DLCreatorCore?.syncQueueService?.diagnostic?.(),conflictJournal:window.DLCreatorCore?.conflictSyncService?.journal?.(),storage:window.DLCreatorCore?.migrationService?.storageSnapshot?.()||{localStorage:!!window.localStorage,indexedDB:!!window.indexedDB},preparedDisabled:['backend','remoteStorage','serverAuth','transactionalMail','remoteSync','netlifyFunctionsRuntime'],createdAt:nowIso()};
  download(`diagnostic-production-${APP.VERSION}.json`,JSON.stringify(payload,null,2),'application/json;charset=utf-8');
};
window.exportLocalAuditTrail=()=>{
  const content=window.DLCreatorCore?.auditService?.export?.() || '[]';
  download(`audit-local-${APP.VERSION}.json`,content,'application/json;charset=utf-8');
};

function renderBibliotheque(){
  APP.state.library=(APP.state.library||[]).map(d=>ensureDLModel(d));
  $('#panel').innerHTML=`<div class="split library-split"><div class="card side-list library-list-card"><h3>Bibliothèque DL</h3><div class="toolbar library-import-toolbar"><label class="btn red library-json-import-btn"><input id="libraryJsonImportInput" type="file" hidden accept="application/json,.json" onchange="importDLJsonToLibrary(this.files&&this.files[0])">Importer JSON</label></div><div class="form-grid library-filter-grid"><div class="span-3"><label>Domaine</label><select id="fDomain"><option value="">Tous</option>${APP.DOMAINS.map(d=>`<option>${d}</option>`).join('')}</select></div><div class="span-3"><label>Statut</label><select id="fStatus"><option value="">Tous</option>${APP.STATUSES.map(d=>`<option>${d}</option>`).join('')}</select></div><div class="span-3"><label>Type</label><select id="fType"><option value="">Tous</option>${APP.TYPES.map(t=>`<option>${esc(t)}</option>`).join('')}<option>DL</option></select></div><div class="span-3"><label>Tri</label><select id="fSort"><option value="modified">Modifié récent</option><option value="status">Statut</option><option value="type">Type</option><option value="reference">Référence</option></select></div><div class="span-12"><label>Recherche</label><input id="fSearch" placeholder="Référence, mots-clés, thème, niveau Bloom…"></div></div><div id="libList"></div></div><div class="card library-detail-card"><h3>DL sélectionnée</h3><div id="libDetail" class="muted">Sélectionner une DL dans la bibliothèque.</div></div></div>`;
  ['fDomain','fStatus','fType','fSort','fSearch'].forEach(id=>$('#'+id).oninput=drawLibraryList);
  drawLibraryList();
}
function drawLibraryList(){
  const fd=$('#fDomain').value, fs=$('#fStatus').value, ft=$('#fType').value, sort=$('#fSort').value, q=norm($('#fSearch').value);
  let list=(APP.state.library||[]).map(d=>ensureDLModel(d)).filter(d=>{
    const id=d.identification||{};
    const status=effectiveDLStatus(d);
    const type=effectiveDLType(d);
    const hay=[d.referenceDL,id.theme,id.sousTheme,asArray(d.tags).join(' '),id.publicCible,id.niveauBloom,status,type,d.version].join(' ');
    return (!fd||normalizeLegacyDomain(id.domaine)===fd)&&(!fs||status===fs)&&(!ft||type===ft||id.typeDoc===ft)&&(!q||norm(hay).includes(q)||norm(JSON.stringify(d)).includes(q));
  });
  list.sort((a,b)=>{
    const ia=a.identification||{}, ib=b.identification||{};
    if(sort==='status') return effectiveDLStatus(a).localeCompare(effectiveDLStatus(b),'fr') || (a.referenceDL||'').localeCompare(b.referenceDL||'','fr');
    if(sort==='type') return effectiveDLType(a).localeCompare(effectiveDLType(b),'fr') || (a.referenceDL||'').localeCompare(b.referenceDL||'','fr');
    if(sort==='reference') return (a.referenceDL||computeReference(a)).localeCompare(b.referenceDL||computeReference(b),'fr');
    return String(b.dateModification||'').localeCompare(String(a.dateModification||''));
  });
  const grouped = sort==='status' || sort==='type';
  if(grouped){
    const groups={};
    list.forEach(d=>{ const k=sort==='status'?effectiveDLStatus(d):(effectiveDLType(d)||'Sans type'); (groups[k]||(groups[k]=[])).push(d); });
    $('#libList').innerHTML=Object.entries(groups).map(([g,items])=>`<div class="group-title">${esc(g)}</div>${items.map(renderLibraryItem).join('')}`).join('')||'<div class="muted">Aucune DL.</div>';
  }else{
    $('#libList').innerHTML=list.map(renderLibraryItem).join('')||'<div class="muted">Aucune DL.</div>';
  }
  bindLibrarySelection();
}
function bindLibrarySelection(){
  $$('#libList .dl-item[data-lib-id]').forEach(item=>{
    item.addEventListener('click',()=>window.showLib(item.dataset.libId));
  });
}
function renderLibraryItem(d){
  window.DLCreatorCore?.collaborationStorage?.enrich?.(d);
  window.DLCreatorCore?.workflowService?.ensure?.(d);
  const id=d.identification||{};
  const status=effectiveDLStatus(d);
  const ref=d.referenceDL||computeReference(d);
  const sid=String(d.id||'');
  const wf=window.DLCreatorCore?.workflowService?.stateOf?.(d)||String(status||'').toLowerCase();
  const owner=d.collaboration?.ownerId||d.workflow?.ownerId||'local';
  const locked=d.collaboration?.editLock?.locked;
  const conflicts=(d.collaboration?.conflicts||[]).length;
  const badges=[`<span class="badge ${statusBadgeClass(status)}">${esc(status)}</span>`,`<span class="badge">${esc(wf)}</span>`,`<span class="badge">Owner ${esc(owner||'—')}</span>`];
  if(locked) badges.push('<span class="badge warn">Verrouillé</span>');
  if(conflicts) badges.push(`<span class="badge warn">Conflit ${conflicts}</span>`);
  if(wf.includes('publication')) badges.push('<span class="badge">Publication</span>');
  return `<button type="button" class="dl-item ${String(APP.state.selectedLibraryId)===sid?'selected':''}" data-lib-id="${esc(sid)}" onclick="showLib('${jsString(sid)}')"><div class="dl-item-main"><strong>${esc(ref)}</strong>${badges.join('')}</div><div class="dl-item-meta"><span>${esc(effectiveDLType(d)||'Type non défini')}</span><span>${esc(id.niveauBloom||'Bloom —')}</span><span>${esc(id.publicCible||'Public —')}</span></div><small>${esc(normalizeLegacyDomain(id.domaine)||'AUTRE')} · ${esc(id.theme||'Sans thème')}</small></button>`;
}
window.showLib=id=>{
  const raw=(APP.state.library||[]).find(x=>String(x?.id)===String(id));
  const detail=$('#libDetail');
  if(!detail) return;
  if(!raw){
    detail.innerHTML='<div class="alert warn">DL introuvable dans la bibliothèque locale.</div>';
    return;
  }
  const d=ensureDLModel(raw);
  APP.state.selectedLibraryId=d.id;
  $$('#libList .dl-item').forEach(item=>item.classList.toggle('selected', String(item.dataset.libId)===String(d.id)));
  const ident=d.identification||{};
  const status=effectiveDLStatus(d);
  const bloom=ident.niveauBloom || 'Non renseigné';
  const safeId=jsString(d.id);
  detail.innerHTML=`<h2>${esc(d.referenceDL||computeReference(d))}</h2><div class="library-detail-badges"><span class="badge ${statusBadgeClass(status)}">${esc(status)}</span><span class="badge gray">${esc(effectiveDLType(d)||'Type non défini')}</span><span class="badge gray">Bloom : ${esc(bloom)}</span></div><div class="library-detail-grid"><p><strong>Domaine :</strong><br>${esc(normalizeLegacyDomain(ident.domaine)||'—')}</p><p><strong>Thème :</strong><br>${esc(ident.theme||'—')}</p><p><strong>Public :</strong><br>${esc(ident.publicCible||'—')}</p><p><strong>Niveau Bloom :</strong><br>${esc(bloom)}</p><p><strong>Référence :</strong><br>${esc(d.referenceDL||'—')}</p><p><strong>Version :</strong><br>${esc(d.version||'—')}</p><p><strong>Modification :</strong><br>${esc(formatDateTimeCH(d.dateModification)||'—')}</p></div><p>${esc((d.buts||[]).map(b=>b.texte).filter(Boolean).join(' / '))}</p><div class="row-actions"><button class="btn red" onclick="loadDL('${safeId}')">Ouvrir</button><button class="btn" onclick="exportLibJson('${safeId}')">Exporter JSON</button><button class="btn" onclick="exportLibPdf('${safeId}')">Exporter PDF</button><button class="btn" onclick="archiveDL('${safeId}')">Archiver</button><button class="btn icon-only" title="Supprimer" aria-label="Supprimer" onclick="deleteDL('${safeId}')">${sfTrashIcon()}</button></div>`;
};
function libraryDLById(id){ return (APP.state.library||[]).find(x=>String(x?.id)===String(id)); }
window.loadDL=id=>{ const src=libraryDLById(id); if(!src){actionStatus('DL introuvable dans la bibliothèque locale.','warn');return;} APP.state.current=ensureDLModel(structuredClone(src)); APP.state.activeModule='dl'; APP.state.activeTab='generalites'; APP.state.readOnlyMode=false; APP.state.editModeFromMesDL=false; setDirty(false); render(); };
window.importDLFromLibrary=id=>{ const src=libraryDLById(id); if(!src){actionStatus('DL introuvable dans la bibliothèque locale.','warn');return;} const d=ensureDLModel(structuredClone(src)); d.id=uid(); d.dateCreation=nowIso(); d.dateModification=nowIso(); APP.state.current=d; APP.state.activeModule='dl'; APP.state.activeTab='generalites'; setDirty(true); render(); toast('DL importée dans une nouvelle préparation'); };
window.duplicateDL=async id=>{const src=libraryDLById(id); if(!src){actionStatus('DL introuvable dans la bibliothèque locale.','warn');return;} const d=ensureDLModel(structuredClone(src)); d.id=uid(); d.version=nextMinorVersionValue(src.version || 'v1.00'); d.statut='Brouillon'; d.validation={statut:'Brouillon',validateur:'',dateValidation:'',commentaire:''}; d.dateCreation=nowIso(); d.dateModification=nowIso(); computeReference(d); APP.state.library.push(d); try{ await saveLibrary(); drawLibraryList(); toast('DL dupliquée'); }catch(e){ console.error(e); actionStatus('Duplication impossible : '+(e?.message||e),'warn'); }};
window.deleteDL=async id=>{const d=libraryDLById(id); const ref=d?(d.referenceDL||computeReference(d)):'cette DL'; if(!confirm(`Confirmer la suppression de la DL ${ref} ?`))return; APP.state.library=APP.state.library.filter(x=>String(x.id)!==String(id)); try{ await saveLibrary(); APP.state.selectedLibraryId=''; renderPanel(); }catch(e){ console.error(e); actionStatus('Suppression impossible : '+(e?.message||e),'warn'); }};
window.archiveDL=async id=>{const d=libraryDLById(id); if(!d){actionStatus('DL introuvable dans la bibliothèque locale.','warn');return;} if(!hasAccessAtLeast('GESTION DL')){ actionStatus('Archivage non autorisé pour ce profil.','warn'); return; } if(!confirm('Confirmer l’archivage de cette descente de leçon ?')) return; ensureDLModel(d); d.statut='Archivé'; d.workflowState='archivé'; d.validation.statut='Archivé'; d.dateModification=nowIso(); try{ await saveLibrary(); drawLibraryList(); window.showLib(id); toast('Descente de leçon archivée.'); }catch(e){ console.error(e); actionStatus('Archivage impossible : '+(e?.message||e),'warn'); }};
window.exportLibJson=async id=>{const src=libraryDLById(id); if(!src){actionStatus('DL introuvable dans la bibliothèque locale.','warn');return;} const d=ensureDLModel(structuredClone(src)); await exportJsonDocument(d);};
window.exportLibPdf=id=>{const src=libraryDLById(id); if(!src){actionStatus('DL introuvable dans la bibliothèque locale.','warn');return;} const cur=APP.state.current; APP.state.current=ensureDLModel(structuredClone(src)); exportPdf(); APP.state.current=cur;};


async function saveCurrent(manual, options={}){
  try{
    if(manual && APP.state.editModeFromMesDL && !options.skipMesDLConfirm){
      const ok=confirm('Confirmer l’enregistrement des modifications de cette descente de leçon ?');
      if(!ok){ actionStatus('Enregistrement annulé.','warn'); return false; }
    }
    if(typeof saveAllRichBeforeExport==='function') saveAllRichBeforeExport();
    const dl=ensureDLModel(APP.state.current);
    if(!dlHasMinimumDraftFields(dl) && !options.forceIncompleteDraft && !dl.__incompleteDraftConfirmed){
      if(manual){
        const keep=await confirmIncompleteDraftIfNeeded({reason:'manual-save'});
        if(!keep){ actionStatus('DL incomplète non conservée.','warn'); return false; }
      }else{
        try{ safeSetLocalStorage(APP.DRAFT_KEY, JSON.stringify(dl), 'brouillon'); }catch{}
        return false;
      }
    }
    APP.state.current=dl;
    syncDLStatus(dl);
    if(dl.__incompleteDraftConfirmed){ dl.statut='Brouillon'; dl.validation.statut='Brouillon'; }
    syncPlanHoraireFromFilRouge(dl);
    dl.dateModification=nowIso();
    computeReference(dl);
    addKeywordsToLibrary(dl.tags||[]);
    const i=APP.state.library.findIndex(x=>x.id===dl.id);
    const stored=structuredClone(dl); delete stored.__incompleteDraftConfirmed;
    if(i>=0) APP.state.library[i]=stored; else APP.state.library.unshift(stored);
    await saveLibrary();
    try{ localStorage.removeItem(APP.DRAFT_KEY); }catch{}
    setDirty(false);
    if(manual)toast('DL sauvegardée avec succès','ok');
    return true;
  }catch(e){
    console.error(e);
    setDirty(true);
    if(manual)actionStatus('Sauvegarde impossible : stockage navigateur saturé. Exportez le JSON puis libérez de l’espace navigateur. Détail : '+(e?.message||e),'warn');
    return false;
  }
}
function download(name,content,type){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type}));
  a.download=name;
  a.rel='noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function sanitizeExportFileName(name){
  const base=String(name||'DL-export.json').trim().replace(/[\/:*?"<>|]+/g,'_').replace(/\s+/g,' ');
  const safe=base || 'DL-export.json';
  return safe.toLowerCase().endsWith('.json') ? safe : safe+'.json';
}
function canChooseJsonExportLocation(){
  return typeof window.showSaveFilePicker==='function' && (window.isSecureContext || location.protocol==='file:');
}
async function saveJsonWithLocationPicker(name,content){
  const handle=await window.showSaveFilePicker({
    suggestedName:name,
    startIn:'documents',
    excludeAcceptAllOption:false,
    types:[{description:'Fichier JSON DL Creator',accept:{'application/json':['.json']}}]
  });
  const writable=await handle.createWritable();
  try{
    await writable.write(new Blob([content],{type:'application/json;charset=utf-8'}));
  }finally{
    await writable.close();
  }
}
function browserSupportsNativeSaveLocationPicker(){
  return canChooseJsonExportLocation();
}
async function fallbackDownloadJson(name,content){
  download(sanitizeExportFileName(name),content,'application/json;charset=utf-8');
  actionStatus('JSON exporté avec le téléchargement du navigateur. Pour choisir l’emplacement dans Safari/Firefox, activez « demander où enregistrer chaque fichier » dans les préférences du navigateur.','warn');
  return true;
}
async function exportJsonDocument(dl){
  const d=ensureDLModel(structuredClone(dl||APP.state.current));
  syncPlanHoraireFromFilRouge(d);
  computeReference(d);
  const name=dlFileName(d,'json');
  d.exportMeta={appVersion:APP.VERSION, build:window.DLCreatorCore?.getVersionInfo?.().build||'', exportedAt:nowIso(), storageMode:window.DLCreatorCore?.getConfig?.().storageMode||'local'};
  const content=JSON.stringify(d,null,2);
  if(canChooseJsonExportLocation()){
    try{
      await saveJsonWithLocationPicker(name,content);
      actionStatus('JSON exporté à l’emplacement choisi');
      return true;
    }catch(e){
      if(e && e.name==='AbortError'){ actionStatus('Export JSON annulé','warn'); return false; }
      console.warn('Sélecteur système d’emplacement indisponible, bascule vers le téléchargement navigateur.', e);
    }
  }
  return fallbackDownloadJson(name,content);
}
function parseDLJsonText(text){
  const raw=JSON.parse(String(text||''));
  const payload=raw && raw.dl ? raw.dl : raw;
  return ensureDLModel(payload);
}
function finalizeImportedDLModel(dl,{asLibrary=false}={}){
  const d=ensureDLModel(dl);
  syncPlanHoraireFromFilRouge(d);
  computeReference(d);
  d.dateModification=nowIso();
  if(!d.id) d.id=uid();
  return d;
}
function importJsonFile(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      APP.state.current=finalizeImportedDLModel(parseDLJsonText(r.result));
      setDirty();
      renderPanel();
      toast('JSON importé');
    }catch(e){actionStatus('Import JSON impossible : '+e.message,'warn')}
  };
  r.readAsText(file);
}
window.importDLJsonToLibrary=function(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=async()=>{
    try{
      const imported=finalizeImportedDLModel(parseDLJsonText(r.result),{asLibrary:true});
      const existingIndex=(APP.state.library||[]).findIndex(x=>String(x?.id)===String(imported.id));
      if(existingIndex>=0){
        imported.id=uid();
        imported.dateCreation=imported.dateCreation||nowIso();
      }
      const stored=ensureDLModel(structuredClone(imported));
      APP.state.library=Array.isArray(APP.state.library)?APP.state.library:[];
      APP.state.library.unshift(stored);
      APP.state.selectedLibraryId=stored.id;
      await saveLibrary();
      auditLocal('library-json-import',{source:'Bibliothèque DL', reference:stored.referenceDL||computeReference(stored), destructive:false},'AUDIT');
      renderPanel();
      setTimeout(()=>{ try{ window.showLib(stored.id); }catch{} },0);
      toast('DL JSON importée dans la Bibliothèque DL');
    }catch(e){
      console.error(e);
      actionStatus('Import JSON Bibliothèque impossible : '+(e?.message||e),'warn');
    }finally{
      try{ const input=document.getElementById('libraryJsonImportInput'); if(input) input.value=''; }catch{}
    }
  };
  r.readAsText(file);
};

function renderImport(){ $('#panel').innerHTML=`<div class="card"><h3>Import Word adapté au modèle Descente de leçon</h3><div class="drop-zone" id="wordDrop"><strong>Déposer une DL Word (.docx/.dotx)</strong><br><span class="muted">Le moteur lit word/document.xml, détecte tableaux, titres, champs structurés, fil rouge, couleurs bleues et remarques rouges/italiques.</span><br><br><input type="file" id="wordFile" accept=".docx,.dotx"></div></div><div class="card"><h3>Aperçu import Word</h3><div id="importResult" class="muted">Aucun fichier importé.</div></div>`; $('#wordFile').onchange=e=>parseWordFile(e.target.files[0]); const dz=$('#wordDrop'); dz.ondragover=e=>{e.preventDefault();dz.classList.add('drag')}; dz.ondragleave=()=>dz.classList.remove('drag'); dz.ondrop=e=>{e.preventDefault();dz.classList.remove('drag'); parseWordFile(e.dataTransfer.files[0]);}; }
async function parseWordFile(file){ if(!file)return; $('#importResult').innerHTML='Lecture du fichier Word…'; try{ const zip=await MiniZip.fromBlob(file); const xml=await zip.text('word/document.xml'); const rels=await zip.text('word/_rels/document.xml.rels').catch(()=>'<Relationships/>'); const html=wordXmlToHtml(xml,rels,zip); const parsed=mapWordHtmlToDL(await html, file.name); APP.state.current=mergeParsed(APP.state.current, parsed); setDirty(); $('#importResult').innerHTML=importSummary(parsed); bindInputs(); toast('Import Word terminé'); }catch(e){ console.error(e); $('#importResult').innerHTML=`<div class="alert warn">Import Word impossible : ${esc(e.message)}<br>Le fichier peut être protégé, chiffré ou utiliser une compression non supportée par ce navigateur.</div>`; } }
function wordXmlToHtml(xml,rels,zip){
  const relMap={}; [...rels.matchAll(/<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g)].forEach(m=>relMap[m[1]]=m[2]);
  const body=xml.match(/<w:body[\s\S]*<\/w:body>/)?.[0]||xml;
  const blocks=[]; const parts=body.split(/(?=<w:p\b|<w:tbl\b)/g);
  for(const part of parts){ if(part.startsWith('<w:tbl')) blocks.push(parseTbl(part)); else if(part.startsWith('<w:p')){ const p=parsePara(part,relMap); if(strip(p)) blocks.push(`<p>${p}</p>`); } }
  return Promise.resolve(blocks.join('\n'));
}
function decodeXml(s){return String(s||'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'");}
function parsePara(p,relMap){ return [...p.matchAll(/<w:r[\s\S]*?<\/w:r>/g)].map(r=>{const run=r[0]; let txt=[...run.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(m=>decodeXml(m[1])).join(''); if(/<w:tab\/>/.test(run))txt+='\t'; if(!txt && /FORMCHECKBOX/.test(run)) txt='☐'; if(!txt && /FORMDROPDOWN|FORMTEXT/.test(run)) txt=''; if(!txt)return ''; let cls=[]; if(/<w:color[^>]+w:val="(?:0000FF|0070C0|005EB8|2F5496)"/i.test(run)) cls.push('chantier'); if(/<w:color[^>]+w:val="(?:FF0000|C00000|B8141D)"/i.test(run)||/<w:i\b/.test(run)) cls.push('remarque'); if(/<w:b\b/.test(run)) txt='<strong>'+esc(txt)+'</strong>'; else txt=esc(txt); if(/<w:i\b/.test(run)&&!txt.includes('<strong>')) txt='<em>'+txt+'</em>'; return cls.length?`<span class="${cls.join(' ')}">${txt}</span>`:txt; }).join(''); }
function parseTbl(tbl){ const rows=[...tbl.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)].map(r=>{ const cells=[...r[0].matchAll(/<w:tc[\s\S]*?<\/w:tc>/g)].map(c=>strip(parsePara(c[0]))); return '<tr>'+cells.map(c=>`<td>${esc(c)}</td>`).join('')+'</tr>'; }); return '<table>'+rows.join('')+'</table>'; }
function mapWordHtmlToDL(html,name){
  const txt=strip(html); const lines=txt.split(/(?=[A-ZÉÈÀÙÂÊÎÔÛÇ][A-ZÉÈÀÙÂÊÎÔÛÇ\s\/’'-]{3,})|\s{2,}/).map(s=>s.trim()).filter(Boolean);
  const getAfter=(label)=>{ const re=new RegExp(label+'\\s*[:\\-]?\\s*([^\\n]+)','i'); return (txt.match(re)||[])[1]||''; };
  const section=(a,b)=>{ const A=norm(a), B=b?norm(b):''; const parts=html.split(/<p>|<\/p>|<table>|<\/table>/); let on=false,out=[]; for(const p of parts){const t=norm(strip(p)); if(!on&&t.includes(A)){on=true; continue} if(on&&B&&t.includes(B))break; if(on&&strip(p))out.push(p);} return out.join('\n'); };
  const parsed={sourceName:name, fields:{}, warnings:[], unclassifiedHtml:''};
  parsed.fields.theme = getAfter('THÈMES') || detectLineAfter(lines,'THÈMES');
  parsed.fields.publicCible = detectLineAfter(lines,'PUBLIC CIBLE'); parsed.fields.participantsClasses=detectLineAfter(lines,'TAILLE DE CLASSE');
  parsed.fields.dureeTotale = Number((txt.match(/DURÉE[^0-9]*(\d+)/i)||[])[1]||0);
  parsed.fields.buts = extractNumbered(section('BUTS','PERSONNEL')).slice(0,3).map(t=>({texte:t,niveauBloom:'Appliquer',evaluationsLiees:[]}));
  parsed.fields.evaluations = extractNumbered(section('POINTS D’ÉVALUATION','MOYENS DIDACTIQUES')).slice(0,3).map(t=>({texte:t,mesurable:true,butsLies:[]}));
  parsed.fields.materielDidactique = strip(section('MOYENS DIDACTIQUES','FIL ROUGE'));
  parsed.fields.filRouge = [{titre:'FIL ROUGE IMPORTÉ WORD',duree:'',contenuHtml:section('FIL ROUGE','CONCLUSION')||html,documents:[],annexesPdf:[],remarques:'',preparationChantier:'',emplacementChantier:''}];
  parsed.fields.conclusion = extractNumbered(section('CONCLUSION','DIVERS')).slice(0,3).map(t=>({texte:t,butsLies:[],evaluationsLiees:[],pointsAVerifier:''}));
  parsed.fields.remarques = strip(section('DIVERS / REMARQUES','MATÉRIEL ET VÉHICULES'));
  parsed.fields.materielCommande = strip(section('MATÉRIEL ET VÉHICULES','Distribution'));
  parsed.fields.distribution = strip(section('Distribution',null));
  parsed.unclassifiedHtml = html;
  parsed.warnings.push('Les champs Word de formulaire protégés peuvent contenir des marqueurs FORMTEXT/FORMDROPDOWN lorsqu’ils sont vides. Le contenu complet est conservé dans “Contenu non classé”.');
  return parsed;
}
function detectLineAfter(lines,label){ const i=lines.findIndex(l=>norm(l).includes(norm(label))); return i>=0?cleanWordText(lines[i+1]||''):''; }
function cleanWordText(s){return String(s||'').replace(/FORMTEXT|FORMDROPDOWN|FORMCHECKBOX|☐| /g,'').trim();}
function extractNumbered(html){ return strip(html).split(/\b\d+\.\s*/).map(cleanWordText).filter(s=>s.length>2); }
function mergeParsed(dl,p){ const f=p.fields; if(f.theme)dl.identification.theme=f.theme; if(f.publicCible)dl.identification.publicCible=f.publicCible; if(f.participantsClasses)dl.identification.participantsClasses=f.participantsClasses; if(f.dureeTotale)dl.identification.dureeTotale=f.dureeTotale; if(f.buts?.length)dl.buts=f.buts; if(f.evaluations?.length)dl.evaluations=f.evaluations; if(f.materielDidactique)dl.materiel.didactique=f.materielDidactique; if(f.materielCommande)dl.materiel.aCommander=f.materielCommande; if(f.remarques)dl.materiel.remarquesLogistiques=f.remarques; if(f.filRouge?.length){ dl.filRouge=f.filRouge; syncPlanHoraireFromFilRouge(dl); } if(f.conclusion?.length)dl.conclusion=f.conclusion; if(f.distribution)dl.distribution.remarques=f.distribution; dl.importWord={sourceName:p.sourceName,detectedFields:f,unclassifiedHtml:p.unclassifiedHtml,warnings:p.warnings}; dl.historique.push({date:nowIso(),action:'Import Word '+p.sourceName}); return dl; }
function importSummary(p){ return `<div class="import-preview"><div class="preview-pane"><h4>Champs reconnus</h4><pre>${esc(JSON.stringify(p.fields,null,2))}</pre><button class="btn red" onclick="APP.state.activeModule='dl';APP.state.activeTab='generalites';render();">Ouvrir dans le formulaire</button></div><div class="preview-pane unclassified"><h4>Contenu non classé / complet conservé</h4>${p.warnings.map(w=>`<div class="alert warn">${esc(w)}</div>`).join('')}<div>${p.unclassifiedHtml}</div></div></div>`; }

class MiniZip{
  constructor(buf,entries){this.buf=buf;this.entries=entries}
  static async fromBlob(blob){ const buf=await blob.arrayBuffer(); const dv=new DataView(buf); let eocd=-1; for(let i=buf.byteLength-22;i>=0&&i>buf.byteLength-70000;i--){ if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;} } if(eocd<0)throw new Error('Archive DOCX invalide'); const total=dv.getUint16(eocd+10,true), cdOffset=dv.getUint32(eocd+16,true); const entries={}; let p=cdOffset; for(let n=0;n<total;n++){ if(dv.getUint32(p,true)!==0x02014b50)break; const method=dv.getUint16(p+10,true), comp=dv.getUint32(p+20,true), uncomp=dv.getUint32(p+24,true), namelen=dv.getUint16(p+28,true), extralen=dv.getUint16(p+30,true), comlen=dv.getUint16(p+32,true), local=dv.getUint32(p+42,true); const name=new TextDecoder().decode(new Uint8Array(buf,p+46,namelen)); entries[name]={method,comp,uncomp,local}; p+=46+namelen+extralen+comlen; } return new MiniZip(buf,entries); }
  async text(name){ const e=this.entries[name]; if(!e)throw new Error('Entrée DOCX absente : '+name); const dv=new DataView(this.buf); let p=e.local; if(dv.getUint32(p,true)!==0x04034b50)throw new Error('Local header ZIP invalide'); const namelen=dv.getUint16(p+26,true), extralen=dv.getUint16(p+28,true); const start=p+30+namelen+extralen; let data=this.buf.slice(start,start+e.comp); if(e.method===0) return new TextDecoder().decode(data); if(e.method===8){ if(!('DecompressionStream' in window)) throw new Error('Navigateur sans DecompressionStream pour DOCX compressé'); const ds=new DecompressionStream('deflate-raw'); const out=await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer(); return new TextDecoder().decode(out); } throw new Error('Compression ZIP non supportée : '+e.method); }
}

async function exportPdf(options={}){
  try{
    if(typeof saveAllRichBeforeExport==='function') saveAllRichBeforeExport();
    const dl=APP.state.current;
    syncPlanHoraireFromFilRouge(dl);
    updateComputedDurations(dl);
    computeReference(dl);
    actionStatus('Préparation aperçu PDF…');
    const exportDl=await renderAnnexPdfPagesForExport(dl);
    showPdfPreview(exportDl, new Date(), options);
    actionStatus('Aperçu PDF généré');
  }catch(err){
    console.error('Préparation PDF impossible', err);
    actionStatus('Préparation PDF impossible : '+(err?.message||err),'warn');
  }
}
function absoluteAssetBase(){
  const base=document.querySelector('base')?.href || document.baseURI || location.href;
  return base;
}
function pdfPreviewDocumentHtml(dl,generatedAt){
  const title=esc(dlFileName(dl,'pdf'));
  const base=esc(absoluteAssetBase());
  const stylesheet=esc(new URL('styles.css', absoluteAssetBase()).href);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><base href="${base}"><link rel="stylesheet" href="${stylesheet}"></head><body class="pdf-body pdf-preview-render"><main class="pdf-document">${pdfHtml(dl,generatedAt)}</main></body></html>`;
}
function showPdfPreview(dl,generatedAt,options={}){
  closePdfPreview(false);
  const overlay=document.createElement('div');
  overlay.id='pdfPreviewOverlay';
  overlay.className='pdf-preview-overlay no-print';
  overlay.innerHTML=`<div class="pdf-preview-shell"><div class="pdf-preview-toolbar"><div><strong>Aperçu PDF</strong><span>${esc(dl.referenceDL||computeReference(dl)||'Descente de leçon')}</span></div><div class="pdf-preview-actions"><button class="btn small" type="button" data-pdf-print disabled>Imprimer / Exporter PDF</button><button class="btn small" type="button" data-pdf-close>Fermer l’aperçu</button></div></div><iframe class="pdf-preview-frame" title="Aperçu PDF fidèle impression"></iframe></div>`;
  document.body.appendChild(overlay);
  document.body.classList.add('pdf-preview-open');
  const frame=overlay.querySelector('.pdf-preview-frame');
  const printBtn=overlay.querySelector('[data-pdf-print]');
  const closeBtn=overlay.querySelector('[data-pdf-close]');
  closeBtn.addEventListener('click',()=>closePdfPreview(true));
  overlay.addEventListener('click',e=>{ if(e.target===overlay) closePdfPreview(true); });
  const onEsc=e=>{ if(e.key==='Escape') closePdfPreview(true); };
  overlay._pdfEscHandler=onEsc;
  document.addEventListener('keydown',onEsc);
  frame.addEventListener('load',async()=>{
    try{
      await waitForPdfFrameReady(frame);
      sanitizePdfDocumentBeforePrint(frame);
      syncPdfPreviewFooters(frame, dl);
      fitPdfPreviewToFrame(frame);
    }catch(err){
      console.warn('Synchronisation aperçu PDF impossible', err);
    }
    printBtn.disabled=false;
  },{once:true});
  window.addEventListener('resize',()=>fitPdfPreviewToFrame(frame),{passive:true});
  printBtn.addEventListener('click',async()=>{
    try{
      printBtn.disabled=true;
      printBtn.textContent='Préparation impression…';
      await waitForPdfFrameReady(frame);
      sanitizePdfDocumentBeforePrint(frame);
      syncPdfPreviewFooters(frame, dl);
      frame.contentWindow?.focus();
      await new Promise(resolve=>setTimeout(resolve,120));
      frame.contentWindow?.print();
    }catch(err){
      console.error('Impression PDF impossible',err);
      actionStatus('Impression PDF impossible : '+(err?.message||err),'warn');
    }finally{
      printBtn.disabled=false;
      printBtn.textContent='Imprimer / Exporter PDF';
    }
  });
  const html=pdfPreviewDocumentHtml(dl,generatedAt);
  const blobUrl=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
  frame.addEventListener('load',()=>setTimeout(()=>URL.revokeObjectURL(blobUrl),1000),{once:true});
  frame.src=blobUrl;
}

function fitPdfPreviewToFrame(frame){
  const doc=frame?.contentDocument;
  if(!doc) return;
  const documentEl=doc.querySelector('.pdf-document');
  if(!documentEl) return;

  // v8.04 : l’aperçu ne simule plus l’A4 par redimensionnement responsive.
  // Le DOM affiché reste en dimensions physiques 210 x 297 mm, identique
  // au DOM transmis à window.print(). Le conteneur iframe scrolle simplement
  // si la fenêtre est trop étroite.
  doc.documentElement.style.removeProperty('--pdf-preview-scale');
  documentEl.style.width='210mm';
  documentEl.style.margin='0 auto';
  documentEl.style.padding='12mm 0';
  documentEl.style.overflow='visible';
  doc.body.style.overflowX='auto';

  const pages=[...doc.querySelectorAll('.pdf-document > .pdf-page, .pdf-document > .pdf-annex-page')];
  pages.forEach(page=>{
    page.style.transform='none';
    page.style.transformOrigin='initial';
    page.style.margin='0 auto 12mm';
  });

  markPdfPreviewOverflowPages(doc);
}

function isPdfPaginationDebugEnabled(){
  try{ return localStorage.getItem('DL_PDF_PAGINATION_DEBUG')==='1'; }catch{ return false; }
}

function markPdfPreviewOverflowPages(doc){
  if(!doc) return;
  const debug=isPdfPaginationDebugEnabled();
  doc.body.classList.toggle('pdf-pagination-debug',debug);
  const pages=[...doc.querySelectorAll('.pdf-document > .pdf-page, .pdf-document > .pdf-annex-page')];
  pages.forEach((page,index)=>{
    page.classList.toggle('pdf-page-debug',debug);
    page.dataset.previewPage=String(index+1);
    page.classList.remove('pdf-page-overflow');
    const overflow=Math.ceil(page.scrollHeight)-Math.ceil(page.clientHeight)>2 || Math.ceil(page.scrollWidth)-Math.ceil(page.clientWidth)>2;
    if(overflow){
      page.classList.add('pdf-page-overflow');
      console.warn('[DL creator][PDF v8.04] Débordement A4 détecté dans l’aperçu', {page:index+1, scrollHeight:page.scrollHeight, clientHeight:page.clientHeight});
    }
  });
}
function closePdfPreview(restoreFocus=true){
  const overlay=document.getElementById('pdfPreviewOverlay');
  if(!overlay) return;
  if(overlay._pdfEscHandler) document.removeEventListener('keydown',overlay._pdfEscHandler);
  overlay.remove();
  document.body.classList.remove('pdf-preview-open');
  if(restoreFocus){
    try{ document.querySelector('[data-action=pdf]')?.focus(); }catch{}
  }
}
async function waitForPdfFrameReady(frame){
  const doc=frame?.contentDocument;
  if(!doc) return;
  if(doc.readyState!=='complete') await new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));
  const fontsReady=doc.fonts?.ready?.catch?.(()=>null) || Promise.resolve();
  const images=[...doc.images].filter(img=>!img.complete).map(img=>new Promise(resolve=>{img.onload=img.onerror=resolve;}));
  await Promise.race([Promise.all([fontsReady,...images]), new Promise(resolve=>setTimeout(resolve,1800))]);
}
function pdfPageHasUsefulContent(page){
  if(!page) return false;
  const clone=page.cloneNode(true);
  clone.querySelectorAll('.no-print,.pdf-screen-footer,.pdf-footer,script,style').forEach(n=>n.remove());
  if(clone.querySelector('h1,h2,h3,h4,table,img,svg,figure,article,section,ul,ol,li,p,.pdf-fil-section,.pdf-rich-content,.pdf-note,.pdf-tags span')) return true;
  return String(clone.textContent||'').replace(/\s+/g,'').length>0;
}
function removeEmptyPdfPages(doc){
  if(!doc) return 0;
  let removed=0;
  const pages=[...doc.querySelectorAll('.pdf-document > .pdf-page, .pdf-document > .pdf-annexes-index, .pdf-document > .pdf-annex-page')];
  pages.forEach(page=>{
    if(!pdfPageHasUsefulContent(page)){
      page.remove();
      removed++;
    }
  });
  return removed;
}
function sanitizePdfDocumentBeforePrint(frame){
  const doc=frame?.contentDocument;
  if(!doc) return;
  removeEmptyPdfPages(doc);
}
function syncPdfPreviewFooters(frame, dl=APP.state.current){
  const doc=frame?.contentDocument;
  if(!doc) return;
  const reference=dl?.referenceDL || computeReference(dl) || 'DL';
  const pages=[...doc.querySelectorAll('.pdf-document > .pdf-page, .pdf-document > .pdf-annexes-index, .pdf-document > .pdf-annex-page')].filter(pdfPageHasUsefulContent);
  doc.querySelectorAll('.pdf-screen-footer,.pdf-print-page-footer').forEach(n=>n.remove());
  const total=Math.max(1,pages.length);

  // Le footer historique fixe reste présent comme filet de sécurité visuel,
  // mais la pagination fiable est maintenant injectée explicitement dans
  // chaque page DOM après stabilisation du rendu, annexes PDF.js incluses.
  doc.querySelectorAll('.pdf-footer').forEach(footer=>{
    const pageTotal=footer.querySelector('.pageTotal');
    if(pageTotal) pageTotal.textContent=String(total);
  });

  pages.forEach((page,index)=>{
    if(!page.style.position) page.style.position='relative';
    const footer=doc.createElement('footer');
    footer.className='pdf-screen-footer pdf-print-page-footer';
    footer.innerHTML=`<span>Réf. : ${esc(reference)}</span><span>SDIS régional du Nord vaudois</span><span>Page ${index+1} de ${total}</span>`;
    page.appendChild(footer);
  });
}
function formatDateCH(value){
  if(!value) return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return esc(value);
  return d.toLocaleDateString('fr-CH',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function formatDateTimeCH(value){
  const d=value instanceof Date ? value : new Date(value||Date.now());
  return d.toLocaleString('fr-CH',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function listTextPdf(v){ return asArray(v).filter(Boolean).join(', '); }
function pdfLineList(value){
  const items=asArray(value).filter(v=>String(v||'').trim());
  if(!items.length) return '—';
  return `<div class="pdf-line-list">${items.map(v=>`<div>${esc(v)}</div>`).join('')}</div>`;
}
function bloomClass(level){ return 'bloom-'+norm(level||'').replace(/[^a-z0-9]+/g,'-'); }
function bloomVerbs(level,limit=10){
  const verbs=BLOOM_HELP[String(level||'').trim()]?.verbes || [];
  return verbs.slice(0,limit).join(', ');
}
function personLabelPdf(value){
  if(Array.isArray(value)) return value.filter(Boolean).map(personLabelPdf).join('<br>');
  if(value && typeof value==='object'){
    const grade=value.grade||value.Grade||'';
    const prenom=value.prenom||value['Prénom']||value.Prenom||'';
    const nom=value.nom||value.Nom||'';
    const nip=value.nip||value.NIP||'';
    return esc([grade,prenom,nom].filter(Boolean).join(' ')+(nip?` · NIP ${nip}`:''));
  }
  return esc(value||'');
}
const PDF_GRADE_ORDER_HIGH_TO_LOW=['Col','Lt-col','Maj instr','Maj','Cap adj','Cap instr','Cap','Of spéc','Plt instr','Plt','Lt instr','Lt','Adj','Four','Sgtm','Sgt chef instr','Sgt chef','Sgt instr','Sgt','Cpl','App','Sap','Rec'];
function pdfGradeRank(value){
  const label=typeof value==='object' && value ? (value.grade||value.Grade||'') : String(value||'').trim().split(/\s+/)[0];
  const normalized=norm(label).replace(/\s+/g,' ');
  const idx=PDF_GRADE_ORDER_HIGH_TO_LOW.findIndex(g=>norm(g).replace(/\s+/g,' ')===normalized);
  return idx>=0 ? idx : PDF_GRADE_ORDER_HIGH_TO_LOW.length;
}
function sortPeopleByGradeHighToLow(value){
  return asArray(value).filter(Boolean).slice().sort((a,b)=>pdfGradeRank(a)-pdfGradeRank(b) || personLabelPdf(a).localeCompare(personLabelPdf(b),'fr'));
}
function personChipsPdf(value,maxPerRow=4){
  const people=sortPeopleByGradeHighToLow(value);
  if(!people.length) return '—';
  return `<div class="pdf-person-grid pdf-person-grid-${maxPerRow}">${people.map(p=>`<span>${personLabelPdf(p)}</span>`).join('')}</div>`;
}
function sanitizePdfRichHtml(html){
  const raw=String(html||'');
  if(!raw) return '';
  const tpl=document.createElement('template');
  tpl.innerHTML=raw;
  tpl.content.querySelectorAll('.media-preview-btn,.media-delete-btn,.pdf-controls,.row-actions,.annex-actions,.no-print,button,label.btn,input,style,script').forEach(n=>n.remove());
  tpl.content.querySelectorAll('[contenteditable]').forEach(n=>n.removeAttribute('contenteditable'));
  return tpl.innerHTML;
}
function materialRowsPdf(rows,labelField='designation'){
  return (rows||[]).map(r=>{
    if(typeof r!=='object') return {designation:String(r||''),quantite:'',affectation:'',remarque:''};
    return {
      designation:r[labelField]||r.designation||r.description||r.materiel||r.fourniture||r.vehicule||'',
      quantite:r.quantite||r.qte||'',
      affectation:r.affectation||r.etat||r.type||r.categorie||'',
      remarque:r.remarque||r.remarques||''
    };
  }).filter(r=>Object.values(r).some(Boolean));
}
function linkedButLabels(dl,values){
  return asArray(values).map(v=>{ const idx=Number(v)-1; const b=dl.buts?.[idx]; return b?.texte ? `${esc(v)}. ${esc(b.texte)}` : esc(v); }).join('<br>');
}

function publicCiblePdfHtml(dl){
  normalizePublicCibleModel(dl);
  const id=dl.identification||{};
  const selected=uniqueNormalized(id.publicCibleSelections||[]);
  const libre=String(id.publicCibleLibre||'').trim();
  const values=[...selected];
  if(libre) values.push(libre);
  if(!values.length) return '—';
  return `<div class="pdf-public-cible pdf-public-cible-text">${values.map(v=>`<span>${esc(v)}</span>`).join('<br>')}</div>`;
}
function formateursPdfHtml(dl){
  const people=sortPeopleByGradeHighToLow(dl.responsables?.formateurs);
  if(!people.length) return '—';
  return `<div class="pdf-public-cible pdf-formateurs-cible"><ul class="pdf-public-list">${people.map(p=>`<li>${personLabelPdf(p)}</li>`).join('')}</ul></div>`;
}
function pdfDiffusionTagsSection(dl,tags,distCommand,distFormateurs,distAutres,annexIndexHtml=''){
  const tagsHtml=tags.length
    ? `<div class="pdf-tags">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`
    : '<p class="pdf-empty">Aucun mot-clé renseigné.</p>';
  return pdfSection('Diffusion et validation / Mots-clés',`
    <div class="pdf-keep-with-next pdf-diffusion-block">
      <h3 class="pdf-subtitle">Diffusion et validation</h3>
      <div class="pdf-summary-grid pdf-diffusion-grid">
        ${pdfInfoBox('Commandement',pdfLineList(distCommand))}
        ${pdfInfoBox('Formateurs',pdfLineList(distFormateurs))}
        ${pdfInfoBox('Autres',pdfLineList(distAutres))}
        ${pdfInfoBox('Statut',esc(dl.validation?.statut||dl.statut||'—'))}
      </div>
      ${dl.distribution?.remarques?`<div class="pdf-note"><strong>Remarques de diffusion</strong><br>${esc(dl.distribution.remarques)}</div>`:''}
      ${dl.validation?.commentaire?`<div class="pdf-note"><strong>Commentaire validation</strong><br>${esc(dl.validation.commentaire)}</div>`:''}
    </div>
    <div class="pdf-tags-block">
      <h3 class="pdf-subtitle">Mots-clés / tags</h3>
      ${tagsHtml}
    </div>
    ${annexIndexHtml||''}
  `,'pdf-diffusion-tags-section');
}
function pdfHtml(dl,generatedAt){
  ensureDLModel(dl); ensureMaterielModel(dl);
  const id=dl.identification||{};
  const reference=dl.referenceDL||computeReference(dl);
  computePlanRowTranches(dl);
  const plan=dl.planHoraire||[];
  const tags=asArray(dl.tags||[]).filter(Boolean);
  const distCommand=asArray(dl.distribution?.destinataires).concat(dl.distribution?.destinatairesLibre?[dl.distribution.destinatairesLibre]:[]).filter(Boolean);
  const distFormateurs=asArray(dl.distribution?.groupes).concat(dl.distribution?.groupesLibre?[dl.distribution.groupesLibre]:[]).filter(Boolean);
  const distAutres=asArray(dl.distribution?.fonctions).concat(dl.distribution?.fonctionsLibre?[dl.distribution.fonctionsLibre]:[]).filter(Boolean);
  const fileName=dlFileName(dl,'pdf');
  return `
  <section class="pdf-cover pdf-page">
    <div class="pdf-cover-brand"><img class="pdf-cover-logo pdf-cover-logo-color" src="assets/LogoSDIScouleur.jpg" alt="Logo SDIS Nord vaudois"><div><div class="pdf-org">SDIS régional du Nord vaudois</div><h1>DESCENTE DE LEÇON</h1><p>Document pédagogique de formation</p></div></div>
    <div class="pdf-cover-title"><strong>${esc(id.theme||'Thème non renseigné')}</strong><em>${esc(id.sousTheme||'Sous-thème non renseigné')}</em></div>
    <div class="pdf-cover-grid pdf-cover-grid-v2">
      ${pdfMeta('Domaine',normalizeLegacyDomain(id.domaine))}${pdfMeta('Public cible',publicCiblePdfHtml(dl))}${pdfMeta('Type formation',id.typeFormation)}${pdfMeta('Durée',`${id.dureeTotale||planHoraireTotalMinutes(dl)||0} min`)}
      <div class="pdf-meta pdf-meta-reference"><span>Référence automatique</span><strong>${esc(reference)}</strong></div><div class="pdf-meta pdf-meta-version"><span>Version</span><strong>${esc(dl.version||'—')}</strong></div>
      ${pdfMeta('Responsable',personLabelPdf(dl.responsables?.responsable || APP.state.user?.displayName || ''))}${pdfMeta('Rédacteur',personLabelPdf(dl.responsables?.redacteurs))}${pdfMeta('Généré le',formatDateTimeCH(generatedAt))}${pdfMeta('Statut',dl.validation?.statut||dl.statut||'—')}
    </div>
    ${pdfCoverBloom(dl)}
  </section>
  ${pdfPage2Section(dl,plan)}
  ${pdfFilRougeSection(dl)}
  ${pdfConclusionSection(dl)}
  ${pdfMaterielSection(dl)}
  ${pdfDiffusionTagsSection(dl,tags,distCommand,distFormateurs,distAutres,pdfAnnexesIndexHtml(dl))}
  ${pdfAnnexesPagesHtml(dl)}
  <footer class="pdf-footer"><span>Réf. : ${esc(reference)}</span><span>SDIS régional du Nord vaudois</span><span>Page <span class="pageNumber"></span> de <span class="pageTotal"></span></span></footer>`;
}
function pdfPage2Section(dl,plan){
  const formateurs=formateursPdfHtml(dl);
  const generalites=`<div class="pdf-summary-grid pdf-summary-grid-formateurs">${pdfInfoBox('Public cible',publicCiblePdfHtml(dl))}${pdfInfoBox('Formateurs',formateurs)}</div>`;
  const body=`<div class="pdf-page2-block pdf-page2-generalites">${generalites}</div><div class="pdf-page2-block">${pdfButsContent(dl)}</div><div class="pdf-page2-block">${pdfEvaluationsContent(dl)}</div><div class="pdf-page2-block pdf-page2-plan">${pdfPlanContent(plan,dl)}</div>`;
  return pdfSection('Généralités',body,'pdf-page2-section');
}
function pdfButsContent(dl){
  const html=(dl.buts||[]).map((b,i)=>{
    const level=b.niveauBloom||dl.identification?.niveauBloom||'';
    return `<article class="pdf-but-card ${bloomClass(level)}"><div class="pdf-but-num">${i+1}</div><div><h3>${esc(b.texte||'But non renseigné')}</h3><p><strong>${esc(level||'—')}</strong></p></div></article>`;
  }).join('') || '<p class="pdf-empty">Aucun but renseigné.</p>';
  return `<h3>Buts pédagogiques</h3>${html}`;
}
function pdfEvaluationsContent(dl){
  return `<h3>Points d’évaluation</h3>${pdfEvaluationsTable(dl)}`;
}
function pdfPlanContent(plan,dl=APP.state.current){
  const trainer=String(dl?.planFormateurLecon||'').trim();
  const trainerHtml=trainer ? `<div class="pdf-plan-global-trainer"><strong>Formateur de la leçon</strong><span>${esc(trainer)}</span></div>` : '';
  return `<h3>Plan horaire</h3>${trainerHtml}${pdfPlanTable(plan)}`;
}
function pdfEvaluationsTable(dl){
  const rows=(dl.evaluations||[]).map((e,i)=>`<tr><td>${i+1}</td><td>${esc(e.texte||'')}</td><td>${e.mesurable?'☑':'☐'}</td><td>${esc(listTextPdf(e.butsLies||e.butsLiees||''))}</td></tr>`).join('');
  return `<table class="pdf-table pdf-eval-table"><thead><tr><th>N°</th><th>Point d’évaluation</th><th>Mesurable</th><th>Lié aux buts</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Aucun point d’évaluation renseigné.</td></tr>'}</tbody></table>`;
}
function pdfPlanTable(plan){
  const count=usedPlanTrancheCount(APP.state.current);
  const visibleIndexes=Array.from({length:count},(_,i)=>i);
  const hourHeaders=visibleIndexes.map(i=>`<th class="pdf-plan-hour-header" aria-label="Session ${i+1}">${sfClockFillIcon('pdf-plan-hour-icon')}</th>`).join('');
  const hourCols=visibleIndexes.map(()=>'<col class="pdf-plan-hour-col">').join('');
  const hourCells=s=>visibleIndexes.map(i=>`<td class="pdf-plan-hours-cell">${formatPlanRangeHtml(s,i)}</td>`).join('');
  const rows=(plan||[]).map(s=>`<tr><td class="pdf-plan-section-cell">${esc(s.theme||'')}</td><td class="num pdf-plan-duration-cell">${esc(s.duree||'')} min</td>${hourCells(s)}<td class="pdf-plan-formateur-cell">${esc(s.formateur||'')}</td><td class="pdf-plan-remarques-cell">${esc(s.remarques||'')}</td></tr>`).join('');
  const colspan=4+count;
  return `<table class="pdf-table pdf-plan-table pdf-plan-table-multi pdf-plan-table-dynamic pdf-plan-hours-${count}"><colgroup><col class="pdf-plan-theme-col"><col class="pdf-plan-duration-col">${hourCols}<col class="pdf-plan-formateur-col"><col class="pdf-plan-remarques-col"></colgroup><thead><tr><th>Section / thème</th><th>Durée</th>${hourHeaders}<th>Formateur</th><th>Remarques</th></tr></thead><tbody>${rows||`<tr><td colspan="${colspan}">Aucune séquence renseignée.</td></tr>`}</tbody></table>`;
}
function pdfCoverBloom(dl){
  const level=dl.identification?.niveauBloom||'';
  return `<div class="pdf-cover-bloom ${bloomClass(level)}"><div><span>Niveau pédagogique Bloom</span><strong>${esc(level||'—')}</strong></div><div class="pdf-bloom-visual"><img src="assets/PyramideBLOOM.png" alt="Pyramide BLOOM"></div></div>`;
}
function pdfMeta(label,value){ return `<div class="pdf-meta"><span>${esc(label)}</span><strong>${value==null||value===''?'—':value}</strong></div>`; }
function pdfInfoBox(label,value){ return `<div class="pdf-info-box"><span>${esc(label)}</span><strong>${value||'—'}</strong></div>`; }
function pdfSection(title,content,extraClass=''){ return `<section class="pdf-section pdf-page ${extraClass}"><h2>${esc(title)}</h2>${content}</section>`; }
function pdfBloomSection(dl){
  const level=dl.identification?.niveauBloom||'';
  return pdfSection('Niveau pédagogique BLOOM',`<div class="pdf-bloom-main ${bloomClass(level)}"><span>Niveau global</span><strong>${esc(level||'—')}</strong><em>Code ${esc(dl.identification?.codeBloom||bloomCodeFor(level)||'—')}</em></div>`);
}
function pdfButsSection(dl){ return pdfSection('Buts pédagogiques', pdfButsContent(dl).replace(/^<h3>Buts pédagogiques<\/h3>/,'')); }
function pdfEvaluationsSection(dl){ return pdfSection('Points d’évaluation', pdfEvaluationsTable(dl)); }
function pdfPlanSection(plan){ return pdfSection('Plan horaire', pdfPlanTable(plan),'pdf-plan-section'); }
function splitPdfRichHtmlIntoChunks(html,maxChars=1900){
  const clean=sanitizePdfRichHtml(html);
  if(!clean) return [''];
  const tpl=document.createElement('template');
  tpl.innerHTML=clean;
  const nodes=[...tpl.content.childNodes].filter(n=>String(n.textContent||'').trim() || n.nodeType===1);
  if(!nodes.length) return [clean];
  const chunks=[];
  let current='', chars=0;
  const pushCurrent=()=>{ if(current.trim()){ chunks.push(current); current=''; chars=0; } };
  for(const node of nodes){
    const wrapper=document.createElement('div');
    wrapper.appendChild(node.cloneNode(true));
    const outer=wrapper.innerHTML;
    const textLen=String(node.textContent||'').trim().length || 120;
    if(textLen>maxChars*1.35 && node.nodeType===1 && ['P','DIV','LI'].includes(node.nodeName)){
      pushCurrent();
      const text=String(node.textContent||'').trim();
      const parts=text.match(new RegExp(`.{1,${maxChars}}(?:\s|$)`,'g')) || [text];
      const tag=node.nodeName.toLowerCase()==='li'?'p':node.nodeName.toLowerCase();
      parts.forEach(part=>chunks.push(`<${tag}>${esc(part.trim())}</${tag}>`));
      continue;
    }
    if(chars && chars+textLen>maxChars){ pushCurrent(); }
    current+=outer;
    chars+=textLen;
  }
  pushCurrent();
  return chunks.length?chunks:[clean];
}
function pdfFilRougeArticle(section,index,bodyHtml,isSuite=false,tailHtml=''){
  const title=section.titre||`Section ${index+1}`;
  const reportTitle=`${section.duree?`${section.duree} min — `:''}${title}${isSuite?' (suite)':''}`;
  return `<article class="pdf-fil-section ${isSuite?'pdf-fil-section-suite':''}" data-section-report="${esc(reportTitle)}"><table class="pdf-fil-table"><thead><tr><th><div class="pdf-fil-head"><span>${esc(section.duree||'')} min</span><h3>${esc(title)}${isSuite?' <em>(suite)</em>':''}</h3></div></th></tr></thead><tbody><tr><td>${bodyHtml}${tailHtml}</td></tr></tbody></table></article>`;
}
function estimatePdfHtmlChars(html){
  return strip(String(html||'')).length + Math.round(String(html||'').length/8);
}
function pdfFilRougeSection(dl){
  const pages=[];
  let current=[];
  let currentChars=0;
  const pageBudget=2600;
  const flush=()=>{
    if(current.length){ pages.push(current.join('')); current=[]; currentChars=0; }
  };
  (dl.filRouge||[]).forEach((s,i)=>{
    const linked=s.butsLies?.length?`<p class="pdf-linked"><strong>Buts liés :</strong><br>${linkedButLabels(dl,s.butsLies)}</p>`:'';
    const emplacement=s.emplacementChantier?`<div class="pdf-chantier pdf-chantier-place"><strong>Emplacement chantier</strong><br>${esc(s.emplacementChantier)}</div>`:'';
    const preparation=s.preparationChantier?`<div class="pdf-chantier pdf-chantier-prep"><strong>Préparation chantier</strong><br>${esc(s.preparationChantier)}</div>`:'';
    const remarques=s.remarques?`<div class="pdf-note pdf-note-section"><strong>Remarques liées à cette section</strong><br>${esc(s.remarques)}</div>`:'';
    const annexes=(s.annexesPdf||[]).length?`<div class="pdf-note"><strong>Annexes PDF liées</strong><br>${(s.annexesPdf||[]).map(a=>`${esc(a.name)} — ${esc(a.pages)} page${Number(a.pages)>1?'s':''}`).join('<br>')}</div>`:'';
    const intro=linked+emplacement+preparation;
    const chunks=splitPdfRichHtmlIntoChunks(s.contenuHtml);
    chunks.forEach((chunk,chunkIndex)=>{
      const body=`${chunkIndex===0?intro:''}<div class="pdf-rich-content">${chunk}</div>`;
      const tail=chunkIndex===chunks.length-1 ? `${remarques}${annexes}` : '';
      const article=pdfFilRougeArticle(s,i,body,chunkIndex>0,tail);
      const articleChars=estimatePdfHtmlChars(body+tail)+320;
      if(current.length && currentChars+articleChars>pageBudget) flush();
      current.push(article);
      currentChars+=articleChars;
      if(articleChars>pageBudget*.92) flush();
    });
  });
  flush();
  if(!pages.length) return pdfSection('Fil rouge','<p class="pdf-empty">Aucun fil rouge renseigné.</p>','pdf-filrouge');
  return pages.map((content,index)=>pdfSection(index===0?'Fil rouge':'Fil rouge (suite)',content,'pdf-filrouge')).join('');
}
function pdfMaterialTable(title,rows){
  const body=rows.map(r=>`<tr><td>${esc(r.designation)}</td><td class="num">${esc(r.quantite)}</td><td>${esc(r.affectation)}</td><td>${esc(r.remarque)}</td></tr>`).join('') || '<tr><td colspan="4">Aucun élément renseigné.</td></tr>';
  return `<h3 class="pdf-subtitle">${esc(title)}</h3><table class="pdf-table pdf-material-table"><thead><tr><th>Désignation</th><th>Qté</th><th>Affectation / état</th><th>Remarque</th></tr></thead><tbody>${body}</tbody></table>`;
}
function pdfMaterielSection(dl){
  const m=dl.materiel||{};
  const firstTable=pdfMaterialTable('Matériel didactique',materialRowsPdf(m.didactique,'description'));
  const remaining=`${pdfMaterialTable('Matériel engagé',materialRowsPdf(m.materielEngage))}${pdfMaterialTable('Fournitures',materialRowsPdf(m.fournitures))}${pdfMaterialTable('Véhicules engagés',materialRowsPdf(m.vehiculesEngages))}${m.remarquesLogistiques?`<div class="pdf-note"><strong>Remarques logistiques</strong><br>${esc(m.remarquesLogistiques)}</div>`:''}`;
  return `<section class="pdf-section pdf-page pdf-materiel-section"><div class="pdf-section-head-with-first-block"><h2>MATÉRIEL, VÉHICULES ET LOGISTIQUE</h2>${firstTable}</div>${remaining}</section>`;
}
function pdfConclusionSection(dl){
  ensureDLModel(dl);
  const points=(dl.conclusion||[]).map((c,i)=>`<article class="pdf-conclusion"><h3>Point ${i+1}</h3><div class="pdf-rich-content">${sanitizePdfRichHtml(c.texteHtml||esc(c.texte||''))}</div>${(c.pointsAVerifierHtml||c.pointsAVerifier)?`<div class="pdf-note"><strong>À vérifier</strong><div class="pdf-rich-content">${sanitizePdfRichHtml(c.pointsAVerifierHtml||esc(c.pointsAVerifier||''))}</div></div>`:''}</article>`).join('') || '<p class="pdf-empty">Aucun point de conclusion renseigné.</p>';
  const general=dl.distribution?.remarqueGeneraleHtml||dl.distribution?.remarqueGeneraleText ? `<article class="pdf-conclusion pdf-general-remark"><h3>Remarque générale</h3><div class="pdf-rich-content">${sanitizePdfRichHtml(dl.distribution.remarqueGeneraleHtml||esc(dl.distribution.remarqueGeneraleText||''))}</div></article>` : '';
  return pdfSection('Conclusion / discussion finale',points+general,'pdf-conclusion-section');
}

window.APP=APP; window.render=render; window.renderPanel=renderPanel;
init().catch(e=>{document.getElementById('app').innerHTML=`<div class="container"><div class="card"><h1>Erreur de démarrage</h1><pre>${esc(e.stack||e.message)}</pre></div></div>`; console.error(e);});
