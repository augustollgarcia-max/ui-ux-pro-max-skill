// Atendimento público isolado. Não chama Supabase, LLM, CRM nem APIs administrativas.
const { createHmac }=require('node:crypto');
const { isIP }=require('node:net');
const { answer }=require('../hara/knowledge.cjs');
const origins=new Set(['https://hairacademiadabeleza.com.br','https://www.hairacademiadabeleza.com.br']);
// Atomicidade evita ultrapassar o limite com requisições concorrentes.
const LUA=`for i=1,3 do if tonumber(redis.call('GET',KEYS[i]) or '0') >= tonumber(ARGV[i]) then return 0 end end
for i=1,3 do local n=redis.call('INCR',KEYS[i]); if n==1 then redis.call('EXPIRE',KEYS[i],tonumber(ARGV[i+3])) end end return 1`;
async function limit(ip,env,fetcher,now) {
  const url=env.HARA_RATE_REST_URL, token=env.HARA_RATE_REST_TOKEN, secret=env.HARA_RATE_HMAC;
  if(!url || !/^https:\/\/[a-zA-Z0-9-]+\.upstash\.io\/?$/.test(url) || !token || !secret || secret.length<32) throw Error('rate unavailable');
  const day=Math.floor(now/86400000),minute=Math.floor(now/60000);
  const hash=createHmac('sha256',secret).update(`${day}:${ip}`).digest('hex');
  const keys=[`hara:public:${day}:${hash}:m:${minute}`,`hara:public:${day}:${hash}:d`,`hara:public:${day}:global`];
  const r=await fetcher(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',LUA,'3',...keys,'6','30','1000','120','86400','86400']),signal:AbortSignal.timeout(2500)});
  if(!r.ok) throw Error('rate unavailable');
  const body=await r.json(); if(body.error || ![0,1].includes(body.result)) throw Error('rate unavailable');
  return body.result===1;
}
function createHandler({env=process.env,fetcher=fetch,now=Date.now}={}) {
  return async (req,res)=>{
    res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
    const send=(status,error)=>res.status(status).json({error});
    if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,'Método não permitido.');}
    const previewOrigin=env.VERCEL_ENV==='preview' && /^[a-zA-Z0-9.-]+\.vercel\.app$/.test(env.VERCEL_URL||'') ? `https://${env.VERCEL_URL}` : null;
    if(!origins.has(req.headers.origin) && (!previewOrigin || req.headers.origin!==previewOrigin)) return send(403,'Origem não permitida.');
    if(req.headers['sec-fetch-site'] && req.headers['sec-fetch-site']!=='same-origin') return send(403,'Origem não permitida.');
    if(env.HARA_PUBLIC_ENABLED!=='true') return send(503,'Atendimento em preparação. Use o WhatsApp oficial.');
    if(!/^application\/json(?:\s*;.*)?$/i.test(req.headers['content-type']||''))return send(415,'Envie JSON.');
    let b=req.body;
    try {if(Buffer.byteLength(typeof b==='string'?b:JSON.stringify(b)||'')>2048)return send(413,'Mensagem muito longa.');if(typeof b==='string')b=JSON.parse(b);}catch{return send(400,'Mensagem inválida.');}
    if(!b || Array.isArray(b) || Object.keys(b).some(k=>!['message','consent'].includes(k)) || b.consent!=='public-chat-v1' || typeof b.message!=='string' || !b.message.trim() || b.message.length>500)return send(400,'Aceite o aviso e envie uma pergunta de até 500 caracteres.');
    // Defesa adicional; não garante detectar todos os dados pessoais. Nenhum texto é persistido.
    if(/@|(?:\d[\s().+/-]*){8,}|\b(?:cpf|rg|senha|cartao)\s*[:=]/i.test(b.message)) return send(400,'Não envie dados pessoais, documentos, senhas ou telefone. Use o contato oficial.');
    const ip=String(req.headers['x-vercel-forwarded-for']||'').trim();
    if(env.VERCEL!=='1' || !isIP(ip))return send(503,'Proteção de acesso indisponível. Use o WhatsApp oficial.');
    try {if(!await limit(ip,env,fetcher,now())){res.setHeader('Retry-After','60');return send(429,'Limite de atendimento atingido. Tente mais tarde ou use o WhatsApp oficial.');}}catch{return send(503,'Proteção de acesso indisponível. Use o WhatsApp oficial.');}
    return res.status(200).json(answer(b.message.trim()));
  };
}
module.exports=createHandler(); module.exports.createHandler=createHandler; module.exports.limit=limit; module.exports.LUA=LUA;
