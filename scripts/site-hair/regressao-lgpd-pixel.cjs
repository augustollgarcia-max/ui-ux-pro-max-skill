#!/usr/bin/env node
/* Regressão LGPD do Pixel (preparação para a mensuração no dispositivo da Meta, 12/11/2026).
   Trava: nada vai para Meta/Google antes de "Aceitar"; depois, Pixel e API de Conversões
   mandam o MESMO event_id e o mesmo nome (deduplicação); "Recusar" sobrevive ao recarregar;
   revogar pelo botão "Cookies" para tudo; nenhum telefone em texto; banner cabe em 375px.
   A Meta é simulada: nenhuma requisição sai para serviços reais.
   Uso: CHROMIUM_BIN=... PLAYWRIGHT_LIB=... node scripts/site-hair/regressao-lgpd-pixel.cjs */
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_LIB||'playwright');
const root=path.resolve(process.env.SITE_HAIR_DIR||path.join(__dirname,'../../site-hair'));
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';let f=path.join(root,u);if(!fs.existsSync(f)&&fs.existsSync(f+'.html'))f+='.html';if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}
 const t=f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'application/octet-stream';r.writeHead(200,{'Content-Type':t});fs.createReadStream(f).pipe(r)}).listen(0,async()=>{
 const base='http://127.0.0.1:'+srv.address().port;
 const b=await chromium.launch(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN}:{});
 let falhas=0;const ok=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)falhas++};
 const STUB=`(function(){var q=(window.fbq&&window.fbq.queue)||[];window.__fb=[];function run(a){window.__fb.push(a);if(a[0]==='track'){var i=new Image();i.src='https://www.facebook.com/tr?ev='+encodeURIComponent(a[1])+'&eid='+encodeURIComponent((a[3]&&a[3].eventID)||'')}if(a[0]==='init'){document.cookie='_fbp=fb.1.1.123;path=/'}}window.fbq.callMethod=function(){run([].slice.call(arguments))};q.forEach(function(a){run([].slice.call(a))});})();`;
 async function ctx(){const c=await b.newContext({viewport:{width:375,height:800}});const net=[],capi=[];
  await c.route('**/*',async rt=>{const u=rt.request().url();
   if(u.startsWith(base)){ if(u.includes('/api/meta-capi')){capi.push(JSON.parse(rt.request().postData()||'{}'));return rt.fulfill({status:200,body:'{}'})} return rt.continue();}
   net.push(u);
   if(u.includes('connect.facebook.net')) return rt.fulfill({status:200,contentType:'text/javascript',body:STUB});
   return rt.fulfill({status:204,body:''});});
  return {c,net,capi};}
 const pag=base+'/business/mestre-01-allan-rich?fbclid=TESTE123';
 // A: sem aceite
 {const {c,net,capi}=await ctx();const p=await c.newPage();await p.goto(pag,{waitUntil:'load'});await p.waitForTimeout(800);
  ok(!net.some(u=>/facebook|fbevents/.test(u)),'sem aceite: nenhuma requisição para a Meta');
  ok(!net.some(u=>/googletagmanager|google-analytics|googleadservices/.test(u)),'sem aceite: nenhuma requisição para o Google');
  ok(capi.length===0,'sem aceite: nada enviado ao servidor (CAPI)');
  ok(await p.evaluate(()=>typeof window.fbq==='undefined'),'sem aceite: Pixel nem existe na página');
  const bx=await p.locator('#hair-consent').boundingBox();ok(bx&&bx.width<=375,'banner cabe em 375px');
  const recusar=await p.locator('#hair-consent [data-c="0"]').boundingBox(),aceitar=await p.locator('#hair-consent [data-c="1"]').boundingBox();
  ok(recusar&&aceitar&&recusar.height>=40&&aceitar.height>=40,'Recusar e Aceitar com o mesmo tamanho de toque');
  await p.screenshot({path:require('os').tmpdir()+'/hair-banner-375.png'});
 // B: aceitar
  await p.locator('#hair-consent [data-c="1"]').click();await p.waitForTimeout(2500);
  const tr=net.filter(u=>u.includes('facebook.com/tr'));
  ok(tr.length>=2,'após aceite: eventos saem para a Meta ('+tr.length+')');
  ok(tr.every(u=>/eid=[^&]+/.test(u)),'após aceite: todo evento tem eventID');
  const ids=tr.map(u=>decodeURIComponent(u.match(/eid=([^&]*)/)[1])),names=tr.map(u=>decodeURIComponent(u.match(/ev=([^&]*)/)[1]));
  ok(capi.length>=2,'após aceite: servidor (CAPI) recebe os mesmos eventos ('+capi.length+')');
  ok(capi.every(e=>ids.includes(e.event_id)&&names[ids.indexOf(e.event_id)]===e.event_name),'deduplicação: mesmo event_id e mesmo nome no Pixel e no servidor');
   ok(capi.every(e=>!/\d{10,}/.test(JSON.stringify(e.custom_data||{}))),'nenhum telefone em texto nos dados do evento');
  await c.close();}
 // C: recusar e recarregar
 {const {c,net,capi}=await ctx();const p=await c.newPage();await p.goto(pag,{waitUntil:'load'});await p.waitForTimeout(400);
  await p.locator('#hair-consent [data-c="0"]').click();await p.reload({waitUntil:'load'});await p.waitForTimeout(1500);
  ok(!net.some(u=>/facebook|fbevents|googletagmanager/.test(u)),'recusar + recarregar: continua sem nada para Meta/Google');
  ok(capi.length===0,'recusar + recarregar: nada no servidor');
  ok(await p.locator('#hair-consent').count()===0,'recusar: banner não volta a incomodar');
  ok(await p.locator('[data-hair-cookies]').count()===1,'rodapé tem botão "Cookies" para mudar a escolha');
  await c.close();}
 // D: aceitar e depois revogar
 {const {c,net,capi}=await ctx();const p=await c.newPage();await p.goto(pag,{waitUntil:'load'});await p.locator('#hair-consent [data-c="1"]').click();await p.waitForTimeout(1500);
  const n0=net.filter(u=>u.includes('facebook.com/tr')).length,c0=capi.length;
  await p.locator('[data-hair-cookies]').click();await p.locator('#hair-consent [data-c="0"]').click();
  const fb=await p.evaluate(()=>window.__fb.filter(a=>a[0]==='consent').map(a=>a[1]));
  ok(fb.includes('revoke'),'revogar: Pixel recebe consent revoke');
  await p.evaluate(()=>{const a=document.createElement('a');a.href='https://wa.me/5516992558810';document.body.appendChild(a);a.addEventListener('click',e=>e.preventDefault());a.click()});await p.waitForTimeout(800);
  ok(net.filter(u=>u.includes('facebook.com/tr')).length===n0&&capi.length===c0,'revogar: clique no WhatsApp não gera mais evento');
  await c.close();}
 await b.close();srv.close();console.log(falhas?'FALHOU '+falhas:'TUDO OK');process.exit(falhas?1:0);});
