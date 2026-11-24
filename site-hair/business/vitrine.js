(() => {
  'use strict';
  const page = document.querySelector('link[rel=canonical]')?.href;
  const beauty = page && new URL(page).pathname.replace(/\/$/,'') === '/beauty';
  if (document.getElementById('hb-live')) return;
  const make = (tag, value, cls) => {
    const n=document.createElement(tag);
    if(value) n.textContent=value;
    if(cls) n.className=cls;
    return n;
  };
  function button(text, action, cls) {
    const b=make('button',text,cls); b.type='button'; b.onclick=action; return b;
  }
  function link(text, url, cls) {
    const a=make('a',text,cls); a.href=url; return a;
  }
  const work='https://app.hairacademiadabeleza.com.br/work.html?';
  const enrollment='https://wa.me/5516992558810?text='+encodeURIComponent(beauty
    ? 'Olá! Vim pelo Hair Business Beauty e quero ser aluno HAIR. Tenho interesse em formação na área da beleza.'
    : 'Olá! Vim pelo Hair Business Barber e quero ser aluno HAIR. Tenho interesse em formação em barbearia.');
  const root=make('aside','',beauty?'beauty':'barber'); root.id='hb-live';
  root.setAttribute('aria-label','Oportunidades e agenda HAIR');
  const bubble=make('section','','hb-bubble'), strip=make('div','','hb-strip'), panel=make('dialog');
  panel.setAttribute('aria-labelledby','hb-heading');
  root.append(bubble,strip,panel); document.body.append(root);
  const inset = () => {
    const banner=document.getElementById('hair-consent');
    document.body.style.setProperty('--hb-consent', (banner?.offsetHeight || 0)+'px');
  };
  const resize=new ResizeObserver(inset);
  let banner;
  function watchConsent() {
    const next=document.getElementById('hair-consent');
    if(banner===next)return;
    resize.disconnect();banner=next;
    if(banner)resize.observe(banner);
    inset();
  }
  new MutationObserver(watchConsent).observe(document.body,{childList:true});
  watchConsent();
  const jobsButton=button('',()=>jobCard(jobs[ji],false),'hb-feature');
  const all=button('Ver todas as vagas da região',()=>listing(),'hb-all');
  bubble.append(jobsButton,all);
  const eventButton=button('',()=>eventCard(events[ei]),'hb-event'); strip.append(eventButton);
  let jobs=[], events=[], ji=0, ei=0, refreshing=false, focusBefore;
  bubble.hidden=strip.hidden=true;
  const rank = x => beauty ? (x.area==='Cabelo e beleza'?0:['Unhas','Estética e beleza'].includes(x.area)?1:2) : Number(x.area!=='Barbearia');
  const eventRank=x=>beauty ? Number(['Barbearia','Outras áreas'].includes(x.area)) : Number(x.area!=='Barbearia');
  const fmt=d=>new Date(d.length===10?d+'T12:00:00-03:00':d).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});
  function entered(d) {
    const hours=Math.floor((Date.now()-Date.parse(d))/3600000);
    if(hours===0)return 'Entrou agora no Conexão Work';
    if(hours>0 && hours<24)return 'Há '+hours+' h no Conexão Work';
    return d?'No Conexão Work desde '+fmt(d):'Conexão Work';
  }
  const locationOf=j=>[j.city,j.state].filter(Boolean).join(' · ');
  let lastJob, turn=0;
  const quiet=window.matchMedia('(prefers-reduced-motion: reduce)');
  function speak(job) {
    const changed=lastJob!==job.id;
    if(changed && lastJob!=null)turn++;
    lastJob=job.id;
    const place=['baixo','alto','lado'][turn%3];
    bubble.dataset.place=place;
    const age=Date.now()-Date.parse(job.entered);
    const fresh=age>=0 && age<3600000;
    const intro=fresh?'Ei, chegou uma vaga': ['Ei, tem uma vaga','Olha esta oportunidade','Encontrei uma vaga'][turn%3];
    // Keep the complete published title in the detail sheet.
    const role=job.title.replace(/^vaga (?:para|de)\s+/i,'').split(/\s+[—–]\s+/)[0];
    const name=role.charAt(0).toLocaleLowerCase('pt-BR')+role.slice(1);
    const speech=intro+' para '+name+(job.city?' em '+job.city:'')+'.';
    const byline=make('span','','hb-byline');
    byline.append(make('b','HARA'),make('small',entered(job.entered)));
    const parts=[byline,make('strong',speech)];
    if(job.salary)parts.push(make('span','O anúncio informa '+job.salary+'.','hb-pay'));
    parts.push(make('span','Ver oportunidade →','hb-read'));
    jobsButton.replaceChildren(...parts);
    if(changed && !quiet.matches && bubble.animate) {
      const start=place==='lado'?'translateX(8px)':place==='alto'?'translateY(-6px)':'translateY(8px)';
      bubble.animate([{opacity:0,transform:start},{opacity:1,transform:'none'}],{duration:360,easing:'ease-out'});
    }
  }
  function render() {
    const j=jobs[ji], e=events[ei];
    bubble.hidden=!j; strip.hidden=!e;
    document.body.classList.toggle('hb-with-agenda',!!e);
    if(j) speak(j);
    if(e) eventButton.replaceChildren(make('small',e.open?'Inscrições abertas':'Agenda HAIR'),make('strong',[e.title,e.city,e.date&&fmt(e.date)].filter(Boolean).join(' · ')),make('b','Participar →'));
  }
  function show(title) {
    if(!panel.open)focusBefore=document.activeElement;
    const heading=make('h2',title);heading.id='hb-heading';
    const close=button('Fechar',()=>panel.close(),'hb-close');
    panel.replaceChildren(close,heading);
    if(!panel.open) panel.showModal();
    close.focus(); panel.scrollTop=0;
  }
  panel.addEventListener('close',()=>focusBefore?.focus?.({preventScroll:true}));
  panel.addEventListener('click',e=>{if(e.target===panel){const b=panel.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)panel.close();}});
  function jobCard(j,fromList) {
    if(!j)return;
    show(j.title);
    panel.append(make('p',[locationOf(j),j.salary].filter(Boolean).join(' · ')),make('h3','Seja aluno HAIR e tenha acesso às vagas em primeira mão'),
      make('p','Acompanhe oportunidades de trabalho na área da beleza em Ribeirão Preto e região pelo Conexão Work.'),
      link('Quero ser aluno HAIR',enrollment,'hb-primary'),link('Já sou aluno · Ver vaga',work+'vaga='+encodeURIComponent(j.id),'hb-secondary'));
    if(fromList) panel.append(button('Voltar à lista de vagas',()=>listing(),'hb-all'));
  }
  function eventCard(e) {
    if(!e)return;
    show(e.title); panel.append(make('p',[e.city,e.date&&fmt(e.date)].filter(Boolean).join(' · ')));
    if(e.classCode) {
      panel.append(link('Consultar a turma '+e.classCode,e.detail,'hb-primary'));
      return;
    }
    if(e.exclusive) panel.append(make('h3','Seja aluno HAIR para participar'),link('Quero ser aluno HAIR',enrollment,'hb-primary'));
    else if(e.registration || e.info) panel.append(link(e.registration?'Inscrição oficial →':'Ver página do evento →',e.registration||e.info,'hb-primary'));
    panel.append(link('Ver evento no Conexão Work',work+'evento='+encodeURIComponent(e.id),'hb-secondary'));
  }
  const filters={area:'',city:''};
  function listing() {
    show('Vagas da região');
    const rows=make('div','','hb-rows'), controls=make('div','','hb-filters');
    function filterRows() {
      const found=jobs.filter(j=>(!filters.area||j.area===filters.area)&&(!filters.city||j.city===filters.city));
      rows.replaceChildren(...found.map(j=>button(j.title+' · '+j.city,()=>jobCard(j,true),'hb-row')));
      if(!found.length) rows.append(make('p','Nenhuma vaga para estes filtros.'));
    }
    for(const [key,title] of [['area','Área'],['city','Cidade']]) {
      const label=make('label',title), select=make('select');
      select.setAttribute("aria-label",title);
      select.add(new Option('Todas',''));
      for(const v of [...new Set(jobs.map(j=>j[key]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'))) select.add(new Option(v,v));
      select.value=filters[key];filters[key]=select.value;
      select.onchange=()=>{filters[key]=select.value;filterRows();};
      label.append(select);controls.append(label);
    }
    panel.append(controls,rows);filterRows();
  }
  async function refresh() {
    if(refreshing||panel.open||document.hidden)return;
    refreshing=true;
    async function load(type) {
      const r=await fetch('/api/vitrine?tipo='+type,{signal:AbortSignal.timeout(20000)});
      if(!r.ok)throw Error(); return r.json();
    }
    const [j,e]=await Promise.allSettled([load('vagas'),load('agenda')]);
    if(!panel.open){
      if(j.status==='fulfilled'){
        const old=jobs[ji]?.id; jobs=j.value.sort((a,b)=>rank(a)-rank(b)||Date.parse(b.entered)-Date.parse(a.entered));
        ji=Math.max(0,jobs.findIndex(x=>x.id===old));
      }
      if(e.status==='fulfilled'){
        const old=events[ei]?.id;events=e.value.sort((a,b)=>eventRank(a)-eventRank(b)||(a.date||'9999').localeCompare(b.date||'9999'));
        ei=Math.max(0,events.findIndex(x=>x.id===old));
      }
      render();
    }
    refreshing=false;
  }
  setInterval(()=>{
    if(panel.open||document.hidden)return;
    if(jobs.length)ji=(ji+1)%jobs.length;
    if(events.length)ei=(ei+1)%events.length;
    render();
  },7000);
  const requestedClass=new URLSearchParams(location.search).get('turma');
  if(requestedClass) {
    const card=Array.from(document.querySelectorAll('[data-turma]')).find(n=>n.dataset.turma===requestedClass);
    if(card) {
      card.id='turma-'+requestedClass;
      card.tabIndex=-1;
      const reveal=()=>{card.scrollIntoView({block:'center'});card.focus({preventScroll:true});};
      if(document.readyState==='complete')reveal();else window.addEventListener('load',reveal,{once:true});
    }
  }
  refresh();setInterval(refresh,60000);document.addEventListener('visibilitychange',refresh);
})();
