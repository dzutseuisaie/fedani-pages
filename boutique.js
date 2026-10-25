// FEDANI ServiConnect — Boutique : catalogue, panier, commandes (Firestore) — paiement MoMo/OM vérifié à la main
import { db } from "./firebase-init.js";
import { collection, doc, setDoc, addDoc, updateDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const PAY = { 'MTN MoMo': '6XX XX XX XX', 'Orange Money': '6XX XX XX XX' }; // ← METS TES VRAIS NUMÉROS ICI
const DEF = [ // prix indicatifs en FCFA : modifie-les ici ou dans la base (collection « products »)
  { id: 'n1', cat: 'numerique', ico: '📄', nom: 'Modèle de CV professionnel', desc: 'CV modifiable (Word), prêt à remplir.', prix: 2000 },
  { id: 'n2', cat: 'numerique', ico: '🎨', nom: 'Pack 10 flyers modifiables', desc: 'Maquettes prêtes à personnaliser.', prix: 5000 },
  { id: 'n3', cat: 'numerique', ico: '🖼️', nom: 'Pack logos & bannières', desc: 'Modèles de logos et bannières réseaux sociaux.', prix: 5000 },
  { id: 'n4', cat: 'numerique', ico: '🌐', nom: 'Modèle de site vitrine', desc: 'Template HTML/CSS responsive à adapter.', prix: 15000 },
  { id: 'n5', cat: 'numerique', ico: '⚙️', nom: 'Pack GRAFCET & automates', desc: 'Exercices corrigés et exemples PLC.', prix: 3000 },
  { id: 'n6', cat: 'numerique', ico: '📝', nom: 'Modèle de rapport de stage', desc: 'Structure complète à remplir.', prix: 2000 },
  { id: 's1', cat: 'service', ico: '🌐', nom: 'Site vitrine sur mesure', desc: 'Création complète, responsive, SEO de base.', prix: 50000 },
  { id: 's2', cat: 'service', ico: '📈', nom: 'SEO & indexation Google', desc: 'Référencement et indexation de ton site.', prix: 7000 },
  { id: 's3', cat: 'service', ico: '🛠️', nom: 'Maintenance mensuelle', desc: 'Mises à jour et support pendant 1 mois.', prix: 10000 },
  { id: 's4', cat: 'service', ico: '✏️', nom: 'Création de logo', desc: 'Logo original, fichiers prêts à publier.', prix: 5000 },
  { id: 'm1', cat: 'materiel', ico: '🔌', nom: 'Kit de câblage électrique', desc: 'Petit matériel de câblage (prix à confirmer).', prix: 8000 },
  { id: 'm2', cat: 'materiel', ico: '💡', nom: 'Lampe LED rechargeable', desc: 'Éclairage de secours (prix à confirmer).', prix: 2500 },
  { id: 'm3', cat: 'materiel', ico: '🔋', nom: 'Multiprise sécurisée', desc: 'Avec protection (prix à confirmer).', prix: 3500 }
];
const CATS = { all: 'Tout', numerique: '💾 Numérique', service: '🧑‍💻 Services', materiel: '🔧 Matériel' };
const ST = { a_verifier: '⏳ Paiement à vérifier', payee: '✅ Confirmée', annulee: '❌ Annulée' };
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('fr-FR') + ' FCFA';
const me = () => window.FB && FB.getCurrentUser && FB.getCurrentUser();
const adm = () => !!(me() && me().role === 'admin');
let prods = [], cart = {}, orders = [], filt = 'all', unsubO = null, seen = {};

onSnapshot(collection(db, 'products'), s => { prods = s.docs.map(d => ({ ...d.data(), id: d.id })); draw(); }, () => { });

onAuthStateChanged(getAuth(), () => {
  if (unsubO) unsubO(); orders = []; seen = {}; draw();
  setTimeout(() => {
    const u = me(); if (!u) return;
    const q = adm() ? collection(db, 'orders') : query(collection(db, 'orders'), where('uid', '==', u.id));
    unsubO = onSnapshot(q, s => {
      orders = s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => b.date - a.date);
      if (!adm()) orders.forEach(o => { if (seen[o.id] && seen[o.id] !== o.statut) window.toast && toast('Commande ' + o.ref + ' : ' + ST[o.statut], 'info'); seen[o.id] = o.statut; });
      draw();
    }, () => { });
  }, 1500);
});

