"""Pipeline completo: bruto → cortes → 9:16 → transcrição → legendas + gancho + imagens → reel final.

Tudo que a montagem decidiu fica em SAIDA/<nome>/edicao.json. Para ajustar por comando
(trocar gancho, remover trecho, inserir imagem, mudar estilo) edita-se esse JSON e roda `reel.py renderizar`.
"""
from __future__ import annotations

import json
import shutil
import time
from pathlib import Path

from . import audio, legendas, transcrever, video
from .util import PASTA_IMAGENS, carregar_perfil, erro, exigir_ferramenta, fmt_tempo, info_video, log, pasta_saida_para, rodar, salvar_json


def planejar(bruto: Path, perfil: dict, gancho: str | None, inserir: list[str]) -> dict:
    info = info_video(bruto)
    if not info["tem_audio"]:
        erro(f"{bruto.name} não tem áudio; a máquina precisa da narração para cortar e legendar")
    silencios = audio.detectar_silencios(bruto, float(perfil["silencio_db"]), float(perfil["silencio_min_seg"]))
    trechos = audio.trechos_com_fala(info["duracao"], silencios, float(perfil["folga_corte_seg"]))
    blocos = video.dividir_em_blocos(trechos, float(perfil["zoom_a_cada_seg"]) if perfil.get("zoom_dinamico") else 0)
    removido = info["duracao"] - sum(b["fim"] - b["inicio"] for b in blocos)
    imagens = []
    for item in inserir:
        caminho, _, resto = item.partition("@")
        ini, _, dur = resto.partition(":")
        p = Path(caminho)
        if not p.is_absolute() and not p.exists():
            p = PASTA_IMAGENS / p.name
        if not p.exists():
            erro(f"imagem não encontrada: {caminho}")
        imagens.append({"arquivo": str(p), "inicio": float(ini or 0), "duracao": float(dur or 2.5)})
    return {
        "bruto": str(bruto.resolve()),
        "gancho": gancho,
        "perfil": perfil,
        "blocos": blocos,
        "imagens": imagens,
        "silencios_removidos_seg": round(removido, 2),
        "info_bruto": info,
        "criado_em": time.strftime("%Y-%m-%d %H:%M:%S"),
    }


def _filtro_imagens(imagens: list[dict], W: int, H: int) -> tuple[list[str], str]:
    """Entradas extras + trecho de filter_complex para sobrepor imagens (B-roll) com fade."""
    entradas, cadeia, atual = [], [], "[vl]"
    for i, im in enumerate(imagens, 1):
        entradas += ["-loop", "1", "-t", str(im["duracao"]), "-i", im["arquivo"]]
        ini, fim = im["inicio"], im["inicio"] + im["duracao"]
        cadeia.append(
            f"[{i}:v]scale={int(W*0.92)}:-2,format=rgba,fade=t=in:st=0:d=0.25:alpha=1,"
            f"fade=t=out:st={max(im['duracao']-0.25,0)}:d=0.25:alpha=1,setpts=PTS-STARTPTS+{ini}/TB[im{i}];"
            f"{atual}[im{i}]overlay=(W-w)/2:(H-h)/2-{int(H*0.12)}:enable='between(t,{ini},{fim})':eof_action=pass[vo{i}]"
        )
        atual = f"[vo{i}]"
    return entradas, (";".join(cadeia) + ";" if cadeia else ""), atual


def renderizar(edicao: dict, pasta: Path, pular_transcricao: bool = False) -> Path:
    """Executa (ou re-executa) a edição descrita em edicao.json. Reaproveita o que não mudou."""
    exigir_ferramenta("ffmpeg")
    perfil, bruto = edicao["perfil"], Path(edicao["bruto"])
    W, H = int(perfil["largura"]), int(perfil["altura"])
    assinatura = video.assinatura_cortes(edicao["blocos"], perfil)
    cortado = pasta / "01-cortado.mp4"
    marca = pasta / ".assinatura-cortes"
    if not (cortado.exists() and marca.exists() and marca.read_text() == assinatura):
        video.cortar_e_enquadrar(bruto, edicao["blocos"], perfil, edicao["info_bruto"], cortado)
        marca.write_text(assinatura)
        (pasta / "transcricao.json").unlink(missing_ok=True)  # cortes mudaram → tempos mudaram
    else:
        log("cortes iguais aos da última vez: reaproveitando 01-cortado.mp4")
    duracao = info_video(cortado)["duracao"]
    transcricao = None
    if not pular_transcricao:
        tj = pasta / "transcricao.json"
        if tj.exists():
            log("reaproveitando transcrição existente (edite transcricao.json para corrigir palavras)")
            transcricao = json.loads(tj.read_text(encoding="utf-8"))
        else:
            transcricao = transcrever.transcrever(cortado, pasta, perfil["idioma"], perfil["modelo_whisper"])
    edicao["duracao_cortado"] = round(duracao, 3)
    final = pasta / "reel-final.mp4"
    if edicao.get("motor") == "remotion":
        from .remotion import renderizar_remotion
        renderizar_remotion(edicao, pasta, cortado, transcricao, final)
        edicao["duracao_final"] = round(info_video(final)["duracao"], 2)
        edicao["renderizado_em"] = time.strftime("%Y-%m-%d %H:%M:%S")
        salvar_json(pasta / "edicao.json", edicao)
        _relatorio(edicao, transcricao, pasta)
        return final
    ass = legendas.gerar_ass(transcricao, perfil, edicao.get("gancho"), pasta / "02-legendas.ass", duracao)
    entradas, cadeia_im, ultimo = _filtro_imagens(edicao.get("imagens", []), W, H)
    ass_escapado = str(ass).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
    filtro = f"[0:v]ass='{ass_escapado}'[vl];{cadeia_im}{ultimo}null[vout]"
    log("gravando legendas, gancho e imagens no vídeo final (motor ffmpeg/libass)")
    rodar([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(cortado), *entradas,
        "-filter_complex", filtro, "-map", "[vout]", "-map", "0:a",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "copy", "-movflags", "+faststart", str(final),
    ])
    edicao["duracao_final"] = round(info_video(final)["duracao"], 2)
    edicao["renderizado_em"] = time.strftime("%Y-%m-%d %H:%M:%S")
    salvar_json(pasta / "edicao.json", edicao)
    _relatorio(edicao, transcricao, pasta)
    return final


