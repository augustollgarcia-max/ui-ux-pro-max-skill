#!/usr/bin/env sh
# Guarda das landings publicadas (site-hair/ = www.hairacademiadabeleza.com.br).
# Decisão do Augusto em 18/10/2026 (substitui a de 06/10/2026):
#  - o WhatsApp do site é só o 5516992558810 ((16) 99255-8810), número comercial;
#  - o 5516991687977 (7977) é o robô RARA em sessão não oficial (Baileys) e NÃO
#    pode aparecer em página publicada — por isso o site pode ter Meta Pixel e
#    Conversions API (o rastreio nunca fica associado ao 7977);
#  - 5516994612453 (2453, contato humano da RARA) e 5516996240005 também não
#    são destino de landing.
set -eu
DIR="${1:-site-hair}"
FALHOU=0
check() {
  if grep -rnIE --include='*.html' --include='*.js' --include='*.json' "$1" "$DIR" >/tmp/guarda.$$ 2>/dev/null; then
    echo "PROIBIDO ($2):"; cat /tmp/guarda.$$; FALHOU=1
  fi
}
check '991687977|99168[ .-]?7977' 'numero do robo RARA (7977) em pagina publicada'
check '994612453|99461[ .-]?2453|996240005|99624[ .-]?0005' 'numero que nao e destino de landing (so 8810)'
rm -f /tmp/guarda.$$
[ "$FALHOU" = 0 ] && echo "OK: landings sem 7977 e sem numero desativado." || exit 1
