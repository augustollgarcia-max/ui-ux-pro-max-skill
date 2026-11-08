# HARA pública — primeira homologação executada

Atualização comercial posterior: consultar `FUNIL-COMERCIAL.md` e `AUTOMACAO.md`. Esta seção registra a etapa anterior à captação e ao seletor Gemini; seus resultados não equivalem à validação integral do fluxo novo.

08/11/2026. O usuário aprovou exclusivamente homologação e configuração dos limites. Não há autorização de merge nem de produção nesta etapa.

## Resultado

- URL imutável testada da versão corrigida: https://hair-academia-site-7zpvtb9bn-lemosluizgarcia-8715s-projects.vercel.app/
- Projeto: `hair-academia-site`, `prj_Jh0m5zygnaUifRJAG6bM9SPD2G8S`.
- Deployment de teste: `dpl_5qwdG5mzGxR7MFBhY786h4eHD6V7`, READY, target não produtivo (`null` na API Vercel).
- Commit testado: `d228b819faa6cf1607c9446ebd5c7fe427c547a2`.
- Branch: `work/hara-public-chat` no repositório `augustollgarcia-max/ui-ux-pro-max-skill`.
- Nenhum PR integrado, nenhuma alteração na main, nos domínios, na autenticação, no CORS/RLS ou nas variáveis de produção.
- Variáveis criadas apenas para `target=preview` e `gitBranch=work/hara-public-chat`: `HARA_RATE_REST_URL`, `HARA_RATE_REST_TOKEN`, `HARA_RATE_HMAC`, `HARA_PUBLIC_ENABLED`. Não registrar seus valores em documentos, código ou logs.
- Redis temporário gratuito, destinado a testes, com expiração em 11/11/2026 (72 horas aproximadas desde sua criação). Não é infraestrutura de produção; após expirar, a API falha fechada com 503 e mantém o encaminhamento ao WhatsApp.

## Testes executados

| Verificação | Resultado |
| --- | --- |
| Testes locais do handler | 12/12 passaram. |
| Contrato estático existente | Passou: 52 links/botões, 33 IDs, 3 cursos, 4 conversões Ads e 2 scripts válidos. |
| Redis real, Lua exato da implementação, 20 chamadas simultâneas | 6 permitidas e 14 bloqueadas. |
| Redis real, teto diário por IP e global | Bloqueou nos valores de teste configurados de 30 e 1.000. Somente chaves sintéticas isoladas foram utilizadas. |
| TTL real dos contadores e expiração | Verificadas expirações <=120 segundos e <=24 horas; uma chave de teste expirou de fato. Não se esperou 24 horas para observar a exclusão dos contadores diários. |
| API implantada, origem indevida | HTTP 403. |
| API implantada, sem aceite, campo extra, email sintético, texto acima do limite | HTTP 400 em todos os casos. |
| API implantada, chamadas reais válidas | HTTP 200 com resposta, fontes oficiais e WhatsApp 5516992558810. |
| API implantada, lote de dez chamadas no IP de teste compartilhado | Cinco HTTP 200 e cinco HTTP 429; requisições anteriores no mesmo IP também consumiram limite. |
| Navegador real, cookies de marketing recusados | O chat abriu e respondeu normalmente após aceite separado do atendimento. |
| Navegador real, antes do aceite | Campo, envio e perguntas rápidas desabilitados. |
| Navegador real, perguntas de localização e cursos | Respostas apresentadas na própria página, com fontes e contato oficial. |
| Navegador real, texto com marcação HTML maliciosa | Texto literal; nenhum elemento de imagem foi criado dentro das mensagens. |
| Navegador real, apagar conversa | Mensagens removidas; checkbox desmarcado e envio desabilitado. |
| Navegador real, páginas `/`, `/business`, `/beauty` e `/inicio` | Chat abriu em todas. |
| Layout desktop | Inspecionado em 1363×936 CSS pixels. |
| Layout estreito e baixo | Inspecionado por zoom nativo de 400%, equivalente a aproximadamente 340×234 CSS pixels. Dialog passou a ocupar a tela; footer inferior em 233px, dentro da altura 234px. Sem transbordamento horizontal material, respeitada tolerância fracionária <1px do zoom. |
| Telefone físico, teclado virtual e Safari/iOS | Não executados. A simulação por zoom não equivale a teste em aparelho físico. |
| Suíte Playwright local de 20 layouts | Continua bloqueada: o Chromium local não inicia por restrição de socket. A inspeção manual acima foi feita no navegador remoto disponível. |
| Login de alunos e administradores ponta a ponta | Não executado; serviço e código de autenticação preservados. A função HARA existente havia sido verificada retornando 401 sem credenciais. |

