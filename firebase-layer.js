// FEDANI ServiConnect — couche Firebase (Auth + Firestore) + Cloudinary
// Remplace les anciennes fonctions localStorage de script.js
import { auth, db, googleProvider, CLOUDINARY } from "./firebase-init.js";
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, signInWithRedirect, GithubAuthProvider, FacebookAuthProvider, getAdditionalUserInfo, signOut,
  sendEmailVerification, sendPasswordResetEmail, updateProfile, updatePassword
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, getDocs, collection,
  query, where, onSnapshot, arrayUnion, arrayRemove, writeBatch
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const FB = window.FB;               // créé par script.js
const $ = id => document.getElementById(id);

// ── Messages d'erreur en français ─────────────────────────────
const ERR = {
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/wrong-password': 'Email ou mot de passe incorrect.',
  'auth/user-not-found': 'Email ou mot de passe incorrect.',
  'auth/invalid-email': 'Adresse email invalide.',
  'auth/email-already-in-use': 'Cet email est déjà utilisé.',
  'auth/weak-password': 'Mot de passe trop faible (6 caractères minimum).',
  'auth/too-many-requests': 'Trop de tentatives. Réessaie dans quelques minutes.',
  'auth/network-request-failed': 'Problème de connexion internet.',
  'auth/unauthorized-domain': "Ce domaine n'est pas autorisé dans Firebase (Authentication → Paramètres → Domaines autorisés).",
  'auth/account-exists-with-different-credential': "Un compte existe déjà avec cet email via une autre méthode (Google, email…). Connecte-toi avec celle-ci.",
  'auth/operation-not-allowed': "Cette méthode de connexion n'est pas activée dans Firebase.",
  'permission-denied': "Action refusée par les règles de sécurité.",
  'unavailable': 'Service momentanément indisponible.'
};
const frErr = e => ERR[e && e.code] || ('Erreur : ' + ((e && e.message) || e));

// ── Cloudinary (envoi d'images, preset unsigned) ──────────────
async function uploadImage(file, kind) {
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('Le fichier doit être une image.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Image trop lourde (max 2 Mo).');
  // On copie l'image en mémoire d'abord (évite les erreurs "Failed to fetch" sur Android)
  let blob;
  try { blob = new Blob([await file.arrayBuffer()], { type: file.type }); }
  catch (e) { throw new Error("Impossible de lire l'image. Choisis-la depuis la Galerie du téléphone."); }
  const fd = new FormData();
  fd.append('file', blob, file.name || 'image.jpg');
  fd.append('upload_preset', CLOUDINARY.uploadPreset);
  let r;
  try { r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, { method: 'POST', body: fd }); }
  catch (e) { throw new Error("Envoi impossible : Cloudinary est injoignable depuis ce navigateur (réseau, bloqueur de pub ou économie de données)."); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.secure_url) throw new Error((j.error && j.error.message) || "Échec de l'envoi de l'image.");
  const tr = kind === 'avatar' ? 'q_auto,f_auto,w_300,h_300,c_fill,g_auto' : 'q_auto,f_auto,w_1200,c_limit';
  return { url: j.secure_url.replace('/upload/', '/upload/' + tr + '/'), id: j.public_id };
}

window.uploadImage = uploadImage;
function busy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.old = btn.innerHTML; btn.disabled = true; btn.innerHTML = label || '⏳ Patientez…'; }
  else { btn.disabled = false; if (btn.dataset.old) btn.innerHTML = btn.dataset.old; }
}

// ── Profil utilisateur (collection users) ─────────────────────
async function loadProfile(fu) {
  const ref = doc(db, 'users', fu.uid);
  let snap = await getDoc(ref);
  if (!snap.exists()) {
    const nom = fu.displayName || window.__regName || (fu.email || 'Utilisateur').split('@')[0];
    await setDoc(ref, {
      nom: nom.slice(0, 80), email: fu.email || '', tel: '', ville: '', bio: '', avatar: '',
      role: 'user', date: Date.now(),
      googleAuth: fu.providerData.some(p => p.providerId === 'google.com')
    });
    snap = await getDoc(ref);
  }
  return { id: fu.uid, ...snap.data() };
}

// ── Annonces en temps réel ────────────────────────────────────
let unsubs = [];
const pub = new Map(), mine = new Map(), all = new Map();

function stopListeners() { unsubs.forEach(u => u()); unsubs = []; pub.clear(); mine.clear(); all.clear(); }

