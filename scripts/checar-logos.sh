#!/bin/sh
# Regra permanente do dono (22/10/2026): as logos da Vértice e da Hair JAMAIS mudam.
# Confere byte a byte cada logo contra scripts/logos-protegidos.sha256.
# Arquivo alterado, apagado ou renomeado = CI vermelho. Só o dono autoriza
# trocar uma logo; nesse caso o manifesto é atualizado no mesmo PR, com o pedido dele citado.
cd "$(dirname "$0")/.." || exit 1
if sha256sum --quiet -c scripts/logos-protegidos.sha256; then
  echo "OK: $(wc -l < scripts/logos-protegidos.sha256) logos protegidas intactas."
else
  echo "ERRO: logo da Vértice ou da Hair alterada/removida. Regra permanente do dono: logos não mudam." >&2
  exit 1
fi
