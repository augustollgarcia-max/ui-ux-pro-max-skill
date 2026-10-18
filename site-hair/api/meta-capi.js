// API de Conversões da Meta (servidor) — par do Meta Pixel de /business/rastreio.js.
// O navegador manda o mesmo evento com o mesmo event_id; a Meta deduplica.
// Inerte (204) enquanto META_CAPI_TOKEN não existir nas variáveis do Vercel.
// Nunca registra o token, o IP nem o telefone (que já chega em hash SHA-256).
const PERMITIDOS = new Set(['PageView', 'ViewContent', 'Contact', 'Lead']);
const ORIGEM = /^https:\/\/(www\.)?hairacademiadabeleza\.com\.br\//;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return res.status(204).end();
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { return res.status(400).end(); } }
  if (!b || typeof b !== 'object') return res.status(400).end();
  const nome = String(b.event_name || '');
  const url = String(b.event_source_url || '');
  const id = String(b.event_id || '').slice(0, 64);
  if (!PERMITIDOS.has(nome) || !ORIGEM.test(url) || !id) return res.status(400).end();

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const user = { client_user_agent: String(req.headers['user-agent'] || '').slice(0, 512) };
  if (ip) user.client_ip_address = ip;
  if (typeof b.fbp === 'string' && /^fb\.\d\.\d+\.\d+$/.test(b.fbp)) user.fbp = b.fbp;
  if (typeof b.fbc === 'string' && /^fb\.\d\.\d+\.[\w-]+$/.test(b.fbc)) user.fbc = b.fbc.slice(0, 300);
  if (typeof b.ph === 'string' && /^[a-f0-9]{64}$/.test(b.ph)) user.ph = [b.ph];
  if (typeof b.external_id === 'string' && /^[a-f0-9]{64}$/.test(b.external_id)) user.external_id = [b.external_id];

  const custom = {};
  if (b.custom_data && typeof b.custom_data === 'object') {
    for (const [k, v] of Object.entries(b.custom_data).slice(0, 10)) {
      if (/^[a-z_]{1,40}$/.test(k) && typeof v === 'string') custom[k] = v.slice(0, 120);
    }
  }
  const evento = { event_name: nome, event_time: Math.floor(Date.now() / 1000), event_id: id,
    event_source_url: url.slice(0, 500), action_source: 'website', user_data: user, custom_data: custom };
  const corpo = { data: [evento], access_token: token };
  if (process.env.META_TEST_EVENT_CODE) corpo.test_event_code = process.env.META_TEST_EVENT_CODE;

  const pixel = process.env.META_PIXEL_ID || '2824321584567060';
  const versao = process.env.META_GRAPH_VERSION || 'v23.0';
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 5000);
  try {
    const r = await fetch(`https://graph.facebook.com/${versao}/${pixel}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo), signal: ctl.signal });
    if (!r.ok) console.log('meta-capi', nome, 'status', r.status);
    return res.status(r.ok ? 204 : 502).end();
  } catch (e) {
    console.log('meta-capi', nome, 'falhou', e.name);
    return res.status(502).end();
  } finally { clearTimeout(t); }
};
