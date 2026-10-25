// FEDANI ServiConnect — synchronisation Firestore du contenu (services, partenaires, équipe,
// actualités, site, messages, visites). Remplace le stockage localStorage non partagé.
import { auth, db } from "./firebase-init.js";
import {
  doc, setDoc, deleteDoc, collection, onSnapshot, query, where
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const FB = window.FB;
const COLS = { sc_services: 'services', sc_team: 'team', sc_partners: 'partners', sc_actualites: 'actus' };
const SETTERS = { services: 'setServices', team: 'setTeam', partners: 'setPartners', actus: 'setActus' };
const remote = { services: new Map(), team: new Map(), partners: new Map(), actus: new Map(), messages: new Map() };
let unsubs = [], me = null;
const isAdmin = () => !!(me && me.role === 'admin');
const warn = (what, e) => { console.warn(what, e && e.code || e); window.secLog && secLog('alerte', what + ' : ' + (e && (e.code || e.message) || e)); };
const clean = o => JSON.parse(JSON.stringify(o));
const num = id => parseInt(String(id).replace(/\D/g, ''), 10) || 0;

function refresh() {
  ['renderServices', 'renderServicesAdmin', 'renderTeam', 'renderTeamAdmin', 'renderPartenaires',
   'renderPartenairesAdmin', 'renderActualites', 'renderActuAdmin', 'renderAdminMessages', 'updateStats']
    .forEach(n => { try { window[n] && window[n](); } catch (e) { } });
  const t = document.getElementById('tab-visites');
  if (t && t.classList.contains('active')) try { renderAdminVisites(); } catch (e) { }
}

// ── Écriture : appelée par save() de script.js ────────────────
FB.cloudSave = function (key, val) {
  try {
    if (!me) return;
    if (COLS[key]) return syncList(COLS[key], val);
    if (key === 'sc_site') { if (isAdmin()) setDoc(doc(db, 'site', 'content'), clean(val)).catch(e => warn('Écriture site', e)); return; }
    if (key === 'sc_partner_msgs') return syncMsgs(val);
    if (key === 'sc_visites') return syncVisit(val);
  } catch (e) { warn('Synchronisation', e); }
};

function syncList(col, list) {
  if (!isAdmin()) return;
  const known = remote[col], ids = new Set();
  list.forEach(item => {
    if (!item || !item.id) return;
    ids.add(item.id);
    const json = JSON.stringify(clean(item));
    if (known.get(item.id) === json) return;
    known.set(item.id, json);
    setDoc(doc(db, col, item.id), clean(item)).catch(e => warn('Écriture ' + col, e));
    window.secLog && secLog('audit', 'Enregistré : ' + col + '/' + item.id);
  });
  [...known.keys()].filter(id => !ids.has(id)).forEach(id => {
    known.delete(id);
    deleteDoc(doc(db, col, id)).catch(e => warn('Suppression ' + col, e));
    window.secLog && secLog('audit', 'Supprimé : ' + col + '/' + id);
  });
}

function syncMsgs(list) {
  const known = remote.messages;
  list.forEach(m => {
    if (!m || !m.id) return;
    const json = JSON.stringify(clean(m));
    if (known.get(m.id) === json) return;
    if (!isAdmin() && (m.userId !== me.id || m.isAdmin || known.has(m.id))) return; // un utilisateur crée seulement ses messages
    known.set(m.id, json);
    setDoc(doc(db, 'messages', m.id), clean(m)).catch(e => warn('Écriture message', e));
  });
}

function syncVisit(list) {
  if (isAdmin() && list.length === 0) {           // « Effacer » dans l'onglet Visites
    onceDocs('visits').then(ds => ds.forEach(d => deleteDoc(d.ref).catch(() => { })));
    return;
  }
  const v = list[0]; if (!v) return;
  const day = new Date(v.time).toISOString().slice(0, 10), flag = 'sc_vsent';
  if (localStorage.getItem(flag) === v.vid + day) return; // une visite par visiteur et par jour
  localStorage.setItem(flag, v.vid + day);
  setDoc(doc(db, 'visits', v.vid + '_' + day), {
    vid: String(v.vid), page: String(v.page).slice(0, 40), user: String(v.user || 'Visiteur').slice(0, 80),
    userId: v.userId || null, time: v.time, ua: String(v.ua || '').slice(0, 60)
  }).catch(e => { localStorage.removeItem(flag); warn('Écriture visite', e); });
}
const onceDocs = col => new Promise(res => { const u = onSnapshot(collection(db, col), s => { u(); res(s.docs); }, () => res([])); });

// ── Lecture en temps réel ─────────────────────────────────────
function listen(col) {
  return onSnapshot(collection(db, col), snap => {
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => num(a.id) - num(b.id));
    const local = FB.getLocal()[col];
    if (!items.length && local && local.length) return;   // base vide : on garde les données locales (voir « Importer »)
    remote[col] = new Map(snap.docs.map(d => [d.id, JSON.stringify(clean({ ...d.data(), id: d.id }))]));
    FB[SETTERS[col]](items); refresh();
  }, e => warn('Lecture ' + col, e));
}

