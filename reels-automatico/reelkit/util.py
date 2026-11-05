"""Funções compartilhadas: shell, ffprobe, caminhos e perfil de estilo."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA_BRUTO = RAIZ / "ARQUIVO-BRUTO"
PASTA_REFERENCIAS = RAIZ / "REFERENCIAS"
PASTA_IMAGENS = RAIZ / "IMAGENS"
PASTA_ESTILO = RAIZ / "ESTILO"
PASTA_SAIDA = RAIZ / "SAIDA"
PERFIL_PADRAO = PASTA_ESTILO / "perfil-padrao.json"
PERFIL_APRENDIDO = PASTA_ESTILO / "perfil.json"

EXT_VIDEO = {".mp4", ".mov", ".mkv", ".webm", ".m4v", ".avi"}


def log(msg: str) -> None:
    print(f"[reel] {msg}", flush=True)


def erro(msg: str, codigo: int = 1) -> None:
    print(f"[reel] ERRO: {msg}", file=sys.stderr, flush=True)
    sys.exit(codigo)


def exigir_ferramenta(nome: str) -> str:
    caminho = shutil.which(nome)
    if not caminho:
        erro(f"'{nome}' não está instalado. Rode: bash setup.sh")
    return caminho


def rodar(cmd: list[str], *, capturar: bool = False, silencioso: bool = True) -> subprocess.CompletedProcess:
    """Executa um comando. Em caso de falha mostra o stderr inteiro (ffmpeg explica o motivo lá)."""
    res = subprocess.run(
        cmd,
        stdout=subprocess.PIPE if (capturar or silencioso) else None,
        stderr=subprocess.PIPE if (capturar or silencioso) else None,
        text=True,
    )
    if res.returncode != 0:
        print(res.stderr or "", file=sys.stderr)
        erro(f"comando falhou ({res.returncode}): {' '.join(cmd[:4])} ...")
    return res


def ffprobe_json(arquivo: Path) -> dict:
    exigir_ferramenta("ffprobe")
    res = rodar(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(arquivo)],
        capturar=True,
    )
    return json.loads(res.stdout)


def info_video(arquivo: Path) -> dict:
    """Resumo útil: duração, largura, altura, fps, tem_audio."""
    dados = ffprobe_json(arquivo)
    v = next((s for s in dados["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in dados["streams"] if s["codec_type"] == "audio"), None)
    if not v:
        erro(f"{arquivo.name} não tem faixa de vídeo")
    num, _, den = (v.get("avg_frame_rate") or "30/1").partition("/")
    fps = float(num) / float(den or 1) if float(den or 1) else 30.0
    # vídeos de celular podem vir com rotação nos metadados
    rot = 0
    for sd in v.get("side_data_list", []) or []:
        if "rotation" in sd:
            rot = int(sd["rotation"])
    largura, altura = int(v["width"]), int(v["height"])
    if rot in (90, -90, 270, -270):
        largura, altura = altura, largura
    return {
        "duracao": float(dados["format"].get("duration", 0.0)),
        "largura": largura,
        "altura": altura,
        "fps": round(fps, 3),
        "tem_audio": a is not None,
    }


def carregar_perfil(caminho: Path | None = None) -> dict:
    """Perfil padrão + perfil aprendido (se existir) + perfil explícito (se passado)."""
    perfil = json.loads(PERFIL_PADRAO.read_text(encoding="utf-8"))
    if PERFIL_APRENDIDO.exists():
        perfil.update(json.loads(PERFIL_APRENDIDO.read_text(encoding="utf-8")))
    if caminho:
        perfil.update(json.loads(Path(caminho).read_text(encoding="utf-8")))
    return perfil


def salvar_json(caminho: Path, dados) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")


def pasta_saida_para(video: Path) -> Path:
    p = PASTA_SAIDA / video.stem
    p.mkdir(parents=True, exist_ok=True)
    return p


def listar_videos(pasta: Path) -> list[Path]:
    return sorted(p for p in pasta.iterdir() if p.suffix.lower() in EXT_VIDEO and not p.name.startswith("."))


def fmt_tempo(seg: float) -> str:
    m, s = divmod(max(seg, 0.0), 60)
    return f"{int(m):02d}:{s:05.2f}"
