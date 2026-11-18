// Histórico das janelas públicas. O estado guarda somente identificadores
// temporários; dados de conversa ou de formulário ficam com seus controles.
const registros = new Map();
let pilha = [];
let concluindo = false;
let depois;
let numero = 0;
const documento = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function apresentar(proxima) {
  let comum = 0;
  while (comum < pilha.length && pilha[comum] === proxima[comum]) comum++;
  for (let i = pilha.length - 1; i >= comum; i--) pilha[i].ocultar();
  for (let i = comum; i < proxima.length; i++) proxima[i].mostrar();
  pilha = proxima;
}

export function abrir(nome, mostrar, ocultar) {
  if (pilha.some(p => p.nome === nome) || concluindo) return;
  for (const [id, registro] of registros) if (!pilha.includes(registro)) registros.delete(id);
  const item = { id: ++numero, nome, mostrar, ocultar, url: location.href };
  registros.set(item.id, item);
  const proxima = [...pilha, item];
  history.pushState({ ...history.state, janelasHair: { documento, ids: proxima.map(p => p.id) } }, "");
  apresentar(proxima);
}

export function fechar(nome, aoFechar) {
  if (!pilha.some(p => p.nome === nome)) return false;
  if (!concluindo) {
    concluindo = true;
    depois = aoFechar;
    history.back();
  }
  return true;
}

addEventListener("popstate", evento => {
  const estado = evento.state?.janelasHair;
  const proxima = estado?.documento === documento
    ? estado.ids.map(id => registros.get(id)).filter(p => p && p.url === location.href)
    : [];
  if (!pilha.length && !proxima.length) return;
  // O seletor Barber/Beauty também usa popstate. Só a travessia entre
  // janelas do mesmo endereço pertence a este módulo.
  if ((pilha.at(-1) || proxima.at(-1)).url === location.href) evento.stopImmediatePropagation();
  apresentar(proxima);
  const finalizar = depois;
  depois = null;
  concluindo = false;
  finalizar?.();
}, true);

// A tela de escolha troca a página inteira sem recarregar e guarda o próprio
// popstate para recarregar ao voltar. As janelas abertas antes da troca deixam
// de existir: sem esquecê-las aqui, o voltar seria tratado como "fechar janela"
// e a pessoa ficaria na página nova com o endereço da anterior.
document.addEventListener("hair:pagechange", () => {
  for (let i = pilha.length - 1; i >= 0; i--) { try { pilha[i].ocultar(); } catch (e) {} }
  pilha = [];
  registros.clear();
  depois = null;
  concluindo = false;
});

export function carregarEstilo(raiz, caminho) {
  if (raiz.querySelector('link[rel="stylesheet"]')) return;
  const folha = document.createElement("link");
  folha.rel = "stylesheet";
  folha.href = caminho;
  folha.addEventListener("error", () => folha.remove(), {once:true});
  raiz.append(folha);
}

export function sairDeAncora(entrada, saida) {
  if (!entrada || !saida) return;
  saida.addEventListener("click", e => {
    if (location.hash !== entrada.hash || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    history.back();
  });
}
