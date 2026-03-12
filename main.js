/* ==========================================================================
   Andafar — Landing Page Scripts
   ========================================================================== */
/* ---------- GIS CANVAS ANIMATION ---------- */
(function () {
  'use strict';

  var canvas = document.getElementById('gis-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var W, H;
  var mouse = { x: -9999, y: -9999 };
  var scrollY = 0;
  var NODE_COUNT = 35;
  var CONNECT_DIST = 140;
  var MOUSE_RADIUS = 120;

  /* color palette — visible on light (#FAFAF7) background */
  var LIME   = '#2E9E4F';
  var GREEN  = '#1B6B30';
  var BORDER = '#8CA68E';

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* Nodes represent survey points */
  var nodes = [];
  function initNodes() {
    nodes = [];
    for (var i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r:  Math.random() * 2 + 1.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    /* Scroll drift — shift everything slightly */
    var drift = (scrollY % H) * 0.06;

    /* Update positions */
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];

      /* Drift with scroll */
      n.y += n.vy + drift * 0.01;
      n.x += n.vx;

      /* Mouse repulsion */
      var dx = n.x - mouse.x;
      var dy = n.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0) {
        var force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
        n.x += (dx / dist) * force * 2.4;
        n.y += (dy / dist) * force * 2.4;
      }

      /* Wrap around edges */
      if (n.x < -10) n.x = W + 10;
      if (n.x > W + 10) n.x = -10;
      if (n.y < -10) n.y = H + 10;
      if (n.y > H + 10) n.y = -10;
    }

    /* Draw connections (polylines / boundary lines) */
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x;
        var dy = nodes[i].y - nodes[j].y;
        var d  = Math.sqrt(dx * dx + dy * dy);
        if (d < CONNECT_DIST) {
          var alpha = (1 - d / CONNECT_DIST) * 0.7;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = 'rgba(46,158,79,' + alpha + ')';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

    /* Draw filled polygons for clusters of 3 nearby nodes */
    for (var i = 0; i < nodes.length - 2; i += 3) {
      var a = nodes[i], b = nodes[i + 1], c = nodes[i + 2];
      var d1 = Math.hypot(a.x - b.x, a.y - b.y);
      var d2 = Math.hypot(b.x - c.x, b.y - c.y);
      var d3 = Math.hypot(a.x - c.x, a.y - c.y);
      if (d1 < CONNECT_DIST && d2 < CONNECT_DIST && d3 < CONNECT_DIST) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(27,107,48,0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(27,107,48,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    /* Draw nodes (survey points) */
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var pulse = Math.sin(ts * 0.001 + n.phase) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + pulse * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = i % 7 === 0 ? LIME : BORDER;
      ctx.fill();
      /* Accent glow on lime nodes */
      if (i % 7 === 0) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 4 + pulse * 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(46,158,79,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    requestAnimationFrame(draw);
  }

  /* Scroll theme shift */
  function onScroll() {
    scrollY = window.scrollY;
    var maxScroll = document.body.scrollHeight - window.innerHeight;
    var pct = maxScroll > 0 ? scrollY / maxScroll : 0;
    /* Smoothly ramp canvas opacity: full at top, slightly lower mid-page */
    canvas.style.opacity = (0.55 + pct * 0.15).toFixed(3);
  }

  window.addEventListener('resize', function () { resize(); initNodes(); }, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });
  /* Hide cursor influence on touch */
  window.addEventListener('touchstart', function () {
    mouse.x = -9999;
    mouse.y = -9999;
  }, { passive: true });

  resize();
  initNodes();
  requestAnimationFrame(draw);
})();
(function () {
  'use strict';

  /* ---------- TOUCH DETECTION ---------- */
  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(hover: none)').matches;

  /* ---------- NAV SCROLL SHADOW ---------- */
  var nav = document.querySelector('nav');
  if (nav) {
    var lastScroll = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      nav.classList.toggle('scrolled', y > 10);
      lastScroll = y;
    }, { passive: true });
  }

  /* ---------- ANIMATED COUNTERS ---------- */
  function countUp(el) {
    var t = +el.dataset.target;
    var d = 1600;
    var s = null;

    function step(ts) {
      if (!s) s = ts;
      var p = Math.min((ts - s) / d, 1);
      var e = 1 - Math.pow(1 - p, 3); // cubic ease-out
      el.textContent = Math.round(e * t) + '+';
      if (p < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  var heroEl = document.getElementById('hero');
  if (heroEl) {
    var counterFired = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !counterFired) {
          counterFired = true;
          document.querySelectorAll('[data-target]').forEach(countUp);
        }
      });
    }, { threshold: 0.4 }).observe(heroEl);
  }

  /* ---------- SCROLL REVEAL ---------- */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        revealIO.unobserve(e.target); // stop observing once revealed
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal,.feat-card,.wf-step,.integ-card,.plan-card').forEach(function (el) {
    revealIO.observe(el);
  });

  /* ---------- WORKFLOW STAGGER ---------- */
  var wfGrid = document.querySelector('.workflow-grid');
  if (wfGrid) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.wf-step').forEach(function (el, i) {
            setTimeout(function () {
              el.classList.add('in-view');
            }, i * 120);
          });
        }
      });
    }, { threshold: 0.2 }).observe(wfGrid);
  }

  /* ---------- BILLING TOGGLE ---------- */
  var annual = false;
  var plans = {
    starter: { m: '30 000', a: '25 000', mAnn: '300 000', ann: '250 000' },
    pro:     { m: '60 000', a: '50 000', mAnn: '600 000', ann: '500 000' }
  };

  function applyBillingText() {
    var lang = window._lang || 'en';
    ['starter', 'pro'].forEach(function (p) {
      var priceEl = document.getElementById('price-' + p);
      var periodEl = document.getElementById('period-' + p);
      var noteEl = document.getElementById('note-' + p);

      if (priceEl)  priceEl.textContent = annual ? plans[p].a : plans[p].m;
      if (periodEl) periodEl.textContent = annual
        ? (lang === 'fr' ? 'par mois, facturation annuelle' : 'per month, billed annually')
        : (lang === 'fr' ? 'par mois' : 'per month');
      if (noteEl)   noteEl.textContent = annual
        ? plans[p].ann + (lang === 'fr' ? ' FCFA/an (2 mois gratuits)' : ' FCFA/year (2 months free)')
        : '\u00a0';
    });
  }
  window._applyBilling = applyBillingText;

  window.toggleBilling = function () {
    annual = !annual;
    var toggle = document.getElementById('bill-toggle');
    var lblM = document.getElementById('lbl-m');
    var lblA = document.getElementById('lbl-a');

    if (toggle) toggle.classList.toggle('active', annual);
    if (lblM)   lblM.classList.toggle('on', !annual);
    if (lblA)   lblA.classList.toggle('on', annual);

    applyBillingText();
  };

  /* ---------- SMOOTH SCROLL FOR ANCHOR LINKS ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- LAZY-LOAD IMAGES ---------- */
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  }

})();

