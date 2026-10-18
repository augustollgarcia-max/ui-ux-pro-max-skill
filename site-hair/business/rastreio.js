/* Medição HAIR — uma fonte para Meta/CAPI e Google Ads, somente após aceite.
   Conversão WhatsApp existente, confirmada em /inicio: não equivale a matrícula.
   Lead só é chamado pelo formulário depois da confirmação do CRM/análise.
   Não configurar GA4, criar conversões ou inventar rótulos sem os IDs da conta.
   Fonte: hair-business-/site/rastreio.js. */
(function () {
  'use strict';
  var w = window, d = document;
  if (w.__hairRastreio) return;
  w.__hairRastreio = 1;
  var PIXEL = '2824321584567060', ADS = 'AW-799342935';
  var WHATSAPP = 'AW-799342935/cwjnCKSEmekcENeClP0C';
  var CHAVE = 'hair_consent_v1', UTMK = 'hair_utm_v1', CAPI = '/api/meta-capi';
  var ativo = false, inicializado = false, fila = [], ultimaPagina = '';
  function ls(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function id() {
    try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  function contexto(url) {
    var p = new URL(url || location.href, location.href).pathname.replace(/\/+$/, '') || '/';
    return {
      category: p === '/business' || /\/mestre-0\d/.test(p) || p === '/modelo' ? 'barbearia'
        : p === '/beauty' || /\/beauty-0\d/.test(p) ? 'beauty'
        : p === '/inicio' || p === '/alisamento' ? 'cursos'
        : p.indexOf('/vertice') === 0 ? 'parceria' : 'site',
      academy: /\/mestre-01-/.test(p) ? 'LAN' : /\/mestre-02-/.test(p) ? 'WOLF'
        : /\/mestre-03-/.test(p) ? 'ROSATTI' : /\/mestre-04-/.test(p) ? 'SHARPER' : ''
    };
  }
  function origem() {
    try { var o = JSON.parse(ls(UTMK) || 'null'); if (o && Date.now() - o.t < 30 * 864e5) return o; } catch (e) {}
    return null;
  }
  function guardarOrigem() {
    var q = new URLSearchParams(location.search), o = {}, tem = false;
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].forEach(function (k) {
      var v = q.get(k);
      if (v && (k !== 'fbclid' || ls(CHAVE) === 'granted')) { o[k] = v.slice(0, 120); tem = true; }
    });
    if (tem) { o.t = Date.now(); ls(UTMK, JSON.stringify(o)); }
  }
  guardarOrigem();
  w.hairOrigem = origem;
  w.hairConsentGranted = function () { return ativo && ls(CHAVE) === 'granted'; };

  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  var negado = { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  w.gtag('consent', 'default', negado);
  function cookie(n) { var m = d.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; }
  function sha256(s) {
    try { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    }); } catch (e) { return Promise.resolve(''); }
  }
  function enviar(corpo) {
    if (!w.hairConsentGranted()) return;
    try {
      var s = JSON.stringify(corpo);
      if (navigator.sendBeacon && navigator.sendBeacon(CAPI, new Blob([s], { type: 'application/json' }))) return;
      fetch(CAPI, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: s, keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  function entregar(ev) {
    if (!w.hairConsentGranted()) return;
    try { w.fbq('track', ev.nome, ev.dados, { eventID: ev.id }); } catch (e) {}
    var corpo = { event_name: ev.nome, event_id: ev.id, event_source_url: ev.url,
      custom_data: ev.dados, fbp: cookie('_fbp'), fbc: cookie('_fbc') };
    if (ev.telefone) {
      sha256('55' + String(ev.telefone).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')).then(function (h) {
        if (h) corpo.ph = h;
        enviar(corpo);
      });
    } else enviar(corpo);
    if (ev.nome === 'Contact' && !ev.skipGoogle) {
      w.gtag('event', 'conversion', { send_to: WHATSAPP, transport_type: 'beacon' });
    } else if (ev.nome === 'Lead') {
      // Evento informativo: nenhum rótulo de matrícula/conversão Ads é inventado.
      w.gtag('event', 'generate_lead', { send_to: ADS, transaction_id: ev.id,
        content_category: ev.dados.content_category, academy: ev.dados.academy || '' });
    }
  }
  function track(nome, dados) {
    if (ls(CHAVE) === 'denied') return;
    dados = dados || {};
    var url = dados._event_source_url || location.href, ctx = contexto(url), safe = {};
    Object.keys(dados).forEach(function (k) {
      if (k.charAt(0) !== '_' && typeof dados[k] === 'string') safe[k] = dados[k].slice(0, 120);
    });
    if (!safe.content_category && nome !== 'PageView') safe.content_category = ctx.category;
    if (ctx.academy && !safe.academy) safe.academy = ctx.academy;
    var o = origem(); if (o && o.utm_campaign) safe.utm_campaign = o.utm_campaign;
    var ev = { nome: nome, dados: safe, id: dados._event_id || id(), url: url,
      telefone: dados._telefone, skipGoogle: !!dados._skipGoogleConversion };
    if (ativo) entregar(ev); else fila.push(ev);
  }
  w.hairTrack = track;
  w.hairContact = function (dados) {
    var ctx = contexto(), copy = Object.assign({ content_name: d.title.slice(0, 100), content_category: ctx.category }, dados || {});
    // Contact requer a ação com o consentimento vigente; não é reprocessado mais tarde.
    if (w.hairConsentGranted()) track('Contact', copy);
  };
  function pagina() {
    if (!ativo || ultimaPagina === location.href) return;
    ultimaPagina = location.href;
    var ctx = contexto();
    track('PageView');
    if (ctx.category !== 'site') track('ViewContent', { content_name: d.title.slice(0, 100), content_category: ctx.category });
    w.gtag('event', 'page_view', { send_to: ADS, page_location: location.href, page_title: d.title });
  }
  function carregar() {
    if (ativo) return;
    ativo = true;
    w.gtag('consent', 'update', { ad_storage: 'granted', analytics_storage: 'denied', ad_user_data: 'granted', ad_personalization: 'granted' });
    if (!inicializado) {
      inicializado = true;
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = true; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(w, d, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      w.fbq('init', PIXEL);
      w.gtag('js', new Date());
      w.gtag('config', ADS, { send_page_view: false });
      var g = d.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + ADS; d.head.appendChild(g);
    } else { try { w.fbq('consent', 'grant'); } catch (e) {} }
    guardarOrigem(); pagina();
    var f = fila; fila = []; f.forEach(entregar);
  }
  function aviso() {
    if (d.getElementById('hair-consent')) return;
    var b = d.createElement('div'); b.id = 'hair-consent'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Cookies');
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#0b0b0a;color:#efeadf;border-top:1px solid rgba(211,173,108,.45);font:400 13px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;padding:12px max(16px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:center;box-shadow:0 -8px 24px rgba(0,0,0,.45)';
    b.innerHTML = '<span style="max-width:62ch">Usamos cookies para medir os anúncios e melhorar o site. <a href="/privacidade" style="color:#d3ad6c;text-decoration:underline">Saiba mais</a></span>'
      + '<span style="display:flex;gap:8px"><button type="button" data-c="0" style="min-height:40px;padding:0 16px;border-radius:999px;border:1px solid rgba(239,234,223,.35);background:transparent;color:#efeadf;font:inherit;cursor:pointer">Recusar</button>'
      + '<button type="button" data-c="1" style="min-height:40px;padding:0 18px;border-radius:999px;border:0;background:#d3ad6c;color:#11120e;font:700 13px system-ui,sans-serif;cursor:pointer">Aceitar</button></span>';
    b.addEventListener('click', function (e) {
      var c = e.target && e.target.getAttribute && e.target.getAttribute('data-c'); if (c !== '0' && c !== '1') return;
      ls(CHAVE, c === '1' ? 'granted' : 'denied'); b.remove();
      if (c === '1') carregar();
      else {
        ativo = false; fila = []; ultimaPagina = '';
        w.gtag('consent', 'update', negado);
        try { if (w.fbq) w.fbq('consent', 'revoke'); } catch (x) {}
      }
    });
    (d.body || d.documentElement).appendChild(b);
  }
  function preferencias() {
    if (d.querySelector('[data-hair-cookies]')) return;
    var footer = d.querySelector('footer'); if (!footer) return;
    var btn = d.createElement('button'); btn.type = 'button'; btn.textContent = 'Cookies'; btn.setAttribute('data-hair-cookies', '');
    btn.style.cssText = 'font:inherit;color:inherit;background:none;border:0;padding:8px;min-height:32px;cursor:pointer;text-decoration:underline';
    if (footer.classList.contains('esc-pe')) {
      footer.style.position = 'relative';
      btn.style.cssText += ';position:absolute;right:0;top:0;min-height:44px;font-size:10px';
    }
    (footer.querySelector('.wrap') || footer).appendChild(btn);
  }
  function iniciar() {
    preferencias();
    if (ls(CHAVE) === 'granted') carregar(); else if (ls(CHAVE) !== 'denied') aviso();
  }
  d.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-hair-cookies]')) { aviso(); return; }
    var a = e.target.closest && e.target.closest('a[href*="wa.me/"]'); if (!a) return;
    var o = origem();
    if (o && o.utm_campaign) { try {
      var u = new URL(a.href), t = u.searchParams.get('text') || '';
      if (t.indexOf('[ref:') < 0) { u.searchParams.set('text', (t ? t + '\n\n' : '') + '[ref: ' + o.utm_campaign + (o.utm_content ? ' · ' + o.utm_content : '') + ']'); a.href = u.toString(); }
    } catch (x) {} }
    // /inicio já possui rótulos Google específicos; seu handler preservado faz essa parte uma única vez.
    var legacy = location.pathname === '/inicio' && a.matches('[data-wa-generic],[data-wa-consultoria],[data-budget],[data-enrollment]');
    w.hairContact({ _skipGoogleConversion: legacy });
  }, true);
  d.addEventListener('hair:pagechange', function () { guardarOrigem(); preferencias(); iniciar(); pagina(); });
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
