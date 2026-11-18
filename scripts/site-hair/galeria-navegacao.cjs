const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const motores = ['chromium', 'webkit'];
const dispositivos = { chromium: 'Chromium no Android emulado', webkit: 'WebKit no iPhone 13 emulado' };
const lados = ['antes', 'depois'];

function registrar({ app, raiz, pasta, motor, versao, previstas, fotosPrevistas, resultados, capturas, erro }) {
  let commit = null;
  let alteracoesLocais = false;
  try {
    const git = args => execFileSync('git', ['-C', raiz, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (fs.realpathSync(raiz) === fs.realpathSync(git(['rev-parse', '--show-toplevel']))) {
      alteracoesLocais = Boolean(git(['status', '--porcelain', '--', 'public', 'site-hair', 'scripts', 'tests']));
      if (!alteracoesLocais) commit = git(['rev-parse', 'HEAD']);
    }
  } catch { /* Uma cópia sem .git fornece medições, mas não atesta o commit. */ }
  const falhas = resultados.filter(item => !item.ok).length;
  const completo = !erro && resultados.length === previstas && capturas.length === fotosPrevistas;
  const relatorio = {
    app, motor, versao, commit, alteracoesLocais, completo, previstas, fotosPrevistas,
    executadas: resultados.length, aprovadas: resultados.length - falhas, falhas,
    erro: erro ? String(erro.message || erro).split('\n')[0] : null, resultados, capturas
  };
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(path.join(pasta, 'resultado.json'), JSON.stringify(relatorio, null, 2) + '\n');
  return relatorio;
}

const entidades = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = valor => String(valor ?? '').replace(/[&<>"']/g, letra => entidades[letra]);
const ler = (pasta, lado, motor) => {
  const arquivo = path.join(pasta, lado, motor, 'resultado.json');
  return fs.existsSync(arquivo) ? JSON.parse(fs.readFileSync(arquivo, 'utf8')) : null;
};

function resumo(dados, lado, motor) {
  if (!dados) return '<p>As medições desta versão ainda não foram geradas.</p>';
  const arquivo = lado + '/' + motor + '/resultado.json';
  return '<p>' + (dados.completo ? 'Execução completa.' : 'Execução incompleta.') +
    ' ' + dados.aprovadas + ' aprovadas em ' + dados.executadas + ' verificações executadas (' + dados.previstas + ' previstas). ' +
    dados.capturas.length + ' de ' + dados.fotosPrevistas + ' capturas registradas.</p>' +
    (dados.erro ? '<p class="alerta">' + esc(dados.erro) + '</p>' : '') +
    '<p>Commit <code>' + esc(dados.commit || (dados.alteracoesLocais ? 'cópia com alterações locais' : 'indisponível')) + '</code></p><a href="' + arquivo + '">Ver todas as medições</a>';
}

function figura(lado, motor, item) {
  const titulo = lado === 'antes' ? 'Antes' : 'Depois';
  if (!item) return '<figure><figcaption>' + titulo + '</figcaption><p>Captura pendente.</p></figure>';
  const url = lado + '/' + motor + '/' + encodeURIComponent(item.arquivo);
  const alt = esc(titulo + ' · ' + item.grupo + ' · ' + item.tela);
  return '<figure><figcaption>' + titulo + '</figcaption><a href="' + url +
    '"><img loading="lazy" decoding="async" src="' + url + '" alt="' + alt +
    '"></a></figure>';
}

function mudancas(antes, depois) {
  if (!antes || !depois) return '';
  const chave = item => [item.label ?? item.w, item.caso ?? item.test].join(' · ');
  const antigas = new Map(antes.resultados.map(item => [chave(item), item.ok]));
  const linhas = [];
  let corrigidas = 0;
  let regressoes = 0;
  for (const item of depois.resultados) {
    const nome = chave(item);
    if (!antigas.has(nome) || antigas.get(nome) === item.ok) continue;
    if (item.ok) corrigidas++; else regressoes++;
    linhas.push('<tr><td>' + esc(nome) + '</td><td>' + (item.ok ? 'Falhou' : 'Passou') +
      '</td><td>' + (item.ok ? 'Passou' : 'Falhou') + '</td></tr>');
  }
  const contagem = corrigidas + (corrigidas === 1 ? ' correção, ' : ' correções, ') +
    regressoes + (regressoes === 1 ? ' regressão' : ' regressões');
  return '<details><summary>Mudanças nas verificações (' + contagem + ')</summary>' + (linhas.length ?
      '<table><thead><tr><th scope="col">Verificação</th><th scope="col">Antes</th><th scope="col">Depois</th></tr></thead><tbody>' +
      linhas.join('') + '</tbody></table>' : '<p>Nenhum resultado mudou entre as verificações executadas nos dois lados.</p>') +
    '</details>';
}

function bloco(pasta, motor) {
  const antes = ler(pasta, 'antes', motor);
  const depois = ler(pasta, 'depois', motor);
  const pares = new Map();
  for (const [lado, dados] of [['antes', antes], ['depois', depois]]) {
    for (const foto of dados?.capturas || []) {
      if (!foto.arquivo.endsWith('.png') || path.basename(foto.arquivo) !== foto.arquivo) continue;
      if (!fs.existsSync(path.join(pasta, lado, motor, foto.arquivo))) continue;
      const par = pares.get(foto.arquivo) || {};
      par[lado] = foto;
      pares.set(foto.arquivo, par);
    }
  }
  const grupos = new Map();
  for (const par of pares.values()) {
    const referencia = par.depois || par.antes;
    if (!grupos.has(referencia.grupo)) grupos.set(referencia.grupo, []);
    grupos.get(referencia.grupo).push('<details><summary>' + esc(referencia.tela) + '</summary><div class="par">' +
      lados.map(lado => figura(lado, motor, par[lado])).join('') + '</div></details>');
  }
  const totalPares = [...pares.values()].filter(p => p.antes && p.depois).length;
  return '<section><h2>' + esc(dispositivos[motor]) + '</h2><div class="par">' +
    '<article><h3>Antes</h3>' + resumo(antes, 'antes', motor) + '</article>' +
    '<article><h3>Depois</h3>' + resumo(depois, 'depois', motor) + '</article></div>' +
    mudancas(antes, depois) + '<p>' + totalPares + (totalPares === 1 ? ' par' : ' pares') + ' com as duas imagens disponíveis.</p>' +
    [...grupos].map(([grupo, linhas]) => '<h3>' + esc(grupo) + '</h3>' + linhas.join('')).join('') +
    '</section>';
}

function gerar(pasta, escolhidos = motores) {
  fs.mkdirSync(pasta, { recursive: true });
  for (const motor of escolhidos) if (!motores.includes(motor)) throw Error('Motor inválido. Use chromium ou webkit.');
  const informes = escolhidos.flatMap(m => lados.map(l => ler(pasta, l, m))).filter(Boolean);
  const app = informes[0]?.app || 'Navegação';
  const pagina = '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(app) + ' · Antes e depois</title><style>' +
    '*{box-sizing:border-box}body{max-width:900px;margin:auto;padding:16px;color:#202722;background:#fafbf9;font:16px/1.5 system-ui,sans-serif}h1{line-height:1.2}h2,h3{margin-top:1.5em}code{overflow-wrap:anywhere}a{color:#145831}a:focus-visible,summary:focus-visible{outline:3px solid #145831;outline-offset:2px}.par{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}article,figure{margin:0;min-width:0}table{border-collapse:collapse;width:100%}th,td{padding:6px;text-align:left;border-bottom:1px solid #c3ccc3}figure img{display:block;width:100%;height:auto;border:1px solid #c3ccc3;border-radius:6px}figcaption{font-weight:700;margin-block:4px}details{border-top:1px solid #c3ccc3}summary{cursor:pointer;min-height:44px;padding:10px 0}.alerta{color:#8d2c0e}details[open]{padding-bottom:14px}@media(max-width:560px){body{padding:12px}.par{grid-template-columns:1fr}}' +
    '</style><main><h1>' + esc(app) + ' · Antes e depois</h1><p>Abra uma tela para comparar as capturas. Toque na imagem para ampliar.</p>' +
    escolhidos.map(motor => bloco(pasta, motor)).join('') + '</main></html>';
  fs.writeFileSync(path.join(pasta, 'index.html'), pagina);
}

if (require.main === module) {
  const [pasta, motor] = process.argv.slice(2);
  if (!pasta) throw Error('Informe a pasta que contém antes/ e depois/.');
  gerar(path.resolve(pasta), motor ? [motor] : motores);
}
module.exports = { registrar, gerar };