function draw() {
  const root = $('boutiqueRoot'); if (!root) return;
  const list = (prods.length ? prods : DEF).filter(p => filt === 'all' || p.cat === filt);
  const all = prods.length ? prods : DEF, ids = Object.keys(cart).filter(k => cart[k] > 0);
  const total = ids.reduce((t, k) => t + (all.find(p => p.id === k)?.prix || 0) * cart[k], 0);
  const u = me();
  root.innerHTML = `
  <p class="shop-help">👉 1. Choisis tes articles · 2. Valide ton panier · 3. Paie par MoMo/Orange Money et colle l'ID de transaction · 4. On confirme ta commande ici.</p>
  ${adm() && !prods.length ? `<button class="btn-primary" onclick="shopImport()">⬆️ Importer le catalogue dans la base</button>` : ''}
  <div class="shop-chips">${Object.entries(CATS).map(([k, v]) => `<button class="${k === filt ? 'on' : ''}" onclick="shopFilter('${k}')">${v}</button>`).join('')}</div>
  <div class="shop-grid">${list.map(p => `<div class="shop-card"><div class="shop-ico">${esc(p.ico)}</div><h4>${esc(p.nom)}</h4><p>${esc(p.desc)}</p><b>${fmt(p.prix)}</b><button class="btn-primary" onclick="shopAdd('${esc(p.id)}')">🛒 Ajouter</button></div>`).join('')}</div>
  <div class="shop-cart"><h3>🛒 Mon panier</h3>${ids.length ? ids.map(k => { const p = all.find(x => x.id === k); return `<div class="shop-line"><span>${esc(p.nom)} × ${cart[k]}</span><span>${fmt(p.prix * cart[k])} <button onclick="shopRem('${esc(k)}')">✕</button></span></div>`; }).join('') + `<div class="shop-line"><b>Total</b><b>${fmt(total)}</b></div>` +
    (u ? `<div class="shop-form"><input id="shNom" placeholder="Ton nom" value="${esc(u.nom)}"><input id="shTel" placeholder="Ton numéro (6XXXXXXXX)" value="${esc(u.tel)}"><input id="shVille" placeholder="Ville (pour le matériel)" value="${esc(u.ville)}">
      <select id="shMode">${Object.keys(PAY).map(m => `<option>${m}</option>`).join('')}</select>
      <p class="shop-help">Envoie <b>${fmt(total)}</b> au numéro : ${Object.entries(PAY).map(([m, n]) => `<b>${m} ${n}</b>`).join(' ou ')}. Puis colle ci-dessous l'ID de la transaction reçu par SMS.</p>
      <input id="shTx" placeholder="ID de la transaction (SMS)"><button class="btn-primary big" onclick="shopOrder()">✅ J'ai payé — envoyer la commande</button></div>`
      : `<p class="shop-help">Connecte-toi pour valider ta commande.</p><button class="btn-primary" onclick="openModal('login')">Connexion</button>`) : '<p class="shop-help">Ton panier est vide. Touche « Ajouter » sur un article.</p>'}</div>
  ${u ? `<div class="shop-cart"><h3>📦 ${adm() ? 'Commandes à traiter' : 'Mes commandes'}</h3>${orders.length ? orders.map(o => `<div class="shop-order"><b>${esc(o.ref)}</b> — ${ST[o.statut] || ''}<br><small>${esc(o.items.map(i => i.nom + '×' + i.qty).join(', '))} · ${fmt(o.total)}</small>
    ${adm() ? `<br><small>${esc(o.nom)} · ${esc(o.tel)} · ${esc(o.ville)} · ${esc(o.mode)} · ID : ${esc(o.txid)}</small>${o.statut === 'a_verifier' ? `<br><button class="btn-primary" onclick="shopSet('${o.id}','payee')">✅ Confirmer</button> <button class="btn-ghost" onclick="shopSet('${o.id}','annulee')">❌ Annuler</button>` : ''}` : ''}</div>`).join('') : '<p class="shop-help">Aucune commande pour le moment.</p>'}</div>` : ''}`;
}
Object.assign(window, {
  shopFilter: k => { filt = k; draw(); },
  shopAdd: id => { cart[id] = (cart[id] || 0) + 1; draw(); window.toast && toast('Ajouté au panier 🛒', 'success'); },
  shopRem: id => { delete cart[id]; draw(); },
  shopImport: async () => { for (const p of DEF) await setDoc(doc(db, 'products', p.id), p); window.toast && toast('Catalogue importé ✅', 'success'); },
  shopSet: (id, statut) => updateDoc(doc(db, 'orders', id), { statut }).catch(e => window.toast && toast('Refusé : ' + (e.code || e.message), 'error')),
  shopOrder: async () => {
    const u = me(), all = prods.length ? prods : DEF, v = i => $(i).value.trim();
    const items = Object.keys(cart).filter(k => cart[k] > 0).map(k => { const p = all.find(x => x.id === k); return { id: k, nom: p.nom, prix: p.prix, qty: cart[k] }; });
    if (!u || !items.length) return;
    if (!/^(\+?237)?6\d{8}$/.test(v('shTel').replace(/\s/g, ''))) return toast('Numéro invalide.', 'error');
    if (v('shTx').length < 6) return toast("Colle l'ID de transaction reçu par SMS.", 'error');
    const total = items.reduce((t, i) => t + i.prix * i.qty, 0);
    try {
      await addDoc(collection(db, 'orders'), { uid: u.id, nom: v('shNom'), tel: v('shTel'), ville: v('shVille'), mode: v('shMode'), txid: v('shTx'), items, total, statut: 'a_verifier', date: Date.now(), ref: 'CMD-' + Date.now().toString(36).toUpperCase() });
      cart = {}; toast('Commande envoyée ✅ Elle sera confirmée après vérification du paiement.', 'success');
    } catch (e) { toast('Échec : ' + (e.code || e.message), 'error'); }
  }
});
const g = window.goPage; window.goPage = p => { g(p); if (p === 'boutique') draw(); };
draw();
