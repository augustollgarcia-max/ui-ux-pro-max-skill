#!/bin/sh
# Junta vídeo mudo + trilha e gera as duas saídas:
#  - apresentacao-curso.mp4      1080x1920 (Instagram/arquivo)
#  - apresentacao-curso-720.mp4  720x1280  (WhatsApp, menor)
# Uso: finalizar.sh <render-silencioso.mp4> <trilha.wav> <pasta_saida>
set -e
V="$1"; A="$2"; OUT="$3"
ffmpeg -y -v error -i "$V" -i "$A" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart "$OUT/apresentacao-curso.mp4"
ffmpeg -y -v error -i "$V" -i "$A" -map 0:v -map 1:a -vf scale=720:1280 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest -movflags +faststart "$OUT/apresentacao-curso-720.mp4"
for f in "$OUT/apresentacao-curso.mp4" "$OUT/apresentacao-curso-720.mp4"; do
  printf '%s  ' "$f"; ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height -of csv=p=0 "$f" | tr '\n' ' '; echo
done