/* ============================================================
   LANGUAGE TOGGLE  (FR / EN)
   ============================================================ */
(function () {
  'use strict';

  window._lang = localStorage.getItem('andafar-lang') || 'en';

  /* ---- simple text translations  [selector, EN, FR] ---- */
  var T = [
    /* Nav */
    ['.nav-tag', 'Now Open', 'Maintenant ouvert'],
    /* Hero */
    ['.hero-label-txt', 'Collaborative GIS Platform', 'Plateforme SIG collaborative'],
    ['.hero-sub', 'The platform that connects office and field teams for GIS data correction at scale. Works for utilities, land surveys, infrastructure, environmental mapping, humanitarian ops \u2014 offline-first, real-time, native KoboToolbox integration.', 'La plateforme qui connecte \u00e9quipes bureau et terrain pour la correction de donn\u00e9es SIG \u00e0 grande \u00e9chelle. Con\u00e7ue pour les services publics, le cadastre, les infrastructures, la cartographie environnementale, l\u2019humanitaire \u2014 offline-first, temps r\u00e9el, int\u00e9gration native KoboToolbox.'],
    ['.hero .btn-ghost', 'Explore Features', 'D\u00e9couvrir les fonctionnalit\u00e9s'],
    /* Problem */
    ['#problem .section-label', 'Why Andafar', 'Pourquoi Andafar'],
    ['#problem h2', 'Field GIS data correction was a headache', 'La correction de donn\u00e9es SIG terrain \u00e9tait un casse-t\u00eate'],
    ['#problem .reveal > p', 'GIS data collected in the field arrives at the office incomplete, unverified, and improperly linked. Without a dedicated tool, coordination between agents and supervisors means time-consuming manual work.', 'Les donn\u00e9es SIG collect\u00e9es sur le terrain arrivent au bureau incompl\u00e8tes, non v\u00e9rifi\u00e9es et mal li\u00e9es. Sans un outil d\u00e9di\u00e9, la coordination entre agents et superviseurs implique un travail manuel chronophage.'],
    /* Features */
    ['#features .section-label', 'Features', 'Fonctionnalit\u00e9s'],
    ['#features h2', 'Everything your field team needs', 'Tout ce dont votre \u00e9quipe terrain a besoin'],
    ['#features .features-top > p', 'A complete stack built for real field conditions: intermittent connectivity, non-technical agents, complex forms, rigorous validation.', 'Une stack compl\u00e8te con\u00e7ue pour les conditions r\u00e9elles du terrain : connectivit\u00e9 intermittente, agents non-techniques, formulaires complexes, validation rigoureuse.'],
    /* Workflow */
    ['#workflow .section-label', 'Process', 'Processus'],
    ['#workflow h2', 'From field to validation in 6 steps', 'Du terrain \u00e0 la validation en 6 \u00e9tapes'],
    ['#workflow .workflow-head > p', 'A structured collaborative workflow between field agents, supervisors and GIS managers.', 'Un workflow collaboratif structur\u00e9 entre agents terrain, superviseurs et gestionnaires SIG.'],
    /* Integrations */
    ['#integrations .section-label', 'Integrations', 'Int\u00e9grations'],
    ['#integrations h2', 'Plugged into your existing GIS stack', 'Branch\u00e9 sur votre stack SIG existant'],
    ['#integrations .integ-head > p', 'No migration needed. Andafar integrates with your tools without changing your workflow.', 'Aucune migration nécessaire. Andafar s\u2019intègre à vos outils sans changer votre workflow.'],
    /* Pricing */
    ['#pricing .section-label', 'Pricing', 'Tarifs'],
    ['#pricing .pricing-head > p', 'Start for free. Scale up as your project grows. All prices in FCFA.', 'Commencez gratuitement. Évoluez au rythme de votre projet. Tous les prix en FCFA.'],
    ['#lbl-m', 'MONTHLY', 'MENSUEL'],
    ['#lbl-a', 'ANNUAL', 'ANNUEL'],
    ['.badge-save', '2 MONTHS FREE', '2 MOIS GRATUITS'],
    ['#period-starter', 'per month', 'par mois'],
    ['#period-pro', 'per month', 'par mois'],
    ['.plan-card:nth-child(1) .plan-period', 'forever', 'pour toujours'],
    /* Plan names */
    ['.plan-card:nth-child(1) .plan-name', 'Free', 'Gratuit'],
    ['.plan-card:nth-child(2) .plan-badge.popular', 'Starter', 'Starter'],
    ['.plan-card:nth-child(3) .plan-badge.featured-b', 'Popular', 'Populaire'],
    ['.plan-card:nth-child(4) .plan-badge.enterprise-b', 'Enterprise', 'Entreprise'],
    ['.plan-card:nth-child(4) .plan-name', 'Enterprise', 'Entreprise'],
    /* Plan CTAs */
    ['.plan-card:nth-child(1) .plan-cta', 'Get started', 'Commencer'],
    ['.plan-card:nth-child(2) .plan-cta', 'Get started', 'Commencer'],
    ['.plan-card:nth-child(3) .plan-cta', 'Start now', 'Commencer'],
    ['.plan-card:nth-child(4) .plan-cta', 'Get in touch', 'Contactez-nous'],
    ['.promo-ribbon', '1 month free!', '1 mois gratuit !'],
    /* Live Preview */
    ['#live-preview .section-label', 'Live Preview', 'Aper\u00e7u en direct'],
    ['#live-preview > .preview-inner > .reveal > p', 'See GIS data corrections directly in the Andafar interface \u2014 office and field teams in sync.', 'Visualisez les corrections de donn\u00e9es SIG directement dans l\u2019interface Andafar \u2014 \u00e9quipes bureau et terrain en synchronisation.'],
    /* Contact */
    ['#contact .section-label', 'Contact', 'Contact'],
    ['#contact h2', 'Ready to deploy on your project?', 'Pr\u00eat \u00e0 d\u00e9ployer sur votre projet ?'],
    ['#contact .reveal > p', 'Andafar is an open platform. Self-configure your account and projects, or reach out to discuss your GIS survey workflow.', 'Andafar est une plateforme ouverte. Configurez votre compte et vos projets vous-m\u00eame, ou contactez-nous pour discuter de votre workflow d\u2019enqu\u00eate SIG.'],
    ['.author-role', 'CEO - Geo Shiffai', 'PDG - Geo Shiffai'],
    ['.author-bio', 'CEO of Geo Shiffai, specialising in GIS field platforms, geospatial data management and smart city tools for West Africa and beyond.', 'PDG de Geo Shiffai, sp\u00e9cialis\u00e9 dans les plateformes SIG terrain, la gestion de donn\u00e9es g\u00e9ospatiales et les outils smart city pour l\u2019Afrique de l\u2019Ouest et au-del\u00e0.']
  ];

  /* ---- innerHTML translations  [selector, EN, FR] ---- */
  var H = [
    ['.hero-title', 'Correct Field Data<br/><span class="line-accent">Together</span>', 'Corrigez vos donn\u00e9es terrain<br/><span class="line-accent">Ensemble</span>'],
    ['#pricing h2', 'Transparent, scalable,<br/>built for the field', 'Transparent, \u00e9volutif,<br/>con\u00e7u pour le terrain'],
    ['#live-preview h2', 'Real-time corrections<br/>on Andafar Web', 'Corrections en temps r\u00e9el<br/>sur Andafar Web'],
    ['.plan-amount.ent', 'Custom<br/>quote', 'Sur<br/>devis'],
    ['.pricing-note', '<b>Open registration</b>: self-serve setup \u2014 create your account and projects directly on the platform.<br/>All plans include offline mode and native KoboToolbox sync. Email support included.<br/><b>Early access:</b> the first 30 teams to sign up can reach us via WhatsApp or email for direct onboarding.', '<b>Inscription ouverte</b> : configuration en libre-service \u2014 cr\u00e9ez votre compte et vos projets directement sur la plateforme.<br/>Tous les forfaits incluent le mode hors-ligne et la synchronisation native KoboToolbox. Support email inclus.<br/><b>Acc\u00e8s anticip\u00e9 :</b> les 30 premi\u00e8res \u00e9quipes inscrites peuvent nous contacter via WhatsApp ou email pour un onboarding direct.']
  ];

  /* ---- pain items (indexed) ---- */
  var painTexts = [
    ['Excel files shared over WhatsApp, conflicting versions, no traceability', 'Fichiers Excel partag\u00e9s sur WhatsApp, versions conflictuelles, aucune tra\u00e7abilit\u00e9'],
    ['Field agents without connectivity \u2014 work impossible without a network', 'Agents terrain sans connectivit\u00e9 \u2014 travail impossible sans r\u00e9seau'],
    ['No link between the map feature and its correction form', 'Aucun lien entre l\u2019entit\u00e9 cartographique et son formulaire de correction'],
    ['Manual supervisor validation \u2014 no diff, no history, no formal rejections', 'Validation superviseur manuelle \u2014 pas de diff, pas d\u2019historique, pas de rejets formels']
  ];

  var proHeading = ['With Andafar', 'Avec Andafar'];
  var proTexts = [
    ['Instant attribute join after corrections \u2014 no need to re-join through QGIS or ArcGIS manually', 'Jointure attributaire instantan\u00e9e apr\u00e8s correction \u2014 plus besoin de refaire la jointure manuellement dans QGIS ou ArcGIS'],
    ['Offline-first: agents collect and correct data without any network, sync when back online', 'Offline-first : les agents collectent et corrigent sans r\u00e9seau, synchronisation au retour en ligne'],
    ['Each map feature is directly linked to its correction form \u2014 one tap to open, fill, and submit', 'Chaque entit\u00e9 cartographique est directement li\u00e9e \u00e0 son formulaire de correction \u2014 un tap pour ouvrir, remplir et soumettre'],
    ['Built-in before/after diff, full history, and formal approval or rejection workflow', 'Diff avant/apr\u00e8s int\u00e9gr\u00e9, historique complet et workflow formel d\u2019approbation ou de rejet'],
    ['Live validation or rejection \u2014 corrections are addressed on the spot, eliminating costly back-and-forth trips to the field', 'Validation ou rejet en direct \u2014 les corrections sont trait\u00e9es sur place, \u00e9liminant les allers-retours co\u00fbteux sur le terrain'],
    ['Daily corrections monitored per agent \u2014 supervisors see who submitted what, who reviewed it, and track team progress in real time', 'Corrections journali\u00e8res suivies par agent \u2014 les superviseurs voient qui a soumis quoi, qui l\u2019a examin\u00e9 et suivent l\u2019avancement de l\u2019\u00e9quipe en temps r\u00e9el']
  ];

  var probLabels = [
    ['Attribute table with statuses', 'Table attributaire avec statuts'],
    ['Before / after diff', 'Diff avant / apr\u00e8s'],
    ['Project analytics', 'Analytiques du projet']
  ];

  /* ---- feat cards (indexed) ---- */
  var featTitles = [
    ['Offline-first, always available', 'Offline-first, toujours disponible'],
    ['Real-time notifications', 'Notifications en temps r\u00e9el'],
    ['QR Code to Feature', 'QR Code vers entit\u00e9'],
    ['GPS Navigation', 'Navigation GPS'],
    ['Zones & Teams with granular control', 'Zones & \u00c9quipes avec contr\u00f4le granulaire']
  ];
  var featBodies = [
    ['Layers, features, forms and basemaps cached locally. Your agents work without connectivity; corrections sync when back online. Automatic conflict resolution.', 'Couches, entit\u00e9s, formulaires et fonds de carte en cache local. Vos agents travaillent sans connexion ; les corrections se synchronisent \u00e0 la reconnexion. R\u00e9solution automatique des conflits.'],
    ['Every submitted correction notifies the supervisor instantly. The agent receives approval or rejection as a push notification, in real time.', 'Chaque correction soumise notifie le superviseur instantan\u00e9ment. L\u2019agent re\u00e7oit l\u2019approbation ou le rejet en notification push, en temps r\u00e9el.'],
    ['Scan a QR on a marker to instantly identify the feature, navigate to it, and open the pre-filled form. Zero manual entry.', 'Scannez un QR sur un marqueur pour identifier instantan\u00e9ment l\u2019entit\u00e9, naviguer vers elle et ouvrir le formulaire pr\u00e9-rempli. Z\u00e9ro saisie manuelle.'],
    ['Turn-by-turn navigation to any GIS feature. Real-time distance and bearing via Google Maps SDK. Works with offline basemap.', 'Navigation guid\u00e9e vers n\u2019importe quelle entit\u00e9 SIG. Distance et cap en temps r\u00e9el via Google Maps SDK. Fonctionne avec le fond de carte hors-ligne.'],
    ['Draw geographic zones on the map, assign agents by zone, configure supervisors by perimeter. Six roles: Owner, Admin, Supervisor, Corrector, Editor, Reader. Daily agent leaderboard to keep motivation high.', 'Dessinez des zones g\u00e9ographiques sur la carte, assignez des agents par zone, configurez les superviseurs par p\u00e9rim\u00e8tre. Six r\u00f4les : Propri\u00e9taire, Admin, Superviseur, Correcteur, \u00c9diteur, Lecteur. Classement quotidien des agents pour maintenir la motivation.']
  ];
  var featPills = [
    /* card 01 pills */
    [['50 features cached', '50 entit\u00e9s en cache'], ['3 local layers', '3 couches locales'], ['MBTiles basemap', 'Fond de carte MBTiles'], ['Sync file queue', 'File de sync']],
    /* card 05 pills */
    [['Zones drawn on map', 'Zones trac\u00e9es sur carte'], ['6 role levels', '6 niveaux de r\u00f4le'], ['Supervisor per zone', 'Superviseur par zone'], ['Daily leaderboard', 'Classement quotidien'], ['History per agent', 'Historique par agent']]
  ];

  /* ---- workflow steps (indexed) ---- */
  var wfTitles = [
    ['Import GIS Data', 'Importer les donn\u00e9es SIG'],
    ['Configure Layers', 'Configurer les couches'],
    ['Surveyors, Additions & Assignment Zones', 'Enqu\u00eateurs, ajouts & zones d\u2019affectation'],
    ['Field Correction', 'Correction terrain'],
    ['Supervision & Validation', 'Supervision & Validation'],
    ['Export & QGIS', 'Export & QGIS']
  ];
  var wfDescs = [
    ['Load your GIS layers (GeoJSON, SHP, GPKG) and link your KoboToolbox forms. Up and running in minutes.', 'Chargez vos couches SIG (GeoJSON, SHP, GPKG) et liez vos formulaires KoboToolbox. Op\u00e9rationnel en quelques minutes.'],
    ['Set up your GIS layers, define attribute fields and customise forms for each field agent.', 'Configurez vos couches SIG, d\u00e9finissez les champs attributaires et personnalisez les formulaires pour chaque agent terrain.'],
    ['Add field surveyors, define their coverage zones and assign features to each agent.', 'Ajoutez des enqu\u00eateurs terrain, d\u00e9finissez leurs zones de couverture et assignez les entit\u00e9s \u00e0 chaque agent.'],
    ['The agent locates the feature, scans the QR code, fills the form with photos, GPS and attribute data. Works fully offline.', 'L\u2019agent localise l\u2019entit\u00e9, scanne le QR code, remplit le formulaire avec photos, GPS et donn\u00e9es attributaires. Fonctionne enti\u00e8rement hors-ligne.'],
    ['The supervisor sees the before/after diff in real-time from the web. They approve or reject with a comment. The agent is notified on mobile.', 'Le superviseur voit le diff avant/apr\u00e8s en temps r\u00e9el depuis le web. Il approuve ou rejette avec un commentaire. L\u2019agent est notifi\u00e9 sur mobile.'],
    ['Export to GeoJSON, CSV, GPKG or SHP. Live QGIS sync via PostGIS connection or REST API.', 'Exportez en GeoJSON, CSV, GPKG ou SHP. Synchronisation QGIS en direct via connexion PostGIS ou API REST.']
  ];

  /* ---- integration subs ---- */
  var integSubs = [
    ['XForm forms', 'Formulaires XForm'],
    ['Sync PostgreSQL', 'Sync PostgreSQL'],
    ['Direct connection', 'Connexion directe'],
    ['Import / Export', 'Import / Export']
  ];

  /* ---- plan feature lists  [EN, FR] per li, per card ---- */
  var planFeats = [
    /* Free */
    [['1 active project','1 projet actif'],['3 members','3 membres'],['3 layers per project','3 couches par projet'],['1 mobile device','1 appareil mobile'],['Unlimited features','Entit\u00e9s illimit\u00e9es'],['GIS Export','Export SIG'],['QGIS access','Acc\u00e8s QGIS']],
    /* Starter */
    [['3 active projects','3 projets actifs'],['5 members','5 membres'],['5 layers per project','5 couches par projet'],['3 mobile devices','3 appareils mobiles'],['Unlimited features','Entit\u00e9s illimit\u00e9es'],['GIS Export','Export SIG'],['QGIS access','Acc\u00e8s QGIS']],
    /* Pro */
    [['10 active projects','10 projets actifs'],['20 members','20 membres'],['Unlimited layers','Couches illimit\u00e9es'],['10 mobile devices','10 appareils mobiles'],['Unlimited features','Entit\u00e9s illimit\u00e9es'],['GIS Export + QGIS','Export SIG + QGIS'],['Full analytics','Analytiques compl\u00e8tes']],
    /* Enterprise */
    [['Unlimited projects','Projets illimit\u00e9s'],['Unlimited members','Membres illimit\u00e9s'],['Unlimited layers','Couches illimit\u00e9es'],['Unlimited devices','Appareils illimit\u00e9s'],['Unlimited features','Entit\u00e9s illimit\u00e9es'],['GIS Export + QGIS','Export SIG + QGIS'],['Dedicated support + SLA','Support d\u00e9di\u00e9 + SLA']]
  ];

  /* ---- helpers ---- */
  function idx(lang) { return lang === 'fr' ? 1 : 0; }

  function setLiText(li, text) {
    var span = li.querySelector('span');
    li.textContent = '';
    if (span) li.appendChild(span);
    li.appendChild(document.createTextNode(text));
  }

  /* ---- apply language ---- */
  function apply(lang) {
    var i = idx(lang);

    /* simple text */
    T.forEach(function (t) {
      var el = document.querySelector(t[0]);
      if (el) el.textContent = t[1 + i];
    });

    /* innerHTML */
    H.forEach(function (t) {
      var el = document.querySelector(t[0]);
      if (el) el.innerHTML = t[1 + i];
    });

    /* pain items */
    document.querySelectorAll('.pain-text').forEach(function (el, j) {
      if (painTexts[j]) el.textContent = painTexts[j][i];
    });

    /* pro heading & items */
    var proH = document.querySelector('.pro-heading');
    if (proH) proH.textContent = proHeading[i];
    document.querySelectorAll('.pro-text').forEach(function (el, j) {
      if (proTexts[j]) el.textContent = proTexts[j][i];
    });

    /* prob-img labels */
    document.querySelectorAll('.prob-img-label').forEach(function (el, j) {
      if (probLabels[j]) el.textContent = probLabels[j][i];
    });

    /* feat cards */
    document.querySelectorAll('.feat-title').forEach(function (el, j) {
      if (featTitles[j]) el.textContent = featTitles[j][i];
    });
    document.querySelectorAll('.feat-body').forEach(function (el, j) {
      if (featBodies[j]) el.textContent = featBodies[j][i];
    });

    /* feat pills - card 01 (index 0) and card 05 (index 4) */
    var pillCards = document.querySelectorAll('.feat-card');
    [[0, 0], [4, 1]].forEach(function (pair) {
      var card = pillCards[pair[0]];
      if (!card) return;
      var pills = card.querySelectorAll('.feat-pill');
      var data = featPills[pair[1]];
      pills.forEach(function (pill, k) {
        if (data[k]) pill.textContent = data[k][i];
      });
    });

    /* workflow steps */
    document.querySelectorAll('.wf-step').forEach(function (step, j) {
      var h4 = step.querySelector('h4');
      var p = step.querySelector('p');
      if (h4 && wfTitles[j]) h4.textContent = wfTitles[j][i];
      if (p && wfDescs[j])   p.textContent = wfDescs[j][i];
    });

    /* integration subs */
    document.querySelectorAll('.integ-sub').forEach(function (el, j) {
      if (integSubs[j]) el.textContent = integSubs[j][i];
    });

    /* plan feature lis */
    var planCards = document.querySelectorAll('.pricing-grid > .plan-card');
    planCards.forEach(function (card, ci) {
      if (!planFeats[ci]) return;
      var lis = card.querySelectorAll('.plan-features li');
      lis.forEach(function (li, fi) {
        if (planFeats[ci][fi]) setLiText(li, planFeats[ci][fi][i]);
      });
    });

    /* page meta */
    document.documentElement.lang = lang;
    document.title = lang === 'fr'
      ? 'Andafar \u2014 Corrigez vos donn\u00e9es SIG terrain ensemble'
      : 'Andafar \u2014 Correct Field GIS Data Together';

    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = lang === 'fr'
        ? 'Plateforme mobile collaborative pour corriger, valider et exporter les donn\u00e9es SIG terrain. Offline-first, sync temps r\u00e9el, validation superviseur, int\u00e9gration KoboToolbox.'
        : 'Collaborative mobile platform to correct, validate and export GIS field data. Offline-first, real-time sync, supervisor validation, KoboToolbox integration.';
    }

    /* persist + update button */
    window._lang = lang;
    localStorage.setItem('andafar-lang', lang);
    var btn = document.querySelector('.lang-toggle');
    if (btn) btn.textContent = lang === 'en' ? 'FR' : 'EN';

    /* re-apply billing text */
    if (typeof window._applyBilling === 'function') window._applyBilling();
  }

  /* ---- public toggle ---- */
  window.toggleLang = function () {
    apply(window._lang === 'en' ? 'fr' : 'en');
  };

  /* ---- bind toggle button in nav ---- */
  var existingBtn = document.querySelector('.lang-toggle');
  if (existingBtn) {
    existingBtn.textContent = window._lang === 'en' ? 'FR' : 'EN';
    existingBtn.addEventListener('click', window.toggleLang);
  }

  /* apply saved language on load */
  if (window._lang === 'fr') apply('fr');
})();