O lote HTTP foi executado na primeira versão de preview `dpl_XVmp1cCLzRKu7kmLeYVKPUHMYTAG`, commit `33451a7...`. A correção seguinte alterou somente CSS do chat; o endpoint não foi modificado. A resposta completa foi novamente conferida no navegador na versão corrigida `d228b819...`.

A correção de viewport baixo está em `site-hair/hara/chat.js`, media query `max-height:450px`. Evita controles fora da área visível quando a altura disponível é pequena.

## Limites e dados

O servidor usa a franquia de 6 solicitações/minuto/IP, 30/dia/IP e 1.000/dia globalmente. Redis recebe identificador derivado por HMAC e contagens, nunca texto de conversa ou IP em claro nas chaves. O navegador envia a pergunta somente depois do aceite; o conteúdo é processado transitoriamente pelo servidor e não é salvo pela aplicação. O serviço ainda depende da infraestrutura da hospedagem e de seus próprios registros técnicos; não prometer ausência total de logs dos provedores.

O atendimento usa seleção de respostas públicas por assuntos, sem modelo generativo e sem contexto de conversa. Não conecta o visitante à HARA autenticada. O link comercial abre WhatsApp com mensagem genérica, sem transcript e sem envio automático. Não foram criados painel, rastreamento de navegação, identificação de visitantes nem sincronização com CRM.

## Antes de produção

1. Validar o conteúdo comercial com a coordenação; horários, preços, datas e vagas continuam sem confirmação automática. O site consultado lista quatro academias, podendo haver novas unidades ainda não publicadas.
2. Substituir o Redis temporário por recurso estável aprovado, com conta, região, retenção, limites de custo e responsável definidos. Não transportar a credencial temporária para produção.
3. Validar a política de privacidade com os provedores e retenções efetivamente escolhidos; o texto preparado registra essa dependência.
4. Concluir teste em telefone com teclado virtual e, quando disponível, suíte de múltiplos viewports. Confirmar que os acessos de alunos e administradores seguem funcionando em seus fluxos reais.
5. Aplicar o patch de `hair-business-/site/rastreio.js` junto da futura integração, para que a sincronização das páginas preserve o carregador. O patch ainda não foi aplicado à fonte remota.
6. Apresentar versão e resultados finais ao usuário e obter aprovação específica antes de qualquer merge, configuração de produção ou publicação no domínio oficial.

Não classificar esta homologação como autorização ou liberação de produção.

## Registro de segurança da implantação

A API de deployments rejeitou o valor literal `target=preview`. Uma tentativa de recriação sem alvo explícito foi bloqueada pela revisão automática por possível risco de produção. A execução foi interrompida para verificação por leitura.

O schema oficial em `https://openapi.vercel.sh`, endpoint `/v13/deployments`, confirmou explicitamente: quando `target` é omitido, o alvo é `preview`. O projeto já possuía produção na main e um preview separado da branch de trabalho, fato confirmado pela API. Com essas evidências, foi criada exclusivamente a implantação do commit da branch de homologação. A resposta confirmou target não produtivo e somente alias de branch; os domínios oficiais permaneceram na implantação original. Não se desativou proteção nem se ampliaram permissões para contornar o bloqueio.

## Reprodução e evidências

- `node --test scripts/hara/security.test.cjs`
- `python3 scripts/site-hair/checar-contrato.py`
- `python3 scripts/hara/redis-live-check.py <arquivo-de-configuracao-de-preview>` — exige Redis de testes descartável, não inclui nem imprime segredos.
- `security-results.txt`, `redis-live-results.txt`, `api-live-results.txt`, `layout-results-final.json` e capturas `chat-desktop.png`/`chat-narrow.png`.
