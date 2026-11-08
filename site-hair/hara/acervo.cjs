// Server-only reader. No browser credentials, no raw files and no questions sent to the Acervo.
const {isPriceQuestion,answer,selectTopics}=require('./knowledge.cjs');
const managed=new Set(require('./public-cards.json').cards.map(c=>c.id));
const ENDPOINT='https://hair-acervo-central.financeiro-hairacade.chatgpt.site/api/hara-cards';
const TTL=60000;
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const stop=new Set('a o as os de da do das dos e em no na nos nas para por um uma que qual quais como com sem sobre meu minha eu me voce quero saber pode tem esta'.split(' '));
function safeCard(c,now){
 if(!c||typeof c.id!=='string'||c.id.length>120||typeof c.text!=='string'||c.text.length<20||c.text.length>1200||typeof c.label!=='string'||c.label.length>160||!Array.isArray(c.keywords)||c.keywords.length>20||c.keywords.some(x=>typeof x!=='string'||x.length>400))return false;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(c.reviewedAt||'')||!/^[a-f0-9]{40,64}$/.test(c.sourceHash||''))return false;
 const age=now-Date.parse(c.reviewedAt+'T00:00:00Z');if(!Number.isFinite(age)||age<0||age>90*86400000)return false;
 let u;try{u=new URL(c.source)}catch{return false}
 if(u.protocol!=='https:'||!['www.hairacademiadabeleza.com.br','hairacademiadabeleza.com.br'].includes(u.hostname)||u.username||u.password||u.port||u.search||u.hash||!/^\/(?:business(?:\/[a-z0-9-]+)?|beauty|inicio|llms\.txt)\/?$/.test(u.pathname))return false;
 return !/r\s*\$|\b\d+[.,]\d{2}\b|\b(?:senha|token|secret|cpf|api.key)\s*[:=]|\b(?:custa|mensalidade|desconto)\b.*\d/i.test(c.text);
}
function rank(message,c){
 const q=norm(message),words=[...new Set(q.split(' ').filter(w=>w.length>=3&&!stop.has(w)))];
 const label=new Set(norm(c.label).split(' '));
 const hits=words.filter(w=>label.has(w)).length;
 const exact=c.keywords.map(norm).filter(k=>k.length>=4&&!stop.has(k)&&(' '+q+' ').includes(' '+k+' ')).length;
 return exact?10+hits:hits>=2?hits:0;
}
function createAcervoReader({clock=Date.now}={}){
 let cached=null,pending=null,scope=null;
 async function load(env,fetcher){
  const secret=env.HARA_ACERVO_SERVICE_TOKEN;
  if(scope!==secret){cached=null;pending=null;scope=secret;}
  if(cached&&clock()-cached.at<TTL)return cached.cards;
  if(pending)return pending;
  pending=(async()=>{
   const r=await fetcher(ENDPOINT,{method:'GET',headers:{'OAI-Sites-Authorization':`Bearer ${secret}`,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(1800)});
   if(!r.ok)throw Error('acervo unavailable');
   if(Number(r.headers?.get('content-length')||0)>150000)throw Error('acervo too large');
   const reader=r.body?.getReader();if(!reader)throw Error('acervo invalid response');
   let total=0;const parts=[];while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>150000){await reader.cancel();throw Error('acervo too large');}parts.push(value);}
   const bytes=new Uint8Array(total);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}
   const body=JSON.parse(new TextDecoder().decode(bytes));
   if(body.version!==1||!Array.isArray(body.cards)||body.cards.length>80)throw Error('acervo invalid schema');
   const cards=body.cards.filter(c=>safeCard(c,clock()));cached={cards,at:clock()};return cards;
  })();
  try{return await pending}catch{cached=null;return null}finally{pending=null}
 }
 return async function consult(message,{env=process.env,fetcher=fetch}={}){
  if(isPriceQuestion(message)||env.HARA_ACERVO_ENABLED!=='true'||typeof env.HARA_ACERVO_SERVICE_TOKEN!=='string'||env.HARA_ACERVO_SERVICE_TOKEN.length<32)return null;
  const cards=await load(env,fetcher),local=selectTopics(message);
  const known=local.filter(c=>managed.has(c.id));
  let ranked=[];
  if(cards){
   ranked=known.map(c=>cards.find(x=>x.id==='public-'+c.id)).filter(c=>c&&safeCard(c,clock())).slice(0,2);
   if(!known.length)ranked=cards.filter(c=>safeCard(c,clock())).map(c=>({c,score:rank(message,c)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,2).map(x=>x.c);
  }
  // A managed topic revoked/expired/offline must not reappear through the old local card or selector.
  if(!ranked.length)return !known.length&&local.length?null:answer('');
  return {reply:ranked.map(c=>c.text).join('\n\n'),sources:[...new Set(ranked.map(c=>c.source))],whatsapp:answer('').whatsapp,topics:ranked.map(c=>c.id)};
 };
}
module.exports={createAcervoReader,consultAcervo:createAcervoReader(),safeCard,ENDPOINT,TTL};
