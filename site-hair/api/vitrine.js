// Public projection of the catalog shared by Hair and Work. Only the anonymous role is used.
const base = 'https://zoyyfvfvnxrpojhypsjh.supabase.co/rest/v1/';
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveXlmdmZ2bnhycG9qaHlwc2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTEwMzEsImV4cCI6MjA5NzU4NzAzMX0.gM5qLWnbKMeaHQ5fvBXM8FOHpB2rMrBmZOwfFUqK7D8';
const dateBR = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'America/Sao_Paulo'}).format(new Date());
const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

async function catalog(table, filters) {
  const rows = [];
  const size = 250;
  for (let offset = 0; ; offset += size) {
    const query = new URLSearchParams({...filters, limit:size, offset});
    const r = await fetch(base + table + '?' + query, {headers:{apikey:anon}, signal:AbortSignal.timeout(12000)});
    if (!r.ok) throw Error('Catálogo indisponível');
    const page = await r.json();
    rows.push(...page);
    if (page.length < size) return rows;
  }
}
function area(title, category) {
  const t = normalize(title).split(/\s+[—–]\s+/)[0];
  if (/barbeir|barbearia|barber|barboterapia/.test(t) || category === 'barbearia') return 'Barbearia';
  if (/cabeleir|escovista|colorista|capilar|mechas|tricolog|penteado|corte feminino/.test(t) || category === 'cabeleireira') return 'Cabelo e beleza';
  if (/manicure|pedicure|unhas|nail/.test(t)) return 'Unhas';
  if (/estetic|sobrancelh|lash|brow|laser|maqui|lifting|massag|depila/.test(t) || category === 'designer') return 'Estética e beleza';
  return 'Outras áreas';
}
function pay(text) {
  const amount = /(?:até\s+|a partir de\s+)?R\$\s*\d+(?:\.\d{3})*(?:,\d{2})?(?:\s*(?:a|e|até|[-–—])\s*(?:R\$\s*)?\d+(?:\.\d{3})*(?:,\d{2})?)?(?:\s*(?:por |\/)(?:hora|dia|mês))?(?:\s*(?:\+|\/)\s*comissão(?: de \d+%)?)?/i;
  const pattern = /(?:salário|remuneração|faixa anunciada|diária|ganhos|média informada)\s*(?:mensal|informad[ao]|anunciad[ao]|no portal|de|:|entre|base|fixo|\s){0,8}((?:até |a partir de )?R\$[^;\n]{0,90})/i;
  const statement = String(text || '');
  const phrase = statement.match(pattern)?.[1] || statement.match(/(?:escala de turno, |Freelancer\/MEI; |\. )((?:até |a partir de )?R\$[^;\n]{0,90})/i)?.[1];
  return phrase?.match(amount)?.[0] || '';
}
async function jobs() {
  const rows = await catalog('oportunidades',{select:'id,public_ref,titulo,cidade,categoria,proposta,created_at',ativo:'eq.true',encerrada_em:'is.null',tipo:'eq.vaga',order:'created_at.desc,id.asc'});
  const seen = new Set();
  return rows.filter(j => {
    const key = j.public_ref || j.id;
    if (!j.titulo || seen.has(key)) return false;
    seen.add(key); return true;
  }).map(j => ({id:j.id,title:j.titulo,city:(j.cidade||'').replace(/\s*[-,·]\s*SP$/i,'').trim(),state:/[-,·]\s*SP$/i.test(j.cidade)||['araraquara','ribeirao preto','franca','serrana','orlandia','jaboticabal'].includes(normalize(j.cidade))?'SP':'',area:area(j.titulo,j.categoria),salary:pay(j.proposta),entered:j.created_at}));
}
function event(e) {
  const description = e.descricao || '';
  const closed = /inscriç[õã](?:es|o)\s+(?:encerrada|fechada)|evento cancelado/i.test(description);
  const open = !closed && /inscriç[õã](?:es|o)\s+aberta/i.test(description);
  if (closed || !(e.data >= dateBR() || (!e.data && open))) return null;
  const exclusive = /(?:exclusiv[oa]s?|restrit[oa]s?|somente|apenas)\s+(?:(?:para|a|os|aos)\s+)*(?:alun|estudant|matriculad)|(?:alunos?|estudantes?)\s+HAIR/i.test(description+' '+e.titulo);
  const registration = description.match(/(?:inscrição|inscrições|inscreva-se|cadastro)\s*[:–-]?\s*(https:\/\/[^\s<>"]+)/i)?.[1];
  const phone = description.match(/inscriç(?:ão|ões)\s*:\s*(?:via\s+)?WhatsApp\s*[:–-]?\s*(?:\+?55\s*)?\(?(\d{2})\)?\s*(9?\d{4})[- ]?(\d{4})/i);
  const source = description.match(/Fonte(?: oficial)?\s*:\s*(https:\/\/[^\s<>"]+)/i)?.[1];
  const link = registration || (phone && 'https://wa.me/55'+phone.slice(1).join('')) || source;
  let url = '';
  try { const u=new URL(link?.replace(/[.,;]+$/,'')); if(u.protocol==='https:'&&!u.username&&!u.password) url=u.href; } catch {}
  return {id:e.id,title:e.titulo,city:e.cidade,date:e.data,area:area(e.titulo),open,exclusive,
    registration:!exclusive && (registration || phone) ? url : '', info:exclusive?'':url};
}
async function events() {
  const rows = await catalog('work_eventos',{select:'id,titulo,cidade,data,descricao',ativo:'eq.true',or:'(data.is.null,data.gte.'+dateBR()+')',order:'data.asc.nullslast,id.asc'});
  return rows.map(event).filter(Boolean);
}
module.exports = async function(req,res) {
  if(req.method !== 'GET') return res.status(405).end();
  const read = {vagas:jobs,agenda:events}[req.query.tipo];
  if(typeof read !== 'function' || !['vagas','agenda'].includes(req.query.tipo)) return res.status(400).end();
  try {
    const rows = await read();
    res.setHeader('Cache-Control','public, s-maxage=30');
    return res.status(200).json(rows);
  } catch { return res.status(503).json({erro:'Catálogo temporariamente indisponível'}); }
};
