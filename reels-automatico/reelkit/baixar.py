"""Baixa vídeos de referência com yt-dlp (só quando o download é permitido pela plataforma/autor)."""
from __future__ import annotations

import shutil
from pathlib import Path

from .util import PASTA_REFERENCIAS, erro, log, rodar


def baixar(url: str, destino: Path | None = None) -> None:
    exe = shutil.which("yt-dlp")
    if not exe:
        erro("yt-dlp não instalado. Rode: bash setup.sh")
    destino = destino or PASTA_REFERENCIAS
    destino.mkdir(parents=True, exist_ok=True)
    log(f"baixando referência: {url}")
    rodar([exe, "-f", "bv*[height<=1080]+ba/b[height<=1080]", "--merge-output-format", "mp4",
           "-o", str(destino / "%(uploader)s - %(title).60s.%(ext)s"), "--no-playlist", url], silencioso=False)
    log(f"salvo em {destino}/")
