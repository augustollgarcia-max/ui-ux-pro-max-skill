/* HARA pública: sem cookies, sem histórico persistente, sem eventos de marketing. */
(()=>{
  if(document.getElementById('hara-public-host'))return;
  const host=document.createElement('div');host.id='hara-public-host';document.body.append(host);
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>
  :host{all:initial;color-scheme:dark;font:15px/1.5 system-ui,sans-serif}
  *{box-sizing:border-box}button,input{font:inherit}button,a{touch-action:manipulation}button{cursor:pointer}
  button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #e7c773;outline-offset:3px}
  .launch{position:fixed;right:16px;bottom:calc(100px + env(safe-area-inset-bottom));z-index:990;background:#d9bb76;color:#181710;border:1px solid #f4dfa8;border-radius:28px;padding:12px 18px;font-weight:700;min-height:48px;box-shadow:0 6px 24px #0006}
  dialog{color:#f5f2e9;background:#141816;border:1px solid #746640;border-radius:18px;width:min(420px,calc(100vw - 20px));height:min(650px,calc(100dvh - 20px));padding:0;margin:auto;box-shadow:0 12px 70px #0009}
  dialog::backdrop{background:#0008} .panel{height:100%;display:flex;flex-direction:column}
  header{padding:16px;border-bottom:1px solid #43473d;display:flex;justify-content:space-between;gap:10px}header p{margin:0;font-size:12px;color:#cdcabb}
  button{background:#26332c;color:#f5f2e9;border:1px solid #687462;border-radius:10px;min-height:44px;padding:8px 12px} .close{font-size:20px}
  .body{overflow-y:auto;padding:16px;flex:1;min-height:0;overflow-wrap:anywhere}p{margin:0 0 12px}a{color:#e7c773}
  .consent{display:flex;gap:10px;align-items:flex-start;margin:12px 0}input[type=checkbox]{width:22px;height:22px;flex-shrink:0}
  .topics{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.topics button{font-size:13px}
  .msg{padding:12px;border-radius:12px;background:#243128;white-space:pre-wrap;margin:12px 0}.user{background:#30312c}
  form{padding:12px;border-top:1px solid #43473d;display:flex;gap:8px}input[type=text]{width:100%;min-width:0;border:1px solid #788271;border-radius:8px;background:#0e120f;color:#fff;padding:10px}button:disabled,input:disabled{opacity:.55;cursor:default}
  footer{padding:0 12px 12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13px}.status{font-size:13px;color:#dfd5b5;min-height:20px}
  [hidden]{display:none!important}
  @media(max-height:450px){dialog{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;border-radius:0}header{padding:8px;flex-shrink:0}header p{font-size:11px}header strong{font-size:14px}.close{min-height:40px;padding:4px 10px}form{padding:8px;flex-shrink:0}footer{padding:0 8px 8px;gap:6px;font-size:12px;flex-shrink:0}footer button{min-height:40px;padding:4px 8px}.body{padding:8px}}
  @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
  </style><button class="launch" aria-haspopup="dialog">Conversar com a HARA</button>
  <dialog aria-labelledby="hara-title"><div class="panel"><header><div><strong id="hara-title">HARA · Atendimento HAIR</strong><p>Assistente automática com informações do site</p></div><button class="close" aria-label="Fechar conversa">×</button></header>
  <div class="body"><section class="notice"><p>Olá! Ajudo com cursos, academias parceiras e localização. Horários, vagas e valores são confirmados pela equipe.</p>
  <p>Ao enviar, sua pergunta será processada pelo site para responder. Não envie nome, telefone, documentos, senhas ou informações sensíveis. Não salvamos o texto no atendimento; a infraestrutura processa dados técnicos de conexão. Contadores de segurança usam um identificador derivado do IP, com expiração em até 24 horas.</p>
  <p>A conversa fica somente nesta página. “Apagar conversa” limpa as mensagens e retira o aceite. O WhatsApp só abre quando você tocar no link, sem anexar a conversa. <a href="/privacidade" target="_blank" rel="noopener noreferrer">Política de privacidade</a>.</p>
  <label class="consent"><input type="checkbox"> <span>Li o aviso e concordo com o processamento da pergunta para este atendimento.</span></label></section>
  <div class="topics"><button data-question="Quais cursos vocês oferecem?">Cursos</button><button data-question="Quais academias parceiras?">Academias</button><button data-question="Quais horários e valores?">Horários e valores</button><button data-question="Onde fica o atendimento presencial?">Localização</button></div>
  <div class="messages" role="log" aria-live="polite" aria-relevant="additions"></div><p class="status" role="status"></p></div>
  <form><input type="text" aria-label="Sua pergunta" placeholder="Pergunte sobre a HAIR" maxlength="500" required disabled autocomplete="off"><button type="submit" disabled>Enviar</button></form>
  <footer><a href="https://wa.me/5516992558810?text=Ol%C3%A1%2C%20quero%20informa%C3%A7%C3%B5es%20sobre%20os%20cursos%20da%20HAIR." target="_blank" rel="noopener noreferrer">Equipe no WhatsApp</a><button class="clear" type="button">Apagar conversa</button></footer></div></dialog>`;
  const $=s=>root.querySelector(s),dialog=$('dialog'),input=$('input[type=text]'),consent=$('input[type=checkbox]'),submit=$('button[type=submit]'),messages=$('.messages'),status=$('.status');
  let pending=false,controller=null,generation=0,count=0;
  function controls(){input.disabled=submit.disabled=!consent.checked||pending;root.querySelectorAll('[data-question]').forEach(b=>b.disabled=!consent.checked||pending);}
  controls();
  $('.launch').onclick=()=>dialog.showModal();$('.close').onclick=()=>dialog.close();
  function clear(){generation++;controller?.abort();controller=null;pending=false;count=0;messages.replaceChildren();status.textContent='';input.value='';consent.checked=false;controls();}
  $('.clear').onclick=clear;
  consent.onchange=()=>{if(!consent.checked)clear();else controls();};
  function append(text,who){const p=document.createElement('p');p.className='msg '+who;p.textContent=(who==='user'?'Você: ':'HARA: ')+text;messages.append(p);p.scrollIntoView({block:'nearest'});}
  async function send(text){
    if(!consent.checked||pending||!text.trim())return;
    if(count>=30){status.textContent='Limite desta conversa atingido. Fale com a equipe pelo WhatsApp.';return;}
    pending=true;controls();status.textContent='Consultando informações…';append(text,'user');input.value='';
    const version=generation;controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),8000);
    try{
      const r=await fetch('/api/hara-public',{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,consent:'public-chat-v1'}),signal:controller.signal});
      const data=await r.json();if(version!==generation)return;
      if(!r.ok)throw Error(data.error||'Atendimento indisponível. Use o WhatsApp oficial.');
      if(typeof data.reply!=='string')throw Error('Resposta indisponível. Use o WhatsApp oficial.');
      append(data.reply,'assistant');count++;
      // Links fixos no código; nunca interpretar HTML ou URLs retornadas pelo visitante.
      status.textContent='Informações verificadas no conteúdo público em 08/11/2026. Confirme condições atuais com a equipe.';
      const sources=document.createElement('p');
      for(const src of data.sources||[]){try{const u=new URL(src);if(u.origin!=='https://www.hairacademiadabeleza.com.br')continue;const a=document.createElement('a');a.href=u.href;a.textContent='Consultar fonte oficial ';a.target='_blank';a.rel='noopener noreferrer';sources.append(a);}catch{}}
      messages.append(sources);
    }catch(e){if(version===generation)status.textContent=e.name==='AbortError'?'Tempo esgotado. Tente novamente ou fale com a equipe.':e.message;}
    finally{clearTimeout(timeout);if(version===generation){pending=false;controller=null;controls();if(dialog.open)input.focus();}}
  }
  $('form').onsubmit=e=>{e.preventDefault();send(input.value);};
  root.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>send(b.dataset.question));
})();
