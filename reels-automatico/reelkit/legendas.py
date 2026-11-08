"""Legendas animadas palavra por palavra (estilo Reels) e gancho, em formato ASS para o libass."""
from __future__ import annotations

from pathlib import Path


def _cor_ass(hexcor: str) -> str:
    """#RRGGBB ou #RRGGBBAA → &HAABBGGRR& (ASS usa alpha invertido: 00 = opaco)."""
    h = hexcor.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    alfa_css = int(h[6:8], 16) if len(h) == 8 else 255
    aa = f"{255 - alfa_css:02X}"
    return f"&H{aa}{b}{g}{r}&".upper()


def _t(seg: float) -> str:
    seg = max(0.0, seg)
    h, resto = divmod(seg, 3600)
    m, s = divmod(resto, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def _escapar(txt: str) -> str:
    return txt.replace("\\", "\\\\").replace("{", "(").replace("}", ")")


def agrupar_linhas(transcricao: dict, por_linha: int, pausa_quebra: float = 0.7) -> list[list[dict]]:
    """Agrupa palavras em linhas curtas: respeita fim de frase, pausas e o máximo por linha."""
    linhas: list[list[dict]] = []
    for seg in transcricao["segmentos"]:
        atual: list[dict] = []
        for w in seg["palavras"]:
            if atual and (len(atual) >= por_linha or w["inicio"] - atual[-1]["fim"] > pausa_quebra):
                linhas.append(atual)
                atual = []
            atual.append(w)
        if atual:
            linhas.append(atual)
    return linhas


def gerar_ass(transcricao: dict | None, perfil: dict, gancho: str | None, destino: Path, duracao: float) -> Path:
    W, H = int(perfil["largura"]), int(perfil["altura"])
    margem_v = int((1 - float(perfil["legenda_posicao_vertical"])) * H)
    cor = _cor_ass(perfil["legenda_cor"])
    destaque = _cor_ass(perfil["legenda_cor_destaque"])
    cabecalho = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Legenda,{perfil['legenda_fonte']},{perfil['legenda_tamanho']},{cor},{cor},&H00000000&,&H80000000&,-1,0,0,0,100,100,0,0,1,{perfil['legenda_contorno']},2,2,60,60,{margem_v},1
Style: Gancho,{perfil['legenda_fonte']},{perfil['gancho_tamanho']},{_cor_ass(perfil['gancho_cor'])},{_cor_ass(perfil['gancho_cor'])},{_cor_ass(perfil['gancho_fundo'])},{_cor_ass(perfil['gancho_fundo'])},-1,0,0,0,100,100,0,0,3,18,0,8,80,80,{int(H*0.16)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    eventos: list[str] = []
    if gancho:
        palavras = gancho.split()
        texto = gancho.upper() if perfil["legenda_maiusculas"] else gancho
        palavras = [_escapar(w) for w in texto.split()]
        quebrado = "\\N".join(" ".join(palavras[i:i + 3]) for i in range(0, len(palavras), 3))
        dur = min(float(perfil["gancho_duracao_seg"]), duracao)
        eventos.append(
            f"Dialogue: 1,{_t(0)},{_t(dur)},Gancho,,0,0,0,,"
            f"{{\\fad(0,220)\\fscx88\\fscy88\\t(0,120,\\fscx100\\fscy100)}}{quebrado}"
        )
    if transcricao:
        for linha in agrupar_linhas(transcricao, int(perfil["legenda_palavras_por_linha"])):
            fim_linha = linha[-1]["fim"] + 0.15
            for k, w in enumerate(linha):
                ini = w["inicio"]
                fim = linha[k + 1]["inicio"] if k + 1 < len(linha) else fim_linha
                if fim <= ini:
                    fim = ini + 0.08
                pedacos = []
                for j, p in enumerate(linha):
                    txt = _escapar(p["texto"].upper() if perfil["legenda_maiusculas"] else p["texto"])
                    pedacos.append(f"{{\\c{destaque}}}{txt}{{\\c{cor}}}" if j == k else txt)
                anim = "{\\fscx86\\fscy86\\t(0,90,\\fscx100\\fscy100)}" if k == 0 else ""
                eventos.append(f"Dialogue: 0,{_t(ini)},{_t(fim)},Legenda,,0,0,0,,{anim}{' '.join(pedacos)}")
    destino.write_text(cabecalho + "\n".join(eventos) + "\n", encoding="utf-8")
    return destino
