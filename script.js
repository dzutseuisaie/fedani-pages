/* ================================================================
   FEDANI ServiConnect — script.js  VERSION ULTRA-COMPLÈTE 2026
   Toutes fonctionnalités : menu hamburger, profil photo, admin
   services/équipe, visiteurs uniques, chat partenariat, notifs,
   commentaires/likes/partage, actualités, FAQ, confidentialité,
   footer réseaux sociaux, Google login, messages bienvenue
================================================================ */

// ── LocalStorage helpers ──────────────────────────────────────
const save = (k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){console.warn(e)}try{window.FB&&FB.cloudSave&&FB.cloudSave(k,v)}catch(e){}};
const load = (k,d)=>{try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):d}catch{return d}};

// ── Data ──────────────────────────────────────────────────────
let users = [];            // chargé depuis Firestore (admin uniquement)
let annonces = [];         // chargé depuis Firestore
let visites        = load('sc_visites',[]);
let siteContent    = load('sc_site',{});
let currentUser = null;    // fourni par Firebase Auth
let services       = load('sc_services',[]);
let teamMembers    = load('sc_team',[]);
let partnerMsgs    = load('sc_partner_msgs',[]);
let partners       = load('sc_partners',[]);
let actualites     = load('sc_actualites',[]);
let uniqueVisitors = load('sc_unique_visitors',{});
let notifications  = load('sc_notifications',[]);
let _prevPage      = 'home';
function saveScroll(){try{history.replaceState(Object.assign({},history.state||{},{scroll:window.scrollY}),'')}catch(e){}}
function goBackSmart(p){if(history.state&&history.state.page==='detail')history.back();else goPage(p);}
let _actuFilter    = 'all';

const DEFAULT_SITE = {
  heroTag:'🇨🇲 Plateforme étudiante camerounaise — FEDANI',
  heroTitle1:'Trouve un service.',heroTitle2:'Propose le tien.',
  heroSub:'Cours particuliers, correction de devoirs, design, programmation…\nConnecte-toi avec des prestataires près de chez toi.',
  siteName:'FEDANI ServiConnect',siteSlogan:'La plateforme de services étudiants',
  colorAccent:'#00aaff',colorAccent2:'#38bdf8',colorBg:'#0b0c10',colorCard:'#161820',
  banner:'',bannerType:'info',
  footerMsg:'© 2026 FEDANI ServiConnect. Tous droits réservés.',
  facebook:'https://facebook.com/fedanisarl',
  whatsapp:'https://wa.me/237696837926',
  contactEmail:'fedanisarl1@gmail.com'
};
siteContent = Object.assign({},DEFAULT_SITE,siteContent);

const CAT_ICONS = {
  Cours:'📚',Correction:'✏️',Programmation:'💻',Design:'🎨',
  Recherche:'🔬',Traduction:'🌍',Rédaction:'📝',Musique:'🎵',Sport:'⚽',Autre:'⚡'
};
const CAT_BG = {
  Cours:'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=70',
  Programmation:'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=70',
  Design:'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=70',
  Correction:'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=70',
  Musique:'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&q=70',
  Sport:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=70',
  Traduction:'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=70',
  Rédaction:'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=70',
  Recherche:'https://images.unsplash.com/photo-1532094349884-543559196ed5?w=400&q=70',
  Autre:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=70'
};

// (compte admin en dur supprimé : le rôle admin se donne dans Firestore)

// ── Default services ──────────────────────────────────────────
if(services.length===0){
  services=[
    {id:'s1',icon:'📚',title:'Cours particuliers',desc:'Maths, physique, chimie, biologie, langues, histoire… Trouve un prof à proximité ou en ligne.',points:'Niveaux : Primaire, Collège, Lycée, Université\nSéances individuelles ou en groupe\nSuivi personnalisé',filter:'Cours'},
    {id:'s2',icon:'💻',title:'Programmation & Tech',desc:'Développement web, mobile, IA, cybersécurité, réseaux… Les meilleurs développeurs t\'accompagnent.',points:'HTML/CSS/JS, React, Python, Java\nApplications mobiles Android/iOS\nFormation débutant à expert',filter:'Programmation'},
    {id:'s3',icon:'🎨',title:'Design Créatif',desc:'Logos, affiches, flyers, identité visuelle, UI/UX… Des designers talentueux pour tous tes projets.',points:'Identité visuelle & branding\nDesign web et mobile\nImpression & communication',filter:'Design'},
    {id:'s4',icon:'✏️',title:'Correction & Rédaction',desc:'Dissertations, mémoires, rapports, exposés… Fais corriger ou rédiger tes travaux académiques.',points:'Correction orthographique et grammaticale\nAmélioration du style\nRédaction de mémoires & TER',filter:'Correction'},
    {id:'s5',icon:'🌍',title:'Traduction',desc:'Anglais, Français, Espagnol, Allemand, Chinois… Des traducteurs professionnels pour tous tes documents.',points:'Documents officiels\nTraduction académique\nSous-titrage & transcription',filter:'Traduction'},
    {id:'s6',icon:'🎵',title:'Musique & Arts',desc:'Cours de guitare, piano, chant, dessin, peinture… Développe tes talents artistiques.',points:'Instruments de musique\nArts plastiques & visuels\nThéâtre & expression corporelle',filter:'Musique'},
    {id:'s7',icon:'⚽',title:'Sport & Bien-être',desc:'Football, basket, fitness, yoga, natation… Des coachs sportifs pour te mettre en forme.',points:'Coaching sportif personnel\nPréparation physique\nWellness & méditation',filter:'Sport'},
    {id:'s8',icon:'🔬',title:'Recherche & Documentation',desc:'Aide à la recherche documentaire, bibliographie, structuration de mémoire et de thèse.',points:'Recherches académiques\nBibliographie APA/MLA\nStructuration de mémoire',filter:'Recherche'},
    // ── Services FEDANI Agence Digitale (image) ──
    {id:'sv1',icon:'🌐',title:'Création de Sites Web',desc:'Sites vitrine, e-commerce, professionnels, scolaires et portfolio. Design moderne, responsive, SEO optimisé.',points:'Site Vitrine : 50 000 – 70 000 FCFA\nSite E-Commerce : 100 000 – 150 000 FCFA\nSite Professionnel : 100 000 – 150 000 FCFA\nSite Scolaire : 150 000 – 300 000 FCFA\nPortfolio / Blog : 5 000 – 10 000 FCFA',filter:'Programmation'},
    {id:'sv2',icon:'📈',title:'Référencement & Visibilité',desc:'SEO & indexation Google, gestion réseaux sociaux, logo & flyers, publicité Facebook/TikTok/Instagram.',points:'SEO & Indexation : 7 000 – 10 000 FCFA\nRéseaux Sociaux : 5 000 – 6 000 FCFA\nLogo & Flyers : 1 000 – 6 000 FCFA\nPublicité en ligne : Sur devis\nGestion de Pages & Comptes Pro',filter:'Autre'},
    {id:'sv3',icon:'💳',title:'Solutions Digitales',desc:'Carte bancaire virtuelle, paiements internationaux, Mobile Money, PayPal, création de comptes pro.',points:'Carte Bancaire Virtuelle : 5 000 – 10 000 FCFA\nPaiements Internationaux : 5 000 – 20 000 FCFA\nMobile Money / PayPal : 5 000 – 7 000 FCFA\nCréation de Comptes Pro : 5 000 – 10 000 FCFA\nIntégration API & Outils : Sur devis',filter:'Autre'},
    {id:'sv4',icon:'🤝',title:'Accompagnement & Suivi',desc:'Hébergement & maintenance, refonte de site, maintenance mensuelle, assistance & support technique.',points:'Hébergement & Maintenance : 10 000 – 25 000 FCFA\nRefonte de Site : 30 000 – 100 000 FCFA\nMaintenance Mensuelle : 10 000 – 25 000 FCFA\nAssistance & Support : Continu',filter:'Autre'},
    {id:'sv5',icon:'💻',title:'Programmation & Projets',desc:'Programmes en C, Java, bases de données, projets académiques, sites dynamiques PHP+BD.',points:'Programmes en C : 10 000 – 30 000 FCFA\nApplications Java : 20 000 – 40 000 FCFA\nGestion Base de Données : 10 000 – 25 000 FCFA\nProjets académiques : 5 000 – 20 000 FCFA\nSites Web Dynamiques PHP+BD : Sur devis',filter:'Programmation'},
    {id:'sv6',icon:'🎨',title:'Design Graphique & Retouche',desc:'Affiches & flyers, cartes & invitations, bannières, retouche photo Photoshop, logos.',points:'Affiches & Flyers : 5 000 – 15 000 FCFA\nCartes & Invitations : 5 000 – 15 000 FCFA\nBannières Réseaux Sociaux : 5 000 – 15 000 FCFA\nRetouche Photoshop : 2 000 – 10 000 FCFA\nCréation de Logos : 5 000 – 15 000 FCFA',filter:'Design'},
    {id:'sv7',icon:'📄',title:'Bureautique & Documents',desc:'Rédaction Word, bases de données Access, présentations PowerPoint, CV professionnels.',points:'Rédaction & Mise en forme Word : 2 000 – 10 000 FCFA\nBase de données Access : 5 000 – 15 000 FCFA\nPrésentation PowerPoint : 5 000 – 20 000 FCFA\nCV Professionnels : 2 000 – 7 000 FCFA\nSaisie de documents & rapports : Sur devis',filter:'Rédaction'},
    {id:'sv8',icon:'🔧',title:'Maintenance Informatique',desc:'Réinstallation Windows, installation logiciels, optimisation PC, sécurité & antivirus.',points:'Réinstallation Windows : 5 000 – 15 000 FCFA\nInstallation logiciels : 5 000 – 10 000 FCFA\nOptimisation & Nettoyage PC : 5 000 – 10 000 FCFA\nSécurité & Antivirus : 5 000 – 10 000 FCFA\nSauvegarde & Récupération : Sur devis',filter:'Autre'},
    {id:'sv9',icon:'📡',title:'Réseaux Informatiques',desc:'Installation & configuration réseau, routeur & switch, câblage réseau & Wi-Fi, dépannage.',points:'Installation & Configuration Réseau\nPartage de fichiers & imprimantes\nConfiguration Routeur & Switch\nCâblage réseau & Wi-Fi\nMaintenance & Dépannage Réseau',filter:'Autre'},
    {id:'sv10',icon:'📱',title:'Gestion des Réseaux Sociaux',desc:'Création de comptes pro, publications, publicité ciblée & boosting, analyse des performances.',points:'Création & Optimisation de comptes pro\nGestion de pages & publications\nPublicité ciblée & boosting (FB, TikTok, IG)\nCréation de contenu attractif\nAnalyse des performances',filter:'Autre'},
    {id:'sv11',icon:'📁',title:'Création de Fichiers Professionnels',desc:'Documents Word, Excel, PPT, PDF, ZIP, images. Rapports, CV, contrats, tableaux, formulaires.',points:'Documents professionnels (rapports, CV, contrats)\nTableaux, présentations, formulaires\nArchivage, conversion et mise en page pro\nFormats : Word, Excel, PPT, PDF, ZIP, Images',filter:'Autre'},
  ];
  save('sc_services',services);
}

// ── Default team ──────────────────────────────────────────────
if(teamMembers.length===0){
  teamMembers=[
    {id:'t1',nom:'Fondateur FEDANI',role:'CEO & Fondateur',desc:'Visionnaire à l\'origine de FEDANI ServiConnect. Passionné par l\'innovation technologique et l\'entrepreneuriat camerounais.',color:'#00aaff',photo:''},
    {id:'t2',nom:'Directrice Technique',role:'CTO',desc:'Responsable de l\'architecture technique de la plateforme. Experte en développement web et intelligence artificielle.',color:'#38bdf8',photo:''},
    {id:'t3',nom:'Responsable Commercial',role:'CMO',desc:'En charge du développement des partenariats et de la croissance de la communauté FEDANI.',color:'#2ecc71',photo:''},
    {id:'t4',nom:'Admin Principal',role:'Administrateur Plateforme',desc:'Garant de la qualité des annonces et de la sécurité de la plateforme. Modération et support utilisateurs.',color:'#3498db',photo:''},
  ];
  save('sc_team',teamMembers);
}

// ── Default partners ──────────────────────────────────────────
if(partners.length===0){
  partners=[
  ];
  save('sc_partners',partners);
}

// ── Default actualités ────────────────────────────────────────
if(actualites.length===0){
  actualites=[
    {id:'a1',title:'FEDANI ServiConnect lance sa plateforme officielle !',summary:'La première plateforme de services étudiants du Cameroun est en ligne.',content:'Après des mois de préparation, FEDANI ServiConnect ouvre officiellement ses portes. La plateforme permet aux étudiants et jeunes professionnels camerounais de proposer et trouver des services dans toutes les catégories : cours, programmation, design, correction, traduction et bien plus.',type:'actu',img:'',author:'Équipe FEDANI',date:Date.now()-7*86400000},
    {id:'a2',title:'Offre d\'emploi : Développeur Full Stack Junior à Douala',summary:'Une startup tech de Douala recrute un développeur pour rejoindre son équipe dynamique.',content:'Une startup innovante basée à Douala recherche un développeur Full Stack Junior maîtrisant React et Node.js. Formation assurée en interne. Salaire attractif selon profil. Envoyez votre CV à fedanisarl1@gmail.com avec l\'objet "Candidature Dev FS".',type:'pro',img:'',author:'Équipe FEDANI',date:Date.now()-3*86400000},
    {id:'a5',title:'Stage : Assistant Marketing Digital — FEDANI SARL',summary:'FEDANI recrute un stagiaire en marketing digital pour une durée de 3 mois.',content:'FEDANI SARL recherche un stagiaire passionné par le marketing digital pour rejoindre son équipe. Missions : gestion des réseaux sociaux, création de contenu, analyse de performance. Durée : 3 mois renouvelables. Contact : fedanisarl1@gmail.com',type:'pro',img:'',author:'Équipe FEDANI',date:Date.now()-4*86400000},
  ];
  save('sc_actualites',actualites);
}


// ════════════════════════════════════════════════════
// 3D INTRO ANIMATION (Three.js)
// ════════════════════════════════════════════════════
function initIntro(){
  var screen=document.getElementById('intro-screen');
  var bar=document.getElementById('intro-bar-fill');
  var canvas=document.getElementById('intro-canvas');
  if(!screen)return;

  // Animation Canvas 2D (fonctionne sans internet)
  if(canvas && canvas.getContext){
    var W=window.innerWidth, H=window.innerHeight;
    canvas.width=W; canvas.height=H;
    var ctx=canvas.getContext('2d');
    var pts=[];
    for(var i=0;i<180;i++){
      pts.push({
        x:Math.random()*W, y:Math.random()*H,
        r:Math.random()*2+0.5,
        vx:(Math.random()-0.5)*1.2, vy:(Math.random()-0.5)*1.2,
        a:Math.random()*Math.PI*2,
        col:Math.random()<0.6?'#00aaff':'#38bdf8'
      });
    }
    var orbs=[
      {r:100,a:0,s:0.012,op:0.12},
      {r:180,a:1,s:0.008,op:0.08},
      {r:260,a:2,s:0.005,op:0.05},
      {r:360,a:3,s:0.003,op:0.04}
    ];
    var fid;
    function draw(){
      fid=requestAnimationFrame(draw);
      ctx.fillStyle='rgba(0,0,0,0.18)';
      ctx.fillRect(0,0,W,H);
      // Orbes
      for(var i=0;i<orbs.length;i++){
        orbs[i].a+=orbs[i].s;
        ctx.beginPath();
        ctx.arc(W/2,H/2,orbs[i].r,0,Math.PI*2);
        ctx.strokeStyle='rgba(245,197,24,'+orbs[i].op*(0.7+0.3*Math.sin(orbs[i].a))+')';
        ctx.lineWidth=1.5;
        ctx.stroke();
      }
      // Particules
      for(var i=0;i<pts.length;i++){
        var p=pts[i];
        p.x+=p.vx; p.y+=p.vy; p.a+=0.015;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        var alpha=0.4+0.4*Math.abs(Math.sin(p.a));
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.col;
        ctx.globalAlpha=alpha;
        ctx.fill();
        ctx.globalAlpha=1;
      }
      // Lueur centrale
      var grd=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,80+15*Math.sin(Date.now()*0.002));
      grd.addColorStop(0,'rgba(245,197,24,0.18)');
      grd.addColorStop(1,'rgba(245,197,24,0)');
      ctx.fillStyle=grd;
      ctx.beginPath();
      ctx.arc(W/2,H/2,90,0,Math.PI*2);
      ctx.fill();
    }
    draw();
    window.addEventListener('resize',function(){W=window.innerWidth;H=window.innerHeight;canvas.width=W;canvas.height=H;});
    window._stopIntroCanvas=function(){cancelAnimationFrame(fid);};
  }

  // Barre de chargement
  var prog=0;
  var barTimer=setInterval(function(){
    prog+=Math.random()*5+1.5;
    if(prog>=100){
      prog=100;
      clearInterval(barTimer);
      if(bar)bar.style.width='100%';
      setTimeout(function(){
        if(window._stopIntroCanvas)window._stopIntroCanvas();
        screen.style.transition='opacity 0.9s ease';
        screen.style.opacity='0';
        setTimeout(function(){screen.style.display='none';},900);
      },500);
      return;
    }
    if(bar)bar.style.width=Math.floor(prog)+'%';
  },70);

  window._finishIntro=function(){
    clearInterval(barTimer);
    if(window._stopIntroCanvas)window._stopIntroCanvas();
    screen.style.transition='opacity 0.7s ease';
    screen.style.opacity='0';
    setTimeout(function(){screen.style.display='none';},700);
  };
}
function skipIntro(){if(window._finishIntro)window._finishIntro();}

