/* Captação pública separada do chat: dados apenas em memória; envio ao backend do site. */
(()=>{
  'use strict';
  if(document.getElementById('hara-lead-host'))return;
  let intakeReady=false;
  fetch('/api/hara-config',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(2500)}).then(r=>r.ok?r.json():null).then(c=>{intakeReady=c?.leadsEnabled===true;}).catch(()=>{});
  const host=document.createElement('div');host.id='hara-lead-host';document.body.append(host);
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>
    :host{all:initial;color-scheme:dark;font:15px/1.5 system-ui,sans-serif}*{box-sizing:border-box}
    dialog{color:#f5f2e9;background:#141816;border:1px solid #746640;border-radius:16px;width:min(520px,calc(100vw - 20px));max-height:calc(100dvh - 20px);padding:0;margin:auto;overflow:auto}
    dialog::backdrop{background:#0009}header{position:sticky;top:0;z-index:1;background:#141816;padding:12px 16px;border-bottom:1px solid #43473d;display:flex;align-items:center;justify-content:space-between;gap:12px}h2{font-size:18px;margin:0}
    form{padding:16px}p{margin:0 0 12px}label.field{display:block;margin:12px 0}input,select,textarea,button,a{font:inherit}input:not([type=checkbox]),select,textarea{display:block;width:100%;padding:10px;margin-top:5px;background:#0e120f;color:#fff;border:1px solid #788271;border-radius:8px}textarea{min-height:110px;resize:vertical}
    button,.continue{display:inline-block;min-height:44px;padding:10px 14px;border-radius:9px;border:1px solid #e7c773;background:#d9bb76;color:#181710;text-align:center;cursor:pointer;text-decoration:none}.close{background:#26332c;color:#fff;border-color:#687462}.check{display:flex;gap:6px;align-items:center;margin:10px 0;font-size:11px;min-height:24px}.check input{width:14px;height:14px;margin:0;flex:0 0 14px;accent-color:#d9bb76}.check a{color:#c7cbbf;text-underline-offset:2px}.needs-consent input{outline:2px solid #e7c773;outline-offset:3px;animation:lead-pulse .7s ease-in-out 3}@keyframes lead-pulse{50%{box-shadow:0 0 0 4px #d9bb764d}}@media(prefers-reduced-motion:reduce){.needs-consent input{animation:none}}a{color:#e7c773}.status{margin:12px 0;overflow-wrap:anywhere}[hidden]{display:none!important}:focus-visible{outline:3px solid #e7c773;outline-offset:3px}:disabled{opacity:.6;cursor:default}
    @media(max-height:450px){dialog{width:100vw;max-width:none;max-height:100dvh;margin:0;border-radius:0}header,form{padding:8px 12px}}
  </style><dialog aria-labelledby="lead-title" aria-describedby="lead-notice"><header><h2 id="lead-title">Fale com a equipe HAIR</h2><button type="button" class="close" aria-label="Fechar formulário de contato">×</button></header>
  <form novalidate><p id="lead-notice">Se preferir, continue o atendimento com nossa equipe pelo WhatsApp.</p>
    <label class="field">Nome (opcional)<input name="name" autocomplete="name" maxlength="100"></label>
    <label class="field">Cidade<select name="city" required><option value="Ribeirão Preto">Ribeirão Preto</option><option value="other">Outras cidades</option></select></label>
    <label class="field" id="region-field" hidden>Cidade da região<select name="region"><option value="">Selecione sua cidade</option><option>Sertãozinho</option><option>Jardinópolis</option><option>Cravinhos</option><option>Serrana</option><option>Brodowski</option><option>Dumont</option><option>Barrinha</option><option>Pradópolis</option><option>Pontal</option><option>Batatais</option><option value="other">Outra cidade</option></select></label>
    <label class="field" id="other-field" hidden>Qual cidade?<input name="otherCity" autocomplete="address-level2" maxlength="100"></label>
    <label class="field">Telefone com DDD<input name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="25" required></label>
    <label class="field">E-mail<input name="email" type="email" autocomplete="email" maxlength="254" required></label>
    <div class="check"><input id="lead-accept" name="consent" type="checkbox" aria-label="Li e aceito os termos de contato"><label for="lead-accept"><a href="/hara/termos" target="_blank" rel="noopener noreferrer">Li e aceito</a></label></div>
    <button type="submit">Enviar e continuar para o WhatsApp</button><p class="status" role="status" aria-live="polite"></p><a class="continue" hidden target="_blank" rel="noopener noreferrer">Abrir WhatsApp oficial</a>
  </form></dialog>`;
  const $=s=>root.querySelector(s),dialog=$('dialog'),form=$('form'),status=$('.status'),continueLink=$('.continue'),submit=$('button[type=submit]');
  const field=n=>form.elements.namedItem(n);
  let controller=null,version=0,returnFocus=null,topics=[],eventId=null,contextSummary='';
  function conversationTopics(chat){
    // Identificadores da base pública; classificar perguntas, não os textos de resposta.
    const selected=new Set();
    for(const message of chat?.querySelectorAll('.messages .msg.user')||[]){
      const text=(message.textContent||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      if(/\b(valor(?:es)?|preco(?:s)?|cust[ao](?:r|m)?|investimento|mensalidade|desconto|promocoes|promocao|campanha|parcel(?:a|as|amento)|pagamento|boleto|reais|dinheiro|barato|caro|orcamento|gratis|gratuit\w*)\b|r\s*\$|quanto\s+(?:custa|fica|pago|pagar|sai|e\s+(?:o\s+)?curso)/.test(text)){selected.add('valores');continue;}
      const career=/emprego|carreira|mercado de trabalho|conexao work|vaga.{0,20}(trabalho|emprego)/.test(text);
      if(career)selected.add('carreira');
      for(const [id,pattern] of [
        ['cursos',/curso|barbear|cabeleir|sobrancelh|cilio|formacao/],['parceiros',/academia|parceir|allan|kenny|rosatti|sharper/],
        ['horarios',/horario|turma|domingo|segunda|terca|quarta|quinta|sexta|sabado|noturno|manha|noite|data de inicio/],
        ['local',/onde fica|endereco|localiza|presencial|trio office/],['duracao',/duracao|quanto tempo|tempo.{0,20}curso|dois meses|2 meses/],
        ['metodo',/metod|pratica|modelo|conteudo|aprender|tecnica/],['jornada',/matricula|inscrev|jornada/],['garantia',/garantia|nao aprender|reposicao|refazer/],
        ['apps',/aplicativo|conexao hair|biblioteca|apostila|vision/],['assessoria',/assessoria|abrir academia/],['aluno',/login|senha|nota|presenca|certificado/],['contato',/contato|whats|telefone|comercial|humano|atendente/]
      ])if(pattern.test(text))selected.add(id);
      if(!career&&/vaga.{0,20}(curso|turma)|(?:curso|turma).{0,20}vaga/.test(text))selected.add('horarios');
    }
    return [...selected].slice(0,14);
  }
  function officialUrl(value){
    try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='wa.me'&&!u.port&&!u.username&&!u.password&&u.pathname==='/5516992558810'&&!u.hash&&[...u.searchParams.keys()].every(k=>k==='text')&&u.href.length<=4000?u.href:null;}catch{return null;}
  }
  function stopPending(){version++;controller?.abort();controller=null;submit.disabled=false;}
  function cities(){
    const regional=field('city').value==='other',other=regional&&field('region').value==='other';
    $('#region-field').hidden=!regional;field('region').required=regional;field('region').disabled=!regional;
    $('#other-field').hidden=!other;field('otherCity').required=other;field('otherCity').disabled=!other;
  }
  field('city').addEventListener('change',cities);field('region').addEventListener('change',cities);cities();
  function close(){stopPending();dialog.close();form.reset();cities();status.textContent='';continueLink.hidden=true;continueLink.removeAttribute('href');topics=[];eventId=null;contextSummary='';returnFocus?.focus();}
  $('.close').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  field('consent').addEventListener('change',()=>{field('consent').removeAttribute('aria-invalid');$('.check').classList.remove('needs-consent');if(!field('consent').checked){stopPending();status.textContent='Envio interrompido. Se a solicitação já chegou ao servidor, o fechamento não desfaz seu processamento.';continueLink.hidden=true;continueLink.removeAttribute('href');}});
  function open(anchor){
    if(dialog.open)return;
    field('consent').removeAttribute('aria-invalid');$('.check').classList.remove('needs-consent');returnFocus=anchor;eventId=globalThis.crypto?.randomUUID?.()||null;form.reset();cities();status.textContent='';continueLink.hidden=true;continueLink.removeAttribute('href');
    const chat=document.getElementById('hara-public-host')?.shadowRoot;
    const messages=[...(chat?.querySelectorAll('.messages .msg')||[])].map(p=>p.textContent||'');
    contextSummary=messages.join('\n').slice(0,2000);
    topics=conversationTopics(chat);
    dialog.showModal();field('name').focus();
  }
  // composedPath inclui âncoras do Shadow DOM aberto da HARA, sem acoplar seus controles.
  document.addEventListener('click',e=>{
    if(!intakeReady||e.defaultPrevented||e.button!==0||e.composedPath().includes(host))return;
    const anchor=e.composedPath().find(node=>node instanceof HTMLAnchorElement);
    if(!anchor||!officialUrl(anchor.href))return;
    e.preventDefault();e.stopImmediatePropagation();open(anchor);
  },true);
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(controller)return;if(!field('consent').checked){const line=$('.check');line.classList.remove('needs-consent');void line.offsetWidth;line.classList.add('needs-consent');field('consent').setAttribute('aria-invalid','true');status.textContent='Marque “Li e aceito” para enviar.';field('consent').focus();return;}if(!form.reportValidity())return;
    const digits=field('phone').value.replace(/\D/g,'');
    if(digits.length<10||digits.length>15){status.textContent='Informe um telefone válido com DDD (10 a 15 dígitos).';field('phone').focus();return;}
    const city=field('city').value==='other'?(field('region').value==='other'?field('otherCity').value.trim():field('region').value):field('city').value;
    if(!city){status.textContent='Informe sua cidade.';return;}
    if(!eventId){status.textContent='Não foi possível preparar o envio seguro. Atualize a página em uma conexão HTTPS.';return;}
    // O mesmo identificador acompanha retries; somente uma nova abertura inicia outra solicitação.
    const payload={name:field('name').value.trim(),phone:field('phone').value.trim(),email:field('email').value.trim(),city,context:{page:location.pathname.slice(0,300),topics:topics.slice(0,10),summary:contextSummary},consent:'lead-contact-v2',followup:false,eventId};
    const request=new AbortController();controller=request;const current=++version;submit.disabled=true;status.textContent='Enviando sua solicitação…';continueLink.hidden=true;
    const timeout=setTimeout(()=>request.abort(),12000);
    try{
      const response=await fetch('/api/hara-lead',{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:request.signal});
      const data=await response.json();if(current!==version)return;
      if(!response.ok)throw Error('unavailable');
      const url=typeof data.whatsappUrl==='string'?officialUrl(data.whatsappUrl):null;
      if(!url||typeof data.reference!=='string'||!data.reference.trim()||data.reference.length>100)throw Error('invalid response');
      continueLink.href=url;continueLink.hidden=false;
      status.textContent='Solicitação recebida. Referência: '+data.reference+'. Toque em “Abrir WhatsApp oficial” para continuar.';
    }catch(error){if(current===version)status.textContent=error.name==='AbortError'?'O envio demorou além do esperado. A confirmação não chegou; tente novamente.':'Não foi possível confirmar o recebimento. Seus dados continuam neste formulário para corrigir e tentar novamente. Nenhuma confirmação de cadastro ou aviso ao grupo foi recebida.';}
    finally{clearTimeout(timeout);if(current===version){controller=null;submit.disabled=false;}}
  });
})();
