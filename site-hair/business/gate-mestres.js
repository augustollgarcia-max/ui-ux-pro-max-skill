/* Perfis dos Mestres liberados com nome + WhatsApp. Pedido do Augusto em 18/10/2026.
   - Nas páginas dos 4 Mestres (/business/mestre-*), qualquer toque em botão, link, foto ou pergunta abre a janela;
     nas outras páginas, só o toque no card de um Mestre. Uma vez preenchido, libera os 4 perfis.
   - Exceções de propósito: botão de WhatsApp (já é o contato que a gente quer, não leva barreira),
     aviso de cookies e a própria janela.
   - Lembra no aparelho (localStorage + cookie de 1 ano). Não usa IP: no celular o IP muda e é dividido
     entre milhares de pessoas da mesma operadora — liberaria estranhos e bloquearia quem já preencheu.
   - O lead vai para hara_leads pela RPC registrar_lead_site (só acrescenta; não apaga resposta de quem já é lead)
     e aparece no painel de Leads do app. Sem rede, libera do mesmo jeito e tenta enviar na próxima visita.
   - Evento Lead da Meta só aqui, no envio real (com o telefone em hash, via rastreio.js), nunca por visualização.
   Fonte: hair-business-/site/gate-mestres.js (publicado em /business/gate-mestres.js). */
