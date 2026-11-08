// Public lead intake: contact data is sent only to an explicitly configured authenticated relay.
// This endpoint never calls the student APIs, exposes keys, logs contact data or directly sends WhatsApp.
const {createHmac}=require('node:crypto');
const {isIP}=require('node:net');
const {limit}=require('./hara-public');
const {topics}=require('../hara/knowledge.cjs');
const officialOrigins=new Set(['https://www.hairacademiadabeleza.com.br','https://hairacademiadabeleza.com.br']);
const allowedTopics=new Set([...topics.map(t=>t.id),'valores']);
function relayConfig(env){
  if(env.HARA_LEADS_ENABLED!=='true'||!env.HARA_LEADS_RELAY_URL||!env.HARA_LEADS_RELAY_SECRET||env.HARA_LEADS_RELAY_SECRET.length<32)return null;
  try{const u=new URL(env.HARA_LEADS_RELAY_URL);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||!u.hostname.match(/^[a-z0-9]+\.supabase\.co$/)||u.pathname!=='/functions/v1/hara-site-intake'||u.username||u.password||u.port||u.search||u.hash)return null;return {url:u.href,secret:env.HARA_LEADS_RELAY_SECRET};}catch{return null;}
}
function validate(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['name','phone','email','city','context','consent','followup','eventId'].includes(k)))return null;
  const {name,phone,email,city,context,consent,followup,eventId}=input;
  if(typeof name!=='string'||name.length>100||typeof phone!=='string'||phone.length>25||typeof email!=='string'||email.length>254||typeof city!=='string'||city.trim().length<2||city.length>100||followup!==false||consent!=='lead-contact-v2'||typeof eventId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId))return null;
  const digits=phone.replace(/\D/g,'');let normalized=digits;
  if(digits.length===10||digits.length===11)normalized='55'+digits;
  if(!/^55[1-9]\d\d{8,9}$/.test(normalized)||!/^[\s()+.\d-]+$/.test(phone))return null;
  if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||/[\r\n\u0000-\u001f<>]/.test(name+city+email))return null;
  if(!context||typeof context!=='object'||Array.isArray(context)||Object.keys(context).some(k=>!['page','topics','summary'].includes(k))||typeof context.page!=='string'||context.page.length>300||!/^\/(?!\/)[a-zA-Z0-9/_.-]*$/.test(context.page)||!Array.isArray(context.topics)||context.topics.length>10||context.topics.some(t=>!allowedTopics.has(t))||typeof context.summary!=='string'||context.summary.length>2000||/\u0000/.test(context.summary))return null;
  return {name:name.trim(),phone:normalized,email:email.trim().toLowerCase(),city:city.trim(),context:{page:context.page,topics:[...new Set(context.topics)],summary:context.summary.trim()},consent,followup,eventId};
}
function createLeadHandler({env=process.env,fetcher=fetch,now=Date.now}={}){
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,error)=>res.status(status).json({error});
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,'Método não permitido.');}
  const preview=env.VERCEL_ENV==='preview'&&/^[a-zA-Z0-9.-]+\.vercel\.app$/.test(env.VERCEL_URL||'')?'https://'+env.VERCEL_URL:null;
  if(!officialOrigins.has(req.headers.origin)&&(!preview||req.headers.origin!==preview))return send(403,'Origem não permitida.');
  if(req.headers['sec-fetch-site']&&req.headers['sec-fetch-site']!=='same-origin')return send(403,'Origem não permitida.');
  const cfg=relayConfig(env);if(!cfg)return send(503,'Captação comercial ainda não configurada. Nenhum cadastro ou aviso ao grupo foi confirmado.');
  if(!/^application\/json(?:\s*;.*)?$/i.test(req.headers['content-type']||''))return send(415,'Envie JSON.');
  let body=req.body;try{const raw=typeof body==='string'?body:JSON.stringify(body)||'';if(Buffer.byteLength(raw)>7000)return send(413,'Solicitação muito longa.');if(typeof body==='string')body=JSON.parse(body);}catch{return send(400,'Solicitação inválida.');}
  const data=validate(body);if(!data)return send(400,'Confira cidade, telefone com DDD, e-mail e consentimento.');
  const ip=String(req.headers['x-vercel-forwarded-for']||'').trim();if(env.VERCEL!=='1'||!isIP(ip))return send(503,'Proteção de acesso indisponível.');
  try{if(!await limit(ip,env,fetcher,now(),'lead'))return send(429,'Limite de solicitações atingido. Tente mais tarde.');}catch{return send(503,'Proteção de acesso indisponível.');}
  const timestamp=Math.floor(now()/1000).toString();
  // The relay must atomically deduplicate this eventId, save the CRM lead and enqueue an internal notification.
  // followup=false forbids proactive follow-up. Notification means a requested handoff, never proof of a sent WA message.
  const payload=JSON.stringify({event:'site_handoff_requested',...data,consentAcceptedAt:new Date(now()).toISOString(),followupConsent:null});
  const signature=createHmac('sha256',cfg.secret).update(timestamp+'.'+payload).digest('hex');
  try{
   const r=await fetcher(cfg.url,{method:'POST',headers:{'Content-Type':'application/json','X-Hara-Timestamp':timestamp,'X-Hara-Signature':'sha256='+signature,'Idempotency-Key':data.eventId},body:payload,signal:AbortSignal.timeout(8000)});
   if(!r.ok)return send(503,'Não foi possível confirmar o recebimento. Tente novamente.');
   const received=await r.json();
   if(received?.accepted!==true||received.crmStored!==true||received.notificationQueued!==true||received.eventId!==data.eventId||typeof received.reference!=='string'||!/^HAIR-[a-zA-Z0-9-]{6,64}$/.test(received.reference))return send(503,'Confirmação do atendimento indisponível.');
   const text=`Olá! Vim do site da HAIR. Minha cidade é ${data.city}. Quero continuar meu atendimento. Referência: ${received.reference}.`;
   return res.status(200).json({reference:received.reference,whatsappUrl:'https://wa.me/5516992558810?text='+encodeURIComponent(text)});
  }catch{return send(503,'Não foi possível confirmar o recebimento. Tente novamente.');}
 };
}
module.exports=createLeadHandler();module.exports.createLeadHandler=createLeadHandler;module.exports.validate=validate;module.exports.relayConfig=relayConfig;
