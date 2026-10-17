#!/usr/bin/env python3
"""Contrato funcional do site público (site-hair/inicio.html = a landing completa; a raiz index.html é a
página de seleção gerada pelo repositório hair-business-, conferida no passo 6).

Garante que nenhuma mudança visual apague o que faz o site funcionar:
links e botões, IDs usados pelo script, WhatsApp oficial, conversões do
Google Ads, cursos, âncoras e arquivos locais.

Uso:
  python3 scripts/site-hair/checar-contrato.py            # confere (CI)
  python3 scripts/site-hair/checar-contrato.py --gerar    # regrava o contrato
O --gerar só deve ser usado quando o dono aprovar remover/trocar algo:
o diff do contrato.json no PR mostra exatamente o que deixou de existir.
Sem dependências além do Python 3 (o node é opcional, para checar sintaxe JS).
"""
import json, os, re, shutil, subprocess, sys, tempfile
from collections import Counter
from html.parser import HTMLParser

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, "..", ".."))
SITE = os.environ.get("SITE_HAIR_DIR") or os.path.join(RAIZ, "site-hair")
PAGINA = os.path.join(SITE, "inicio.html")
RAIZ_SELECAO = os.path.join(SITE, "index.html")
CONTRATO = os.path.join(AQUI, "contrato.json")

WHATSAPP = "5516991687977"
ADS_ID = "AW-799342935"

class Leitor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.clicaveis, self.ids, self.recursos, self.scripts = [], [], [], []
        self._em_script = False
        self._script_inline = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.append(a["id"])
        if tag in ("a", "button"):
            chave = {k: (v or "") for k, v in a.items()
                     if k in ("href", "target") or k.startswith("data-")}
            self.clicaveis.append(json.dumps(chave, sort_keys=True, ensure_ascii=False))
        for k in ("src", "href", "srcset", "poster"):
            if k in a and a[k]:
                self.recursos.append(a[k])
        if tag == "script":
            self._em_script = True
            self._script_inline = "src" not in a and a.get("type", "") != "application/ld+json"
            self._buf = []
    def handle_data(self, data):
        if self._em_script and self._script_inline:
            self._buf.append(data)
    def handle_endtag(self, tag):
        if tag == "script" and self._em_script:
            if self._script_inline:
                self.scripts.append("".join(self._buf))
            self._em_script = False

def ler():
    html = open(PAGINA, encoding="utf-8").read()
    p = Leitor(); p.feed(html)
    return html, p

def extrair(html, p):
    return {
        "clicaveis": dict(sorted(Counter(p.clicaveis).items())),
        "ids": sorted(set(p.ids)),
        "cursos": sorted(set(re.findall(r'data-course="([^"]+)"', html))),
        "conversoes_ads": sorted(set(re.findall(ADS_ID + r"/[A-Za-z0-9_-]+", html))),
    }

def locais(p):
    saida = set()
    for r in p.recursos:
        for parte in r.split(","):
            u = parte.strip().split(" ")[0]
            if not u or u.startswith(("http:", "https:", "#", "data:", "mailto:", "tel:")):
                continue
            saida.add(u.split("?")[0].split("#")[0])
    return sorted(saida)

def main():
    html, p = ler()
    atual = extrair(html, p)
    if "--gerar" in sys.argv:
        json.dump(atual, open(CONTRATO, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("contrato.json regravado:", len(atual["clicaveis"]), "tipos de link,", len(atual["ids"]), "ids")
        return 0

    contrato = json.load(open(CONTRATO, encoding="utf-8"))
    erros = []

    # 1. nada do contrato pode sumir (pode ter mais, nunca menos)
    for k, n in contrato["clicaveis"].items():
        if atual["clicaveis"].get(k, 0) < n:
            erros.append(f"link/botão sumiu ({n} → {atual['clicaveis'].get(k, 0)}): {k}")
    for i in contrato["ids"]:
        if i not in atual["ids"]:
            erros.append(f"id sumiu: #{i}")
    for c in contrato["cursos"]:
        if c not in atual["cursos"]:
            erros.append(f"curso sumiu: data-course={c}")
    for c in contrato["conversoes_ads"]:
        if c not in atual["conversoes_ads"]:
            erros.append(f"conversão do Google Ads sumiu: {c}")

    # 2. WhatsApp oficial e tag do Ads
    if f'var WA = "{WHATSAPP}"' not in html:
        erros.append("WhatsApp oficial (var WA) não é mais " + WHATSAPP)
    if f"gtag/js?id={ADS_ID}" not in html:
        erros.append("tag do Google Ads " + ADS_ID + " não carrega mais")

    # 3. âncoras apontam para algo que existe
    for alvo in sorted(set(re.findall(r'href="#([^"]+)"', html))):
        if alvo not in atual["ids"]:
            erros.append(f"âncora sem destino: #{alvo}")

    # 4. arquivos locais existem (imagem quebrada = falha)
    # vercel.json usa cleanUrls: "/modelo" é servido por "modelo.html"
    for u in locais(p):
        caminho = os.path.join(SITE, u.lstrip("/"))
        if not (os.path.exists(caminho) or os.path.exists(caminho + ".html")):
            erros.append(f"arquivo não existe: {u}")

    # 5. sintaxe dos scripts inline (quando há node)
    node = shutil.which("node")
    if node:
        for n, js in enumerate(p.scripts, 1):
            with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
                f.write(js); nome = f.name
            r = subprocess.run([node, "--check", nome], capture_output=True, text=True)
            os.unlink(nome)
            if r.returncode:
                msg = next((l for l in r.stderr.splitlines() if "Error" in l), r.stderr.strip()[:200])
                erros.append(f"script inline nº {n} com erro de sintaxe: {msg}")
    else:
        print("aviso: node ausente, sintaxe JS não conferida")

    # 6. raiz do site = página de seleção (17/10/2026, decisão do dono): precisa levar a /business, /beauty e
    #    /business/assessoria, carregar a tag do Ads e os destinos precisam existir (cleanUrls: /beauty = beauty.html).
    raiz = open(RAIZ_SELECAO, encoding="utf-8").read()
    for alvo in ('href="/business"', 'href="/beauty"', 'href="/business/assessoria"', f"gtag/js?id={ADS_ID}"):
        if alvo not in raiz:
            erros.append(f"raiz (index.html, seleção) sem {alvo}")
    for u in ("business/index.html", "beauty.html", "business/assessoria.html", "inicio.html"):
        if not os.path.exists(os.path.join(SITE, u)):
            erros.append(f"destino da raiz não existe: {u}")

    if erros:
        print("CONTRATO QUEBRADO —", len(erros), "problema(s):")
        for e in erros:
            print("  ✗", e)
        print("\nSe a remoção foi aprovada pelo dono, rode com --gerar e explique no PR.")
        return 1
    extra = sum(atual["clicaveis"].values()) - sum(contrato["clicaveis"].values())
    print(f"OK: contrato respeitado ({sum(contrato['clicaveis'].values())} links/botões, "
          f"{len(contrato['ids'])} ids, {len(contrato['cursos'])} cursos, "
          f"{len(contrato['conversoes_ads'])} conversões Ads, {len(p.scripts)} scripts válidos"
          + (f", +{extra} novos" if extra > 0 else "") + ").")
    return 0

if __name__ == "__main__":
    sys.exit(main())