(function(){
  'use strict';
  var w = window, d = document;
  if (w.__hairGate) return; w.__hairGate = 1;
  var OK = 'hair_mestres_ok_v1', PEND = 'hair_mestres_pend_v1';
  var BASE = 'https://zoyyfvfvnxrpojhypsjh.supabase.co/rest/v1/rpc/';
  // v2 (migration 20261018090000) guarda UTMs/academia e devolve o id do lead; enquanto não estiver aplicada,
  // o banco responde 404 e cai na v1, que já está no ar. Nada se perde nos dois casos.
  var RPC2 = BASE + 'registrar_lead_site_v2', RPC1 = BASE + 'registrar_lead_site';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveXlmdmZ2bnhycG9qaHlwc2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTEwMzEsImV4cCI6MjA5NzU4NzAzMX0.gM5qLWnbKMeaHQ5fvBXM8FOHpB2rMrBmZOwfFUqK7D8';
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return null; } }
  function liberado(){ return ls(OK) === '1' || /(?:^|; )hair_mestres_ok=1/.test(d.cookie); }
  function marcar(){ ls(OK, '1'); try { d.cookie = 'hair_mestres_ok=1; max-age=31536000; path=/; SameSite=Lax; Secure'; } catch(e){} }
  function paginaMestre(){ return /\/mestre-0\d/.test(location.pathname); }

  // Academia da página (para o CRM e para os eventos da Meta)
  var ACADEMIA = /\/mestre-01-/.test(location.pathname) ? 'LAN' : /\/mestre-02-/.test(location.pathname) ? 'WOLF'
               : /\/mestre-03-/.test(location.pathname) ? 'ROSATTI' : /\/mestre-04-/.test(location.pathname) ? 'SHARPER' : '';
  function post(url, corpo){ return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + ANON }, body: JSON.stringify(corpo), keepalive: true }); }
  // Resolve com o id do lead (v2), true (v1) ou rejeita. O lead só conta depois que o banco confirma.
  function enviar(dados){
    var v1 = { p_nome: dados.p_nome, p_whatsapp: dados.p_whatsapp, p_origem: dados.p_origem, p_pagina: dados.p_pagina };
    return post(RPC2, dados)
      .then(function(r){ if (r.status === 404) return post(RPC1, v1); return r; })
      .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(res){ if (res === false || res === null) throw new Error('recusado'); ls(PEND, null); return res; })
      .catch(function(e){ ls(PEND, JSON.stringify(dados)); throw e; });
  }
  function lead(dados, res){ // evento Lead da Meta só com o lead gravado; event_id = id do lead quando a v2 devolve
    if (w.hairTrack) w.hairTrack('Lead', { content_name: 'Perfis dos Mestres', content_category: 'barbearia', academy: (dados.p_utm && dados.p_utm.academy) || ACADEMIA || 'site', _event_source_url: new URL(dados.p_pagina || location.pathname, location.origin).href, _telefone: dados.p_whatsapp, _event_id: typeof res === 'string' ? res : undefined });
  }
  var pend = ls(PEND); if (pend){ try { var dp = JSON.parse(pend); enviar(dp).then(function(res){ lead(dp, res); }, function(){}); } catch(e){ ls(PEND, null); } }

  var janela, alvo = null, focoAnterior = null, inertes = [];
  function focaveis(){ return Array.prototype.filter.call(janela.querySelectorAll('a[href],button,input,select,textarea,[tabindex]'), function(el){
    return !el.disabled && el.tabIndex >= 0 && !!el.getClientRects().length;
  }); }
  function isolar(ativar){
    if(ativar){ inertes = Array.prototype.filter.call(d.body.children,function(el){return el !== janela && el.id !== 'hair-consent' && el.tagName !== 'SCRIPT';}).map(function(el){
      var antes = el.inert; el.inert = true; return [el,antes];
    }); } else { inertes.forEach(function(par){par[0].inert=par[1];}); inertes=[]; }
  }
  function montar(){
    janela = d.createElement('div'); janela.id = 'hair-gate'; janela.className = 'gate'; janela.hidden = true;
    janela.innerHTML = '<div class="gate-box" role="dialog" aria-modal="true" aria-labelledby="gate-t">'
      + '<button class="gate-x" type="button" data-fechar aria-label="Fechar">&times;</button>'
      + '<span class="label">HAIR Business · 4 Mestres</span>'
      + '<h2 id="gate-t">Libere os perfis<br><em class="gold">dos Mestres.</em></h2>'
      + '<p>Trajetória, galeria, turmas abertas e o cupom de desconto dos 4 Mestres. Informe seu nome e WhatsApp: é uma vez só e libera todos.</p>'
      + '<form novalidate><label>Seu nome<input name="nome" autocomplete="given-name" maxlength="60" required></label>'
      + '<label>WhatsApp com DDD<input name="zap" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="(16) 90000-0000" maxlength="16" required></label>'
      + '<p class="gate-erro" role="alert" hidden></p>'
      + '<button class="btn main" type="submit">Liberar os perfis</button></form>'
      + '<p class="micro">Ao liberar, você aceita receber contato da HAIR Academia da Beleza pelo WhatsApp sobre cursos e turmas. Seus dados não são vendidos. <a href="/privacidade">Privacidade</a></p></div>';
    (d.body || d.documentElement).appendChild(janela);
    janela.addEventListener('click', function(e){ if (e.target === janela || (e.target.closest && e.target.closest('[data-fechar]'))) fechar(); });
    d.addEventListener('keydown', function(e){
      if (janela.hidden) return;
      if (e.key === 'Escape'){e.preventDefault(); fechar(); return;}
      if (e.key !== 'Tab') return;
      var els=focaveis(), primeiro=els[0], ultimo=els[els.length-1];
      if (!primeiro) return;
      if (e.shiftKey && (d.activeElement===primeiro || !janela.contains(d.activeElement))){e.preventDefault();ultimo.focus();}
      else if (!e.shiftKey && (d.activeElement===ultimo || !janela.contains(d.activeElement))){e.preventDefault();primeiro.focus();}
    });
    var f = janela.querySelector('form'), zap = f.elements.zap, erro = janela.querySelector('.gate-erro');
    zap.addEventListener('input', function(){ var x = zap.value.replace(/\D/g, '').slice(0, 11);
      zap.value = x.length > 6 ? '(' + x.slice(0,2) + ') ' + x.slice(2, x.length - 4) + '-' + x.slice(-4) : x.length > 2 ? '(' + x.slice(0,2) + ') ' + x.slice(2) : x; });
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var nome = f.elements.nome.value.trim(), dig = zap.value.replace(/\D/g, '');
      if (nome.length < 2){ erro.textContent = 'Escreva seu nome.'; erro.hidden = false; f.elements.nome.focus(); return; }
      if (dig.length < 10 || dig.length > 11 || /^0/.test(dig)){ erro.textContent = 'Confira o WhatsApp: DDD + número, como (16) 99999-9999.'; erro.hidden = false; zap.focus(); return; }
      erro.hidden = true;
      var tel = '55' + dig;
      var o = (w.hairOrigem && w.hairOrigem()) || {}, utm = { academy: ACADEMIA };
      ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function(k){ if (o[k]) utm[k] = String(o[k]).slice(0, 120); });
      var dados = { p_nome: nome, p_whatsapp: tel, p_origem: 'Site · Mestres HAIR Business', p_pagina: location.pathname, p_utm: utm };
      enviar(dados).then(function(res){ lead(dados, res); }, function(){});
      marcar(); fechar(true);
    });
  }
  function abrir(el){ if (!janela || !janela.isConnected) montar(); alvo = el; focoAnterior = el || d.activeElement; janela.hidden = false; isolar(true); d.documentElement.classList.add('gate-on');
    setTimeout(function(){ var i = janela.querySelector('input[name=nome]'); if (i) i.focus(); }, 60); }
  function fechar(continuar){ janela.hidden = true; isolar(false); d.documentElement.classList.remove('gate-on');
    if(focoAnterior && focoAnterior.isConnected && focoAnterior.focus) focoAnterior.focus(); focoAnterior=null;
    var el = alvo; alvo = null;
    if (continuar && el){ // segue para o que a pessoa tinha tocado
      if (el.tagName === 'A' && el.getAttribute('href')){ if (el.target === '_blank') w.open(el.href, '_blank', 'noopener'); else location.href = el.href; }
      else el.click();
    } }

  d.addEventListener('click', function(e){
    if (liberado() || !e.target || !e.target.closest) return;
    if (e.target.closest('#hair-gate, #hair-consent, [data-hair-cookies], a[href*="wa.me/"], .skip')) return;
    var el = paginaMestre() ? e.target.closest('a[href], button, summary, .gal figure, [role=button]')
                          : e.target.closest('a[href*="mestre-0"]');
    if (!el) return;
    e.preventDefault(); e.stopPropagation(); abrir(el);
  }, true);
})();
