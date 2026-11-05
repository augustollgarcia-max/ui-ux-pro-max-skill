---
name: reels-automatico
description: "Máquina de Reels automáticos: transforma vídeo bruto em Reel pronto (cortes de silêncio, 9:16, áudio -14 LUFS, legendas palavra a palavra via Whisper, gancho animado, B-roll) e ajusta por comando. Use quando o Augusto pedir para montar, editar, legendar ou ajustar um reel/vídeo curto, aprender estilo de referências ou baixar vídeo de referência. Pasta: reels-automatico/."
argument-hint: "[montar|ajustar|aprender|baixar] [arquivo ou nome] [--gancho ...]"
---

# Reels Automático

Pasta de trabalho: `reels-automatico/` (raiz do repositório). CLI: `python3 reel.py`. Primeira vez: `bash setup.sh`.

## Traduzindo o pedido em comando

| Augusto diz | Você roda (dentro de `reels-automatico/`) |
|---|---|
| "monta o reel do vídeo X" / "edita esse vídeo" | `python3 reel.py montar ARQUIVO-BRUTO/X.mp4 --gancho "<gancho>"` |
| "melhora o gancho" / "troca o gancho por Y" | `python3 reel.py ajustar X --gancho "Y"` |
| "tira dos 12 aos 15 segundos" / "corta essa parte" | `python3 reel.py ajustar X --remover 12-15` |
| "coloca o print/foto aos 4 segundos" | `python3 reel.py ajustar X --inserir IMAGENS/foto.png@4:2.5` |
| "legenda verde" / "legenda maior" / "sem zoom" | `python3 reel.py ajustar X --estilo legenda_cor_destaque='"#00FF88"'` / `--estilo legenda_tamanho=110` / `--estilo zoom_dinamico=false` |
| "mais animado" / "acabamento profissional" | `python3 reel.py ajustar X --motor remotion` |
| "a legenda escreveu errado" | editar `SAIDA/X/transcricao.json` → `python3 reel.py renderizar X` |
| "aprende o estilo desses vídeos" | colocar em `REFERENCIAS/` → `python3 reel.py aprender --transcrever` |
| "baixa esse reel de referência" | `python3 reel.py baixar "<url>"` (só quando o download é permitido) |
| "o que tem aí?" | `python3 reel.py status` |

`X` é o nome do arquivo sem extensão; a saída fica em `SAIDA/X/reel-final.mp4` com `relatorio.md`.

## Gancho

Se ele não deu gancho, crie um com 4 a 7 palavras a partir de `SAIDA/X/transcricao.txt` (promessa ou dor concreta,
sem clickbait vazio) e já renderize. Ofereça 2 alternativas no relatório.

## Verificação obrigatória antes de "pronto"

```bash
ffprobe -v error -show_entries stream=width,height,avg_frame_rate,codec_type -of compact SAIDA/X/reel-final.mp4
ffmpeg -y -loglevel error -ss 1 -i SAIDA/X/reel-final.mp4 -frames:v 1 /tmp/f1.png   # gancho
ffmpeg -y -loglevel error -ss 6 -i SAIDA/X/reel-final.mp4 -frames:v 1 /tmp/f2.png   # legenda / imagem
```
Olhe os frames (Read) e diga no relatório o que conferiu. Entregue no formato 🟢 EXECUTADO / 🔴 ATENÇÃO / ➡️ PRÓXIMO PASSO,
com o caminho do `reel-final.mp4`.

## Estilo

`ESTILO/perfil-padrao.json` (editável) + `ESTILO/perfil.json` (aprendido). Chaves em `reels-automatico/README.md`.
Legenda padrão: Inter Display Black, 3 palavras por linha, destaque amarelo `#FFD400`, 72% da altura. Gancho: cartão no topo por 2,6 s.

## Detalhes técnicos (quando precisar depurar)

- Pipeline em `reelkit/`: `audio.py` (silêncios, LUFS) → `video.py` (blocos, zoom alternado, crop/blur 9:16, loudnorm) →
  `transcrever.py` (faster-whisper, áudio extraído pelo ffmpeg) → `legendas.py` (ASS karaoke) ou `remotion.py` → `montar.py` (orquestra, `edicao.json`).
- `01-cortado.mp4` é reaproveitado quando os blocos não mudam (assinatura em `.assinatura-cortes`); a transcrição também.
- Remotion: `remotion/src/Reel.tsx`; props em `SAIDA/X/props.json`; Chromium via `REEL_CHROMIUM` ou `/opt/pw-browsers/chromium`.
