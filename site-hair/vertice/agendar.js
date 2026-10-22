/* Agendamento com antecedência mínima de 24h. Pedido do Augusto em 22/10/2026.
   - Qualquer elemento com data-agendar="<chave>" abre a janela já com o assunto escolhido.
   - Seg a sáb, das 9h às 21h, a cada 30 min (último início 20h30). O primeiro horário oferecido
     é o próximo múltiplo de 30 min depois de agora + 24h; reconfere no envio (aba esquecida aberta).
   - Não confirma nada sozinho: o pedido vai para o CRM (registrar_lead_site_v2, cai na v1 se faltar)
     e abre o WhatsApp comercial com a mensagem pronta. A confirmação é humana, depois de reservar a sala.
   - Sem rede o WhatsApp abre do mesmo jeito: o CRM é melhor esforço, nunca trava o pedido. */
(function(){
  'use strict';
  var w = window, d = document;
  if (w.__vxAgendar) return; w.__vxAgendar = 1;
  var WHATS = '5516992558810';
  var ASSUNTOS = {
    assessoria:  { nome: 'Vértice Assessoria', pagina: '/vertice/agendar/assessoria' },
    barber:      { nome: 'HAIR Business Barber', pagina: '/vertice/agendar/barber' },
    beauty:      { nome: 'HAIR Business Beauty', pagina: '/vertice/agendar/beauty' },
    cosmeticos:  { nome: 'Ecare & Olenka', pagina: '/vertice/agendar/cosmeticos' },
    estefania:   { nome: 'Atendimento Beauty com Estefânia Oliveira', pagina: '/beauty/agendar/estefania', servico: true },
    // 22/10: cursos. O que se agenda é o atendimento comercial; a nota diz onde acontecem as aulas.
    // '/beauty' na página manda o pedido para o funil Beauty do CRM; o curso Barber cai no HAIR Business.
    brow:        { nome: 'Curso Brow Lamination, Sobrancelha e Cílios', pagina: '/vertice/agendar/beauty/brow-cilios', nivel: true,
                   nota: 'Atendimento comercial, aulas teóricas e aulas práticas no mesmo local.' },
    barbercurso: { nome: 'Curso Barber', pagina: '/vertice/agendar/barber-curso', nivel: true,
                   nota: 'Atendimento comercial aqui. As aulas práticas acontecem nas 5 academias parceiras.' }
  };
  var ABRE = 9 * 60, FECHA = 21 * 60, PASSO = 30, DIAS = 21, MIN_MS = 24 * 3600 * 1000;
  var BASE = 'https://zoyyfvfvnxrpojhypsjh.supabase.co/rest/v1/rpc/';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveXlmdmZ2bnhycG9qaHlwc2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTEwMzEsImV4cCI6MjA5NzU4NzAzMX0.gM5qLWnbKMeaHQ5fvBXM8FOHpB2rMrBmZOwfFUqK7D8';
  var SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var aberturaMs = 0, janela, assunto = 'assessoria';

  function dois(n){ return (n < 10 ? '0' : '') + n; }
  function primeiroHorario(agora){ // agora + 24h, arredondado para cima no passo de 30 min
    var t = new Date(agora + MIN_MS); t.setSeconds(0, 0);
    var r = t.getMinutes() % PASSO; if (r) t.setMinutes(t.getMinutes() + PASSO - r);
    return t;
  }
  function horariosDoDia(dia, limite){ // dia = Date às 00:00; devolve ['09:00', ...] depois do limite
    var out = [];
    if (dia.getDay() === 0) return out; // domingo fechado
    for (var m = ABRE; m + PASSO <= FECHA; m += PASSO){
      var h = new Date(dia); h.setHours(Math.floor(m / 60), m % 60, 0, 0);
      if (h >= limite) out.push(dois(h.getHours()) + ':' + dois(h.getMinutes()));
    }
    return out;
  }
  function diasDisponiveis(limite){
    var out = [], base = new Date(limite); base.setHours(0, 0, 0, 0);
    for (var i = 0; i < DIAS && out.length < 14; i++){
      var dia = new Date(base); dia.setDate(base.getDate() + i);
      var hs = horariosDoDia(dia, limite);
      if (hs.length) out.push({ dia: dia, horas: hs });
    }
    return out;
  }
  function rotulo(dia){ return SEMANA[dia.getDay()] + ', ' + dois(dia.getDate()) + '/' + dois(dia.getMonth() + 1); }
  function iso(dia){ return dia.getFullYear() + '-' + dois(dia.getMonth() + 1) + '-' + dois(dia.getDate()); }

  function post(url, corpo){ return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + ANON }, body: JSON.stringify(corpo), keepalive: true }); }
  function registrar(dados){ // melhor esforço: CRM recebe; falha não impede o WhatsApp
    var v1 = { p_nome: dados.p_nome, p_whatsapp: dados.p_whatsapp, p_origem: dados.p_origem, p_pagina: dados.p_pagina };
    try { return post(BASE + 'registrar_lead_site_v2', dados).then(function(r){ return r.status === 404 ? post(BASE + 'registrar_lead_site', v1) : r; }).catch(function(){}); }
    catch(e){ return Promise.resolve(); }
  }

  function css(){
    var s = d.createElement('style');
    s.textContent = '.vx-ag{position:fixed;inset:0;z-index:9999;background:#050a18cc;display:flex;align-items:flex-end;justify-content:center;padding:12px}'
      + '.vx-ag[hidden]{display:none}.vx-ag-box{width:min(480px,100%);max-height:calc(100dvh - 24px);overflow:auto;background:#0f1a36;border:1px solid #d5b26e55;border-radius:22px;padding:22px 18px;color:#eef1f8;font-family:Inter,system-ui,sans-serif;margin-top:auto}'
      + '@media(min-width:640px){.vx-ag{align-items:center}.vx-ag-box{margin-top:0}}'
      + '.vx-ag h2{font:500 26px/1.15 "Playfair Display",Georgia,serif;margin:4px 0 6px}.vx-ag .eb{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#d5b26e}'
      + '.vx-ag p{color:#c5cbe0;font-size:14px;line-height:1.5;margin:0 0 12px}.vx-ag label{display:block;font-size:13px;color:#e9d6b2;margin:12px 0 6px}'
      + '.vx-ag input,.vx-ag select,.vx-ag textarea{width:100%;box-sizing:border-box;min-height:48px;border-radius:14px;border:1px solid #ffffff2e;background:#ffffff0f;color:#fff;font:16px Inter,system-ui,sans-serif;padding:12px 14px}'
      + '.vx-ag select option{color:#111}.vx-ag-x{float:right;width:44px;height:44px;border-radius:999px;border:1px solid #ffffff2e;background:transparent;color:#fff;font-size:24px;cursor:pointer}'
      + '.vx-ag-horas{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:8px}.vx-ag-horas button{min-height:44px;border-radius:999px;border:1px solid #ffffff2e;background:#ffffff0d;color:#fff;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}'
      + '.vx-ag-nota{border-left:2px solid #d5b26e;padding:2px 0 2px 12px;color:#f1d49f!important}'
      + '.vx-ag-niveis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.vx-ag-niveis button{min-height:44px;border-radius:999px;border:1px solid #ffffff2e;background:#ffffff0d;color:#fff;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;padding:0 6px}'
      + '.vx-ag-niveis button[aria-checked="true"],.vx-ag-horas button[aria-pressed="true"]{background:linear-gradient(110deg,#e3bf7e,#c79c5c);color:#111629;border-color:transparent}'
      + '.vx-ag .erro{color:#ffb4a8;font-size:13px;margin:10px 0 0}.vx-ag .enviar{width:100%;margin-top:16px;min-height:52px;border:0;border-radius:999px;background:linear-gradient(110deg,#e3bf7e,#c79c5c);color:#111629;font:600 16px -apple-system,BlinkMacSystemFont,Inter,system-ui,sans-serif;cursor:pointer;box-shadow:inset 0 1px 0 #ffffff8c,0 10px 28px -10px #d5b26ebf}'
      + '.vx-ag .enviar:active{transform:scale(.965)}.vx-ag .micro{font-size:12px;color:#9aa3bf;margin-top:12px}';
    d.head.appendChild(s);
  }
  function montar(){
    css();
    janela = d.createElement('div'); janela.className = 'vx-ag'; janela.hidden = true;
    janela.innerHTML = '<div class="vx-ag-box" role="dialog" aria-modal="true" aria-labelledby="vx-ag-t">'
      + '<button class="vx-ag-x" type="button" data-fechar aria-label="Fechar">&times;</button>'
      + '<div class="eb">Agendar atendimento</div><h2 id="vx-ag-t"></h2>'
      + '<p class="vx-ag-nota" hidden></p><p>Escolha o dia e o horário. Os horários começam 24 horas a partir de agora; a confirmação chega pelo WhatsApp.</p>'
      + '<form novalidate><div data-nivel hidden><label>Nível</label><div class="vx-ag-niveis" role="radiogroup" aria-label="Nível">'
      + '<button type="button" role="radio" aria-checked="true">Iniciante</button><button type="button" role="radio" aria-checked="false">Avançado</button><button type="button" role="radio" aria-checked="false">Quero orientação</button></div></div>'
      + '<label for="vx-ag-dia">Dia</label><select id="vx-ag-dia" name="dia"></select>'
      + '<label>Horário</label><div class="vx-ag-horas" role="group" aria-label="Horários"></div>'
      + '<div data-servico hidden><label for="vx-ag-serv">Serviço desejado</label><input id="vx-ag-serv" name="servico" maxlength="80" placeholder="Ex.: design de sobrancelha"></div>'
      + '<label for="vx-ag-nome">Seu nome</label><input id="vx-ag-nome" name="nome" autocomplete="given-name" maxlength="60" required>'
      + '<label for="vx-ag-zap">WhatsApp com DDD</label><input id="vx-ag-zap" name="zap" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="(16) 90000-0000" maxlength="16" required>'
      + '<p class="erro" role="alert" hidden></p><button class="enviar" type="submit">Pedir este horário</button>'
      + '<p class="micro">O horário é confirmado depois da reserva. Seus dados não são vendidos. <a href="/privacidade" style="color:#e9d6b2">Privacidade</a></p></form></div>';
    d.body.appendChild(janela);
    var f = janela.querySelector('form'), sel = f.elements.dia, grade = janela.querySelector('.vx-ag-horas'), erro = janela.querySelector('.erro'), zap = f.elements.zap;
    janela.addEventListener('click', function(e){ if (e.target === janela || (e.target.closest && e.target.closest('[data-fechar]'))) fechar(); });
    d.addEventListener('keydown', function(e){ if (!janela.hidden && e.key === 'Escape') fechar(); });
    zap.addEventListener('input', function(){ var x = zap.value.replace(/\D/g, '').slice(0, 11);
      zap.value = x.length > 6 ? '(' + x.slice(0,2) + ') ' + x.slice(2, x.length - 4) + '-' + x.slice(-4) : x.length > 2 ? '(' + x.slice(0,2) + ') ' + x.slice(2) : x; });
    f.addEventListener('input', function(){ erro.hidden = true; });
    sel.addEventListener('change', function(){ desenharHoras(); });
    janela.querySelector('.vx-ag-niveis').addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return;
      Array.prototype.forEach.call(this.children, function(x){ x.setAttribute('aria-checked', x === b ? 'true' : 'false'); }); });
    grade.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return;
      Array.prototype.forEach.call(grade.children, function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); });
    f.addEventListener('submit', function(e){
      e.preventDefault(); erro.hidden = true;
      var b = grade.querySelector('[aria-pressed="true"]'), nome = f.elements.nome.value.trim(), tel = zap.value.replace(/\D/g, '');
      var serv = f.elements.servico.value.trim(), cfg = ASSUNTOS[assunto];
      var nv = cfg.nivel ? (janela.querySelector('.vx-ag-niveis [aria-checked="true"]') || {}).textContent : '';
      var msg = !sel.value ? 'Escolha o dia.' : !b ? 'Escolha o horário.' : (cfg.servico && !serv) ? 'Diga qual serviço você quer.' : !nome ? 'Informe seu nome.' : (tel.length < 10 || tel.length > 11) ? 'Confira o WhatsApp com DDD.' : '';
      if (msg){ erro.textContent = msg; erro.hidden = false; return; }
      var p = sel.value.split('-'), hm = b.textContent.split(':');
      var quando = new Date(+p[0], +p[1] - 1, +p[2], +hm[0], +hm[1]);
      if (quando < primeiroHorario(Date.now())){ // reconfere: aba pode ter ficado aberta
        erro.textContent = 'Esse horário ficou com menos de 24 horas. Escolha outro.'; erro.hidden = false; atualizar(); return;
      }
      var quandoTxt = rotulo(quando) + ' às ' + b.textContent;
      var texto = 'Olá! Quero agendar: ' + cfg.nome + (serv ? ' (' + serv + ')' : '') + '.' + (nv ? '\nNível: ' + nv : '') + (cfg.nivel ? '\nAtendimento comercial' : '') + '\nDia: ' + quandoTxt + '\nNome: ' + nome;
      registrar({ p_nome: nome, p_whatsapp: tel, p_origem: 'Site Vértice · Agendamento · ' + cfg.nome + (nv ? ' · ' + nv : '') + ' · ' + quandoTxt + (serv ? ' · ' + serv : ''), p_pagina: cfg.pagina, p_utm: {} });
      w.open('https://wa.me/' + WHATS + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
      fechar();
    });
  }
  function desenharHoras(){
    var grade = janela.querySelector('.vx-ag-horas'), sel = janela.querySelector('#vx-ag-dia');
    var limite = primeiroHorario(aberturaMs), p = (sel.value || '').split('-');
    grade.innerHTML = '';
    if (p.length < 3) return;
    horariosDoDia(new Date(+p[0], +p[1] - 1, +p[2]), limite).forEach(function(h, i){
      var b = d.createElement('button'); b.type = 'button'; b.textContent = h; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); grade.appendChild(b);
    });
  }
  function atualizar(){
    aberturaMs = Date.now();
    var sel = janela.querySelector('#vx-ag-dia');
    sel.innerHTML = diasDisponiveis(primeiroHorario(aberturaMs)).map(function(x){ return '<option value="' + iso(x.dia) + '">' + rotulo(x.dia) + '</option>'; }).join('');
    desenharHoras();
  }
  function abrir(chave){
    if (!janela) montar();
    assunto = ASSUNTOS[chave] ? chave : 'assessoria';
    janela.querySelector('#vx-ag-t').textContent = ASSUNTOS[assunto].nome;
    janela.querySelector('[data-servico]').hidden = !ASSUNTOS[assunto].servico;
    janela.querySelector('[data-nivel]').hidden = !ASSUNTOS[assunto].nivel;
    var nota = janela.querySelector('.vx-ag-nota'); nota.textContent = ASSUNTOS[assunto].nota || ''; nota.hidden = !ASSUNTOS[assunto].nota;
    janela.querySelector('.erro').hidden = true;
    atualizar(); janela.hidden = false;
    setTimeout(function(){ var s = janela.querySelector('#vx-ag-dia'); if (s) s.focus(); }, 30);
  }
  function fechar(){ janela.hidden = true; }
  d.addEventListener('click', function(e){
    var el = e.target.closest && e.target.closest('[data-agendar]');
    if (!el) return; e.preventDefault(); abrir(el.getAttribute('data-agendar'));
  });
  // link direto: ...?agendar=brow abre a janela já no assunto (ex.: verticebeautygroup.com.br/agendar?agendar=brow)
  function doLink(){ var m = /[?&]agendar=([a-z]+)/.exec(location.search); if (m && ASSUNTOS[m[1]]) abrir(m[1]); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', doLink); else doLink();
  w.vxAgendar = { abrir: abrir, _primeiroHorario: primeiroHorario, _horariosDoDia: horariosDoDia, _diasDisponiveis: diasDisponiveis };
})();
