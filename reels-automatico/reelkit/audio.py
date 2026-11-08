"""Análise de áudio com FFmpeg: silêncios e loudness."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

from .util import exigir_ferramenta


def detectar_silencios(video: Path, limiar_db: float, min_seg: float) -> list[tuple[float, float]]:
    """Retorna [(inicio, fim)] dos silêncios, em segundos."""
    exigir_ferramenta("ffmpeg")
    res = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-vn",
         "-af", f"silencedetect=noise={limiar_db}dB:d={min_seg}", "-f", "null", "-"],
        stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True,
    )
    silencios, inicio = [], None
    for linha in res.stderr.splitlines():
        m = re.search(r"silence_start:\s*([\d.]+)", linha)
        if m:
            inicio = float(m.group(1))
            continue
        m = re.search(r"silence_end:\s*([\d.]+)", linha)
        if m and inicio is not None:
            silencios.append((inicio, float(m.group(1))))
            inicio = None
    return silencios


def loudness_integrado(video: Path) -> float | None:
    """LUFS integrado (EBU R128). None se não tiver áudio."""
    res = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"],
        stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True,
    )
    m = re.findall(r"I:\s*(-?[\d.]+) LUFS", res.stderr)
    return float(m[-1]) if m else None


def trechos_com_fala(duracao: float, silencios: list[tuple[float, float]], folga: float, min_trecho: float = 0.25) -> list[tuple[float, float]]:
    """Inverte os silêncios: devolve os trechos a manter, já com folga nas bordas."""
    trechos, cursor = [], 0.0
    for ini, fim in silencios:
        a, b = cursor, ini + folga
        if b - a >= min_trecho:
            trechos.append((max(0.0, a), min(duracao, b)))
        cursor = max(cursor, fim - folga)
    if duracao - cursor >= min_trecho:
        trechos.append((cursor, duracao))
    # funde sobreposições criadas pela folga
    fundidos: list[list[float]] = []
    for a, b in trechos:
        if fundidos and a <= fundidos[-1][1]:
            fundidos[-1][1] = max(fundidos[-1][1], b)
        else:
            fundidos.append([a, b])
    return [(round(a, 3), round(b, 3)) for a, b in fundidos]
