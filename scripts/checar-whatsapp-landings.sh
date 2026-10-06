#!/usr/bin/env sh
# Guarda das landings publicadas (site-hair/ = www.hairacademiadabeleza.com.br).
# Decisão do Augusto em 06/10/2026:
#  - destino de WhatsApp das landings é só o 5516991687977 (7977);
#  - 5516994612453 (2453) e 5516996240005 não existem mais e não podem voltar;
#  - nada de Meta (Pixel/fbq/Conversions API): o 7977 roda em sessão não
#    oficial e não pode ficar associado a rastreio da Meta.
set -eu
DIR="${1:-site-hair}"
FALHOU=0
check() {
  if grep -rnIE --include='*.html' --include='*.js' --include='*.json' "$1" "$DIR" >/tmp/guarda.$$ 2>/dev/null; then
    echo "PROIBIDO ($2):"; cat /tmp/guarda.$$; FALHOU=1
  fi
}
check '994612453|99461[ .-]?2453|996240005|99624[ .-]?0005' 'numero de WhatsApp desativado'
check 'fbq\(|connect\.facebook\.net|fbevents\.js|facebook-domain-verification|graph\.facebook\.com' 'rastreio da Meta'
rm -f /tmp/guarda.$$
[ "$FALHOU" = 0 ] && echo "OK: landings sem numero desativado e sem Meta." || exit 1
