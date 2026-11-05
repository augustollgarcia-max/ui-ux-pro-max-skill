"""Corte, enquadro 9:16 e zoom dinâmico com FFmpeg (passo 1 da montagem)."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from .util import exigir_ferramenta, log, rodar


def dividir_em_blocos(trechos: list[tuple[float, float]], a_cada: float, minimo: float = 1.0) -> list[dict]:
    """Quebra cada trecho de fala em blocos de ~a_cada segundos, alternando zoom (simula cortes dinâmicos)."""
    blocos, zoom_ligado = [], False
    for ini, fim in trechos:
        cursor = ini
        while cursor < fim:
            prox = cursor + a_cada if a_cada > 0 else fim
            if fim - prox < minimo:  # resto pequeno demais vira parte do bloco atual
                prox = fim
            blocos.append({"inicio": round(cursor, 3), "fim": round(min(prox, fim), 3), "zoom": zoom_ligado})
            zoom_ligado = not zoom_ligado
            cursor = prox
    return blocos


def _filtro_enquadro(perfil: dict, largura_src: int, altura_src: int) -> str:
    W, H = int(perfil["largura"]), int(perfil["altura"])
    paisagem = largura_src / altura_src > W / H
    if perfil.get("enquadro") == "blur" and paisagem:
        return (
            f"split[bg][fg];"
            f"[bg]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=24:4[bgb];"
            f"[fg]scale={W}:-2[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2"
        )
    # crop central (padrão): mantém a pessoa no centro e preenche a tela toda
    return f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"


def cortar_e_enquadrar(bruto: Path, blocos: list[dict], perfil: dict, info: dict, destino: Path) -> Path:
    """Gera destino (mp4 9:16, cortes aplicados, áudio normalizado) a partir do bruto."""
    exigir_ferramenta("ffmpeg")
    if not blocos:
        from .util import erro
        erro("nenhum trecho com fala encontrado (ajuste 'silencio_db' no perfil)")
    fps = int(perfil["fps"])
    z = float(perfil.get("zoom_fator", 1.0)) if perfil.get("zoom_dinamico") else 1.0
    enq = _filtro_enquadro(perfil, info["largura"], info["altura"])
    partes, mapa = [], []
    for i, b in enumerate(blocos):
        zoom = f"crop=trunc(iw/{z}/2)*2:trunc(ih/{z}/2)*2," if b["zoom"] and z > 1.0 else ""
        partes.append(
            f"[0:v]trim={b['inicio']}:{b['fim']},setpts=PTS-STARTPTS,{zoom}{enq},fps={fps},setsar=1,format=yuv420p[v{i}];"
            f"[0:a]atrim={b['inicio']}:{b['fim']},asetpts=PTS-STARTPTS[a{i}]"
        )
        mapa.append(f"[v{i}][a{i}]")
    n = len(blocos)
    filtro = ";".join(partes) + f";{''.join(mapa)}concat=n={n}:v=1:a=1[vc][ac];" \
             f"[ac]loudnorm=I={perfil['lufs_alvo']}:TP=-1.5:LRA=11[aout]"
    script = destino.with_suffix(".filtro.txt")
    script.write_text(filtro, encoding="utf-8")
    log(f"cortando {n} blocos, enquadro {perfil.get('enquadro','crop')} {perfil['largura']}x{perfil['altura']}")
    rodar([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(bruto),
        "-filter_complex_script", str(script), "-map", "[vc]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart", str(destino),
    ])
    return destino


def assinatura_cortes(blocos: list[dict], perfil: dict) -> str:
    chave = json.dumps({"b": blocos, "e": perfil.get("enquadro"), "z": perfil.get("zoom_fator"), "zd": perfil.get("zoom_dinamico")}, sort_keys=True)
    return hashlib.sha1(chave.encode()).hexdigest()[:12]
