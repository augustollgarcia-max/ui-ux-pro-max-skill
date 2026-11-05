#!/usr/bin/env bash
# setup.sh — instala tudo que a máquina de Reels precisa. Pode rodar quantas vezes quiser (idempotente).
set -euo pipefail
cd "$(dirname "$0")"

ok()   { printf "  ✅ %s\n" "$*"; }
falta(){ printf "  ❌ %s\n" "$*"; }
info() { printf "\n== %s ==\n" "$*"; }

PY=python3; command -v python3 >/dev/null || PY=python

info "1/5 FFmpeg (cortes, exportação, legendas)"
if command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null; then
  ok "$(ffmpeg -version | head -1 | cut -d' ' -f1-3)"
  FILTROS="$(ffmpeg -hide_banner -filters 2>/dev/null || true)"
  if printf '%s' "$FILTROS" | grep -q " ass "; then ok "libass (legendas) presente"; else falta "FFmpeg sem libass: instale um build completo (brew install ffmpeg / apt install ffmpeg)"; fi
else
  falta "FFmpeg não encontrado. Mac: brew install ffmpeg | Ubuntu: sudo apt install ffmpeg | Windows: winget install Gyan.FFmpeg"
fi

info "2/5 Whisper (transcrição → legendas sincronizadas)"
$PY -m pip install --quiet --user --upgrade faster-whisper numpy 2>&1 | grep -v -i warning || true
$PY -c "import faster_whisper, numpy" 2>/dev/null && ok "faster-whisper instalado" || falta "faster-whisper não instalou (veja a mensagem acima)"

info "3/5 yt-dlp (baixar referências quando o download é permitido)"
$PY -m pip install --quiet --user --upgrade yt-dlp 2>&1 | grep -v -i warning || true
if command -v yt-dlp >/dev/null; then ok "yt-dlp $(yt-dlp --version)"; else
  BIN="$($PY -c 'import site,os;print(os.path.join(site.USER_BASE,"bin"))')"
  if [ -x "$BIN/yt-dlp" ]; then ok "yt-dlp em $BIN (adicione ao PATH: export PATH=\"$BIN:\$PATH\")"; else falta "yt-dlp não instalou"; fi
fi

info "4/5 Remotion (animações profissionais, motor opcional: --motor remotion)"
if command -v npm >/dev/null; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$NODE_MAJOR" -ge 18 ]; then
    (cd remotion && npm install --no-audit --no-fund --loglevel=error) && ok "Remotion instalado em remotion/node_modules"
  else
    falta "Node $NODE_MAJOR é antigo; instale Node 20+ (https://nodejs.org)"
  fi
else
  falta "npm não encontrado; instale Node 20+ (https://nodejs.org). O motor ffmpeg funciona sem isso."
fi

info "5/5 Hyperframes (opcional: vídeos em HTML; só se você quiser montar cenas em HTML)"
if command -v npx >/dev/null; then
  if [ -d hyperframes ]; then ok "projeto hyperframes/ já existe"; else
    echo "  (pulado) para criar: npx hyperframes init hyperframes   — depois: cd hyperframes && npx hyperframes preview"
  fi
fi

info "Fonte das legendas"
FONTES="$( (fc-list 2>/dev/null || true) )"
if printf '%s' "$FONTES" | grep -qi "Inter"; then ok "fonte Inter encontrada"; else
  echo "  ⚠️  fonte 'Inter Display Black' não encontrada; o libass usa a fonte padrão. Instale a Inter (https://rsms.me/inter/) ou troque 'legenda_fonte' no ESTILO/perfil-padrao.json"
fi

info "Pastas"
mkdir -p ARQUIVO-BRUTO REFERENCIAS IMAGENS ESTILO SAIDA && ok "ARQUIVO-BRUTO/ REFERENCIAS/ IMAGENS/ ESTILO/ SAIDA/"
echo
echo "Pronto. Teste: python3 reel.py status"
