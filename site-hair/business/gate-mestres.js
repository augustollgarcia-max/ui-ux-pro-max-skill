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
  var RPC = 'https://zoyyfvfvnxrpojhypsjh.supabase.co/rest/v1/rpc/registrar_lead_site';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveXlmdmZ2bnhycG9qaHlwc2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTEwMzEsImV4cCI6MjA5NzU4NzAzMX0.gM5qLWnbKMeaHQ5fvBXM8FOHpB2rMrBmZOwfFUqK7D8';
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return null; } }
  function liberado(){ return ls(OK) === '1' || /(?:^|; )hair_mestres_ok=1/.test(d.cookie); }
  function marcar(){ ls(OK, '1'); try { d.cookie = 'hair_mestres_ok=1; max-age=31536000; path=/; SameSite=Lax; Secure'; } catch(e){} }
  var paginaMestre = /\/mestre-0\d/.test(location.pathname);

  function enviar(dados){
    return fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + ANON }, body: JSON.stringify(dados), keepalive: true })
      .then(function(r){ if (!r.ok) throw new Error(r.status); ls(PEND, null); })
      .catch(function(){ ls(PEND, JSON.stringify(dados)); });
  }
  var pend = ls(PEND); if (pend){ try { enviar(JSON.parse(pend)); } catch(e){ ls(PEND, null); } }

  var janela, alvo = null;
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
    d.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !janela.hidden) fechar(); });
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
      enviar({ p_nome: nome, p_whatsapp: tel, p_origem: 'Site · Mestres HAIR Business', p_pagina: location.pathname });
      if (w.hairTrack) w.hairTrack('Lead', { content_name: 'Perfis dos Mestres', content_category: 'barbearia', _telefone: tel });
      marcar(); fechar(true);
    });
  }
  function abrir(el){ if (!janela) montar(); alvo = el; janela.hidden = false; d.documentElement.classList.add('gate-on');
    setTimeout(function(){ var i = janela.querySelector('input[name=nome]'); if (i) i.focus(); }, 60); }
  function fechar(continuar){ janela.hidden = true; d.documentElement.classList.remove('gate-on');
    var el = alvo; alvo = null;
    if (continuar && el){ // segue para o que a pessoa tinha tocado
      if (el.tagName === 'A' && el.getAttribute('href')){ if (el.target === '_blank') w.open(el.href, '_blank', 'noopener'); else location.href = el.href; }
      else el.click();
    } }

  d.addEventListener('click', function(e){
    if (liberado() || !e.target || !e.target.closest) return;
    if (e.target.closest('#hair-gate, #hair-consent, a[href*="wa.me/"], .skip')) return;
    var el = paginaMestre ? e.target.closest('a[href], button, summary, .gal figure, [role=button]')
                          : e.target.closest('a[href*="mestre-0"]');
    if (!el) return;
    e.preventDefault(); e.stopPropagation(); abrir(el);
  }, true);
})();