// ════════════════════════════════════════════════════
// VISITEURS UNIQUES (fingerprint par localStorage)
// ════════════════════════════════════════════════════
function getVisitorId(){
  let vid=localStorage.getItem('sc_vid');
  if(!vid){
    vid='v_'+(Date.now()).toString(36)+'_'+Math.random().toString(36).slice(2,8);
    localStorage.setItem('sc_vid',vid);
  }
  return vid;
}

function trackVisit(page){
  const vid=getVisitorId();
  const today=new Date().toDateString();
  const key=vid+'_'+today;
  if(!uniqueVisitors[key]){
    uniqueVisitors[key]={vid,date:today,time:Date.now(),user:currentUser?currentUser.nom:'Visiteur'};
    save('sc_unique_visitors',uniqueVisitors);
  }
  const v={id:'vi'+Date.now(),page,time:Date.now(),vid,
    user:currentUser?currentUser.nom:'Visiteur anonyme',
    userId:currentUser?currentUser.id:null,
    ua:navigator.userAgent.substring(0,60)};
  visites.unshift(v);
  if(visites.length>500)visites=visites.slice(0,500);
  save('sc_visites',visites);
  updateStats();
}

// ════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════
// goPage is defined at the bottom after init to include history API support

document.querySelectorAll('.nav-link').forEach(l=>{
  l.addEventListener('click',e=>{e.preventDefault();if(l.dataset.page)goPage(l.dataset.page);});
});

// ── Menu hamburger / Drawer ───────────────────────────────────
function closeMenu(){
  const drawer=document.getElementById('mobileDrawer');
  const overlay=document.getElementById('mobileMenuOverlay');
  const hb=document.getElementById('hamburger');
  if(drawer)drawer.classList.remove('open');
  if(overlay)overlay.classList.remove('open');
  if(hb)hb.classList.remove('open');
}
document.getElementById('hamburger').addEventListener('click',()=>{
  const drawer=document.getElementById('mobileDrawer');
  const overlay=document.getElementById('mobileMenuOverlay');
  const hb=document.getElementById('hamburger');
  const isOpen=drawer.classList.contains('open');
  if(isOpen){closeMenu();}
  else{
    drawer.classList.add('open');
    overlay.classList.add('open');
    hb.classList.add('open');
  }
});
// Drawer nav links
document.querySelectorAll('.drawer-link[data-drawer-page]').forEach(l=>{
  l.addEventListener('click',e=>{e.preventDefault();goPage(l.dataset.drawerPage);});
});

// ════════════════════════════════════════════════════
// AUTHENTIFICATION UI
// ════════════════════════════════════════════════════
function updateAuthUI(){
  const auth=document.getElementById('navAuth');
  const nu=document.getElementById('navUser');
  const badge=document.getElementById('userBadge');
  const av=document.getElementById('navAvatar');
  ['navPublier','navMesAnnonces','navProfil'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.display=currentUser?'inline-flex':'none';
  });
  const adm=document.getElementById('navAdmin');
  if(adm)adm.style.display=(currentUser&&currentUser.role==='admin')?'inline-flex':'none';

  // ── Drawer user links ──
  const drawerUserSection=document.getElementById('drawerUserSection');
  const drawerPublier=document.getElementById('drawerPublier');
  const drawerMesAnnonces=document.getElementById('drawerMesAnnonces');
  const drawerProfil=document.getElementById('drawerProfil');
  const drawerAdmin=document.getElementById('drawerAdmin');
  const drawerAuthBtns=document.getElementById('drawerAuthBtns');
  const drawerUserArea=document.getElementById('drawerUserArea');
  const drawerUserInfo=document.getElementById('drawerUserInfo');

  if(currentUser){
    if(auth)auth.style.display='none';
    if(nu)nu.style.display='flex';
    if(badge)badge.textContent=currentUser.nom.split(' ')[0];
    setAvatar(av,currentUser.avatar,currentUser.nom);
    // Show drawer user links
    if(drawerUserSection)drawerUserSection.style.display='block';
    if(drawerPublier)drawerPublier.style.display='flex';
    if(drawerMesAnnonces)drawerMesAnnonces.style.display='flex';
    if(drawerProfil)drawerProfil.style.display='flex';
    if(drawerAdmin)drawerAdmin.style.display=(currentUser.role==='admin')?'flex':'none';
    if(drawerAuthBtns)drawerAuthBtns.style.display='none';
    if(drawerUserArea)drawerUserArea.style.display='block';
    if(drawerUserInfo){
      const initials=currentUser.nom.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
      const avHTML=currentUser.avatar
        ?`<img src="${currentUser.avatar}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--accent)" onerror="this.outerHTML='<div style=\'width:44px;height:44px;border-radius:50%;background:${colorForName(currentUser.nom)};display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;font-family:var(--fh)\'>${initials}</div>'">`
        :`<div style="width:44px;height:44px;border-radius:50%;background:${colorForName(currentUser.nom)};display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;font-family:var(--fh);font-size:.9rem;border:2px solid var(--accent)">${initials}</div>`;
      drawerUserInfo.innerHTML=`${avHTML}<div style="margin-left:.75rem"><strong style="display:block">${currentUser.nom}</strong><span style="color:var(--text2);font-size:.8rem">${currentUser.email}</span></div>`;
    }
  }else{
    if(auth)auth.style.display='flex';
    if(nu)nu.style.display='none';
    if(drawerUserSection)drawerUserSection.style.display='none';
    if(drawerPublier)drawerPublier.style.display='none';
    if(drawerMesAnnonces)drawerMesAnnonces.style.display='none';
    if(drawerProfil)drawerProfil.style.display='none';
    if(drawerAdmin)drawerAdmin.style.display='none';
    if(drawerAuthBtns)drawerAuthBtns.style.display='block';
    if(drawerUserArea)drawerUserArea.style.display='none';
  }
  updateNotifBell();
  updateFooterSocials();
}

function setAvatar(el,img,name){
  if(!el)return;
  if(img){
    el.style.backgroundImage=`url(${img})`;
    el.style.backgroundSize='cover';
    el.style.backgroundPosition='center';
    el.textContent='';
    el.style.background='';
    el.style.display='flex';
  }else{
    el.style.backgroundImage='none';
    el.style.background=colorForName(name);
    const initials=name?name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase():'?';
    el.textContent=initials;
    Object.assign(el.style,{display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',color:'#000',fontFamily:'var(--fh)',fontSize:'.72rem'});
  }
}
function colorForName(n){
  const c=['#00aaff','#38bdf8','#2ecc71','#3498db','#9b59b6','#e91e63'];
  let h=0;for(let ch of(n||''))h+=ch.charCodeAt(0);return c[h%c.length];
}
// ── Welcome / Retrouvailles ───────────────────────────────────
function showWelcomeModal(type,name){
  const title=document.getElementById('welcomeTitle');
  const msg=document.getElementById('welcomeMsg');
  const anim=document.getElementById('welcomeAnim');
  if(!title)return;
  if(type==='new'){
    anim.textContent='🎉';
    title.textContent='Bienvenue sur FEDANI, '+name.split(' ')[0]+' !';
    msg.innerHTML='Ton compte a été créé avec succès !<br><br>Tu peux maintenant :<br>✅ Publier tes services<br>🔍 Trouver des prestataires<br>👤 Personnaliser ton profil<br>📰 Suivre les actualités<br><br><strong>Bienvenue dans la communauté FEDANI ServiConnect ! 🇨🇲</strong>';
  }else{
    anim.textContent='👋';
    title.textContent='Ravi de te revoir, '+name.split(' ')[0]+' !';
    msg.innerHTML='Content de te retrouver sur FEDANI ServiConnect !<br><br>Des nouvelles t\'attendent peut-être sur la plateforme. Explore les nouvelles annonces et profite de nos offres exclusives.<br><br><strong>Bonne session ! 🚀</strong>';
  }
  document.getElementById('modalWelcome').classList.add('open');
  document.getElementById('welcomeOverlay').style.display='block';
}
function closeWelcome(){
  document.getElementById('modalWelcome').classList.remove('open');
  document.getElementById('welcomeOverlay').style.display='none';
  goPage('home');
}

// ════════════════════════════════════════════════════
// MODALS
// ════════════════════════════════════════════════════
function openModal(name){
  closeModals();
  const id='modal'+name.charAt(0).toUpperCase()+name.slice(1);
  const el=document.getElementById(id);
  if(el)el.classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModals(){
  document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));
  document.getElementById('modalOverlay').classList.remove('open');
}
document.getElementById('btnLogin').addEventListener('click',()=>openModal('login'));
document.getElementById('btnRegister').addEventListener('click',()=>openModal('register'));
document.getElementById('btnLogout').addEventListener('click',()=>window.doLogout&&window.doLogout());

// ── FAQ / Privacy ─────────────────────────────────────────────
function openFAQ(){openModal('FAQ');}
function openPrivacy(){openModal('Privacy');}
function toggleFAQ(el){
  const a=el.nextElementSibling;
  el.classList.toggle('open');
  a.classList.toggle('open');
}

// ════════════════════════════════════════════════════
// AUTHENTIFICATION
// ════════════════════════════════════════════════════
// ════════════════════════════════════════════════════
// PROFIL & AVATAR
// ════════════════════════════════════════════════════
function loadProfilForm(){
  if(!currentUser)return;
  document.getElementById('profilNom').value=currentUser.nom||'';
  document.getElementById('profilEmail').value=currentUser.email||'';
  document.getElementById('profilTel').value=currentUser.tel||'';
  document.getElementById('profilVille').value=currentUser.ville||'';
  document.getElementById('profilBio').value=currentUser.bio||'';
  document.getElementById('profilPass').value='';
  document.getElementById('profilPass2').value='';
  renderProfilAvatarEl();
}

function renderProfilAvatarEl(){
  const el=document.getElementById('profilAvatarBig');
  if(!el||!currentUser)return;
  // Reset
  el.innerHTML='<div class="avatar-overlay"><i class="fa fa-camera"></i></div>';
  el.style.background='';
  el.style.backgroundImage='';
  if(currentUser.avatar){
    const img=document.createElement('img');
    img.src=currentUser.avatar;
    img.alt='Avatar';
    img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;z-index:1';
    img.onerror=()=>{img.remove();showInitialsInProfil(el);};
    el.appendChild(img);
  }else{
    showInitialsInProfil(el);
  }
}

function showInitialsInProfil(el){
  const initials=currentUser.nom?currentUser.nom.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase():'?';
  el.style.background=colorForName(currentUser.nom);
  const span=document.createElement('span');
  span.style.cssText='font-family:var(--fh);font-size:2rem;font-weight:700;color:#000;z-index:0';
  span.textContent=initials;
  el.insertBefore(span,el.querySelector('.avatar-overlay'));
}

// ── Image helpers ─────────────────────────────────────────────
function previewImage(input,prevId,phId,btnId){
  if(!input.files[0])return;
  if(input.files[0].size>2*1024*1024){toast('Image trop lourde (max 2 Mo)','error');return;}
  const r=new FileReader();
  r.onload=e=>{
    const prev=document.getElementById(prevId);
    const ph=document.getElementById(phId);
    const btn=btnId?document.getElementById(btnId):null;
    prev.src=e.target.result;prev.style.display='block';
    if(ph)ph.style.display='none';
    if(btn)btn.style.display='block';
  };
  r.readAsDataURL(input.files[0]);
}
function removeImage(ev,prevId,phId,btnId,inpId){
  ev.stopPropagation();
  const prev=document.getElementById(prevId);
  const ph=document.getElementById(phId);
  const btn=document.getElementById(btnId);
  const inp=document.getElementById(inpId);
  prev.src='';prev.style.display='none';
  if(ph)ph.style.display='flex';
  if(btn)btn.style.display='none';
  if(inp)inp.value='';
}
function openImgViewer(src){
  document.getElementById('imgViewerImg').src=src;
  document.getElementById('imgViewer').classList.add('open');
}
function closeImgViewer(){document.getElementById('imgViewer').classList.remove('open');}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeImgViewer();});

// ════════════════════════════════════════════════════
// PUBLIER ANNONCE
// ════════════════════════════════════════════════════
function showPublierForm(){
  const req=document.getElementById('authRequired');
  const form=document.getElementById('publierForm');
  if(currentUser){req.style.display='none';form.style.display='block';}
  else{req.style.display='flex';form.style.display='none';}
}

// ════════════════════════════════════════════════════
// CARTE ANNONCE
// ════════════════════════════════════════════════════
// ── Sécurité : les annonces viennent d'autres utilisateurs → on échappe tout ──
const escAttr=t=>String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const CLOUD_RE=/^https:\/\/res\.cloudinary\.com\/pduc9l0x\/[A-Za-z0-9_\/.,:%~+=-]+$/;
const safeImgUrl=u=>(typeof u==='string'&&CLOUD_RE.test(u))?u:'';
function safeAnnonce(a){
  const s=escAttr;
  return Object.assign({},a,{
    id:String(a.id||'').replace(/[^A-Za-z0-9_-]/g,''),
    titre:s(a.titre),desc:s(a.desc),categorie:s(a.categorie),ville:s(a.ville),quartier:s(a.quartier),
    prix:s(a.prix),mode:s(a.mode),tel:String(a.tel||'').replace(/[^0-9+() \-]/g,''),email:s(a.email),
    paiement:s(a.paiement),dispo:s(a.dispo),tags:s(a.tags),auteur:s(a.auteur||'Anonyme'),
    img:safeImgUrl(a.img),auteurAvatar:safeImgUrl(a.auteurAvatar)
  });
}

