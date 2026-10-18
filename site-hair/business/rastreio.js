/* Rastreio HAIR · Meta Pixel + Conversions API, com consentimento (LGPD). 18/10/2026.
   - Nada da Meta carrega antes de a pessoa tocar em "Aceitar". Escolha guardada no aparelho (hair_consent_v1).
   - Eventos só em ação real: PageView (todas), ViewContent (páginas de curso), Contact (toque num botão de WhatsApp),
     Lead (análise da HARA Vision concluída, chamada pela própria página com window.hairTrack). Nunca Lead por visualização.
   - Cada evento sai com um event_id e vai também para /api/meta-capi (Conversions API), que a Meta deduplica pelo mesmo id.
   - UTMs e fbclid do anúncio ficam 30 dias no aparelho e entram na mensagem do WhatsApp como "[ref: campanha · anúncio]".
   Fonte: hair-business-/site/rastreio.js (publicado em /business/rastreio.js). Não editar a cópia do www. */
(function(){
  'use strict';
  var PIXEL = '2824321584567060';           // conjunto de dados do portfólio "Hair Academia by Nariko" (conta Ribeirão 2026)
  var CHAVE = 'hair_consent_v1', UTMK = 'hair_utm_v1', CAPI = '/api/meta-capi';
  var w = window, d = document;
  if (w.__hairRastreio) return; w.__hairRastreio = 1;
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }

  // 1. origem do anúncio (primeira parte)
  var q; try { q = new URLSearchParams(location.search); } catch(e){ q = null; }
  if (q){ var u = {}, tem = false;
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'].forEach(function(k){ var v = q.get(k); if (v){ u[k] = v.slice(0,120); tem = true; } });
    // fbclid é identificador da Meta: só fica guardado se a pessoa já aceitou os cookies
    if (u.fbclid && ls(CHAVE) !== 'granted') delete u.fbclid;
    if (tem && Object.keys(u).length){ u.t = Date.now(); ls(UTMK, JSON.stringify(u)); } }
  function origem(){ try { var o = JSON.parse(ls(UTMK) || 'null'); if (o && Date.now() - o.t < 30*864e5) return o; } catch(e){} return null; }
  w.hairOrigem = origem; // a janela dos Mestres manda as UTMs junto com o lead para o CRM

  // 2. o que é esta página
  var p = location.pathname.replace(/\/+$/, '') || '/';
  var CAT = p === '/business' || /^\/business\/mestre-/.test(p) ? 'barbearia'
          : p === '/beauty' || /^\/business\/beauty-0/.test(p) ? 'beauty'
          : p === '/inicio' || p === '/alisamento' ? 'cursos'
          : p.indexOf('/vertice') === 0 ? 'parceria' : null;
  // academia LAN/WOLF (anúncios 18/10/2026): vai em todos os eventos das páginas desses Mestres
  var ACAD = /\/mestre-01-/.test(p) ? 'LAN' : /\/mestre-02-/.test(p) ? 'WOLF' : /\/mestre-03-/.test(p) ? 'ROSATTI' : /\/mestre-04-/.test(p) ? 'SHARPER' : null;

  // 3. eventos
  var ativo = false, fila = [];
  function id(){ try { if (crypto.randomUUID) return crypto.randomUUID(); } catch(e){} return Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function cookie(n){ var m = d.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; }
  function sha256(s){ try { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function(b){ return Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }); } catch(e){ return Promise.resolve(''); } }
  function enviar(corpo){ try { var s = JSON.stringify(corpo);
    if (navigator.sendBeacon && navigator.sendBeacon(CAPI, new Blob([s], { type: 'application/json' }))) return;
    fetch(CAPI, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: s, keepalive: true }).catch(function(){}); } catch(e){} }
  function track(nome, dados){
    if (!ativo){ fila.push([nome, dados]); return; }
    dados = dados || {}; var tel = dados._telefone, eid = dados._event_id; delete dados._telefone; delete dados._event_id;
    if (ACAD && !dados.academy) dados.academy = ACAD;
    var o = origem(); if (o && o.utm_campaign) dados.utm_campaign = o.utm_campaign;
    var ev = eid || id();
    try { w.fbq('track', nome, dados, { eventID: ev }); } catch(e){}
    var corpo = { event_name: nome, event_id: ev, event_source_url: location.href, custom_data: dados, fbp: cookie('_fbp'), fbc: cookie('_fbc') };
    if (tel){ sha256('55' + String(tel).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')).then(function(h){ if (h) corpo.ph = h; enviar(corpo); }); }
    else enviar(corpo);
  }
  w.hairTrack = track;

  function carregar(){
    if (ativo) return; ativo = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(w,d,'script','https://connect.facebook.net/en_US/fbevents.js');
    w.fbq('init', PIXEL);
    track('PageView');
    if (CAT || ACAD) track('ViewContent', { content_name: d.title.slice(0, 100), content_category: CAT || 'barbearia' });
    var f = fila; fila = []; f.forEach(function(x){ track(x[0], x[1]); });
  }

  // 4. toque no WhatsApp: coloca a origem do anúncio na mensagem e registra Contact
  d.addEventListener('click', function(e){
    var a = e.target && e.target.closest && e.target.closest('a[href*="wa.me/"]'); if (!a) return;
    var o = origem();
    if (o && o.utm_campaign){ try { var url = new URL(a.href), t = url.searchParams.get('text') || '';
      if (t.indexOf('[ref:') < 0){ url.searchParams.set('text', (t ? t + '\n\n' : '') + '[ref: ' + o.utm_campaign + (o.utm_content ? ' · ' + o.utm_content : '') + ']'); a.href = url.toString(); } } catch(x){} }
    if (ativo) track('Contact', { content_name: d.title.slice(0, 100), content_category: CAT || 'site' });
  }, true);

  // 5. consentimento
  function aviso(){
    var b = d.createElement('div'); b.id = 'hair-consent'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Cookies');
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#0b0b0a;color:#efeadf;border-top:1px solid rgba(211,173,108,.45);font:400 13px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;padding:12px max(16px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:center;box-shadow:0 -8px 24px rgba(0,0,0,.45)';
    b.innerHTML = '<span style="max-width:62ch">Usamos cookies para medir os anúncios e melhorar o site. <a href="/privacidade" style="color:#d3ad6c;text-decoration:underline">Saiba mais</a></span>'
      + '<span style="display:flex;gap:8px"><button type="button" data-c="0" style="min-height:40px;padding:0 16px;border-radius:999px;border:1px solid rgba(239,234,223,.35);background:transparent;color:#efeadf;font:inherit;cursor:pointer">Recusar</button>'
      + '<button type="button" data-c="1" style="min-height:40px;padding:0 18px;border-radius:999px;border:0;background:#d3ad6c;color:#11120e;font:700 13px system-ui,sans-serif;cursor:pointer">Aceitar</button></span>';
    b.addEventListener('click', function(e){ var c = e.target && e.target.getAttribute && e.target.getAttribute('data-c'); if (c === null || c === undefined) return;
      ls(CHAVE, c === '1' ? 'granted' : 'denied'); b.remove(); if (c === '1') carregar(); });
    (d.body || d.documentElement).appendChild(b);
  }
  function iniciar(){ var c = ls(CHAVE); if (c === 'granted') carregar(); else if (c !== 'denied') aviso(); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
