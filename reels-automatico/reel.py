#!/usr/bin/env python3
"""reel.py — máquina de Reels automáticos (Claude Code + FFmpeg + Whisper + Remotion).

Uso rápido:
  python3 reel.py montar ARQUIVO-BRUTO/video.mp4 --gancho "Pare de perder cliente no WhatsApp"
  python3 reel.py aprender                      # lê REFERENCIAS/ e grava ESTILO/perfil.json
  python3 reel.py baixar <url>                  # referência via yt-dlp
  python3 reel.py ajustar video --gancho "..."  # ou --remover 10-12.5 / --inserir IMAGENS/x.png@4:2
  python3 reel.py renderizar video              # re-renderiza depois de editar edicao.json/transcricao.json
  python3 reel.py status                        # o que tem em cada pasta
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from reelkit import util  # noqa: E402


def _pasta(nome: str) -> Path:
    p = Path(nome)
    if p.is_dir() and (p / "edicao.json").exists():
        return p
    p = util.PASTA_SAIDA / Path(nome).stem
    if not (p / "edicao.json").exists():
        util.erro(f"não achei SAIDA/{Path(nome).stem}/edicao.json — rode 'montar' primeiro")
    return p


def cmd_montar(a):
    from reelkit.montar import montar
    final = montar(Path(a.video), a.gancho, Path(a.perfil) if a.perfil else None, a.inserir or [], a.sem_legenda, a.motor)
    print(f"\n✅ PRONTO: {final}\n   relatório: {final.parent / 'relatorio.md'}")


def cmd_renderizar(a):
    from reelkit.montar import renderizar
    pasta = _pasta(a.nome)
    edicao = json.loads((pasta / "edicao.json").read_text(encoding="utf-8"))
    final = renderizar(edicao, pasta)
    print(f"\n✅ PRONTO: {final}")


def cmd_ajustar(a):
    from reelkit.montar import remover_trecho_final, renderizar
    pasta = _pasta(a.nome)
    edicao = json.loads((pasta / "edicao.json").read_text(encoding="utf-8"))
    if a.gancho is not None:
        edicao["gancho"] = a.gancho or None
    for r in a.remover or []:
        ini, _, fim = r.partition("-")
        remover_trecho_final(edicao, float(ini), float(fim))
        util.log(f"trecho {ini}-{fim}s removido do plano")
    for item in a.inserir or []:
        caminho, _, resto = item.partition("@")
        ini, _, dur = resto.partition(":")
        p = Path(caminho) if Path(caminho).exists() else util.PASTA_IMAGENS / Path(caminho).name
        if not p.exists():
            util.erro(f"imagem não encontrada: {caminho}")
        edicao.setdefault("imagens", []).append({"arquivo": str(p.resolve()), "inicio": float(ini or 0), "duracao": float(dur or 2.5)})
    if a.sem_imagens:
        edicao["imagens"] = []
    if a.motor:
        edicao["motor"] = a.motor
    for par in a.estilo or []:
        chave, _, valor = par.partition("=")
        try:
            edicao["perfil"][chave] = json.loads(valor)
        except json.JSONDecodeError:
            edicao["perfil"][chave] = valor
    util.salvar_json(pasta / "edicao.json", edicao)
    final = renderizar(edicao, pasta)
    print(f"\n✅ PRONTO: {final}")


def cmd_aprender(a):
    from reelkit.analisar import aprender
    aprender(a.transcrever)


def cmd_analisar(a):
    from reelkit.analisar import analisar
    print(json.dumps(analisar(Path(a.video), a.transcrever), ensure_ascii=False, indent=2))


def cmd_transcrever(a):
    from reelkit.transcrever import transcrever
    perfil = util.carregar_perfil()
    v = Path(a.video)
    transcrever(v, util.pasta_saida_para(v), perfil["idioma"], a.modelo or perfil["modelo_whisper"])


def cmd_baixar(a):
    from reelkit.baixar import baixar
    for url in a.url:
        baixar(url)


def cmd_status(_a):
    for nome, pasta in [("ARQUIVO-BRUTO", util.PASTA_BRUTO), ("REFERENCIAS", util.PASTA_REFERENCIAS), ("IMAGENS", util.PASTA_IMAGENS)]:
        itens = [p.name for p in sorted(pasta.iterdir()) if not p.name.startswith(".")]
        print(f"{nome}/ ({len(itens)}): {', '.join(itens) or '— vazio'}")
    print(f"ESTILO/perfil.json: {'aprendido' if util.PERFIL_APRENDIDO.exists() else 'ainda não (usando perfil-padrao.json)'}")
    saidas = [p for p in sorted(util.PASTA_SAIDA.iterdir()) if p.is_dir()] if util.PASTA_SAIDA.exists() else []
    for p in saidas:
        final = p / "reel-final.mp4"
        print(f"SAIDA/{p.name}/: {'reel-final.mp4 pronto' if final.exists() else 'sem render'}")


def main(argv=None):
    ap = argparse.ArgumentParser(prog="reel.py", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    m = sub.add_parser("montar", help="bruto → reel pronto (cortes, 9:16, legendas, gancho, imagens)")
    m.add_argument("video")
    m.add_argument("--gancho", help="texto do gancho nos primeiros segundos")
    m.add_argument("--perfil", help="JSON de estilo extra (sobrepõe ESTILO/)")
    m.add_argument("--inserir", action="append", metavar="IMG@INICIO:DUR", help="ex.: IMAGENS/foto.png@4:2.5 (tempos do vídeo final)")
    m.add_argument("--sem-legenda", action="store_true")
    m.add_argument("--motor", choices=["ffmpeg", "remotion"], default="ffmpeg", help="ffmpeg = rápido (libass); remotion = animações React")
    m.set_defaults(fn=cmd_montar)

    r = sub.add_parser("renderizar", help="re-renderiza SAIDA/<nome>/ a partir de edicao.json")
    r.add_argument("nome")
    r.set_defaults(fn=cmd_renderizar)

    j = sub.add_parser("ajustar", help="ajustes por comando e re-render")
    j.add_argument("nome")
    j.add_argument("--gancho")
    j.add_argument("--remover", action="append", metavar="INI-FIM", help="segundos do vídeo final, ex. 12.5-15")
    j.add_argument("--inserir", action="append", metavar="IMG@INICIO:DUR")
    j.add_argument("--sem-imagens", action="store_true")
    j.add_argument("--estilo", action="append", metavar="CHAVE=VALOR", help='ex. legenda_cor_destaque="#00FF88" ou zoom_dinamico=false')
    j.add_argument("--motor", choices=["ffmpeg", "remotion"])
    j.set_defaults(fn=cmd_ajustar)

    ap_ = sub.add_parser("aprender", help="analisa REFERENCIAS/ e grava ESTILO/perfil.json")
    ap_.add_argument("--transcrever", action="store_true", help="também mede ritmo de fala (mais lento)")
    ap_.set_defaults(fn=cmd_aprender)

    an = sub.add_parser("analisar", help="analisa um vídeo e imprime JSON")
    an.add_argument("video")
    an.add_argument("--transcrever", action="store_true")
    an.set_defaults(fn=cmd_analisar)

    t = sub.add_parser("transcrever", help="só transcrição (JSON + SRT + TXT)")
    t.add_argument("video")
    t.add_argument("--modelo")
    t.set_defaults(fn=cmd_transcrever)

    b = sub.add_parser("baixar", help="baixa referência(s) com yt-dlp para REFERENCIAS/")
    b.add_argument("url", nargs="+")
    b.set_defaults(fn=cmd_baixar)

    sub.add_parser("status", help="o que há em cada pasta").set_defaults(fn=cmd_status)

    a = ap.parse_args(argv)
    a.fn(a)


if __name__ == "__main__":
    main()
