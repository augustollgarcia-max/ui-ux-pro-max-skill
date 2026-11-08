"""Transcrição com faster-whisper → JSON com tempo de cada palavra + SRT."""
from __future__ import annotations

import subprocess
from pathlib import Path

from .util import exigir_ferramenta, log, salvar_json, fmt_tempo


def audio_16k(video: Path):
    """Extrai o áudio como float32 mono 16 kHz via FFmpeg (evita depender do PyAV)."""
    import numpy as np
    exigir_ferramenta("ffmpeg")
    res = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    if res.returncode != 0:
        from .util import erro
        erro("falha ao extrair áudio: " + res.stderr.decode(errors="ignore"))
    return np.frombuffer(res.stdout, dtype=np.float32).copy()


def _srt_tempo(seg: float) -> str:
    h, resto = divmod(seg, 3600)
    m, s = divmod(resto, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)):03d}"


def transcrever(video: Path, destino: Path, idioma: str = "pt", modelo: str = "small") -> dict:
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        from .util import erro
        erro("faster-whisper não instalado. Rode: bash setup.sh")

    log(f"transcrevendo {video.name} (whisper {modelo}, idioma {idioma})")
    wm = WhisperModel(modelo, device="cpu", compute_type="int8")
    segmentos, info = wm.transcribe(
        audio_16k(video),
        language=None if idioma == "auto" else idioma,
        word_timestamps=True,
        vad_filter=True,
        beam_size=5,
    )
    saida = {"idioma": info.language, "duracao": info.duration, "segmentos": []}
    for s in segmentos:
        palavras = [
            {"inicio": round(w.start, 3), "fim": round(w.end, 3), "texto": w.word.strip(), "prob": round(w.probability, 3)}
            for w in (s.words or [])
            if w.word.strip()
        ]
        saida["segmentos"].append(
            {"inicio": round(s.start, 3), "fim": round(s.end, 3), "texto": s.text.strip(), "palavras": palavras}
        )
    destino.mkdir(parents=True, exist_ok=True)
    salvar_json(destino / "transcricao.json", saida)
    linhas = []
    for i, s in enumerate(saida["segmentos"], 1):
        linhas += [str(i), f"{_srt_tempo(s['inicio'])} --> {_srt_tempo(s['fim'])}", s["texto"], ""]
    (destino / "transcricao.srt").write_text("\n".join(linhas), encoding="utf-8")
    (destino / "transcricao.txt").write_text(" ".join(s["texto"] for s in saida["segmentos"]), encoding="utf-8")
    n = sum(len(s["palavras"]) for s in saida["segmentos"])
    log(f"{n} palavras, {len(saida['segmentos'])} frases, {fmt_tempo(saida['duracao'])} de áudio")
    return saida


def palavras_planas(transcricao: dict) -> list[dict]:
    return [w for s in transcricao["segmentos"] for w in s["palavras"]]
