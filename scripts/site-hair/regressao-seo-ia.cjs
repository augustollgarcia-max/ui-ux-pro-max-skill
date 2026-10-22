#!/usr/bin/env node
/* Regressão da auditoria aprovada. Serviços externos e TODAS as escritas são interceptados.
   Uso: CHROMIUM_BIN=/usr/bin/chromium PLAYWRIGHT_LIB=... AXE_LIB=... node scripts/site-hair/regressao-seo-ia.cjs */
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_LIB||'playwright');
const AXE=process.env.AXE_LIB||require.resolve('axe-core/axe.min.js');
const SITE=path.resolve(process.env.SITE_HAIR_DIR||path.join(__dirname,'../../site-hair'));
const prod='https://www.hairacademiadabeleza.com.br';
// /vertice é espelhada em verticebeautygroup.com.br, o domínio oficial da marca mãe: a canônica aponta para lá.
const routes=['/','/business','/beauty','/business/apps','/business/assessoria','/business/historia',
 '/business/mestre-01-allan-rich','/business/mestre-02-kenny-wolf','/business/mestre-03-gustavo-rosatti','/business/mestre-04-wesley-sharper',
 '/business/beauty-05-renata-scatena','/business/beauty-06-estefania-oliveira','/vertice'];
// o envio ao servidor (CAPI) espera o cookie _fbp do Pixel por até ~1,5 s: espere o evento, não um tempo fixo
const ateEm=async(p,f,ms=2500)=>{for(let t=0;t<ms&&!f();t+=100)await p.waitForTimeout(100);return f();};
let checks=0;function ok(test,msg){if(!test)throw Error(msg);checks++;console.log('✓ '+msg);}
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const p=decodeURIComponent(new URL(req.url,'http://local').pathname);let file=path.join(SITE,p);
 if(!file.startsWith(SITE+path.sep)&&file!==SITE){res.writeHead(404);return res.end();}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 else if(!path.extname(file)&&fs.existsSync(file+'.html'))file+='.html';
 if(!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
 const config=JSON.parse(fs.readFileSync(path.join(SITE,'vercel.json'),'utf8'));
 const relevant=config.headers.filter(x=>x.source==='/(.*)'||['/business(.*)','/beauty(.*)','/vertice(.*)'].includes(x.source)&&p.startsWith(x.source.split('(')[0]));
 const headers=Object.fromEntries(relevant.flatMap(x=>x.headers.map(h=>[h.key,h.value.replace('; upgrade-insecure-requests','')])));
 res.writeHead(200,{...headers,'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.BASE_URL||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined,args:['--no-sandbox']});
 try {
 async function context(consent='denied',mode={fail:false,fallback:false}){
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),events=[],network=[];
  if(consent)await c.addInitScript(v=>localStorage.setItem('hair_consent_v1',v),consent);
  await c.route('**/*',async r=>{
   const q=r.request(),u=q.url();
   if(u.includes('/api/meta-capi')){events.push(JSON.parse(q.postData()||'{}'));return r.fulfill({status:204,body:''});}
   if(u.includes('/rpc/registrar_lead_site')){
    network.push('crm-mock');
    return r.fulfill({status:mode.fail?503:mode.fallback&&u.endsWith('_v2')?404:200,contentType:'application/json',body:mode.fail?'{}':'"audit-lead-id"'});
   }
   if(/wa.me\/|api.whatsapp.com/.test(u)){network.push('whatsapp-blocked');return r.abort();}
   if(/googletagmanager|google-analytics|doubleclick|googleadservices|facebook/.test(u)){
    network.push(u);return r.fulfill({status:200,contentType:'application/javascript',body:'/* serviço externo isolado */'});
   }
   if(!['GET','HEAD','OPTIONS'].includes(q.method()))return r.abort();
   if(u.endsWith('/audio/trilha.mp3'))network.push('audio');
   return r.continue();
  });return {c,events,network};
 }
 for(const route of routes){
  const {c}=await context(),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const r=await p.goto(base+route,{waitUntil:'domcontentloaded'});await p.waitForTimeout(150);
  ok(r.status()===200,route+' HTTP 200');
  const canon=await p.locator('link[rel=canonical]').getAttribute('href');const esperada=route==='/vertice'?'https://verticebeautygroup.com.br/':prod+(route==='/'?'/':route);ok(canon===esperada,route+' canônica preservada');
  await p.addScriptTag({path:AXE});const violations=await p.evaluate(async()=>{
   const a=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
   return a.violations.filter(x=>['serious','critical'].includes(x.impact)).map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)}));
  });ok(!violations.length,route+' acessibilidade: '+JSON.stringify(violations));
  for(const width of [320,390,1440]){await p.setViewportSize({width,height:844});ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' largura '+width);}
  ok(!errors.length,route+' sem erro JS: '+errors.join(';'));await c.close();
 }
 {
  const {c,events,network}=await context(null),p=await c.newPage();await p.goto(base+'/',{waitUntil:'load'});await p.waitForTimeout(250);
  ok(!events.length&&!network.some(x=>/facebook|googletagmanager/.test(x)),'sem medição externa antes do aceite');
  ok(!network.includes('audio'),'sem transferência da trilha antes da escolha');
  await p.locator('#hair-consent [data-c="1"]').click();await p.waitForTimeout(150);
  ok(network.some(x=>x.includes('googletagmanager'))&&network.some(x=>x.includes('fbevents.js')),'aceite carrega Google e Meta');
  await p.locator('.emblema--barber').click();await p.waitForURL(base+'/business');await p.waitForTimeout(150);
  const graph=await p.locator('script[type="application/ld+json"]').evaluate(x=>JSON.parse(x.textContent));ok(graph['@graph'].some(x=>x['@type']==='ItemList'),'SPA copia o grafo da página Barber');
  ok(await ateEm(p,()=>events.some(x=>x.event_name==='ViewContent'&&x.custom_data.content_category==='barbearia')),'SPA registra ViewContent da rota atual');
  await p.locator('.whats').evaluate(x=>x.addEventListener('click',e=>e.preventDefault()));await p.locator('.whats').click();
  ok(await ateEm(p,()=>events.some(x=>x.event_name==='Contact'))&&events.filter(x=>x.event_name==='Contact').length===1,'WhatsApp registra um Contact');
  ok(await p.evaluate(()=>dataLayer.filter(x=>x[0]==='event'&&x[1]==='conversion').length===1),'Google usa um único rótulo WhatsApp existente');
  await p.locator('[data-hair-cookies]').click();await p.locator('#hair-consent [data-c="0"]').click();
  await p.locator('.whats').click();await p.waitForTimeout(1900);ok(events.filter(x=>x.event_name==='Contact').length===1,'revogação bloqueia novos eventos');await c.close();
 }
 {
  const mode={fail:true,fallback:false},{c,events}=await context('granted',mode),p=await c.newPage();
  await p.goto(base+'/business/mestre-02-kenny-wolf',{waitUntil:'load'});await p.locator('.som-btn').click();await p.waitForTimeout(100);
  const first=p.locator('#hair-gate [data-fechar]');await first.focus();await p.keyboard.press('Shift+Tab');
  ok(await p.evaluate(()=>!!document.activeElement.closest('#hair-gate')),'Shift+Tab fica dentro do modal');
  await p.keyboard.press('Tab');ok(await p.evaluate(()=>document.activeElement.hasAttribute('data-fechar')),'Tab retorna ao primeiro controle');
  await p.keyboard.press('Escape');ok(await p.locator('.som-btn').evaluate(x=>x===document.activeElement),'fechar restaura foco ao acionador');
  await p.locator('.som-btn').click();await p.locator('#hair-gate button[type=submit]').click();ok(await p.locator('.gate-erro').innerText()==='Escreva seu nome.','formulário valida vazio');
  await p.locator('#hair-gate input[name=nome]').fill('Teste isolado');await p.locator('#hair-gate input[name=zap]').fill('16900000000');await p.locator('#hair-gate button[type=submit]').click();await p.waitForTimeout(250);
  ok(!events.some(x=>x.event_name==='Lead'),'CRM com falha não conta Lead');await p.waitForFunction(()=>!!localStorage.getItem('hair_mestres_pend_v1'),{},{timeout:5000}).catch(async e=>{console.error('Gate state',await p.evaluate(()=>({open:!!document.querySelector('#hair-gate:not([hidden])'),message:document.querySelector('.gate-erro').textContent,nameLength:document.querySelector('[name=nome]').value.length,phoneLength:document.querySelector('[name=zap]').value.replace(/\D/g,'').length,unlocked:localStorage.getItem('hair_mestres_ok_v1')})));throw e;});ok(await p.evaluate(()=>!!localStorage.getItem('hair_mestres_pend_v1')),'falha mantém fila offline');
  mode.fail=false;await p.reload({waitUntil:'load'});await p.waitForTimeout(200);
  await ateEm(p,()=>events.some(x=>x.event_name==='Lead'));
  ok(events.filter(x=>x.event_name==='Lead').length===1,'retomada conta Lead depois da confirmação');ok(!await p.evaluate(()=>localStorage.getItem('hair_mestres_pend_v1')),'retomada limpa a pendência');
  ok(events.find(x=>x.event_name==='Lead').event_id==='audit-lead-id','Lead mantém identificador confirmado para deduplicação');await c.close();
 }
 {
  const {c,events,network}=await context('granted'),p=await c.newPage();await p.goto(base+'/modelo',{waitUntil:'load'});
  await p.locator('#academy').selectOption('kenny');await p.locator('#name').fill('Teste isolado');await p.locator('#phone').fill('16900000000');await p.locator('#availability').selectOption({index:1});await p.locator('#contact').check();await p.locator('button[type=submit]').click();await p.waitForTimeout(150);
  await ateEm(p,()=>events.filter(x=>x.event_name==='Contact').length>=1);await p.waitForTimeout(300);
  ok(network.includes('whatsapp-blocked'),'modelo prepara WhatsApp, sem enviar mensagem');ok(events.filter(x=>x.event_name==='Contact').length===1&&!events.some(x=>x.event_name==='Lead'),'modelo conta intenção, sem inventar Lead salvo');await c.close();
 }
 {
  const {c,events}=await context(null),p=await c.newPage();
  await p.goto(base+'/?utm_source=teste_local&gclid=identificador_local',{waitUntil:'load'});
  await p.locator('.emblema--beauty').click();await p.waitForURL('**/beauty?**');
  ok(new URL(p.url()).searchParams.get('gclid')==='identificador_local','transição preserva atribuição do anúncio na URL');
  ok(await p.locator('#hair-consent').isVisible(),'transição preserva a possibilidade de escolher cookies');
  ok(!events.length,'transição antes da escolha não mede visitas');
  await p.locator('#hair-consent [data-c="1"]').click();await p.waitForTimeout(150);
  await ateEm(p,()=>events.some(x=>x.event_name==='ViewContent'));await p.waitForTimeout(300);
  ok(events.filter(x=>x.event_name==='ViewContent'&&x.custom_data.content_category==='beauty').length===1,'aceite depois da transição mede a página atual uma vez');await c.close();
 }
 console.log(`OK: ${checks} verificações; zero escrita/contato/conversão enviada a serviços reais.`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
