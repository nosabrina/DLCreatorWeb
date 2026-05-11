function esc(value){ return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function dlTitle(data){ return data?.dl?.title || data?.title || 'DL sans titre'; }
function responsible(data){ return data?.responsibleName || data?.responsible?.display_name || data?.responsible?.username || 'Non défini'; }
function appLink(data){
  const base = String(data?.appBaseUrl || process.env.MAIL_APP_BASE_URL || '').replace(/\/$/, '');
  return base && data?.dl?.id ? `${base}/?dl=${encodeURIComponent(data.dl.id)}` : base || null;
}
function baseText(title, lines){ return [`DL Creator Web - ${title}`, '', ...lines.filter(Boolean), '', 'Message automatique serveur.'].join('\n'); }
function baseHtml(title, lines){ return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.45"><h2>${esc(title)}</h2>${lines.filter(Boolean).map(l => `<p>${esc(l)}</p>`).join('')}<hr><p style="color:#666;font-size:12px">Message automatique serveur.</p></div>`; }

const templates = {
  dl_assigned: data => ({
    subject: `[DL Creator] DL assignée - ${dlTitle(data)}`,
    text: baseText('DL assignée', [`Titre : ${dlTitle(data)}`, `Responsable : ${responsible(data)}`, appLink(data) ? `Lien : ${appLink(data)}` : null]),
    html: baseHtml('DL assignée', [`Titre : ${dlTitle(data)}`, `Responsable : ${responsible(data)}`, appLink(data) ? `Lien : ${appLink(data)}` : null])
  }),
  dl_submitted: data => ({
    subject: `[DL Creator] DL soumise à validation - ${dlTitle(data)}`,
    text: baseText('DL soumise à validation', [`Titre : ${dlTitle(data)}`, `Responsable : ${responsible(data)}`, data.comment ? `Commentaire : ${data.comment}` : null, appLink(data) ? `Lien : ${appLink(data)}` : null]),
    html: baseHtml('DL soumise à validation', [`Titre : ${dlTitle(data)}`, `Responsable : ${responsible(data)}`, data.comment ? `Commentaire : ${data.comment}` : null, appLink(data) ? `Lien : ${appLink(data)}` : null])
  }),
  dl_rejected: data => ({
    subject: `[DL Creator] DL refusée - ${dlTitle(data)}`,
    text: baseText('DL refusée', [`Titre : ${dlTitle(data)}`, `Responsable : ${responsible(data)}`, `Commentaire : ${data.comment || 'Commentaire non transmis'}`, appLink(data) ? `Lien : ${appLink(data)}` : null]),
    html: baseHtml('DL refusée', [`Titre : ${dlTitle(data)}`, `Responsable : ${responsible(data)}`, `Commentaire : ${data.comment || 'Commentaire non transmis'}`, appLink(data) ? `Lien : ${appLink(data)}` : null])
  }),
  dl_validated_private: data => ({
    subject: `[DL Creator] DL validée privée - ${dlTitle(data)}`,
    text: baseText('DL validée privée', [`Titre : ${dlTitle(data)}`, 'La DL est validée mais non publiée dans la bibliothèque.', appLink(data) ? `Lien : ${appLink(data)}` : null]),
    html: baseHtml('DL validée privée', [`Titre : ${dlTitle(data)}`, 'La DL est validée mais non publiée dans la bibliothèque.', appLink(data) ? `Lien : ${appLink(data)}` : null])
  }),
  dl_validated_library: data => ({
    subject: `[DL Creator] DL publiée bibliothèque - ${dlTitle(data)}`,
    text: baseText('DL publiée bibliothèque', [`Titre : ${dlTitle(data)}`, 'La DL est validée et publiée dans la bibliothèque partagée.', appLink(data) ? `Lien : ${appLink(data)}` : null]),
    html: baseHtml('DL publiée bibliothèque', [`Titre : ${dlTitle(data)}`, 'La DL est validée et publiée dans la bibliothèque partagée.', appLink(data) ? `Lien : ${appLink(data)}` : null])
  }),
  dl_archived: data => ({
    subject: `[DL Creator] DL archivée - ${dlTitle(data)}`,
    text: baseText('DL archivée', [`Titre : ${dlTitle(data)}`, 'La DL a été archivée.', appLink(data) ? `Lien : ${appLink(data)}` : null]),
    html: baseHtml('DL archivée', [`Titre : ${dlTitle(data)}`, 'La DL a été archivée.', appLink(data) ? `Lien : ${appLink(data)}` : null])
  }),
  dl_not_started_reminder: data => ({
    subject: `[DL Creator] Rappel DL non commencée - ${dlTitle(data)}`,
    text: baseText('Rappel DL non commencée', [`Titre : ${dlTitle(data)}`, `Responsable : ${responsible(data)}`, `Assignée depuis : ${data.daysSinceAssigned ?? '?'} jour(s)`, appLink(data) ? `Lien : ${appLink(data)}` : null]),
    html: baseHtml('Rappel DL non commencée', [`Titre : ${dlTitle(data)}`, `Responsable : ${responsible(data)}`, `Assignée depuis : ${data.daysSinceAssigned ?? '?'} jour(s)`, appLink(data) ? `Lien : ${appLink(data)}` : null])
  }),
  dl_late_reminder: data => ({
    subject: `[DL Creator] Rappel DL en retard - ${dlTitle(data)}`,
    text: baseText('Rappel DL en retard', [`Titre : ${dlTitle(data)}`, `Responsable : ${responsible(data)}`, data.dueAt ? `Échéance : ${data.dueAt}` : null, `Retard : ${data.daysLate ?? '?'} jour(s)`, appLink(data) ? `Lien : ${appLink(data)}` : null]),
    html: baseHtml('Rappel DL en retard', [`Titre : ${dlTitle(data)}`, `Responsable : ${responsible(data)}`, data.dueAt ? `Échéance : ${data.dueAt}` : null, `Retard : ${data.daysLate ?? '?'} jour(s)`, appLink(data) ? `Lien : ${appLink(data)}` : null])
  })
};

export function renderMailTemplate(templateKey, data = {}){
  const tpl = templates[templateKey];
  if (!tpl) throw Object.assign(new Error(`Template e-mail inconnu : ${templateKey}`), { status:400 });
  return tpl({ ...data, appBaseUrl:data.appBaseUrl || process.env.MAIL_APP_BASE_URL });
}
export const MAIL_TEMPLATE_KEYS = Object.freeze(Object.keys(templates));
