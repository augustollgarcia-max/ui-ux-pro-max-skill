"""Aprender o estilo: analisa 3 a 5 vídeos de REFERENCIAS e grava ESTILO/perfil.json."""
from __future__ import annotations

import json
import re
import statistics
import subprocess
from pathlib import Path

from . import audio
from .util import PASTA_ESTILO, PASTA_REFERENCIAS, fmt_tempo, info_video, listar_videos, log, salvar_json


def cortes_de_cena(video: Path, limiar: float = 0.35) -> list[float]:
    res = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-an",
         "-vf", f"select='gt(scene,{limiar})',showinfo", "-f", "null", "-"],
        stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True,
    )
    return [float(m) for m in re.findall(r"pts_time:\s*([\d.]+)", res.stderr)]


def analisar(video: Path, transcrever_tb: bool = False) -> dict:
    info = info_video(video)
    cortes = cortes_de_cena(video)
    duracao = info["duracao"]
    marcos = [0.0] + cortes + [duracao]
    planos = [b - a for a, b in zip(marcos, marcos[1:]) if b - a > 0.05]
    silencios = audio.detectar_silencios(video, -35, 0.4) if info["tem_audio"] else []
    tempo_silencio = sum(f - i for i, f in silencios)
    dados = {
        "arquivo": video.name,
        "duracao": round(duracao, 2),
        "formato": f"{info['largura']}x{info['altura']}",
        "vertical": info["altura"] > info["largura"],
        "cortes": len(cortes),
        "plano_medio_seg": round(statistics.mean(planos), 2) if planos else round(duracao, 2),
        "silencio_pct": round(100 * tempo_silencio / duracao, 1) if duracao else 0,
        "lufs": audio.loudness_integrado(video) if info["tem_audio"] else None,
    }
    if transcrever_tb and info["tem_audio"]:
        from .transcrever import transcrever, palavras_planas
        t = transcrever(video, PASTA_ESTILO / "transcricoes" / video.stem, "pt", "small")
        palavras = palavras_planas(t)
        if palavras:
            fala = palavras[-1]["fim"] - palavras[0]["inicio"]
            dados["palavras_por_min"] = round(60 * len(palavras) / fala, 1) if fala > 0 else None
            dados["gancho_falado"] = " ".join(w["texto"] for w in palavras if w["inicio"] < 3.0)
    log(f"{video.name}: {fmt_tempo(duracao)}, {dados['cortes']} cortes, plano médio {dados['plano_medio_seg']}s, silêncio {dados['silencio_pct']}%")
    return dados


def aprender(transcrever_tb: bool = False) -> dict:
    videos = listar_videos(PASTA_REFERENCIAS)
    if not videos:
        from .util import erro
        erro("coloque 3 a 5 vídeos em REFERENCIAS/ (ou baixe com: python3 reel.py baixar <url>)")
    if len(videos) < 3:
        log(f"aviso: só {len(videos)} referência(s); com 3 a 5 o perfil fica mais confiável")
    analises = [analisar(v, transcrever_tb) for v in videos]
    salvar_json(PASTA_ESTILO / "analise-referencias.json", analises)
    plano = statistics.median(a["plano_medio_seg"] for a in analises)
    dur = statistics.median(a["duracao"] for a in analises)
    lufs = [a["lufs"] for a in analises if a.get("lufs") is not None]
    wpm = [a["palavras_por_min"] for a in analises if a.get("palavras_por_min")]
    perfil = {
        "_aprendido_de": [a["arquivo"] for a in analises],
        "duracao_alvo_seg": round(dur, 1),
        "zoom_dinamico": plano < 6.0,
        "zoom_a_cada_seg": round(min(max(plano, 1.5), 6.0), 1),
        "silencio_min_seg": 0.4 if plano < 2.5 else 0.55,
        # volume das referências só informativo: Instagram/TikTok normalizam em ~-14 LUFS, então o alvo fica fixo
        "lufs_medido_referencias": round(statistics.median(lufs), 1) if lufs else None,
        "enquadro": "crop",
    }
    if wpm:
        media = statistics.median(wpm)
        perfil["legenda_palavras_por_linha"] = 2 if media > 170 else 3 if media > 120 else 4
        perfil["ritmo_fala_palavras_min"] = round(media, 1)
    salvar_json(PASTA_ESTILO / "perfil.json", perfil)
    log(f"perfil aprendido salvo em ESTILO/perfil.json: {json.dumps(perfil, ensure_ascii=False)}")
    return perfil