function fillMap(snap, map) {
  map.clear();
  snap.forEach(d => map.set(d.id, { likes: [], comments: [], ...d.data(), id: d.id }));
  merge();
}
function merge() {
  const m = new Map([...pub, ...mine, ...all]);
  FB.setAnnonces([...m.values()].sort((a, b) => (b.date || 0) - (a.date || 0)));
  rerender();
}
function startListeners(profile) {
  stopListeners();
  (window.cloudStart || (() => setTimeout(() => window.cloudStart && window.cloudStart(profile), 800)))(profile);
  const col = collection(db, 'annonces');
  const onErr = e => console.warn('Firestore :', e.code);
  unsubs.push(onSnapshot(query(col, where('visible', '==', true)), s => fillMap(s, pub), onErr));
  if (profile) {
    unsubs.push(onSnapshot(query(col, where('userId', '==', profile.id)), s => fillMap(s, mine), onErr));
    if (profile.role === 'admin') {
      unsubs.push(onSnapshot(col, s => fillMap(s, all), onErr));
      unsubs.push(onSnapshot(collection(db, 'users'), s => {
        FB.setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
        rerender();
      }, onErr));
    }
  }
}

function rerender() {
  const ae = document.activeElement;
  if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName) && ae.value &&
      ae.closest('#homeAnnonces,#annoncesGrid,#mesAnnoncesGrid,#detailContent')) return; // ne pas effacer un commentaire en cours
  const page = (document.querySelector('.page.active') || {}).id;
  const open = [...document.querySelectorAll('.comments-section.open')].map(e => e.id);
  try {
    if (page === 'page-home') renderHomeAnnonces();
    else if (page === 'page-annonces') renderAnnonces();
    else if (page === 'page-mesAnnonces') renderMesAnnonces();
    else if (page === 'page-admin' && FB.getCurrentUser() && FB.getCurrentUser().role === 'admin') renderAdmin();
    updateStats();
  } catch (e) { console.warn(e); }
  open.forEach(id => { const el = $(id); if (el) el.classList.add('open'); });
}

function afterAuth() {
  updateAuthUI();
  showPublierForm();
  const pe = $('profilEmail'); if (pe) pe.readOnly = true;   // l'email = identifiant Firebase
  const page = (document.querySelector('.page.active') || {}).id;
  if (page === 'page-profil') loadProfileFormSafe();
  const u = FB.getCurrentUser();
  if (!u && ['page-publier', 'page-mesAnnonces', 'page-profil', 'page-admin'].includes(page)) goPage('home');
  rerender();
}
function loadProfileFormSafe() { try { loadProfilForm(); } catch (e) { } }

onAuthStateChanged(auth, async fu => {
  if (!fu) {
    stopListeners(); FB.setCurrentUser(null); FB.setUsers([]);
    startListeners(null); afterAuth(); return;
  }
  let profile;
  try { profile = await loadProfile(fu); }
  catch (e) {
    console.warn('Profil :', e.code || e);
    profile = { id: fu.uid, nom: fu.displayName || 'Utilisateur', email: fu.email || '', tel: '', ville: '', bio: '', avatar: '', role: 'user', date: Date.now() };
  }
  FB.setCurrentUser(profile);
  startListeners(profile);
  afterAuth();
});

// ── Connexion / inscription / déconnexion ─────────────────────
window.doLogin = async function (e) {
  e.preventDefault();
  const err = $('loginError'); err.textContent = '';
  const email = $('loginEmail').value.trim(), pass = $('loginPass').value;
  const btn = e.submitter || e.target.querySelector('[type=submit]');
  busy(btn, true);
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    window.secLog && secLog('connexion', 'Connexion réussie : ' + email);
    closeModals();
    setTimeout(() => showWelcomeModal('return', cred.user.displayName || email.split('@')[0]), 300);
  } catch (ex) { window.secLog && secLog('alerte', 'Échec de connexion : ' + email + ' (' + (ex.code || ex.message) + ')'); err.textContent = '❌ ' + frErr(ex); }
  finally { busy(btn, false); }
};

window.doRegister = async function (e) {
  e.preventDefault();
  const err = $('regError'); err.textContent = '';
  const nom = $('regNom').value.trim(), email = $('regEmail').value.trim(), pass = $('regPass').value;
  if (nom.length < 2) { err.textContent = '❌ Nom trop court.'; return; }
  if (pass.length < 6) { err.textContent = '❌ Mot de passe : 6 caractères minimum.'; return; }
  const btn = e.submitter || e.target.querySelector('[type=submit]');
  busy(btn, true);
  window.__regName = nom;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: nom }).catch(() => { });
    sendEmailVerification(cred.user).catch(() => { });
    closeModals();
    setTimeout(() => showWelcomeModal('new', nom), 300);
    toast('📧 Un email de confirmation vous a été envoyé.', 'info');
  } catch (ex) { err.textContent = '❌ ' + frErr(ex); }
  finally { busy(btn, false); }
};

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');
const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');

