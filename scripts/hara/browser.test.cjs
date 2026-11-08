const {chromium}=require('playwright');const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHandler}=require('../../site-hair/api/hara-public');const SITE=path.resolve(__dirname,'../../site-hair');
const env={VERCEL:'1',HARA_PUBLIC_ENABLED:'true',HARA_RATE_REST_URL:'https://test.upstash.io',HARA_RATE_REST_TOKEN:'test-only',HARA_RATE_HMAC:'a'.repeat(32)};
// Somente neste servidor de testes são simulados origem, cabeçalho Vercel e Redis.
let calls=0,redisMode=1;
const handler=createHandler({env,fetcher:async()=>({ok:true,json:async()=>({result:redisMode})})});
const server=http.createServer(async(req,res)=>{
  if(req.url==='/api/hara-public'){
    calls++;let body='';for await(const c of req)body+=c;
    const request={method:req.method,body,headers:{...req.headers,origin:'https://www.hairacademiadabeleza.com.br','x-vercel-forwarded-for':'192.0.2.1'}};
    res.status=s=>{res.statusCode=s;return res;};res.json=b=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(b));};return handler(request,res);
  }
  let p=path.join(SITE,new URL(req.url,'http://local').pathname);if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');if(!path.extname(p)&&fs.existsSync(p+'.html'))p+='.html';
  if(!p.startsWith(SITE+path.sep)||!fs.existsSync(p)){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(p)]||'application/octet-stream');
  const config=JSON.parse(fs.readFileSync(path.join(SITE,'vercel.json')));const route=new URL(req.url,'http://local').pathname;
  for(const rule of config.headers){if(new RegExp('^'+rule.source+'$').test(route))for(const h of rule.headers)res.setHeader(h.key,h.value);}
  fs.createReadStream(p).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||'/usr/bin/chromium',args:['--no-sandbox']});let cases=0;
try{
  for(const route of ['/','/business','/beauty','/inicio'])for(const [width,height] of [[320,640],[390,844],[768,900],[1440,900],[812,375]]){
    const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.fulfill({status:200,body:''}));
    await page.addInitScript(()=>localStorage.setItem('hair_consent_v1','denied'));
    const before=calls;await page.goto(base+route);await page.getByRole('button',{name:'Conversar com a HARA'}).click();
    assert.equal(calls,before);assert.ok(await page.getByRole('textbox',{name:'Sua pergunta'}).isDisabled());
    assert.ok(await page.evaluate(()=>{const d=document.querySelector('#hara-public-host').shadowRoot.querySelector('dialog'),r=d.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&d.scrollWidth<=d.clientWidth+1;}));
    await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Localização',exact:true}).click();await page.getByText('HARA: O atendimento presencial', {exact:false}).waitFor();
    assert.ok((await page.getByRole('link',{name:'Equipe no WhatsApp'}).getAttribute('href')).includes('5516992558810'));
    await page.getByRole('textbox').fill('<img src=x onerror=alert(1)> cursos');await page.getByRole('button',{name:'Enviar',exact:true}).click();await page.getByText('HARA: A HAIR oferece', {exact:false}).waitFor();
    assert.equal(await page.evaluate(()=>document.querySelector('#hara-public-host').shadowRoot.querySelector('.messages').querySelectorAll('img').length),0);
    assert.equal(await page.evaluate(()=>localStorage.getItem('hair_consent_v1')),'denied');
    await page.getByRole('button',{name:'Apagar conversa'}).click();assert.equal(await page.locator('#hara-public-host').locator('.messages').innerText(),'');assert.ok(!await page.getByRole('checkbox').isChecked());
    assert.ok(await page.getByRole('textbox').isDisabled());await page.keyboard.press('Escape');assert.ok(!await page.getByRole('dialog').isVisible());assert.ok(await page.getByRole('button',{name:'Conversar com a HARA'}).evaluate(el=>el===document.activeElement||el===el.getRootNode().activeElement));
    assert.deepEqual(errors,[]);await page.close();cases++;console.log(`PASS ${route} ${width}x${height}`);
  }
  const page=await browser.newPage({viewport:{width:390,height:844}});await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.fulfill({status:200,body:''}));await page.addInitScript(()=>localStorage.setItem('hair_consent_v1','denied'));await page.goto(base);await page.getByRole('button',{name:'Conversar com a HARA'}).click();await page.getByRole('checkbox').check();redisMode=0;await page.getByRole('button',{name:'Cursos',exact:true}).click();await page.getByText('Limite de atendimento atingido.',{exact:false}).waitFor();assert.ok(await page.getByRole('button',{name:'Enviar',exact:true}).isEnabled());redisMode=1;
  await page.getByRole('button',{name:'Localização',exact:true}).click();await page.getByText('HARA: O atendimento presencial',{exact:false}).waitFor();await page.screenshot({path:path.resolve(__dirname,'../../docs/hara/chat-mobile.png')});await page.close();console.log(`PASS ${cases} layouts + erro 429 recuperável; nenhum envio real a serviços externos`);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
