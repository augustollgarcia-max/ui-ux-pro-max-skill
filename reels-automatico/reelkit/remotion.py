"""Motor Remotion: renderiza gancho + legendas animadas + imagens sobre o vídeo cortado (passo 2 alternativo)."""
from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

from .legendas import agrupar_linhas
from .util import RAIZ, erro, log, rodar, salvar_json

PASTA_REMOTION = RAIZ / "remotion"
CHROMIUM_CANDIDATOS = ["/opt/pw-browsers/chromium", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"]


def _chromium() -> str | None:
    for c in [os.environ.get("REEL_CHROMIUM", "")] + CHROMIUM_CANDIDATOS:
        if c and Path(c).exists():
            return c
    return None


def renderizar_remotion(edicao: dict, pasta: Path, cortado: Path, transcricao: dict | None, destino: Path) -> Path:
    if not (PASTA_REMOTION / "node_modules").exists():
        erro("Remotion não instalado. Rode: bash setup.sh  (ou: cd remotion && npm install)")
    perfil = edicao["perfil"]
    publico = PASTA_REMOTION / "public"
    publico.mkdir(exist_ok=True)
    nome_video = f"{pasta.name}-cortado.mp4"
    shutil.copyfile(cortado, publico / nome_video)
    imagens = []
    for im in edicao.get("imagens", []):
        src = Path(im["arquivo"])
        shutil.copyfile(src, publico / src.name)
        imagens.append({"arquivo": src.name, "inicio": im["inicio"], "duracao": im["duracao"]})
    linhas = agrupar_linhas(transcricao, int(perfil["legenda_palavras_por_linha"])) if transcricao else []
    props = {
        "video": nome_video,
        "duracao": edicao.get("duracao_cortado") or 0,
        "gancho": edicao.get("gancho"),
        "perfil": perfil,
        "linhas": [[{"inicio": w["inicio"], "fim": w["fim"], "texto": w["texto"]} for w in l] for l in linhas],
        "imagens": imagens,
    }
    props_path = pasta / "props.json"
    salvar_json(props_path, props)
    sem_audio = pasta / "03-remotion-sem-audio.mp4"
    cmd = ["npx", "remotion", "render", "src/index.ts", "Reel", str(sem_audio), "--props", str(props_path),
           "--codec", "h264", "--muted", "--log", "error"]
    chromium = _chromium()
    if chromium:
        cmd += ["--browser-executable", chromium]
    log("renderizando com Remotion (pode levar alguns minutos na primeira vez)")
    cwd = os.getcwd()
    os.chdir(PASTA_REMOTION)
    try:
        rodar(cmd, silencioso=False)
    finally:
        os.chdir(cwd)
    # junta o áudio já normalizado do vídeo cortado (Remotion renderizou só a imagem)
    rodar(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(sem_audio), "-i", str(cortado),
           "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(destino)])
    return destino