window.cloudStart = function (profile) {
  unsubs.forEach(u => u()); unsubs = [];
  me = profile;
  ['services', 'partners', 'team', 'actus'].forEach(c => unsubs.push(listen(c)));
  unsubs.push(onSnapshot(doc(db, 'site', 'content'), s => {
    if (s.exists()) { FB.setSite(s.data()); try { applySiteContent(); } catch (e) { } }
  }, e => warn('Lecture site', e)));
  if (!profile) return;
  const msgs = new Map(), push = () => {
    remote.messages = new Map([...msgs.values()].map(m => [m.id, JSON.stringify(clean(m))]));
    FB.setMsgs([...msgs.values()].sort((a, b) => (a.date || 0) - (b.date || 0))); refresh();
  };
  const watch = q => onSnapshot(q, s => {
    s.docs.forEach(d => msgs.set(d.id, { ...d.data(), id: d.id }));
    s.docChanges().forEach(c => c.type === 'removed' && msgs.delete(c.doc.id)); push();
  }, e => warn('Lecture messages', e));
  const mc = collection(db, 'messages');
  if (isAdmin()) {
    unsubs.push(watch(mc));
    unsubs.push(onSnapshot(collection(db, 'visits'), s => {          // visites en temps réel
      const vs = s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => b.time - a.time);
      const uv = {}; vs.forEach(v => { uv[v.id] = { vid: v.vid, date: new Date(v.time).toDateString(), time: v.time, user: v.user }; });
      FB.setVisits(vs, uv); refresh();
    }, e => warn('Lecture visites', e)));
  } else {
    unsubs.push(watch(query(mc, where('userId', '==', profile.id))));
    unsubs.push(watch(query(mc, where('targetUserId', '==', profile.id))));
  }
};

// ── Bouton admin : copier les données de CE navigateur vers Firestore ──
window.cloudImport = async function () {
  if (!isAdmin()) return toast('Réservé à l\'administrateur.', 'error');
  if (!confirm('Copier les services, partenaires, équipe, actualités et textes de ce navigateur vers la base partagée ?')) return;
  try {
    const L = FB.getLocal(), jobs = [];
    Object.entries({ services: L.services, team: L.team, partners: L.partners, actus: L.actus })
      .forEach(([c, list]) => (list || []).forEach(i => i.id && jobs.push(setDoc(doc(db, c, i.id), clean(i)))));
    if (L.site && Object.keys(L.site).length) jobs.push(setDoc(doc(db, 'site', 'content'), clean(L.site)));
    (L.msgs || []).forEach(m => m.id && jobs.push(setDoc(doc(db, 'messages', m.id), clean(m))));
    await Promise.all(jobs);
    window.secLog && secLog('audit', 'Import des données locales : ' + jobs.length + ' document(s)');
    toast('✅ ' + jobs.length + ' élément(s) importé(s).', 'success');
  } catch (e) { toast('❌ ' + (e.code || e.message), 'error'); }
};