function annonceCard(a0,mode='public'){
  const a=safeAnnonce(a0);
  const icon=CAT_ICONS[a.categorie]||'⚡';
  const bgImg=CAT_BG[a.categorie]||'';
  const waNum=(a.tel||'').replace(/\D/g,'');
  const waLink=`https://wa.me/237${waNum}?text=Bonjour,%20j'ai%20vu%20votre%20annonce%20"${encodeURIComponent(a0.titre)}"%20sur%20FEDANI%20ServiConnect.`;
  const dateStr=new Date(a.date).toLocaleDateString('fr-FR');
  const tags=(a.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
  const likes=a.likes||[];const comments=a.comments||[];
  const userLiked=currentUser&&likes.includes(currentUser.id);

  const imgHtml=a.img
    ?`<img class="card-img" src="${a.img}" alt="${a.titre}" onclick="event.stopPropagation();openImgViewer('${a.img.replace(/'/g,"\\'")}')" onerror="this.outerHTML='<div class=card-img-placeholder style=background-image:url(${bgImg});background-size:cover;background-position:center>${icon}</div>'"/>`
    :`<div class="card-img-placeholder" style="${bgImg?`background-image:url(${bgImg});background-size:cover;background-position:center`:''}">${bgImg?'':icon}</div>`;

  const tagsHtml=tags.length?`<div class="card-tags">${tags.map(t=>`<span class="tag-pill">${t}</span>`).join('')}</div>`:'';
  const modeHtml=a.mode?`<span class="card-mode">• ${a.mode}</span>`:'';
  const hiddenBadge=!a.visible?`<div class="card-hidden-badge">🙈 Masquée</div>`:'';
  const clickHandler=(mode==='public'||mode==='mine')?`onclick="showDetail('${a.id}')"`:'' ;

  let actionsHtml='';
  if(mode==='public'){
    actionsHtml=`<div class="card-actions">
      <a href="${waLink}" target="_blank" rel="noopener" class="btn-whatsapp" onclick="event.stopPropagation()"><i class="fab fa-whatsapp"></i> WhatsApp</a>
      <a href="tel:${a.tel}" class="btn-tel" onclick="event.stopPropagation()"><i class="fa fa-phone"></i> ${a.tel}</a>
    </div>`;
  }else if(mode==='mine'){
    actionsHtml=`<div class="card-actions">
      <a href="${waLink}" target="_blank" rel="noopener" class="btn-whatsapp" onclick="event.stopPropagation()"><i class="fab fa-whatsapp"></i></a>
    </div>
    <div class="card-manage-actions">
      <button class="btn-edit" onclick="event.stopPropagation();openEdit('${a.id}','mine')">✏️ Modifier</button>
      <button class="btn-danger" onclick="event.stopPropagation();deleteAnnonce('${a.id}','mine')">🗑️</button>
    </div>`;
  }else if(mode==='admin'){
    actionsHtml=`<div class="card-actions">
      <a href="${waLink}" target="_blank" rel="noopener" class="btn-whatsapp" onclick="event.stopPropagation()"><i class="fab fa-whatsapp"></i></a>
      <a href="tel:${a.tel}" class="btn-tel" onclick="event.stopPropagation()"><i class="fa fa-phone"></i> ${a.tel}</a>
    </div>
    <div class="card-manage-actions">
      <button class="btn-edit" onclick="event.stopPropagation();openEdit('${a.id}','admin')">✏️</button>
      <button class="btn-danger" onclick="event.stopPropagation();deleteAnnonce('${a.id}','admin')">🗑️</button>
    </div>`;
  }

  // Social interactions (likes, comments, share)
  const socialHtml=mode!=='admin'?`
    <div class="card-social" onclick="event.stopPropagation()">
      <button class="social-action${userLiked?' liked':''}" onclick="toggleLike('${a.id}',this)">
        <i class="${userLiked?'fas':'fa'} fa-heart"></i> <span>${likes.length}</span>
      </button>
      <button class="social-action" onclick="toggleComments('${a.id}',this)">
        <i class="fa fa-comment"></i>
        <span class="comment-count-pill">${comments.length} commentaire${comments.length!==1?'s':''}</span>
      </button>
      <div style="position:relative;margin-left:auto">
        <button class="social-action" data-t="${a.titre}" data-u="${a.id}" onclick="openShareModal(this.dataset.t,location.href.split('#')[0]+'#'+this.dataset.u)"><i class="fa fa-share-nodes"></i></button>
      </div>
    </div>
    <div class="comments-section" id="comments-${a.id}">
      <div id="comments-list-${a.id}">${buildCommentsList(a)}</div>
      ${currentUser
        ?`<div class="comment-input-row"><input type="text" id="cmt-${a.id}" placeholder="Écrire un commentaire..." onclick="event.stopPropagation()"/><button onclick="event.stopPropagation();addComment('${a.id}')">↩</button></div>`
        :'<p style="color:var(--text2);font-size:.78rem;text-align:center;padding:.25rem"><a href="#" onclick="openModal(\'login\')" style="color:var(--accent)">Connecte-toi</a> pour commenter</p>'}
    </div>`:'';

  return `<div class="annonce-card" ${clickHandler} style="animation-delay:${Math.random()*.2}s">
    ${imgHtml}
    <div class="card-top">
      <div class="card-icon">${icon}</div>
      <div class="card-meta"><div class="card-cat">${a.categorie}</div><div class="card-title">${a.titre}</div></div>
    </div>
    <div class="card-body"><p class="card-desc">${a.desc}</p></div>
    ${tagsHtml}
    <div class="card-footer">
      <span class="card-tag">📍 ${a.ville}${a.quartier?', '+a.quartier:''}</span>
      ${modeHtml}
      <span class="card-tag">📅 ${dateStr}</span>
      <span class="card-price">${a.prix}</span>
    </div>
    ${actionsHtml}
    ${socialHtml}
    ${hiddenBadge}
    <div class="card-owner">👤 ${a.auteur}</div>
  </div>`;
}

function buildCommentsList(a){
  if(!a.comments||!a.comments.length)return '';
  return a.comments.slice(-3).map(c=>`
    <div class="comment-item">
      <div class="comment-av" style="background:${colorForName(c.author)};color:#000">${escHtml((c.author||'?')[0].toUpperCase())}</div>
      <div class="comment-bubble">
        <div class="comment-author">${escHtml(c.author)}</div>
        <div class="comment-text">${escHtml(c.text)}</div>
        <div class="comment-time">${new Date(c.date).toLocaleDateString('fr-FR')}</div>
      </div>
    </div>`).join('');
}

function escHtml(t){return (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function toggleLike(id,btn){
  if(!currentUser){openModal('login');return;}
  const a=annonces.find(x=>x.id===id);if(!a)return;
  if(!a.likes)a.likes=[];
  const idx=a.likes.indexOf(currentUser.id);
  if(idx===-1){
    a.likes.push(currentUser.id);
    btn.classList.add('liked');
    btn.querySelector('i').className='fas fa-heart';
    // notify owner
    if(a.userId!==currentUser.id){
      addNotification(a.userId,'❤️ '+currentUser.nom+' a aimé votre annonce "'+a.titre+'"','like',id);
    }
  }else{
    a.likes.splice(idx,1);
    btn.classList.remove('liked');
    btn.querySelector('i').className='fa fa-heart';
  }
  btn.querySelector('span').textContent=a.likes.length;
  if(window.FB&&FB.toggleLike)FB.toggleLike(id,idx===-1);
}

function toggleComments(id,btn){
  const s=document.getElementById('comments-'+id);
  if(s){
    const isOpen=s.classList.toggle('open');
    // Update count pill text
    if(btn){
      const pill=btn.querySelector('.comment-count-pill');
      if(pill){
        const a=annonces.find(x=>x.id===id);
        const cnt=(a&&a.comments)?a.comments.length:0;
        pill.textContent=isOpen?`${cnt} commentaire${cnt!==1?'s':''} — Fermer`:`${cnt} commentaire${cnt!==1?'s':''}`;
      }
    }
  }
}

// ── Share modal ────────────────────────────────────────────────
function openShareModal(title,url){
  const shareUrl=url||window.location.href;
  const encoded=encodeURIComponent(shareUrl);
  const encodedTitle=encodeURIComponent(title||'FEDANI ServiConnect');
  const platforms=[
    {name:'WhatsApp',icon:'<i class="fab fa-whatsapp" style="color:#25d366;font-size:2rem"></i>',href:`https://wa.me/?text=${encodedTitle}%20%E2%80%94%20${encoded}`},
    {name:'Facebook',icon:'<i class="fab fa-facebook" style="color:#1877f2;font-size:2rem"></i>',href:`https://www.facebook.com/sharer/sharer.php?u=${encoded}`},
    {name:'Telegram',icon:'<i class="fab fa-telegram" style="color:#0088cc;font-size:2rem"></i>',href:`https://t.me/share/url?url=${encoded}&text=${encodedTitle}`},
    {name:'Twitter / X',icon:'<i class="fab fa-x-twitter" style="color:#e7e7e7;font-size:2rem"></i>',href:`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`},
    {name:'Email',icon:'<i class="fa fa-envelope" style="color:var(--accent2);font-size:2rem"></i>',href:`mailto:?subject=${encodedTitle}&body=Regarde%20sur%20FEDANI%20%3A%20${encoded}`},
    {name:'LinkedIn',icon:'<i class="fab fa-linkedin" style="color:#0a66c2;font-size:2rem"></i>',href:`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`},
  ];
  document.getElementById('shareModalGrid').innerHTML=platforms.map(p=>`<a class="share-modal-btn" href="${p.href}" target="_blank" rel="noopener">${p.icon}<span class="share-modal-label">${p.name}</span></a>`).join('');
  document.getElementById('shareLinkInput').value=shareUrl;
  openModal('share');
}
function copyShareLink(){
  const inp=document.getElementById('shareLinkInput');
  if(inp){navigator.clipboard.writeText(inp.value).then(()=>toast('Lien copié !','success')).catch(()=>toast(inp.value,'info'));}
}
function toggleShare(id,ev){
  // Legacy — now redirects to modal
  ev.stopPropagation();
  const a=annonces.find(x=>x.id===id);
  openShareModal(a?a.titre:'',window.location.href+'#'+id);
}
function copyToClipboard(text){
  navigator.clipboard.writeText(text)
    .then(()=>toast('Lien copié dans le presse-papier !','success'))
    .catch(()=>toast('Lien : '+text,'info'));
}


function addComment(id){
  if(!currentUser){openModal('login');return;}
  const input=document.getElementById('cmt-'+id);
  if(!input||!input.value.trim())return;
  const a=annonces.find(x=>x.id===id);if(!a)return;
  if(!a.comments)a.comments=[];
  const c={id:'c'+Date.now(),author:currentUser.nom,userId:currentUser.id,text:input.value.trim(),date:Date.now()};
  a.comments.push(c);if(window.FB&&FB.addComment)FB.addComment(id,c);
  input.value='';
  const list=document.getElementById('comments-list-'+id);
  if(list)list.innerHTML=buildCommentsList(a);
  // Update comment count
  const countSpan=document.querySelector(`#comments-${id}`).previousElementSibling?.querySelector('.social-action:nth-child(2) span');
  if(countSpan)countSpan.textContent=a.comments.length;
  if(a.userId!==currentUser.id){
    addNotification(a.userId,'💬 '+currentUser.nom+' a commenté votre annonce "'+a.titre+'"','comment',id);
  }
  toast('Commentaire ajouté !','success');
}

// ════════════════════════════════════════════════════
// PAGE DÉTAIL
// ════════════════════════════════════════════════════
function showDetail(id,noPush){
  if(!noPush){saveScroll();try{history.pushState({page:'detail',id},'',window.location.pathname+'#detail-'+id);}catch(e){}}
  const a0=annonces.find(x=>x.id===id);if(!a0)return;const a=safeAnnonce(a0);
  const icon=CAT_ICONS[a.categorie]||'⚡';
  const bgImg=CAT_BG[a.categorie]||'';
  const waNum=(a.tel||'').replace(/\D/g,'');
  const waLink=`https://wa.me/237${waNum}?text=Bonjour,%20j'ai%20vu%20votre%20annonce%20"${encodeURIComponent(a0.titre)}"%20sur%20FEDANI%20ServiConnect.`;
  const tags=(a.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
  const authorUser={avatar:a.auteurAvatar||'',bio:''};
  const authorColor=colorForName(a.auteur);
  const imgHtml=a.img
    ?`<img class="detail-img-hero" src="${a.img}" alt="${a.titre}" onclick="openImgViewer('${a.img.replace(/'/g,"\\'")}')" onerror="this.outerHTML='<div class=detail-img-placeholder>${icon}</div>'"  />`
    :`<div class="detail-img-placeholder" style="${bgImg?`background-image:url(${bgImg});background-size:cover;background-position:center`:''}">${bgImg?'':icon}</div>`;

  let avHtml;
  if(authorUser&&authorUser.avatar){
    avHtml=`<div class="author-av" style="background:transparent"><img src="${authorUser.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentNode.innerHTML='${a.auteur[0]}';this.parentNode.style.background='${authorColor}';this.parentNode.style.color='#000'"/></div>`;
  }else{
    avHtml=`<div class="author-av" style="background:${authorColor};color:#000">${a.auteur[0].toUpperCase()}</div>`;
  }

  const tagsHtml=tags.length?`<div class="detail-tags">${tags.map(t=>`<span class="tag-pill">${t}</span>`).join('')}</div>`:'';
  const payHtml=a.paiement?`<div class="detail-pay-card"><h4>💳 Paiement accepté</h4><span class="pay-pill">${a.paiement}</span></div>`:'';

  const commentsHtml=(a.comments||[]).map(c=>`
    <div class="comment-item">
      <div class="comment-av" style="background:${colorForName(c.author)};color:#000">${escHtml((c.author||'?')[0].toUpperCase())}</div>
      <div class="comment-bubble">
        <div class="comment-author">${escHtml(c.author)}</div>
        <div class="comment-text">${escHtml(c.text)}</div>
        <div class="comment-time">${new Date(c.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}</div>
      </div>
    </div>`).join('')||'<p style="color:var(--text2);text-align:center;padding:1rem">Soyez le premier à commenter !</p>';

  document.getElementById('detailContent').innerHTML=`
    <div class="detail-wrap">
      <button class="detail-back" onclick="goBackSmart('${_prevPage}')">← Retour</button>
      ${imgHtml}${a.img?dlBtn(a.img,a.titre):''}
      <div class="detail-grid">
        <div class="detail-main">
          <div class="detail-cat-badge">${icon} ${a.categorie}</div>
          <h1>${a.titre}</h1>
          ${tagsHtml}
          <p class="detail-desc">${(a.desc||'').replace(/\n/g,'<br>')}</p>
          <div class="detail-info-grid">
            <div class="detail-info-item"><label>📍 Localisation</label><strong>${a.ville}${a.quartier?', '+a.quartier:''}</strong></div>
            <div class="detail-info-item"><label>💰 Prix</label><strong style="color:var(--accent)">${a.prix}</strong></div>
            ${a.mode?`<div class="detail-info-item"><label>🖥️ Mode</label><strong>${a.mode}</strong></div>`:''}
            ${a.dispo?`<div class="detail-info-item"><label>🕐 Disponibilité</label><strong>${a.dispo}</strong></div>`:''}
            <div class="detail-info-item"><label>📅 Publiée le</label><strong>${new Date(a.date).toLocaleDateString('fr-FR')}</strong></div>
            ${a.email?`<div class="detail-info-item"><label>📧 Email</label><strong>${a.email}</strong></div>`:''}
          </div>
          <div class="detail-comments">
            <h3>💬 Commentaires (${(a.comments||[]).length})</h3>
            <div id="detail-cmts">${commentsHtml}</div>
            ${currentUser
              ?`<div class="comment-input-row" style="margin-top:1rem"><input type="text" id="detail-cmt-inp" placeholder="Laisser un commentaire..."/><button onclick="addDetailComment('${a.id}')">Envoyer</button></div>`
              :`<p style="color:var(--text2);font-size:.85rem;text-align:center;margin-top:1rem"><a href="#" onclick="openModal('login')" style="color:var(--accent)">Connecte-toi</a> pour commenter</p>`}
          </div>
        </div>
        <div class="detail-sidebar">
          <div class="detail-contact-card">
            <h3>Contacter le prestataire</h3>
            <div class="author">${avHtml}
              <div><strong>${a.auteur}</strong><br><small style="color:var(--text2)">${authorUser&&authorUser.bio?authorUser.bio.substring(0,60)+'…':'Prestataire FEDANI'}</small></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.6rem">
              <a href="${waLink}" target="_blank" rel="noopener" class="btn-whatsapp" style="justify-content:center;padding:.75rem"><i class="fab fa-whatsapp"></i> Contacter WhatsApp</a>
              <a href="tel:${a.tel}" class="btn-tel" style="justify-content:center;padding:.75rem"><i class="fa fa-phone"></i> Appeler : ${a.tel}</a>
              ${a.email?`<a href="mailto:${a.email}" class="btn-tel" style="justify-content:center;padding:.75rem"><i class="fa fa-envelope"></i> Email</a>`:''}
              <button class="btn-primary" onclick="openPaiement('${a.id}')" style="width:100%;padding:.75rem"><i class="fa fa-credit-card"></i> Voir les paiements</button>
            </div>
          </div>
          ${payHtml}
          <div class="detail-pay-card">
            <h4>🔒 Paiements sécurisés</h4>
            <span class="pay-pill">MTN MoMo</span><span class="pay-pill">Orange Money</span>
            <span class="pay-pill">Express Union</span><span class="pay-pill">Cash</span>
          </div>
        </div>
      </div>
    </div>`;
  goPage('detail');
}

function addDetailComment(id){
  if(!currentUser){openModal('login');return;}
  const input=document.getElementById('detail-cmt-inp');
  if(!input||!input.value.trim())return;
  const a=annonces.find(x=>x.id===id);if(!a)return;
  if(!a.comments)a.comments=[];
  const c={id:'c'+Date.now(),author:currentUser.nom,userId:currentUser.id,text:input.value.trim(),date:Date.now()};
  a.comments.push(c);if(window.FB&&FB.addComment)FB.addComment(id,c);
  input.value='';
  const list=document.getElementById('detail-cmts');
  if(list){
    const div=document.createElement('div');div.className='comment-item';
    div.innerHTML=`<div class="comment-av" style="background:${colorForName(c.author)};color:#000">${escHtml((c.author||'?')[0].toUpperCase())}</div><div class="comment-bubble"><div class="comment-author">${escHtml(c.author)}</div><div class="comment-text">${escHtml(c.text)}</div><div class="comment-time">${new Date(c.date).toLocaleDateString('fr-FR')}</div></div>`;
    list.appendChild(div);list.scrollTop=list.scrollHeight;
  }
  if(a.userId!==currentUser.id){
    addNotification(a.userId,'💬 '+currentUser.nom+' a commenté votre annonce "'+a.titre+'"','comment',id);
  }
  toast('Commentaire envoyé !','success');
}

function openPaiement(annonceId){
  const a=annonces.find(x=>x.id===annonceId);if(!a)return;
  document.getElementById('paiementContent').innerHTML=`
    <p style="color:var(--text2);margin-bottom:1.5rem">Contacte <strong>${a.auteur}</strong> pour convenir du paiement :</p>
    <div style="display:flex;flex-direction:column;gap:.75rem">
      <div class="pay-option"><span>📱</span><div><strong>MTN Mobile Money</strong><p>Envoie au <strong>${a.tel}</strong> via MTN MoMo.</p></div></div>
      <div class="pay-option"><span>🔵</span><div><strong>Orange Money</strong><p>Transfert au <strong>${a.tel}</strong>.</p></div></div>
      <div class="pay-option"><span>💛</span><div><strong>Express Union</strong><p>Au nom de <strong>${a.auteur}</strong>.</p></div></div>
      <div class="pay-option"><span>💵</span><div><strong>Cash</strong><p>En main propre lors de la prestation.</p></div></div>
    </div>
    <p style="color:var(--text2);font-size:.82rem;margin-top:1.25rem">⚠️ Toujours confirmer le service avant tout paiement.</p>`;
  document.querySelectorAll('.pay-option').forEach(el=>{
    Object.assign(el.style,{display:'flex',gap:'.75rem',alignItems:'flex-start',background:'var(--bg3)',padding:'1rem',borderRadius:'10px',border:'1px solid var(--border)',marginBottom:'.5rem'});
    el.querySelector('span').style.fontSize='1.8rem';
    el.querySelector('strong').style.display='block';
    el.querySelector('p').style.cssText='color:var(--text2);font-size:.85rem;margin-top:.2rem';
  });
  openModal('paiement');
}

// ════════════════════════════════════════════════════
// HOME
// ════════════════════════════════════════════════════
function renderHomeAnnonces(){
  const grid=document.getElementById('homeAnnonces');
  const list=annonces.filter(a=>a.visible).slice(0,6);
  grid.innerHTML=list.length?list.map(a=>annonceCard(a)).join(''):'<p style="color:var(--text2);padding:2rem;text-align:center">Aucune annonce pour le moment.</p>';
  const cg=document.getElementById('categoriesGrid');
  if(cg)cg.innerHTML=Object.entries(CAT_ICONS).map(([cat,ico])=>{
    const bg=CAT_BG[cat]||'';
    return `<div class="cat-card" onclick="filterCategory('${cat}')">
      ${bg?`<div class="cat-card-bg" style="background-image:url(${bg})"></div>`:''}
      <div class="cat-card-content">
        <span>${ico}</span><p>${cat}</p>
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════════════
// ANNONCES
// ════════════════════════════════════════════════════
function renderAnnonces(){
  const search=(document.getElementById('searchInput')?.value||'').toLowerCase();
  const cat=document.getElementById('filterCat')?.value||'';
  const ville=document.getElementById('filterVille')?.value||'';
  const mode=document.getElementById('filterMode')?.value||'';
  const sort=document.getElementById('filterSort')?.value||'date';
  let list=annonces.filter(a=>a.visible);
  if(search)list=list.filter(a=>a.titre.toLowerCase().includes(search)||a.desc.toLowerCase().includes(search)||(a.tags||'').toLowerCase().includes(search));
  if(cat)list=list.filter(a=>a.categorie===cat);
  if(ville)list=list.filter(a=>a.ville===ville);
  if(mode)list=list.filter(a=>a.mode===mode);
  if(sort==='alpha')list.sort((a,b)=>a.titre.localeCompare(b.titre));
  else if(sort==='ville')list.sort((a,b)=>(a.ville||'').localeCompare(b.ville||''));
  else list.sort((a,b)=>b.date-a.date);
  const grid=document.getElementById('annoncesGrid');
  const empty=document.getElementById('emptyAnnonces');
  if(!list.length){grid.innerHTML='';empty.style.display='flex';}
  else{empty.style.display='none';grid.innerHTML=list.map(a=>annonceCard(a)).join('');}
}
function filterCategory(cat){
  goPage('annonces');
  setTimeout(()=>{
    const el=document.getElementById('filterCat');
    if(el)el.value=cat;
    renderAnnonces();
  },80);
}

// ════════════════════════════════════════════════════
// MES ANNONCES
// ════════════════════════════════════════════════════
function renderMesAnnonces(){
  if(!currentUser)return;
  const list=annonces.filter(a=>a.userId===currentUser.id).sort((a,b)=>b.date-a.date);
  const grid=document.getElementById('mesAnnoncesGrid');
  const empty=document.getElementById('emptyMesAnnonces');
  if(!list.length){grid.innerHTML='';empty.style.display='flex';}
  else{empty.style.display='none';grid.innerHTML=list.map(a=>annonceCard(a,'mine')).join('');}
}

// ── Edit annonce ──────────────────────────────────────────────
let _editMode='mine';
function openEdit(id,mode='mine'){
  _editMode=mode;const a=annonces.find(x=>x.id===id);if(!a)return;
  document.getElementById('editId').value=id;
  document.getElementById('editTitre').value=a.titre;
  document.getElementById('editCategorie').value=a.categorie;
  document.getElementById('editDesc').value=a.desc;
  document.getElementById('editVille').value=a.ville;
  document.getElementById('editQuartier').value=a.quartier||'';
  document.getElementById('editPrix').value=a.prix;
  document.getElementById('editMode').value=a.mode||'';
  document.getElementById('editTel').value=a.tel;
  document.getElementById('editEmail').value=a.email||'';
  document.getElementById('editPaiement').value=a.paiement||'';
  document.getElementById('editDispo').value=a.dispo||'';
  document.getElementById('editTags').value=a.tags||'';
  document.getElementById('editVisible').value=String(a.visible);
  const prev=document.getElementById('editImgPreview');
  const ph=document.getElementById('editImgPlaceholder');
  const btn=document.getElementById('editImgRemoveBtn');
  if(a.img){prev.src=a.img;prev.style.display='block';ph.style.display='none';btn.style.display='block';}
  else{prev.src='';prev.style.display='none';ph.style.display='flex';btn.style.display='none';}
  document.getElementById('editImgInput').value='';
  openModal('edit');
}
// ════════════════════════════════════════════════════
// SERVICES
// ════════════════════════════════════════════════════
function renderServices(){
  const grid=document.getElementById('servicesBigGrid');if(!grid)return;
  grid.innerHTML=services.map(s=>{
    const bg=CAT_BG[s.filter]||CAT_BG[s.title]||'';
    const imgHtml=s.img
      ?`<img class="sbc-img" src="${s.img}" alt="${s.title}" onerror="this.style.display='none'">`
      :(bg?`<div class="sbc-img" style="background-image:url(${bg});background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;font-size:3rem">${s.icon}</div>`:`<div class="sbc-icon">${s.icon}</div>`);
    return `<div class="service-big-card">
      ${imgHtml}
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
      <ul>${(s.points||'').split('\n').filter(Boolean).map(p=>`<li>${p}</li>`).join('')}</ul>
      <button class="btn-primary" onclick="openService('${escHtml(s.id)}')">Voir l'offre</button>
    </div>`;
  }).join('');
}
function openAddService(){
  document.getElementById('serviceModalTitle').textContent='➕ Ajouter un service';
  document.getElementById('serviceId').value='';
  ['serviceIcon','serviceTitle','serviceDesc','servicePoints','serviceImg','serviceLong'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('serviceFilter').value='Cours';
  openModal('service');
}
function openEditService(id){
  const s=services.find(x=>x.id===id);if(!s)return;
  document.getElementById('serviceModalTitle').textContent='✏️ Modifier le service';
  document.getElementById('serviceId').value=id;
  document.getElementById('serviceIcon').value=s.icon;
  document.getElementById('serviceTitle').value=s.title;
  document.getElementById('serviceDesc').value=s.desc;
  document.getElementById('servicePoints').value=s.points||'';const lg=document.getElementById('serviceLong');if(lg)lg.value=s.long||'';
  document.getElementById('serviceFilter').value=s.filter||'Cours';
  const imgEl=document.getElementById('serviceImg');if(imgEl)imgEl.value=s.img||'';
  openModal('service');
}
function saveService(e){
  e.preventDefault();
  const id=document.getElementById('serviceId').value;
  const imgEl=document.getElementById('serviceImg');
  const data={
    icon:document.getElementById('serviceIcon').value.trim(),
    title:document.getElementById('serviceTitle').value.trim(),
    desc:document.getElementById('serviceDesc').value.trim(),
    points:document.getElementById('servicePoints').value.trim(),
    filter:document.getElementById('serviceFilter').value.trim(),
    img:imgEl?imgEl.value.trim():'',
    long:(document.getElementById('serviceLong')||{value:''}).value.trim()
  };
  if(id){const idx=services.findIndex(x=>x.id===id);if(idx!==-1)services[idx]={...services[idx],...data};}
  else{services.push({id:'s'+Date.now(),...data});}
  save('sc_services',services);closeModals();renderServicesAdmin();
  toast('Service sauvegardé !','success');
}
function deleteService(id){
  if(!confirm('Supprimer ce service ?'))return;
  services=services.filter(x=>x.id!==id);save('sc_services',services);renderServicesAdmin();toast('Supprimé.','info');
}
function renderServicesAdmin(){
  const grid=document.getElementById('servicesAdminGrid');if(!grid)return;
  grid.innerHTML=services.map(s=>{
    const bg=s.img||CAT_BG[s.filter]||'';
    return `<div class="service-big-card" style="margin:0">
      ${bg?`<img src="${bg}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:.75rem" onerror="this.style.display='none'">`:''}
      <div class="sbc-icon">${s.icon}</div>
      <h3>${s.title}</h3>
      <p style="font-size:.85rem;margin-bottom:.5rem">${s.desc}</p>
      <div class="service-admin-actions">
        <button class="btn-edit" onclick="openEditService('${s.id}')">✏️ Modifier</button>
        <button class="btn-danger" onclick="deleteService('${s.id}')">🗑️ Supprimer</button>
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════════════
// ÉQUIPE
// ════════════════════════════════════════════════════
function renderTeam(){
  const grid=document.getElementById('teamGrid');if(!grid)return;
  grid.innerHTML=teamMembers.map(m=>{
    const initial=m.nom[0].toUpperCase();
    const textColor=m.color==='#00aaff'?'#000':'#fff';
    let avHtml;
    if(m.photo){
      avHtml=`<div class="team-avatar" style="background:${m.color}"><img src="${m.photo}" alt="${m.nom}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.innerHTML='<span style=font-size:1.8rem;font-weight:700;color:${textColor}>${initial}</span>';"/></div>`;
    }else{
      avHtml=`<div class="team-avatar" style="background:${m.color};color:${textColor};font-size:1.8rem">${initial}</div>`;
    }
    return `<div class="team-card">${avHtml}<h4>${m.nom}</h4><p class="team-role">${m.role}</p><p class="team-desc">${m.desc||''}</p></div>`;
  }).join('');
}
function renderTeamAdmin(){
  const grid=document.getElementById('teamAdminGrid');if(!grid)return;
  grid.innerHTML=teamMembers.map(m=>{
    const initial=m.nom[0].toUpperCase();
    const textColor=m.color==='#00aaff'?'#000':'#fff';
    return `<div class="team-card" style="margin:0">
      <div class="team-avatar" style="background:${m.color};color:${textColor};font-size:1.5rem">${m.photo?`<img src="${m.photo}" style="width:100%;height:100%;object-fit:cover"/>`:initial}</div>
      <h4>${m.nom}</h4><p class="team-role">${m.role}</p>
      <div style="display:flex;gap:.5rem;margin-top:1rem;justify-content:center">
        <button class="btn-edit" onclick="openEditTeamMember('${m.id}')">✏️ Modifier</button>
        <button class="btn-danger" onclick="deleteTeamMember('${m.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}
function previewTeamPhoto(input){
  if(!input.files[0])return;
  const r=new FileReader();
  r.onload=e=>{
    const preview=document.getElementById('teamPhotoPreview');
    const wrap=document.getElementById('teamPhotoPreviewWrap');
    if(preview){preview.src=e.target.result;wrap.style.display='block';}
    document.getElementById('teamPhoto').value=''; // clear URL input
    window._pendingTeamPhoto=e.target.result;
    toast('Photo chargée. Sauvegarde pour confirmer.','info');
  };
  r.readAsDataURL(input.files[0]);
}

function openAddTeamMember(){
  document.getElementById('teamModalTitle').textContent='➕ Ajouter un membre';
  document.getElementById('teamMemberId').value='';
  ['teamNom','teamRole','teamDesc','teamPhoto'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('teamColor').value='#00aaff';
  const pw=document.getElementById('teamPhotoPreviewWrap');if(pw)pw.style.display='none';
  const pf=document.getElementById('teamPhotoFile');if(pf)pf.value='';
  window._pendingTeamPhoto=null;
  openModal('team');
}
function openEditTeamMember(id){
  const m=teamMembers.find(x=>x.id===id);if(!m)return;
  document.getElementById('teamModalTitle').textContent='✏️ Modifier le membre';
  document.getElementById('teamMemberId').value=id;
  document.getElementById('teamNom').value=m.nom;
  document.getElementById('teamRole').value=m.role;
  document.getElementById('teamDesc').value=m.desc||'';
  document.getElementById('teamColor').value=m.color||'#00aaff';
  document.getElementById('teamPhoto').value=m.photo&&!m.photo.startsWith('data:')?m.photo:'';
  const pw=document.getElementById('teamPhotoPreviewWrap');
  const pp=document.getElementById('teamPhotoPreview');
  if(m.photo&&pw&&pp){pw.style.display='block';pp.src=m.photo;}
  else if(pw){pw.style.display='none';}
  const pf=document.getElementById('teamPhotoFile');if(pf)pf.value='';
  window._pendingTeamPhoto=null;
  openModal('team');
}
function saveTeamMember(e){
  e.preventDefault();
  const id=document.getElementById('teamMemberId').value;
  let photo=window._pendingTeamPhoto||document.getElementById('teamPhoto').value.trim();
  window._pendingTeamPhoto=null;
  const data={
    nom:document.getElementById('teamNom').value.trim(),
    role:document.getElementById('teamRole').value.trim(),
    desc:document.getElementById('teamDesc').value.trim(),
    color:document.getElementById('teamColor').value,
    photo
  };
  if(id){const idx=teamMembers.findIndex(x=>x.id===id);if(idx!==-1)teamMembers[idx]={...teamMembers[idx],...data};}
  else{teamMembers.push({id:'t'+Date.now(),...data});}
  save('sc_team',teamMembers);closeModals();renderTeamAdmin();
  toast('Membre sauvegardé !','success');
}
function deleteTeamMember(id){
  if(!confirm('Supprimer ce membre ?'))return;
  teamMembers=teamMembers.filter(x=>x.id!==id);save('sc_team',teamMembers);renderTeamAdmin();toast('Supprimé.','info');
}

// ════════════════════════════════════════════════════
// PARTENAIRES
// ════════════════════════════════════════════════════
function renderPartenaires(){
  const grid=document.getElementById('partenairesGrid');if(!grid)return;
  grid.innerHTML=partners.map(p=>{
    let logoHtml;
    if(p.logo&&(p.logo.startsWith('http')||p.logo.startsWith('data'))){
      logoHtml=`<img src="${p.logo}" alt="${p.nom}" class="partner-logo-img" onerror="this.outerHTML='<div class=partner-logo>🤝</div>'"/>`;
    }else if(p.url&&(!p.logo||p.logo==='🤝')){
      let host='';try{host=new URL(p.url).hostname}catch(e){}
      logoHtml=host?`<img src="https://www.google.com/s2/favicons?domain=${host}&sz=128" alt="${p.nom}" class="partner-logo-img" onerror="this.outerHTML='<div class=partner-logo>🤝</div>'"/>`:`<div class="partner-logo">🤝</div>`;
    }else{
      logoHtml=`<div class="partner-logo">${p.logo||'🤝'}</div>`;
    }
    return `<div class="partner-card">
      ${logoHtml}
      <h3>${p.nom}</h3>
      <p>${p.desc}</p>
      <span class="partner-badge">${p.badge}</span>
      ${p.url?`<br><a href="${p.url}" target="_blank" rel="noopener" style="color:var(--accent);font-size:.8rem;display:inline-block;margin-top:.6rem">Visiter le site →</a>`:''}
    </div>`;
  }).join('');
}
function renderPartenairesAdmin(){
  const grid=document.getElementById('partenairesAdminGrid');if(!grid)return;
  grid.innerHTML=partners.map(p=>`
    <div class="partner-card" style="text-align:left">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <span class="partner-badge">${p.badge}</span>
        <div style="display:flex;gap:.4rem">
          <button class="btn-edit" onclick="openEditPartner('${p.id}')">✏️</button>
          <button class="btn-danger" onclick="deletePartner('${p.id}')">🗑️</button>
        </div>
      </div>
      <strong style="display:block;font-family:var(--fh);margin-bottom:.4rem">${p.nom}</strong>
      <p style="font-size:.83rem">${p.desc}</p>
    </div>`).join('');
}
function openAddPartner(){
  document.getElementById('partnerModalTitle').textContent='➕ Ajouter un partenaire';
  document.getElementById('partnerId').value='';
  ['partnerName','partnerBadge','partnerDesc','partnerLogo','partnerUrl'].forEach(id=>document.getElementById(id).value='');
  openModal('partner');
}
function openEditPartner(id){
  const p=partners.find(x=>x.id===id);if(!p)return;
  document.getElementById('partnerModalTitle').textContent='✏️ Modifier le partenaire';
  document.getElementById('partnerId').value=id;
  document.getElementById('partnerName').value=p.nom;
  document.getElementById('partnerBadge').value=p.badge;
  document.getElementById('partnerDesc').value=p.desc;
  document.getElementById('partnerLogo').value=p.logo&&!p.logo.startsWith('data:')?p.logo:'';
  document.getElementById('partnerUrl').value=p.url||'';
  openModal('partner');
}
function previewPartnerLogo(input){
  if(!input.files[0])return;
  const r=new FileReader();
  r.onload=e=>{
    const pw=document.getElementById('partnerLogoPreviewWrap');
    const pp=document.getElementById('partnerLogoPreview');
    if(pw&&pp){pw.style.display='block';pp.src=e.target.result;}
    document.getElementById('partnerLogo').value='';
    window._pendingPartnerLogo=e.target.result;
    toast('Logo chargé. Sauvegarde pour confirmer.','info');
  };
  r.readAsDataURL(input.files[0]);
}
function savePartner(e){
  e.preventDefault();
  const id=document.getElementById('partnerId').value;
  const logo=window._pendingPartnerLogo||document.getElementById('partnerLogo').value.trim()||'🤝';
  window._pendingPartnerLogo=null;
  const data={
    nom:document.getElementById('partnerName').value.trim(),
    badge:document.getElementById('partnerBadge').value.trim(),
    desc:document.getElementById('partnerDesc').value.trim(),
    logo,
    url:document.getElementById('partnerUrl').value.trim()
  };
  if(id){const idx=partners.findIndex(x=>x.id===id);if(idx!==-1)partners[idx]={...partners[idx],...data};}
  else{partners.push({id:'p'+Date.now(),...data});}
  save('sc_partners',partners);closeModals();renderPartenairesAdmin();
  toast('Partenaire sauvegardé !','success');
}
function deletePartner(id){
  if(!confirm('Supprimer ce partenaire ?'))return;
  partners=partners.filter(x=>x.id!==id);save('sc_partners',partners);renderPartenairesAdmin();toast('Supprimé.','info');
}

// ════════════════════════════════════════════════════
// PARTNER CHAT (demande partenariat)
// ════════════════════════════════════════════════════
function openPartnerChat(){
  if(!currentUser){toast('Connectez-vous pour contacter l\'administrateur.','info');openModal('login');return;}
  document.getElementById('partnerChatPanel').classList.add('open');
  document.getElementById('partnerChatOverlay').classList.add('open');
  renderPartnerChatMsgs();
}
function closePartnerChat(){
  document.getElementById('partnerChatPanel').classList.remove('open');
  document.getElementById('partnerChatOverlay').classList.remove('open');
}
function renderPartnerChatMsgs(){
  const container=document.getElementById('partnerChatMessages');if(!container)return;
  const myMsgs=partnerMsgs.filter(m=>m.userId===currentUser.id||m.targetUserId===currentUser.id);
  const allMsgs=[
    {isAdmin:true,text:'Bonjour ! Je suis l\'administrateur FEDANI. Décrivez votre projet de partenariat et je reviendrai vers vous rapidement. 😊',date:Date.now()-3600000},
    ...myMsgs
  ].sort((a,b)=>a.date-b.date);
  container.innerHTML=allMsgs.map(m=>`
    <div class="chat-msg ${m.isAdmin?'admin-msg':'user-msg'}">
      <div class="chat-av">${m.isAdmin?'🛡️':'👤'}</div>
      <div>
        <div class="chat-bubble">${escHtml(m.text)}</div>
        <div style="font-size:.72rem;color:var(--text2);margin-top:.2rem;${m.isAdmin?'text-align:left':'text-align:right'}">${new Date(m.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
    </div>`).join('');
  container.scrollTop=container.scrollHeight;
}
function sendPartnerMsg(){
  if(!currentUser){toast('Connectez-vous d\'abord.','info');return;}
  const input=document.getElementById('partnerChatInput');
  if(!input||!input.value.trim())return;
  const msg={id:'pm'+Date.now(),userId:currentUser.id,userName:currentUser.nom,userEmail:currentUser.email,text:input.value.trim(),date:Date.now(),read:false,isAdmin:false};
  partnerMsgs.push(msg);save('sc_partner_msgs',partnerMsgs);
  input.value='';renderPartnerChatMsgs();
  addNotification('admin','📩 Demande partenariat de '+currentUser.nom,'partner',msg.id);
  toast('Message envoyé ! L\'admin vous répondra bientôt.','success');
}

function replyPartnerMsg(userId,text){
  const msg={id:'pm'+Date.now(),userId:'admin',userName:'Admin FEDANI',text,date:Date.now(),isAdmin:true,targetUserId:userId};
  partnerMsgs.push(msg);save('sc_partner_msgs',partnerMsgs);
  addNotification(userId,'💬 L\'administrateur a répondu à votre demande de partenariat','partner_reply',msg.id);
  renderAdminMessages();toast('Réponse envoyée.','success');
}

// ════════════════════════════════════════════════════
// ACTUALITÉS
// ════════════════════════════════════════════════════
const ACTU_DEFAULT_IMGS={
  actu:'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80',
  pro:'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&q=80',
  event:'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80'
};

function filterActus(type,btn){
  _actuFilter=type;
  document.querySelectorAll('.actu-filter-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderActualites(type);
}
function renderActualites(typeFilter){
  const grid=document.getElementById('actuGrid');if(!grid)return;
  const t=typeFilter||_actuFilter||'all';
  let list=[...actualites].sort((a,b)=>b.date-a.date);
  if(t!=='all')list=list.filter(a=>a.type===t);
  if(!list.length){grid.innerHTML='<div class="empty-state"><span>📰</span><p>Aucune actualité dans cette catégorie.</p></div>';return;}
  const typeLabels={actu:'📰 Actualité',pro:'💼 Professionnel',event:'📅 Événement'};
  const typeClasses={actu:'actu-type-actu',pro:'actu-type-pro',event:'actu-type-event'};
  grid.innerHTML=list.map(a=>{
    const imgSrc=a.img||ACTU_DEFAULT_IMGS[a.type]||ACTU_DEFAULT_IMGS.actu;
    return `<div class="actu-card" onclick="showActuDetail('${a.id}')">
      <div class="actu-img"><img src="${imgSrc}" alt="${a.title}" onerror="this.parentNode.innerHTML='${a.type==='actu'?'📰':a.type==='pro'?'💼':'📅'}'"></div>
      <div class="actu-body">
        <span class="actu-type-badge ${typeClasses[a.type]||'actu-type-actu'}">${typeLabels[a.type]||'📰 Actualité'}</span>
        <h3>${a.title}</h3>
        <p>${a.summary}</p>
        <div class="actu-meta">
          <span>✍️ ${a.author||'FEDANI'}</span>
          <span>📅 ${new Date(a.date).toLocaleDateString('fr-FR')}</span>
          <button class="social-action" onclick="event.stopPropagation();openShareModal('${escHtml(a.title)}','${window.location.href}')" style="margin-left:auto"><i class="fa fa-share-nodes"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function showActuDetail(id){
  const a=actualites.find(x=>x.id===id);if(!a)return;
  const typeLabels={actu:'📰 Actualité',pro:'💼 Professionnel',event:'📅 Événement'};
  const typeClasses={actu:'actu-type-actu',pro:'actu-type-pro',event:'actu-type-event'};
  const imgSrc=a.img||ACTU_DEFAULT_IMGS[a.type]||ACTU_DEFAULT_IMGS.actu;
  saveScroll();history.pushState({page:'actualites',actuId:id},'',window.location.pathname+'#actualites');
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:600;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:2rem 1rem;backdrop-filter:blur(5px)';
  overlay.onclick=(e)=>{if(e.target===overlay){document.body.removeChild(overlay);history.back();}};
  overlay.innerHTML=`
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;max-width:700px;width:100%;padding:2rem;position:relative;margin:auto">
      <button onclick="this.closest('[style]').remove();history.back()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:var(--text2);font-size:1.1rem;cursor:pointer">✕</button>
      <img src="${imgSrc}" alt="${a.title}" style="width:100%;height:220px;object-fit:cover;border-radius:10px;margin-bottom:1.5rem">
      <span class="actu-type-badge ${typeClasses[a.type]||'actu-type-actu'}" style="margin-bottom:1rem;display:inline-block">${typeLabels[a.type]||'📰'}</span>
      <h2 style="font-family:var(--fh);font-size:1.5rem;margin-bottom:.5rem;line-height:1.3">${a.title}</h2>
      <div style="color:var(--text2);font-size:.82rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:1rem">
        <span>✍️ ${a.author||'FEDANI'} · 📅 ${new Date(a.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</span>
        <button onclick="openShareModal('${escHtml(a.title)}','${window.location.href}')" style="margin-left:auto;background:var(--bg3);border:1px solid var(--border);color:var(--text2);border-radius:8px;padding:.3rem .75rem;cursor:pointer;font-size:.8rem"><i class="fa fa-share-nodes"></i> Partager</button>
      </div>
      <p style="color:var(--text2);line-height:1.85;white-space:pre-wrap">${a.content}</p>
    </div>`;
  document.body.appendChild(overlay);
}

function renderActuAdmin(){
  const list=document.getElementById('actuAdminList');if(!list)return;
  const typeLabels={actu:'📰',pro:'💼',event:'📅'};
  list.innerHTML=[...actualites].sort((a,b)=>b.date-a.date).map(a=>`
    <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:10px;padding:1rem;display:flex;justify-content:space-between;align-items:center;gap:1rem">
      <div style="flex:1">
        <span style="font-size:.78rem;color:var(--accent)">${typeLabels[a.type]||'📰'} ${a.type}</span>
        <strong style="display:block;font-family:var(--fh);margin:.2rem 0">${a.title}</strong>
        <small style="color:var(--text2)">${new Date(a.date).toLocaleDateString('fr-FR')} · ${a.author}</small>
      </div>
      <div style="display:flex;gap:.4rem;flex-shrink:0">
        <button class="btn-edit" onclick="openEditActu('${a.id}')">✏️</button>
        <button class="btn-danger" onclick="deleteActu('${a.id}')">🗑️</button>
      </div>
    </div>`).join('')||'<p style="color:var(--text2);text-align:center;padding:2rem">Aucune actualité.</p>';
}
function openAddActu(){
  document.getElementById('actuModalTitle').textContent='➕ Ajouter une actualité';
  document.getElementById('actuId').value='';
  ['actuTitle','actuSummary','actuContent','actuImg'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('actuAuthor').value='Équipe FEDANI';
  document.getElementById('actuType').value='actu';
  openModal('actu');
}
function openEditActu(id){
  const a=actualites.find(x=>x.id===id);if(!a)return;
  document.getElementById('actuModalTitle').textContent='✏️ Modifier l\'actualité';
  document.getElementById('actuId').value=id;
  document.getElementById('actuTitle').value=a.title;
  document.getElementById('actuSummary').value=a.summary;
  document.getElementById('actuContent').value=a.content;
  document.getElementById('actuImg').value=a.img||'';
  document.getElementById('actuAuthor').value=a.author||'Équipe FEDANI';
  document.getElementById('actuType').value=a.type||'actu';
  openModal('actu');
}
function saveActu(e){
  e.preventDefault();
  const id=document.getElementById('actuId').value;
  const data={
    title:document.getElementById('actuTitle').value.trim(),
    summary:document.getElementById('actuSummary').value.trim(),
    content:document.getElementById('actuContent').value.trim(),
    img:document.getElementById('actuImg').value.trim(),
    author:document.getElementById('actuAuthor').value.trim()||'Équipe FEDANI',
    type:document.getElementById('actuType').value,
    date:id?(actualites.find(x=>x.id===id)||{}).date||Date.now():Date.now()
  };
  if(id){const idx=actualites.findIndex(x=>x.id===id);if(idx!==-1)actualites[idx]={...actualites[idx],...data};}
  else{actualites.push({id:'ac'+Date.now(),...data});}
  save('sc_actualites',actualites);closeModals();renderActuAdmin();
  toast('Actualité sauvegardée !','success');
}
function deleteActu(id){
  if(!confirm('Supprimer cette actualité ?'))return;
  actualites=actualites.filter(x=>x.id!==id);save('sc_actualites',actualites);renderActuAdmin();toast('Supprimée.','info');
}

// ════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════
function addNotification(targetUserId,text,type,refId){
  const notif={id:'n'+Date.now(),targetUserId,text,type,refId,date:Date.now(),read:false};
  notifications.push(notif);save('sc_notifications',notifications);
  if(currentUser&&currentUser.id===targetUserId){updateNotifBell();}
}
function updateNotifBell(){
  const bell=document.getElementById('notifBell');
  const count=document.getElementById('notifCount');
  if(!currentUser){if(bell)bell.style.display='none';return;}
  if(bell)bell.style.display='flex';
  const myNotifs=notifications.filter(n=>n.targetUserId===currentUser.id&&!n.read);
  if(count){
    count.textContent=myNotifs.length;
    count.style.display=myNotifs.length?'flex':'none';
  }
}
function toggleNotifs(){
  const panel=document.getElementById('notifPanel');
  if(!panel)return;
  const isOpen=panel.style.display!=='none';
  panel.style.display=isOpen?'none':'block';
  if(!isOpen)renderNotifs();
}
function renderNotifs(){
  const list=document.getElementById('notifList');
  if(!list||!currentUser)return;
  const myNotifs=notifications.filter(n=>n.targetUserId===currentUser.id).sort((a,b)=>b.date-a.date).slice(0,20);
  if(!myNotifs.length){list.innerHTML='<p style="padding:1rem;color:var(--text2);text-align:center;font-size:.85rem">Aucune notification</p>';return;}
  list.innerHTML=myNotifs.map(n=>`
    <div class="notif-item${n.read?'':' unread'}" onclick="markNotifRead('${n.id}')">
      ${n.text}
      <small>${new Date(n.date).toLocaleString('fr-FR')}</small>
    </div>`).join('');
}
function markNotifRead(id){
  const n=notifications.find(x=>x.id===id);
  if(n){n.read=true;save('sc_notifications',notifications);renderNotifs();updateNotifBell();}
}
function clearNotifs(){
  notifications=notifications.filter(n=>n.targetUserId!==currentUser?.id);
  save('sc_notifications',notifications);renderNotifs();updateNotifBell();
  document.getElementById('notifPanel').style.display='none';
}
document.addEventListener('click',e=>{
  const panel=document.getElementById('notifPanel');
  const bell=document.getElementById('notifBell');
  if(panel&&bell&&!panel.contains(e.target)&&!bell.contains(e.target)){panel.style.display='none';}
  document.querySelectorAll('.share-menu.open').forEach(m=>{
    if(!m.contains(e.target))m.classList.remove('open');
  });
});

// ════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════
function renderAdmin(){
  if(!currentUser||currentUser.role!=='admin')return;
  updateAdminCounts();renderAdminDashboard();
}
function updateAdminCounts(){
  const today=new Date();today.setHours(0,0,0,0);
  const todayVis=visites.filter(v=>v.time>=today.getTime()).length;
  const uniqueCount=Object.keys(uniqueVisitors).length;
  document.getElementById('cntAnn').textContent=annonces.length;
  document.getElementById('cntUsers').textContent=users.length;
  document.getElementById('cntVisites').textContent=uniqueCount;
  document.getElementById('dAnn').textContent=annonces.length;
  document.getElementById('dUsers').textContent=users.length;
  document.getElementById('dVisites').textContent=uniqueCount;
  document.getElementById('dToday').textContent=todayVis;
  document.getElementById('dActive').textContent=annonces.filter(a=>a.visible).length;
  document.getElementById('dNew').textContent=users.filter(u=>u.date&&u.date>Date.now()-7*86400000).length;
  const msgs=partnerMsgs.filter(m=>!m.read&&m.userId!=='admin');
  document.getElementById('cntMsgs').textContent=msgs.length;
}
function renderAdminDashboard(){
  const g=document.getElementById('dashRecentAnn');
  if(g){const l=annonces.slice(0,4);g.innerHTML=l.map(a=>annonceCard(a,'admin')).join('')||'<p style="color:var(--text2);padding:1rem">Aucune annonce.</p>';}
}
function renderAdminAnnonces(){
  const s=(document.getElementById('adminSearchAnn')?.value||'').toLowerCase();
  const cat=document.getElementById('adminFilterCat')?.value||'';
  let list=[...annonces];
  if(s)list=list.filter(a=>a.titre.toLowerCase().includes(s)||a.auteur.toLowerCase().includes(s));
  if(cat)list=list.filter(a=>a.categorie===cat);
  list.sort((a,b)=>b.date-a.date);
  const g=document.getElementById('adminAnnoncesGrid');
  g.innerHTML=list.length?list.map(a=>annonceCard(a,'admin')).join(''):'<div class="empty-state"><span>📭</span><p>Aucune annonce.</p></div>';
}
function renderAdminUsers(){
  const s=(document.getElementById('adminSearchUser')?.value||'').toLowerCase();
  let list=[...users];
  if(s)list=list.filter(u=>u.nom.toLowerCase().includes(s)||u.email.toLowerCase().includes(s));
  const tbody=document.getElementById('adminUsersBody');
  tbody.innerHTML=list.map(u=>{
    const cnt=annonces.filter(a=>a.userId===u.id).length;
    const date=u.date?new Date(u.date).toLocaleDateString('fr-FR'):'—';
    let avHtml;
    if(u.avatar){
      avHtml=`<div class="u-avatar" style="background:transparent"><img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentNode.style.background='${colorForName(u.nom)}';this.remove();this.parentNode.textContent='${u.nom[0]}'"/></div>`;
    }else{
      avHtml=`<div class="u-avatar" style="background:${colorForName(u.nom)};color:#000;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-family:var(--fh);font-size:.75rem">${u.nom[0].toUpperCase()}</div>`;
    }
    return `<tr>
      <td>${avHtml}</td>
      <td><strong>${u.nom}</strong></td><td>${u.email}</td><td>${u.tel||'—'}</td>
      <td>${u.ville||'—'}</td>
      <td><span class="role-badge role-${u.role}">${u.role}</span></td>
      <td>${cnt}</td><td>${date}</td>
      <td style="display:flex;gap:.4rem;flex-wrap:wrap">
        <button class="btn-edit" onclick="openEditUser('${u.id}')">✏️</button>
        ${u.id!=='admin'?`<button class="btn-danger" onclick="deleteUser('${u.id}')">🗑️</button>`:''}
      </td></tr>`;
  }).join('')||'<tr><td colspan="9" style="text-align:center;color:var(--text2);padding:2rem">Aucun utilisateur.</td></tr>';
}
function renderAdminVisites(){
  const log=document.getElementById('visitsLog');
  if(!visites.length){log.innerHTML='<div class="empty-state"><span>👁️</span><p>Aucune visite enregistrée.</p></div>';return;}
  const uniqueCount=Object.keys(uniqueVisitors).length;
  log.innerHTML=`<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:10px;padding:1rem 1.5rem;margin-bottom:1rem;display:flex;gap:2rem">
    <div><strong style="font-family:var(--fh);font-size:1.5rem;color:var(--accent)">${uniqueCount}</strong><div style="color:var(--text2);font-size:.82rem">Visiteurs uniques</div></div>
    <div><strong style="font-family:var(--fh);font-size:1.5rem;color:var(--accent)">${visites.length}</strong><div style="color:var(--text2);font-size:.82rem">Visites totales</div></div>
  </div>`+
  visites.slice(0,200).map(v=>`<div class="visit-row">
    <span class="vr-time">${new Date(v.time).toLocaleString('fr-FR')}</span>
    <span class="vr-page">📄 ${v.page}</span>
    <span class="vr-user">👤 ${v.user}</span>
    <span style="color:var(--text2);font-size:.72rem;margin-left:auto">${(v.ua||'').substring(0,35)}…</span>
  </div>`).join('');
}
function clearVisits(){
  if(!confirm('Effacer tout l\'historique de visites ?'))return;
  visites=[];uniqueVisitors={};
  save('sc_visites',visites);save('sc_unique_visitors',uniqueVisitors);
  renderAdminVisites();updateAdminCounts();toast('Historique effacé.','info');
}
function renderAdminMessages(){
  const list=document.getElementById('adminMessagesList');if(!list)return;
  const allMsgs=partnerMsgs.filter(m=>!m.isAdmin&&m.userId!=='admin');
  if(!allMsgs.length){list.innerHTML='<div class="empty-state"><span>💬</span><p>Aucun message de partenariat.</p></div>';return;}
  const grouped={};
  allMsgs.forEach(m=>{if(!grouped[m.userId])grouped[m.userId]=[];grouped[m.userId].push(m);});
  list.innerHTML=Object.entries(grouped).map(([uid,msgs])=>{
    const u=users.find(x=>x.id===uid);
    const lastMsg=msgs[msgs.length-1];
    return `<div class="admin-msg-card">
      <div class="admin-msg-header">
        <div><div class="admin-msg-user">${u?u.nom:uid}</div><div style="color:var(--text2);font-size:.78rem">${u?u.email:''}</div></div>
        <div class="admin-msg-time">${new Date(lastMsg.date).toLocaleString('fr-FR')}</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.75rem;max-height:120px;overflow-y:auto">
        ${msgs.map(m=>`<div style="margin-bottom:.5rem"><strong style="font-size:.78rem;color:var(--text2)">${new Date(m.date).toLocaleString('fr-FR')}</strong><p style="font-size:.88rem;margin-top:.2rem">${escHtml(m.text)}</p></div>`).join('')}
      </div>
      <div class="admin-msg-actions">
        <input type="text" id="reply-${uid}" placeholder="Votre réponse..." style="flex:1"/>
        <button class="btn-primary" onclick="adminReply('${uid}')">Répondre</button>
        <button class="btn-primary" onclick="openAddPartner()" style="background:var(--green)">✅ Ajouter comme partenaire</button>
      </div>
    </div>`;
  }).join('');
  // Mark as read
  allMsgs.forEach(m=>{m.read=true;});save('sc_partner_msgs',partnerMsgs);updateAdminCounts();
}
function adminReply(userId){
  const input=document.getElementById('reply-'+userId);
  if(!input||!input.value.trim())return;
  replyPartnerMsg(userId,input.value.trim());
  input.value='';
}
function adminTab(name,btn){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  document.querySelectorAll('.admin-tab-content').forEach(t=>{t.classList.remove('active');t.style.display='none';});
  const cur=document.getElementById('tab-'+name);cur.classList.add('active');cur.style.display='block';
  const bar=document.getElementById('adminTabsBar');if(bar)bar.scrollIntoView({behavior:'smooth',block:'start'});
  if(name==='db')dbInit();
  if(name==='secu')secuRender();
  if(name==='annonces')renderAdminAnnonces();
  if(name==='users')renderAdminUsers();
  if(name==='visites')renderAdminVisites();
  if(name==='site')loadSiteEditor();
  if(name==='dashboard')renderAdminDashboard();
  if(name==='services')renderServicesAdmin();
  if(name==='team')renderTeamAdmin();
  if(name==='messages')renderAdminMessages();
  if(name==='actualites')renderActuAdmin();
  if(name==='partenaires')renderPartenairesAdmin();
}
function openEditUser(id){
  const u=users.find(x=>x.id===id);if(!u)return;
  document.getElementById('editUserId').value=id;
  document.getElementById('editUserNom').value=u.nom;
  document.getElementById('editUserEmail').value=u.email;
  document.getElementById('editUserTel').value=u.tel||'';
  document.getElementById('editUserVille').value=u.ville||'';
  document.getElementById('editUserRole').value=u.role;
  document.getElementById('editUserPass').value='';
  openModal('editUser');
}
function saveUserEdit(e){
  e.preventDefault();
  const id=document.getElementById('editUserId').value;
  const u=users.find(x=>x.id===id);if(!u)return;
  const ne=document.getElementById('editUserEmail').value.trim().toLowerCase();
  if(ne!==u.email&&users.find(x=>x.email.toLowerCase()===ne&&x.id!==id)){toast('Email déjà utilisé.','error');return;}
  u.nom=document.getElementById('editUserNom').value.trim();
  u.email=ne;
  u.tel=document.getElementById('editUserTel').value.trim();
  u.ville=document.getElementById('editUserVille').value;
  u.role=document.getElementById('editUserRole').value;
  const np=document.getElementById('editUserPass').value;if(np)u.pass=np;
  save('sc_users',users);
  if(currentUser&&currentUser.id===id){currentUser=u;save('sc_current',u);updateAuthUI();}
  closeModals();renderAdminUsers();updateAdminCounts();toast('Utilisateur modifié.','success');
}
function deleteUser(id){
  if(!confirm('Supprimer cet utilisateur et ses annonces ?'))return;
  users=users.filter(u=>u.id!==id);
  annonces=annonces.filter(a=>a.userId!==id);
  save('sc_users',users);save('sc_annonces',annonces);
  renderAdminUsers();updateAdminCounts();toast('Utilisateur supprimé.','info');
}

// ════════════════════════════════════════════════════
// SITE CONTENT
// ════════════════════════════════════════════════════
function loadSiteEditor(){
  const s=siteContent;
  document.getElementById('sSiteName').value=s.siteName||'';
  document.getElementById('sSiteSlogan').value=s.siteSlogan||'';
  document.getElementById('sHeroTag').value=s.heroTag||'';
  document.getElementById('sHeroTitle1').value=s.heroTitle1||'';
  document.getElementById('sHeroTitle2').value=s.heroTitle2||'';
  document.getElementById('sHeroSub').value=s.heroSub||'';
  document.getElementById('sColorAccent').value=s.colorAccent||'#00aaff';
  document.getElementById('sColorAccent2').value=s.colorAccent2||'#38bdf8';
  document.getElementById('sColorBg').value=s.colorBg||'#0b0c10';
  document.getElementById('sColorCard').value=s.colorCard||'#161820';
  document.getElementById('sBanner').value=s.banner||'';
  document.getElementById('sBannerType').value=s.bannerType||'info';
  document.getElementById('sFooterMsg').value=s.footerMsg||'';
  document.getElementById('sFacebook').value=s.facebook||'';
  document.getElementById('sWhatsapp').value=s.whatsapp||'https://wa.me/237696837926';
  document.getElementById('sContactEmail').value=s.contactEmail||'fedanisarl1@gmail.com';
}
function saveSiteContent(){
  siteContent.siteName=document.getElementById('sSiteName').value.trim()||DEFAULT_SITE.siteName;
  siteContent.siteSlogan=document.getElementById('sSiteSlogan').value.trim()||DEFAULT_SITE.siteSlogan;
  siteContent.heroTag=document.getElementById('sHeroTag').value.trim()||DEFAULT_SITE.heroTag;
  siteContent.heroTitle1=document.getElementById('sHeroTitle1').value.trim()||DEFAULT_SITE.heroTitle1;
  siteContent.heroTitle2=document.getElementById('sHeroTitle2').value.trim()||DEFAULT_SITE.heroTitle2;
  siteContent.heroSub=document.getElementById('sHeroSub').value.trim()||DEFAULT_SITE.heroSub;
  siteContent.colorAccent=document.getElementById('sColorAccent').value;
  siteContent.colorAccent2=document.getElementById('sColorAccent2').value;
  siteContent.colorBg=document.getElementById('sColorBg').value;
  siteContent.colorCard=document.getElementById('sColorCard').value;
  siteContent.banner=document.getElementById('sBanner').value.trim();
  siteContent.bannerType=document.getElementById('sBannerType').value;
  siteContent.footerMsg=document.getElementById('sFooterMsg').value.trim()||DEFAULT_SITE.footerMsg;
  siteContent.facebook=document.getElementById('sFacebook').value.trim();
  siteContent.whatsapp=document.getElementById('sWhatsapp').value.trim();
  siteContent.contactEmail=document.getElementById('sContactEmail').value.trim();
  save('sc_site',siteContent);applySiteContent();toast('✅ Modifications appliquées !','success');
}
function resetSiteContent(){
  if(!confirm('Réinitialiser le contenu du site ?'))return;
  siteContent={...DEFAULT_SITE};save('sc_site',siteContent);loadSiteEditor();applySiteContent();toast('Site réinitialisé.','info');
}
function applySiteContent(){
  const s=siteContent;
  document.documentElement.style.setProperty('--accent',s.colorAccent);
  document.documentElement.style.setProperty('--accent2',s.colorAccent2);
  document.documentElement.style.setProperty('--bg',s.colorBg);
  document.documentElement.style.setProperty('--card-bg',s.colorCard);
  const htag=document.getElementById('heroTag');if(htag)htag.textContent=s.heroTag;
  const htitle=document.getElementById('heroTitle');if(htitle)htitle.innerHTML=`${s.heroTitle1}<br><em id="heroTitleEm">${s.heroTitle2}</em>`;
  const hsub=document.getElementById('heroSub');if(hsub)hsub.innerHTML=(s.heroSub||'').replace(/\n/g,'<br>');
  const fm=document.getElementById('footerMsg');if(fm)fm.textContent=s.footerMsg;
  const b=document.getElementById('globalBanner');const bm=document.getElementById('bannerMsg');
  if(s.banner){
    b.className=`global-banner banner-${s.bannerType}`;b.style.display='flex';bm.textContent=s.banner;
  }else{b.style.display='none';}
  document.title=`${s.siteName} — ${s.siteSlogan}`;
  updateFooterSocials();
}
function updateFooterSocials(){
  const fb=document.getElementById('footerFacebook');
  const wa=document.getElementById('footerWhatsapp');
  if(fb&&siteContent.facebook)fb.href=siteContent.facebook;
  if(wa&&siteContent.whatsapp)wa.href=siteContent.whatsapp;
}

// ════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════
function updateStats(){
  const today=new Date();today.setHours(0,0,0,0);
  const uniqueCount=Object.keys(uniqueVisitors).length;
  const sa=document.getElementById('statAnnonces');
  const su=document.getElementById('statUsers');
  const sv=document.getElementById('statVisites');
  if(sa)sa.textContent=annonces.filter(a=>a.visible).length;
  if(su)su.textContent=users.length;
  if(sv)sv.textContent=uniqueCount;
}

// ════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════
function toast(msg,type='success'){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className=`toast show ${type}`;
  clearTimeout(window._tt);
  window._tt=setTimeout(()=>{t.className='toast';},3200);
}

// ════════════════════════════════════════════════════
// FEDANI AI ASSISTANT
// ════════════════════════════════════════════════════
const AI_KB = {
  "trouver":["Pour trouver un prestataire, va sur la page **Annonces** 📋. Tu peux filtrer par catégorie (cours, design, programmation...), par ville et par mode. Clique sur une annonce pour voir les détails et contacter via WhatsApp ou téléphone !"],
  "publier":["Pour publier une annonce : 1️⃣ Crée un compte ou connecte-toi. 2️⃣ Clique sur **Publier** dans le menu. 3️⃣ Remplis le formulaire : titre, catégorie, description, ville, prix, contact. 4️⃣ Ajoute une photo ! 5️⃣ Clique **Publier** — c'est en ligne ! 🎉"],
  "paiement":["💳 Modes de paiement acceptés :\n\n• **MTN Mobile Money** — le plus courant\n• **Orange Money** — transfert rapide\n• **Express Union** — transferts nationaux\n• **Cash** — en main propre\n• **PayPal** — international\n• **Visa/Mastercard** — carte bancaire\n\nLe mode est convenu directement entre client et prestataire."],
  "compte":["Pour créer un compte FEDANI : 1️⃣ Clique **S'inscrire**. 2️⃣ Entre ton nom, email et mot de passe. 3️⃣ Compte créé ! Tu peux aussi te connecter avec Google. ✅"],
  "inscription":["Clique sur **S'inscrire** dans la barre de navigation. Remplis nom, email et mot de passe (min. 6 caractères). Tu peux aussi utiliser ton compte Google ! Gratuit et instantané."],
  "connexion":["Clique sur **Connexion** dans la navigation. Entre ton email et mot de passe. Ou utilise le bouton **Google** pour te connecter directement avec ton compte Google !"],
  "fedani":["**FEDANI** est une entreprise camerounaise qui connecte les talents étudiants avec ceux qui ont besoin de leurs services. **ServiConnect** est notre marketplace de services 🇨🇲.\n\nNotre mission : faciliter l'accès aux services pour tous les Camerounais. Contact : fedanisarl1@gmail.com | +237 696 837 926"],
  "catégorie":["Catégories disponibles :\n\n📚 **Cours** — maths, physique, langues\n✏️ **Correction** — dissertations, rapports\n💻 **Programmation** — web, mobile, IA\n🎨 **Design** — logos, UI/UX\n🔬 **Recherche** — mémoires\n🌍 **Traduction** — toutes langues\n📝 **Rédaction** — articles, contenu\n🎵 **Musique** — cours instruments\n⚽ **Sport** — coaching\n⚡ **Autre** — tout autre service"],
  "ville":["Villes couvertes :\n📍 Douala\n📍 Yaoundé\n📍 Bafoussam\n📍 Bandjoun\n📍 Buea\n📍 Bamenda\n📍 Autres villes (option 'Autre')\n\nFiltre par ville sur la page Annonces."],
  "admin":["Les **administrateurs FEDANI** contrôlent :\n✅ Toutes les annonces\n✅ Tous les utilisateurs\n✅ Statistiques & visiteurs uniques\n✅ Services, équipe, partenaires\n✅ Actualités & contenu du site\n✅ Messages de partenariat\n\nConnecte-toi avec admin@fedani.cm"],
  "contact":["📧 fedanisarl1@gmail.com\n📱 +237 696 837 926\n💬 WhatsApp : 696 837 926\n📍 Douala, Cameroun\n\nSur la page **À propos** tu trouveras tous nos contacts."],
  "partenaire":["Pour devenir partenaire FEDANI :\n1️⃣ Va sur la page **Partenaires**\n2️⃣ Clique sur **Nous contacter**\n3️⃣ Envoie ton message à l'administrateur\n4️⃣ Il examinera ta demande\n\nOu écris directement à fedanisarl1@gmail.com"],
  "actualité":["La page **Actualités** contient :\n📰 Actualités FEDANI\n💼 Offres professionnelles & stages\n📅 Événements (hackathons, conférences)\n\nVisite régulièrement pour ne rien manquer !"],
  "gratuit":["✅ FEDANI ServiConnect est **100% gratuit** !\n\n• Créer un compte : gratuit\n• Publier des annonces : gratuit\n• Contacter les prestataires : gratuit\n• Toutes les fonctionnalités : gratuites\n\nAucun abonnement, aucune commission."],
  "google":["Tu peux te connecter avec ton compte **Google** ! Sur les pages de connexion ou d'inscription, clique sur le bouton **'Se connecter avec Google'** pour accéder instantanément à FEDANI. Simple et sécurisé !"],
  "profil":["Pour modifier ton profil :\n1. Connecte-toi\n2. Clique sur **Profil** dans le menu\n3. Clique sur ta photo pour en changer\n4. Modifie : nom, email, téléphone, ville, bio, mot de passe\n5. Clique **Sauvegarder** 💾\n\nTa photo s'affichera partout sur la plateforme !"],
  "commentaire":["Pour commenter une annonce :\n1. Trouve une annonce qui t'intéresse\n2. Clique sur l'icône 💬 commentaire\n3. Tape ton message et envoie\n\nTu peux aussi ❤️ liker et 🔗 partager les annonces sur WhatsApp, Facebook, Telegram !"],
  "whatsapp":["Pour contacter via WhatsApp :\n1. Trouve l'annonce qui t'intéresse\n2. Clique sur le bouton **WhatsApp** vert\n3. Un message pré-rempli s'ouvre\n4. Envoie et discute directement ! 📱"],
  "offre":["🔥 Offres spéciales sur FEDANI :\n\n• **-30%** première séance de cours\n• **-20%** pack programmation (5 séances)\n• **Gratuit** : 1ère correction de devoir\n• **-15%** création de logo professionnel\n\nVisible sur la page d'accueil !"],
  "aide":["Je suis **FedaniAI** ! Je peux t'aider :\n\n🔍 Trouver une annonce\n📝 Publier un service\n👤 Gérer ton compte & profil\n💳 Comprendre les paiements\n🤝 Devenir partenaire\n📰 Voir les actualités\n⚖️ Questions légales\n🔥 Découvrir les offres\n\nPose ta question !"],
};

function openAI(){document.getElementById('aiPanel').classList.add('open');document.getElementById('aiFab').style.display='none';}
function closeAI(){document.getElementById('aiPanel').classList.remove('open');document.getElementById('aiFab').style.display='flex';}
function aiQuick(q){document.getElementById('aiInput').value=q;sendAI();}

function sendAI(){
  const inp=document.getElementById('aiInput');
  const q=inp.value.trim();if(!q)return;
  inp.value='';
  appendAIMsg(q,'user');
  const typingEl=appendTyping();
  setTimeout(()=>{
    typingEl.remove();
    const answer=getAIAnswer(q);
    appendAIMsg(answer,'bot');
  },700+Math.random()*500);
}

function getAIAnswer(q){
  const ql=q.toLowerCase();
  // Knowledge base match
  for(const [key,answers] of Object.entries(AI_KB)){
    if(ql.includes(key))return answers[0];
  }
  // Dynamic answers
  if(ql.includes('combien')&&(ql.includes('annonce')||ql.includes('offre'))){
    const cnt=annonces.filter(a=>a.visible).length;
    return `Il y a actuellement **${cnt} annonce${cnt>1?'s':''}** active${cnt>1?'s':''} sur FEDANI ServiConnect ! 📋 Va sur la page Annonces pour les voir.`;
  }
  if(ql.includes('inscrit')||ql.includes('utilisateur')&&!ql.includes('create')){
    return `FEDANI ServiConnect compte **${users.length} utilisateur${users.length>1?'s':''}** inscrits ! 👥 La communauté grandit chaque jour.`;
  }
  if(ql.includes('bonjour')||ql.includes('salut')||ql.includes('hello')||ql.includes('bonsoir')){
    const greeting=currentUser?`Bonjour **${currentUser.nom.split(' ')[0]}** !`:'Bonjour !';
    return `${greeting} 👋 Bienvenue sur **FEDANI ServiConnect**. Comment puis-je t'aider aujourd'hui ?`;
  }
  if(ql.includes('merci')){return `Avec plaisir ! 😊 N'hésite pas si tu as d'autres questions. Bonne expérience sur FEDANI ServiConnect !`;}
  if(ql.includes('problème')||ql.includes('bug')||ql.includes('erreur')){
    return `Désolé pour ce problème ! 😔 Contacte notre équipe à **fedanisarl1@gmail.com** ou via WhatsApp **+237 696 837 926**. Nous répondrons dans les 24h.`;
  }
  if(ql.includes('heure')||ql.includes('temps')){
    return `Il est actuellement ${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} ⏰. La plateforme FEDANI est disponible 24h/24 !`;
  }
  if(ql.includes('cameroun')||ql.includes('douala')||ql.includes('yaoundé')){
    return `🇨🇲 FEDANI ServiConnect est **100% camerounais** ! Basé à Douala, nous servons les étudiants de tout le Cameroun : Douala, Yaoundé, Bafoussam, Bandjoun, Buea, Bamenda et plus encore.`;
  }
  return `Hmm, laisse-moi réfléchir... 🤔\n\nTu peux me demander :\n• **Trouver** une annonce\n• **Publier** un service\n• Les **paiements** acceptés\n• Comment **devenir partenaire**\n• Les **actualités** & événements\n• Tout sur **FEDANI**\n\nOu clique sur un des boutons rapides ci-dessous !`;
}

function appendAIMsg(text,role){
  const msgs=document.getElementById('aiMessages');
  const div=document.createElement('div');div.className=`ai-msg ${role}`;
  const avatar=document.createElement('span');avatar.className='ai-avatar';
  avatar.textContent=role==='bot'?'🤖':'👤';
  const bubble=document.createElement('div');bubble.className='ai-bubble';
  bubble.innerHTML=text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  div.appendChild(avatar);div.appendChild(bubble);msgs.appendChild(div);
  msgs.scrollTop=msgs.scrollHeight;return div;
}
function appendTyping(){
  const msgs=document.getElementById('aiMessages');
  const div=document.createElement('div');div.className='ai-msg bot';
  const av=document.createElement('span');av.className='ai-avatar';av.textContent='🤖';
  const typing=document.createElement('div');typing.className='ai-typing';
  for(let i=0;i<3;i++){const s=document.createElement('span');typing.appendChild(s);}
  div.appendChild(av);div.appendChild(typing);msgs.appendChild(div);
  msgs.scrollTop=msgs.scrollHeight;return div;
}

// ════════════════════════════════════════════════════
// NAVIGATION (définie avant init pour éviter erreur)
// ════════════════════════════════════════════════════
const _pageHistory=[];
function goPage(page){
  if(page!=='detail')saveScroll();
  if(page!=='detail')_prevPage=document.querySelector('.page.active')?.id?.replace('page-','')||'home';
  if(page!=='detail'){
    try{history.pushState({page},'',window.location.pathname+'#'+page);}catch(e){}
    _pageHistory.push(page);
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  document.querySelectorAll('.drawer-link').forEach(l=>l.classList.remove('active'));
  const el=document.getElementById('page-'+page);
  if(el)el.classList.add('active');
  const link=document.querySelector(`[data-page="${page}"]`);
  if(link)link.classList.add('active');
  const drawerLink=document.querySelector(`.drawer-link[data-drawer-page="${page}"]`);
  if(drawerLink)drawerLink.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  closeMenu();
  trackVisit(page);
  switch(page){
    case 'home':        renderHomeAnnonces();updateStats();applySiteContent();break;
    case 'annonces':    renderAnnonces();break;
    case 'services':    renderServices();break;
    case 'partenaires': renderPartenaires();break;
    case 'actualites':  renderActualites('all');break;
    case 'apropos':     renderTeam();break;
    case 'publier':     showPublierForm();break;
    case 'contact':     break;
    case 'mesAnnonces': renderMesAnnonces();break;
    case 'profil':      loadProfilForm();break;
    case 'admin':
      if(!currentUser||currentUser.role!=='admin'){toast('Accès refusé.','error');goPage('home');return;}
      renderAdmin();break;
  }
}

// ── Bouton retour téléphone (Android/navigateur) ──────────────
window.addEventListener('popstate',e=>{
  if(e.state&&e.state.page==='detail'){showDetail(e.state.id,true);setTimeout(()=>window.scrollTo(0,e.state.scroll||0),80);return;}
  const page=(e.state&&e.state.page)||'home';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  document.querySelectorAll('.drawer-link').forEach(l=>l.classList.remove('active'));
  const el=document.getElementById('page-'+page);
  if(el)el.classList.add('active');
  const link=document.querySelector(`[data-page="${page}"]`);
  if(link)link.classList.add('active');
  const drawerLink=document.querySelector(`.drawer-link[data-drawer-page="${page}"]`);
  if(drawerLink)drawerLink.classList.add('active');
  setTimeout(()=>window.scrollTo(0,(e.state&&e.state.scroll)||0),80);
  trackVisit(page);
  switch(page){
    case 'home':        renderHomeAnnonces();updateStats();applySiteContent();break;
    case 'annonces':    renderAnnonces();break;
    case 'services':    renderServices();break;
    case 'partenaires': renderPartenaires();break;
    case 'actualites':  renderActualites('all');break;
    case 'apropos':     renderTeam();break;
    case 'mesAnnonces': renderMesAnnonces();break;
    case 'profil':      loadProfilForm();break;
    case 'admin':
      if(!currentUser||currentUser.role!=='admin'){return;}
      renderAdmin();break;
  }
});

// ── Scroll to top button ──────────────────────────────────────
window.addEventListener('scroll',()=>{
  const btn=document.getElementById('scrollTopBtn');
  if(btn)btn.classList.toggle('show',window.scrollY>400);
});

// Close hamburger on resize
window.addEventListener('resize',()=>{
  if(window.innerWidth>700)closeMenu();
});

// ════════════════════════════════════════════════════
// INITIALISATION
// ════════════════════════════════════════════════════
applySiteContent();
updateAuthUI();
showPublierForm();
goPage('home');
initIntro();

// ════════════════════════════════════════════════════
// PONT FIREBASE (utilisé par firebase-layer.js)
// ════════════════════════════════════════════════════
window.FB = window.FB || {};
Object.assign(window.FB,{
  setAnnonces(l){annonces=l;},
  getAnnonces(){return annonces;},
  setUsers(l){users=l;},
  setCurrentUser(u){currentUser=u;},
  getCurrentUser(){return currentUser;},
  getLocal(){return {services,team:teamMembers,partners,actus:actualites,site:siteContent,msgs:partnerMsgs};},
  setServices(l){services=l;localStorage.setItem('sc_services',JSON.stringify(l));},
  setTeam(l){teamMembers=l;localStorage.setItem('sc_team',JSON.stringify(l));},
  setPartners(l){partners=l;localStorage.setItem('sc_partners',JSON.stringify(l));},
  setActus(l){actualites=l;localStorage.setItem('sc_actualites',JSON.stringify(l));},
  setSite(o){siteContent=o;localStorage.setItem('sc_site',JSON.stringify(o));},
  setMsgs(l){partnerMsgs=l;localStorage.setItem('sc_partner_msgs',JSON.stringify(l));},
  setVisits(v,u){visites=v;uniqueVisitors=u;}
});


// Cartes du dashboard cliquables : ouvrent uniquement la section choisie
function dashGo(name){
  const btn=document.querySelector(`#adminTabsBar .tab-btn[onclick*="'${name}'"]`);
  if(btn)adminTab(name,btn);
}


/* ═══════════ SÉCURITÉ : journal + moniteur réseau ═══════════ */
const SEC={events:[],net:[]};
window.SEC=SEC;
function secLog(type,msg){
  SEC.events.unshift({t:Date.now(),type,msg:String(msg).slice(0,300)});SEC.events=SEC.events.slice(0,300);
  const tb=document.getElementById('tab-secu');if(tb&&tb.classList.contains('active'))secuRender();
}
window.secLog=secLog;
(function(){
  const push=r=>{SEC.net.unshift(r);if(SEC.net.length>200)SEC.net.length=200;};
  const of=window.fetch;
  window.fetch=function(input,init){
    const url=typeof input==='string'?input:((input&&input.url)||String(input));
    const rec={t:Date.now(),method:((init&&init.method)||(input&&input.method)||'GET').toUpperCase(),url,status:'…',ms:0};
    const t0=performance.now();push(rec);
    return of.apply(this,arguments).then(r=>{rec.status=r.status;rec.ms=Math.round(performance.now()-t0);return r;},e=>{rec.status='ÉCHEC';rec.ms=Math.round(performance.now()-t0);throw e;});
  };
  const xo=XMLHttpRequest.prototype.open,xs=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(m,u){this._rec={t:Date.now(),method:String(m).toUpperCase(),url:String(u),status:'…',ms:0};return xo.apply(this,arguments);};
  XMLHttpRequest.prototype.send=function(){
    const r=this._rec;if(r){push(r);const t0=performance.now();this.addEventListener('loadend',()=>{r.status=this.status||'ÉCHEC';r.ms=Math.round(performance.now()-t0);});}
    return xs.apply(this,arguments);
  };
  window.addEventListener('error',e=>secLog('erreur',(e.message||'Erreur JS')+' @ '+(e.filename||'').split('/').pop()+':'+(e.lineno||'')));
  window.addEventListener('unhandledrejection',e=>secLog('erreur','Promesse rejetée : '+((e.reason&&(e.reason.code||e.reason.message))||e.reason)));
  window.addEventListener('offline',()=>secLog('réseau','Connexion internet perdue'));
  window.addEventListener('online',()=>secLog('réseau','Connexion internet rétablie'));
})();
const secEsc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function secuRender(){
  const hh=t=>new Date(t).toLocaleTimeString('fr-FR');
  const admins=(users||[]).filter(u=>u.role==='admin').length;
  const ls=Object.keys(localStorage).filter(k=>k.startsWith('sc_'));
  const checks=[
    [location.protocol==='https:'||location.hostname==='localhost'?'ok':'bad','Connexion chiffrée (HTTPS)',location.protocol==='https:'?'Les échanges sont chiffrés.':'Le site n’est pas en HTTPS : les données peuvent être interceptées.'],
    [admins>=1&&admins<=2?'ok':'warn','Comptes administrateur : '+admins,'Gardez-en le moins possible (1 ou 2) et protégez-les par un mot de passe fort.'],
    [ls.length?'warn':'ok','Données stockées dans le navigateur : '+ls.length+' élément(s)','Ces données restent sur cet appareil et ne sont ni partagées ni protégées par Firebase. Pour la sécurité et le partage entre appareils, elles doivent être migrées vers Firestore.'],
    ['warn','Règles Firestore','Ce site ne peut pas les vérifier. Dans Firebase → Firestore → Règles, vérifiez que seul un administrateur peut lire « users » et modifier les données des autres.'],
    [SEC.net.some(r=>r.status===403)||SEC.events.some(e=>e.type==='erreur'&&/permission/i.test(e.msg))?'warn':'ok','Accès refusés','Des refus « permission-denied » signalent soit une règle trop stricte, soit une tentative non autorisée.']
  ];
  document.getElementById('secuChecks').innerHTML=checks.map(c=>`<div class="sec-check ${c[0]}"><span>${c[0]==='ok'?'✅':c[0]==='warn'?'⚠️':'❌'}</span><div><strong>${secEsc(c[1])}</strong><small>${secEsc(c[2])}</small></div></div>`).join('');
  document.getElementById('secuNet').innerHTML=SEC.net.map(r=>{let d=r.url;try{const u=new URL(r.url,location.href);d=u.host+u.pathname.slice(0,60);}catch(e){}
    return `<tr><td>${hh(r.t)}</td><td>${secEsc(r.method)}</td><td class="db-cell" title="${secEsc(r.url)}">${secEsc(d)}</td><td>${secEsc(r.status)}</td><td>${r.ms?r.ms+' ms':'—'}</td></tr>`;}).join('')||'<tr><td colspan="5" style="color:var(--text2)">Aucune requête enregistrée pour le moment.</td></tr>';
  document.getElementById('secuEvents').innerHTML=SEC.events.map(e=>`<tr><td>${hh(e.t)}</td><td>${secEsc(e.type)}</td><td>${secEsc(e.msg)}</td></tr>`).join('')||'<tr><td colspan="3" style="color:var(--text2)">Aucun événement.</td></tr>';
}

/* ═══════════ BASE DE DONNÉES (explorateur admin) ═══════════ */
const DB={cols:['users','annonces'],cur:'users',docs:[],view:null};
window.DB=DB;
function dbInit(){dbRenderCols();dbLoad(DB.cur);dbLocal();}
function dbRenderCols(){
  document.getElementById('dbCols').innerHTML=DB.cols.map(c=>`<button class="tab-btn ${c===DB.cur?'active':''}" onclick="dbLoad('${c}')"><i class="fa fa-table"></i> ${secEsc(c)}</button>`).join('');
}
function dbAddCol(){
  const i=document.getElementById('dbNewCol'),n=i.value.trim();
  if(!/^[A-Za-z0-9_-]{1,60}$/.test(n)){toast('Nom de collection invalide.','error');return;}
  if(!DB.cols.includes(n))DB.cols.push(n);i.value='';dbLoad(n);
}
async function dbLoad(name){
  DB.cur=name;dbRenderCols();document.getElementById('dbViewer').style.display='none';
  const info=document.getElementById('dbInfo');info.textContent='⏳ Chargement de « '+name+' »…';
  try{
    DB.docs=await window.dbExplore(name);
    info.textContent=DB.docs.length+' document(s) dans « '+name+' » — cliquez sur « Voir » pour tout afficher.';
  }catch(e){DB.docs=[];info.textContent='❌ '+(e.code==='permission-denied'?'Accès refusé par les règles Firestore.':(e.message||e));}
  dbRenderRows();
}
function dbRenderRows(){
  const q=(document.getElementById('dbSearch').value||'').toLowerCase();
  const docs=DB.docs.filter(d=>!q||(d.id+JSON.stringify(d.data)).toLowerCase().includes(q));
  const keys=[];docs.forEach(d=>Object.keys(d.data).forEach(k=>{if(!keys.includes(k))keys.push(k);}));
  const shown=keys.slice(0,6);
  document.getElementById('dbHead').innerHTML='<tr><th>ID</th>'+shown.map(k=>'<th>'+secEsc(k)+'</th>').join('')+'<th>Total champs</th><th></th></tr>';
  document.getElementById('dbBody').innerHTML=docs.map(d=>{
    const i=DB.docs.indexOf(d);
    return `<tr><td class="db-cell" title="${secEsc(d.id)}">${secEsc(d.id)}</td>`+shown.map(k=>{let v=d.data[k];if(v&&typeof v==='object')v=JSON.stringify(v);return `<td class="db-cell" title="${secEsc(v)}">${secEsc(v)}</td>`;}).join('')+`<td>${Object.keys(d.data).length}</td><td><button class="tab-btn" onclick="dbView(${i})">Voir</button></td></tr>`;
  }).join('')||'<tr><td colspan="9" style="color:var(--text2)">Aucun document.</td></tr>';
}
function dbShow(title,obj){
  DB.view=JSON.stringify(obj,null,2);
  document.getElementById('dbViewerTitle').textContent=title;
  document.getElementById('dbViewerPre').textContent=DB.view;
  const v=document.getElementById('dbViewer');v.style.display='block';v.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function dbView(i){const d=DB.docs[i];if(d)dbShow(DB.cur+'/'+d.id,d.data);}
function dbCopy(){navigator.clipboard&&navigator.clipboard.writeText(DB.view||'').then(()=>toast('Copié.','success'));}
function dbExport(){
  const blob=new Blob([JSON.stringify(DB.docs,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fedani-'+DB.cur+'.json';a.click();
  secLog('base','Export JSON de « '+DB.cur+' »');
}
function dbLocal(){
  const ks=Object.keys(localStorage).filter(k=>k.startsWith('sc_'));
  document.getElementById('dbLocal').innerHTML=ks.length?`<div class="users-table-wrap" style="padding:0"><table class="users-table"><thead><tr><th>Clé</th><th>Éléments</th><th>Taille</th><th></th></tr></thead><tbody>`+ks.map(k=>{
    let n='—';try{const v=JSON.parse(localStorage.getItem(k));n=Array.isArray(v)?v.length:Object.keys(v||{}).length;}catch(e){}
    return `<tr><td>${secEsc(k)}</td><td>${n}</td><td>${(localStorage.getItem(k).length/1024).toFixed(1)} Ko</td><td><button class="tab-btn" onclick="dbViewLocal('${k}')">Voir</button></td></tr>`;}).join('')+'</tbody></table></div>':'<p style="color:var(--text2)">Rien de stocké dans le navigateur.</p>';
}
function dbViewLocal(k){let v;try{v=JSON.parse(localStorage.getItem(k));}catch(e){v=localStorage.getItem(k);}dbShow('Navigateur / '+k,v);}


// ═══ Images (Cloudinary), téléchargement et page de détail des services ═══
async function pickImage(input,targetId,label){
  const f=input.files&&input.files[0];if(!f)return;
  if(!window.uploadImage){toast('Envoi indisponible, réessayez.','error');return;}
  toast('⏳ Envoi de l\'image…','info');
  try{
    const up=await window.uploadImage(f);
    document.getElementById(targetId).value=up.url;
    toast('✅ '+(label||'Image')+' envoyée. Enregistrez pour confirmer.','success');
  }catch(e){toast('❌ '+(e.message||'Échec de l\'envoi'),'error');}
  input.value='';
}
function dlUrl(url,name){
  const n=String(name||'image').replace(/[^\w-]+/g,'_').slice(0,40);
  return url.includes('res.cloudinary.com')&&url.includes('/upload/')?url.replace('/upload/','/upload/fl_attachment:'+n+'/'):url;
}
function dlBtn(url,name){
  if(!url)return '';
  return `<a class="btn-primary" href="${dlUrl(url,name)}" download target="_blank" rel="noopener" style="display:inline-block;margin:.75rem 0;text-decoration:none">⬇️ Télécharger l'image</a>`;
}
const SERVICE_PRO={
  sv1:{long:'Une présence en ligne qui inspire confiance. Nos développeurs conçoivent des sites rapides, élégants et adaptés au mobile, pensés pour convertir vos visiteurs en clients.',why:['Design moderne et responsive','Livraison rapide, accompagnement inclus','Prix adaptés aux étudiants et petites structures']},
  sv2:{long:'Être trouvé fait toute la différence. Nous optimisons votre visibilité sur Google et les réseaux pour attirer plus de visiteurs qualifiés.',why:['Audit clair de votre présence en ligne','Actions concrètes et mesurables','Conseils simples, sans jargon']},
  sv3:{long:'Simplifiez votre quotidien et celui de vos clients avec des outils numériques sur mesure : paiements, formulaires, automatisations.',why:['Solutions adaptées au contexte local','Mise en place guidée pas à pas','Support après livraison']},
  sv4:{long:'Vous n\'êtes pas seul. Un expert vous suit de l\'idée jusqu\'au résultat, avec des points réguliers et des conseils personnalisés.',why:['Suivi individuel','Objectifs clairs et échéances tenues','Disponibilité et écoute']},
  sv5:{long:'Du petit script au projet complet, nos programmeurs vous aident à réaliser, corriger et comprendre votre code.',why:['Projets académiques et professionnels','Code propre et expliqué','Plusieurs langages maîtrisés']},
  sv6:{long:'Logos, affiches, flyers, retouches photo : des visuels soignés qui valorisent votre image et marquent les esprits.',why:['Créations originales','Fichiers prêts à imprimer ou publier','Retouches rapides']},
  sv7:{long:'Des documents impeccables, sans stress : mise en forme, présentations, CV et bases de données réalisés avec rigueur.',why:['Rendu professionnel','Délais respectés','Confidentialité garantie']},
  sv8:{long:'Un ordinateur lent ou en panne ? Nos techniciens le remettent d\'aplomb : installation, nettoyage, sécurité et sauvegarde.',why:['Diagnostic clair avant intervention','Protection contre virus et pertes de données','Interventions rapides']},
  sv9:{long:'Un réseau fiable pour votre maison, votre commerce ou votre école : installation, configuration et dépannage.',why:['Installation propre et sécurisée','Wi-Fi stable et partage simple','Dépannage réactif']},
  sv10:{long:'Développez votre audience et vos ventes : création de comptes professionnels, contenus attractifs et publicités ciblées.',why:['Contenus adaptés à votre cible','Suivi des performances','Gain de temps pour vous']},
  sv11:{long:'Tous vos documents professionnels, prêts à l\'emploi : rapports, contrats, tableaux, présentations et conversions de formats.',why:['Mise en page soignée','Tous formats : Word, Excel, PPT, PDF','Livraison rapide']}
};
function openService(id){
  const s=services.find(x=>x.id===id);if(!s)return;
  const pro=SERVICE_PRO[s.id]||{};
  const long=s.long||pro.long||s.desc;
  const why=pro.why||[];
  const pts=(s.points||'').split('\n').filter(Boolean);
  const hero=s.img?`<img class="detail-img" src="${escHtml(s.img)}" alt="${escHtml(s.title)}" style="width:100%;max-height:340px;object-fit:cover;border-radius:var(--radius)" onerror="this.style.display='none'">`:`<div style="font-size:5rem;text-align:center;padding:2rem">${escHtml(s.icon)}</div>`;
  document.getElementById('detailContent').innerHTML=`
    <div class="detail-wrap">
      <button class="detail-back" onclick="goBackSmart('${_prevPage}')">← Retour</button>
      ${hero}${dlBtn(s.img,s.title)}
      <div class="detail-main">
        <div class="detail-cat-badge">${escHtml(s.icon)} ${escHtml(s.filter||'Service')}</div>
        <h1>${escHtml(s.title)}</h1>
        <p class="detail-desc">${escHtml(s.desc)}</p>
        <p class="detail-desc">${escHtml(long).replace(/\n/g,'<br>')}</p>
        ${pts.length?`<h3 style="margin:1.5rem 0 .5rem">Ce que nous proposons</h3><ul style="line-height:1.9;padding-left:1.2rem">${pts.map(p=>`<li>${escHtml(p)}</li>`).join('')}</ul>`:''}
        ${why.length?`<h3 style="margin:1.5rem 0 .5rem">Pourquoi nous choisir</h3><ul style="line-height:1.9;padding-left:1.2rem">${why.map(p=>`<li>✔ ${escHtml(p)}</li>`).join('')}</ul>`:''}
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1.5rem">
          <button class="btn-primary" onclick="filterCategory('${escHtml(s.filter||s.title)}')">Voir les annonces</button>
          <button class="btn-primary" onclick="goPage('publier')" style="background:transparent;border:1px solid var(--accent);color:var(--accent)">Publier une offre</button>
        </div>
      </div>
    </div>`;
  goPage('detail');
}
// Images envoyées sur Cloudinary (plus de base64 dans la base)
function previewPartnerLogo(input){
  const f=input.files[0];if(!f)return;
  const pw=document.getElementById('partnerLogoPreviewWrap'),pp=document.getElementById('partnerLogoPreview');
  if(pw&&pp){pw.style.display='block';pp.src=URL.createObjectURL(f);}
  window._pendingPartnerLogo=null;pickImage(input,'partnerLogo','Logo');
}
function previewTeamPhoto(input){
  const f=input.files[0];if(!f)return;
  const wrap=document.getElementById('teamPhotoPreviewWrap'),pv=document.getElementById('teamPhotoPreview');
  if(pv&&wrap){pv.src=URL.createObjectURL(f);wrap.style.display='block';}
  window._pendingTeamPhoto=null;pickImage(input,'teamPhoto','Photo');
}