async function socialFlow(provider) {
  try {
    const res = await signInWithPopup(auth, provider);
    window.secLog && secLog('connexion', 'Connexion ' + (provider.providerId || 'sociale') + ' : ' + (res.user.email || res.user.uid));
    closeModals();
    const isNew = getAdditionalUserInfo(res) && getAdditionalUserInfo(res).isNewUser;
    setTimeout(() => showWelcomeModal(isNew ? 'new' : 'return', res.user.displayName || 'ami'), 300);
  } catch (ex) {
    if (ex.code === 'auth/popup-closed-by-user' || ex.code === 'auth/cancelled-popup-request') return;
    if (ex.code === 'auth/popup-blocked') { signInWithRedirect(auth, provider); return; }
    toast('❌ ' + frErr(ex), 'error');
  }
}
const googleFlow = () => socialFlow(googleProvider);
window.loginWithGoogle = googleFlow;
window.registerWithGoogle = googleFlow;
window.loginWithGithub = () => socialFlow(githubProvider);
window.registerWithGithub = window.loginWithGithub;
window.loginWithFacebook = () => socialFlow(facebookProvider);
window.registerWithFacebook = window.loginWithFacebook;

window.doLogout = async function () {
  window.secLog && secLog('connexion', 'Déconnexion');
  try { await signOut(auth); } catch (e) { }
  toast('Déconnecté(e).', 'info'); goPage('home');
};

window.resetPassword = async function () {
  const email = $('loginEmail').value.trim();
  if (!email) { toast("Saisis d'abord ton email ci-dessus.", 'error'); return; }
  try { await sendPasswordResetEmail(auth, email); toast('📧 Email de réinitialisation envoyé.', 'success'); }
  catch (ex) { toast('❌ ' + frErr(ex), 'error'); }
};

// ── Profil ────────────────────────────────────────────────────
window.changeAvatar = function (input) {
  const f = input.files[0]; if (!f) return;
  if (!f.type.startsWith('image/')) { toast('Fichier non image.', 'error'); return; }
  if (f.size > 2 * 1024 * 1024) { toast('Image trop lourde (max 2 Mo)', 'error'); return; }
  window._pendingAvatarFile = f;
  const r = new FileReader();
  r.onload = ev => {
    const el = $('profilAvatarBig');
    el.innerHTML = '<div class="avatar-overlay"><i class="fa fa-camera"></i></div>';
    el.style.background = 'transparent';
    const img = document.createElement('img');
    img.src = ev.target.result; img.alt = 'Avatar';
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;z-index:1';
    el.appendChild(img);
    toast('Photo chargée. Sauvegarde pour confirmer.', 'info');
  };
  r.readAsDataURL(f);
};

window.saveProfil = async function (e) {
  e.preventDefault();
  const u = FB.getCurrentUser(); if (!u) return;
  const pass = $('profilPass').value, pass2 = $('profilPass2').value;
  if (pass && pass !== pass2) { toast('Mots de passe différents.', 'error'); return; }
  if (pass && pass.length < 6) { toast('Mot de passe : 6 caractères minimum.', 'error'); return; }
  const btn = e.submitter || e.target.querySelector('[type=submit]');
  busy(btn, true);
  try {
    const data = {
      nom: $('profilNom').value.trim().slice(0, 80) || u.nom,
      tel: $('profilTel').value.trim().slice(0, 25),
      ville: $('profilVille').value,
      bio: $('profilBio').value.trim().slice(0, 300)
    };
    if (window._pendingAvatarFile) { const up = await uploadImage(window._pendingAvatarFile, 'avatar'); data.avatar = up.url; }
    await updateDoc(doc(db, 'users', u.id), data);
    if (data.nom !== auth.currentUser.displayName) await updateProfile(auth.currentUser, { displayName: data.nom }).catch(() => { });
    if (pass) {
      try { await updatePassword(auth.currentUser, pass); }
      catch (ex) {
        if (ex.code === 'auth/requires-recent-login') toast('Pour changer le mot de passe : déconnecte-toi, reconnecte-toi, puis réessaie.', 'error');
        else throw ex;
      }
    }
    window._pendingAvatarFile = null;
    FB.setCurrentUser({ ...u, ...data });
    updateAuthUI(); renderProfilAvatarEl();
    toast('Profil sauvegardé ! ✅', 'success');
  } catch (ex) { toast('❌ ' + (ex.code ? frErr(ex) : ex.message), 'error'); }
  finally { busy(btn, false); }
};

