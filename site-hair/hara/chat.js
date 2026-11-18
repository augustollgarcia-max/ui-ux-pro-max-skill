/* HARA pública: painel flutuante; sessão da aba, sem cookies ou histórico no servidor. */
(()=>{
  if(document.getElementById('hara-public-host'))return;
  const host=document.createElement('div');host.id='hara-public-host';document.body.append(host);
  const root=host.attachShadow({mode:'open'}),SESSION='hara_chat_tab_v3';
  root.innerHTML=`<style>
  :host{all:initial;color-scheme:dark;font:14px/1.5 system-ui,sans-serif}*{box-sizing:border-box}button,input{font:inherit}button,a{touch-action:manipulation}button{cursor:pointer}a{color:#e7c773}:focus-visible{outline:2px solid #e7c773;outline-offset:2px}
  .launch{position:fixed;right:16px;bottom:calc(88px + env(safe-area-inset-bottom));z-index:990;border:1px solid #b59a5d;background:#1a211d;color:#edddb4;border-radius:22px;padding:9px 14px;font-weight:600;min-height:44px;box-shadow:0 4px 18px #0004}
  .widget{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:995;color:#f5f2e9;background:#141816;border:1px solid #746640;border-radius:14px;width:min(350px,calc(100vw - 24px));height:min(500px,calc(100dvh - 32px));box-shadow:0 8px 30px #0005;overflow:hidden}
  .panel{display:flex;flex-direction:column;height:100%}.body{overflow:auto;flex:1;min-height:0}.close{min-width:44px;min-height:44px}.widget [hidden],.widget[hidden],.launch[hidden]{display:none}
  @media(max-width:480px){.widget{right:10px;bottom:calc(10px + env(safe-area-inset-bottom));width:calc(100vw - 20px);height:min(460px,calc(100dvh - 24px))}.launch{right:10px;font-size:12px}}
  </style><button class="launch" aria-controls="hara-chat" aria-expanded="false">Conversar com a HARA</button>
  <section class="widget" id="hara-chat" role="dialog" aria-modal="false" aria-labelledby="hara-title" hidden><div class="panel"><header><div><strong id="hara-title">HARA · Assistente HAIR</strong><p>Tire suas dúvidas enquanto navega</p></div><button class="close" aria-label="Fechar conversa">×</button></header>
  <div class="body"><p class="intro">Olá! Posso tirar suas dúvidas aqui ou te mostrar os perfis das academias no site. Como prefere começar?</p><div class="topics"><button data-question="Quais cursos vocês oferecem?">Cursos</button><button data-question="Quais academias parceiras?">Ver academias</button><button data-question="Como funciona a jornada?">Como funciona</button></div><nav class="atalhos" aria-label="Atalhos da HAIR"><a href="/inicio#formacoes">Ver formações</a><a href="/modelo">Ser modelo</a></nav><div class="messages" role="log" aria-live="polite" aria-relevant="additions"></div><p class="status" role="status"></p></div>
  <form novalidate><div class="compose"><input type="text" aria-label="Sua pergunta" placeholder="Sua dúvida…" maxlength="500" required autocomplete="off"><button type="submit">Enviar</button></div><div class="consent"><input id="hara-accept" type="checkbox" aria-label="Li e aceito os termos de atendimento"><label for="hara-accept"><a href="/hara/termos" target="_blank" rel="noopener noreferrer">Li e aceito</a></label></div></form>
  <footer><a href="https://wa.me/5516992558810?text=Ol%C3%A1%2C%20vim%20do%20site%20da%20HAIR." target="_blank" rel="noopener noreferrer">Continuar no WhatsApp</a><button class="clear" type="button">Apagar conversa</button></footer></div></section>`;
  const $=s=>root.querySelector(s),widget=$('.widget'),input=$('input[type=text]'),consent=$('#hara-accept'),submit=$('button[type=submit]'),messages=$('.messages'),status=$('.status'),launcher=$('.launch');
  let pending=false,controller=null,generation=0,count=0,history=[];
  function save(){try{sessionStorage.setItem(SESSION,JSON.stringify({v:3,accepted:consent.checked,open:!widget.hidden,history:history.slice(-30)}));}catch{}}
  function controls(){input.disabled=submit.disabled=pending;root.querySelectorAll('[data-question]').forEach(b=>b.disabled=pending);}
  function setOpen(open,focus=true){widget.hidden=!open;launcher.hidden=open;launcher.setAttribute('aria-expanded',String(open));save();if(focus)(open?input:launcher).focus();}
  function nudge(){const line=$('.consent');line.classList.remove('needs-consent');void line.offsetWidth;line.classList.add('needs-consent');consent.setAttribute('aria-invalid','true');status.textContent='Marque “Li e aceito” para enviar.';consent.focus();}
  function append(text,who){const p=document.createElement('p');p.className='msg '+who;p.textContent=(who==='user'?'Você: ':'HARA: ')+text;messages.append(p);return p;}
  function sources(urls){const p=document.createElement('p');p.className='sources';for(const src of (urls||[]).slice(0,3)){try{const u=new URL(src);if(u.origin!=='https://www.hairacademiadabeleza.com.br'||u.pathname.startsWith('//'))continue;const a=document.createElement('a');a.href=u.pathname+u.hash;a.textContent='Ver no site → ';p.append(a);}catch{}}if(p.childNodes.length)messages.append(p);}
  function scrollConversation(){const body=$('.body');body.scrollTop=body.scrollHeight;}
  function clear(){generation++;controller?.abort();controller=null;pending=false;count=0;history=[];messages.replaceChildren();status.textContent='';input.value='';consent.checked=false;consent.removeAttribute('aria-invalid');$('.consent').classList.remove('needs-consent');controls();try{sessionStorage.removeItem(SESSION);}catch{}}
  const navegacao = () => window.hairVoltarPublico ||= import("/hara/voltar.js").catch(() => null);
  function abrirChat(foco=true) {
    navegacao().then(nav => {
      nav?.carregarEstilo(root, "/hara/chat.css");
      if(nav) nav.abrir('chat', () => setOpen(true,foco), () => setOpen(false));
      else setOpen(true,foco);
    });
  }
  function fecharChat() {
    navegacao().then(nav => { if(!nav || !nav.fechar('chat')) setOpen(false); });
  }
  $('.atalhos').addEventListener('click', e => {
    const link=e.target.closest('a');
    if(!link || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const seguir=()=>location.assign(link.href);
    navegacao().then(nav => { if(nav?.fechar('chat', seguir))return;setOpen(false);seguir(); });
  });
  $('.launch').onclick=()=>abrirChat();$('.close').onclick=fecharChat;$('.clear').onclick=clear;
  widget.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();fecharChat();}});
  consent.onchange=()=>{if(!consent.checked){clear();save();}else{consent.removeAttribute('aria-invalid');$('.consent').classList.remove('needs-consent');status.textContent='';save();}};
  try{const old=JSON.parse(sessionStorage.getItem(SESSION)||'null');if(old?.v===3&&old.accepted===true&&Array.isArray(old.history)){consent.checked=true;for(const turn of old.history.slice(-30)){if(typeof turn?.user!=='string'||turn.user.length>500||typeof turn?.reply!=='string'||turn.reply.length>6000)continue;const item={user:turn.user,reply:turn.reply,sources:Array.isArray(turn.sources)?turn.sources.slice(0,3):[]};history.push(item);append(item.user,'user');append(item.reply,'assistant');sources(item.sources);}count=history.length;if(old.open===true){abrirChat(false);scrollConversation();}}}catch{}
  controls();
  async function send(text){
    if(pending)return;if(!consent.checked){nudge();return;}if(!text.trim()){input.reportValidity();return;}
    if(count>=30){status.textContent='Para continuar, fale com a equipe pelo WhatsApp.';return;}
    pending=true;controls();status.textContent='Consultando…';const userNode=append(text,'user');input.value='';scrollConversation();
    const version=generation;controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),8000);
    try{const r=await fetch('/api/hara-public',{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,consent:'public-chat-v3'}),signal:controller.signal});const data=await r.json();if(version!==generation)return;if(!r.ok)throw Error(data.error||'Não consegui responder agora. Tente novamente.');if(typeof data.reply!=='string'||data.reply.length>6000)throw Error('Resposta indisponível. Tente novamente.');append(data.reply,'assistant');sources(data.sources);count++;history.push({user:text,reply:data.reply,sources:Array.isArray(data.sources)?data.sources.slice(0,3):[]});save();status.textContent='';scrollConversation();}
    catch(e){if(version===generation){userNode.remove();status.textContent=e.name==='AbortError'?'Tempo esgotado. Tente novamente ou fale com a equipe.':e.message;}}
    finally{clearTimeout(timeout);if(version===generation){pending=false;controller=null;controls();if(!widget.hidden)input.focus();}}
  }
  $('form').onsubmit=e=>{e.preventDefault();send(input.value);};root.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>{input.value=b.dataset.question;send(input.value);});
})();