def _relatorio(edicao: dict, transcricao: dict | None, pasta: Path) -> None:
    p = edicao["perfil"]
    linhas = [
        f"# Reel: {Path(edicao['bruto']).name}",
        "",
        f"- Bruto: {fmt_tempo(edicao['info_bruto']['duracao'])} ({edicao['info_bruto']['largura']}x{edicao['info_bruto']['altura']})",
        f"- Final: {fmt_tempo(edicao.get('duracao_final', 0))} em {p['largura']}x{p['altura']} ({p['formato']})",
        f"- Silêncio removido: {edicao['silencios_removidos_seg']}s em {len(edicao['blocos'])} blocos (zoom dinâmico: {'sim' if p.get('zoom_dinamico') else 'não'})",
        f"- Gancho: {edicao.get('gancho') or '(nenhum — passe --gancho \"texto\")'}",
        f"- Imagens inseridas: {len(edicao.get('imagens', []))}",
        f"- Legendas: {p['legenda_palavras_por_linha']} palavras por linha, destaque {p['legenda_cor_destaque']}, fonte {p['legenda_fonte']}",
        f"- Áudio: normalizado para {p['lufs_alvo']} LUFS",
        f"- Motor de legendas/animação: {edicao.get('motor', 'ffmpeg')}",
        "",
        "## Como ajustar por comando",
        "- Trocar gancho: `python3 reel.py ajustar <nome> --gancho \"novo texto\"`",
        "- Remover trecho: `python3 reel.py ajustar <nome> --remover 12.5-15.0` (tempos do vídeo FINAL)",
        "- Inserir imagem: `python3 reel.py ajustar <nome> --inserir IMAGENS/foto.png@4:2.5`",
        "- Corrigir palavra da legenda: edite `transcricao.json` e rode `python3 reel.py renderizar <nome>`",
        "",
    ]
    if transcricao:
        linhas += ["## Transcrição", "", " ".join(s["texto"] for s in transcricao["segmentos"]), ""]
    (pasta / "relatorio.md").write_text("\n".join(linhas), encoding="utf-8")


def montar(bruto: Path, gancho: str | None, perfil_extra: Path | None, inserir: list[str], sem_legenda: bool = False, motor: str = "ffmpeg") -> Path:
    if not bruto.exists():
        erro(f"arquivo não encontrado: {bruto}")
    perfil = carregar_perfil(perfil_extra)
    pasta = pasta_saida_para(bruto)
    edicao = planejar(bruto, perfil, gancho, inserir)
    edicao["motor"] = motor
    salvar_json(pasta / "edicao.json", edicao)
    log(f"plano salvo em {pasta / 'edicao.json'}: {len(edicao['blocos'])} blocos, {edicao['silencios_removidos_seg']}s de silêncio fora")
    return renderizar(edicao, pasta, pular_transcricao=sem_legenda)


def remover_trecho_final(edicao: dict, ini: float, fim: float) -> None:
    """Remove um intervalo medido no vídeo FINAL, convertendo para os tempos do bruto."""
    novos, cursor = [], 0.0
    for b in edicao["blocos"]:
        dur = b["fim"] - b["inicio"]
        a, c = cursor, cursor + dur  # posição deste bloco no final
        corte_a, corte_c = max(a, ini), min(c, fim)
        if corte_a >= corte_c:  # sem interseção
            novos.append(b)
        else:
            if corte_a > a:
                novos.append({**b, "fim": round(b["inicio"] + (corte_a - a), 3)})
            if corte_c < c:
                novos.append({**b, "inicio": round(b["inicio"] + (corte_c - a), 3)})
        cursor = c
    edicao["blocos"] = [b for b in novos if b["fim"] - b["inicio"] >= 0.2]