// ── Annonces : publier / modifier / supprimer ─────────────────
window.submitAnnonce = async function (e) {
  e.preventDefault();
  const u = FB.getCurrentUser(); if (!u) { openModal('login'); return; }
  const btn = e.submitter || e.target.querySelector('[type=submit]');
  busy(btn, true, '⏳ Publication…');
  try {
    const g = id => $(id).value.trim();
    const file = $('imgFileInput').files[0];
    const up = file ? await uploadImage(file) : null;
    await addDoc(collection(db, 'annonces'), {
      userId: u.id, auteur: u.nom, auteurAvatar: u.avatar || '',
      titre: g('pTitre').slice(0, 120), categorie: $('pCategorie').value, desc: g('pDesc').slice(0, 3000),
      ville: $('pVille').value, quartier: g('pQuartier').slice(0, 80), prix: g('pPrix').slice(0, 60) || 'Négociable',
      mode: $('pMode').value, tel: g('pTel').slice(0, 25), email: g('pEmail').slice(0, 120),
      paiement: $('pPaiement').value, dispo: g('pDispo').slice(0, 80), tags: g('pTags').slice(0, 150),
      visible: true, date: Date.now(), img: up ? up.url : '', imgId: up ? up.id : '', likes: [], comments: []
    });
    $('publierForm').reset();
    removeImage({ stopPropagation: () => { } }, 'imgPreview', 'imgPlaceholder', 'imgRemoveBtn', 'imgFileInput');
    toast('✅ Annonce publiée !', 'success');
    goPage('mesAnnonces');
  } catch (ex) { toast('❌ ' + (ex.code ? frErr(ex) : ex.message), 'error'); }
  finally { busy(btn, false); }
};

window.saveEdit = async function (e) {
  e.preventDefault();
  const id = $('editId').value;
  const btn = e.submitter || e.target.querySelector('[type=submit]');
  busy(btn, true);
  try {
    const g = x => $(x).value.trim();
    const data = {
      titre: g('editTitre').slice(0, 120), categorie: $('editCategorie').value, desc: g('editDesc').slice(0, 3000),
      ville: $('editVille').value, quartier: g('editQuartier').slice(0, 80), prix: g('editPrix').slice(0, 60),
      mode: $('editMode').value, tel: g('editTel').slice(0, 25), email: g('editEmail').slice(0, 120),
      paiement: $('editPaiement').value, dispo: g('editDispo').slice(0, 80), tags: g('editTags').slice(0, 150),
      visible: $('editVisible').value === 'true'
    };
    const file = $('editImgInput').files[0];
    if (file) { const up = await uploadImage(file); data.img = up.url; data.imgId = up.id; }
    else if ($('editImgPreview').style.display === 'none') { data.img = ''; data.imgId = ''; }
    await updateDoc(doc(db, 'annonces', id), data);
    closeModals();
    toast('✅ Annonce modifiée !', 'success');
  } catch (ex) { toast('❌ ' + (ex.code ? frErr(ex) : ex.message), 'error'); }
  finally { busy(btn, false); }
};

window.deleteAnnonce = async function (id) {
  if (!confirm('Supprimer cette annonce ?')) return;
  try { await deleteDoc(doc(db, 'annonces', id)); toast('Annonce supprimée.', 'info'); }
  catch (ex) { toast('❌ ' + frErr(ex), 'error'); }
};

window.deleteAllAnnonces = async function () {
  const u = FB.getCurrentUser();
  if (!u || u.role !== 'admin') return;
  if (!confirm('⚠️ Supprimer TOUTES les annonces ?')) return;
  try {
    const snap = await getDocs(collection(db, 'annonces'));
    for (let i = 0; i < snap.docs.length; i += 400) {
      const b = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach(d => b.delete(d.ref));
      await b.commit();
    }
    toast('Toutes supprimées.', 'info');
  } catch (ex) { toast('❌ ' + frErr(ex), 'error'); }
};

// ── Likes & commentaires (appelés par script.js) ──────────────
FB.toggleLike = function (id, add) {
  const uid = auth.currentUser && auth.currentUser.uid; if (!uid) return;
  updateDoc(doc(db, 'annonces', id), { likes: add ? arrayUnion(uid) : arrayRemove(uid) })
    .catch(ex => toast('❌ ' + frErr(ex), 'error'));
};
FB.addComment = function (id, c) {
  const uid = auth.currentUser && auth.currentUser.uid; if (!uid) return;
  updateDoc(doc(db, 'annonces', id), {
    comments: arrayUnion({ id: String(c.id), author: String(c.author).slice(0, 80), userId: uid, text: String(c.text).slice(0, 500), date: c.date })
  }).catch(ex => toast('❌ ' + frErr(ex), 'error'));
};


// ── Explorateur de base de données (admin) ────────────────────
const plainVal = v => {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v && v.constructor && v.constructor.name === 'DocumentReference') return v.path;
  if (Array.isArray(v)) return v.map(plainVal);
  if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = plainVal(v[k]); return o; }
  return v;
};
window.dbExplore = async function (name) {
  const u = FB.getCurrentUser && FB.getCurrentUser();
  if (!u || u.role !== 'admin') throw new Error('Réservé à l\'administrateur.');
  window.secLog && secLog('base', 'Lecture de la collection « ' + name + ' »');
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => ({ id: d.id, data: plainVal(d.data()) }));
};
