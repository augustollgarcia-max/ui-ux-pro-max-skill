# Relatório — Pixel Meta + API de Conversões + LGPD (preparação para 12/11/2026)

Feito em 20/10/2026. Branch `fix/pixel-lgpd-12nov`. Nada publicado: este PR só adiciona um teste e este relatório.

## Inventário

| Item | Situação |
|---|---|
| Onde o Pixel carrega | Só em `site-hair/business/rastreio.js`, usado pelas **22 páginas** do www. Pixel `2824321584567060`. Nenhuma outra página nem o app Conexão Hair carregam Pixel. |
| Como carrega | Direto na página (script, não iframe nem `<img>`), **só depois de "Aceitar"**. Antes disso o `fbevents.js` nem é baixado. |
| Eventos | `PageView`, `ViewContent` (página), `Contact` (clique no WhatsApp), `Lead` (formulário dos Mestres e Teste HARA Vision). Todos com `eventID`. |
| API de Conversões | `site-hair/api/meta-capi.js` (Vercel). Recebe o **mesmo** `event_id` e o **mesmo** `event_name` do Pixel. Token só em variável do Vercel (`META_CAPI_TOKEN`), nunca no site. |
| Banner | Aceitar / Recusar, mesmo tamanho, botão "Cookies" no rodapé para mudar depois. Recusar revoga (`fbq('consent','revoke')` + Google Consent Mode negado). |
| Política | `/privacidade` cita o site, Google Ads, Meta Pixel e API de Conversões, só após aceite, e o telefone em hash SHA-256. |
| Dados nos formulários | Nome, WhatsApp, academia de interesse, disponibilidade, foto (Teste HARA Vision). **Não** pede idade, data de nascimento, CPF, saúde nem dado financeiro. |
| Dados nos eventos | Só página, categoria (barbearia/beauty/cursos), academia e campanha. Telefone **só em hash**, só com aceite. Nenhum dado de saúde, financeiro ou de menor. |
| Checkout externo | Não existe: a venda é feita no WhatsApp e na secretaria. A matrícula real não volta para a Meta. |
| Arquivo solto | `index (4).html` na raiz do repositório tem Pixel de exemplo (`SEU_PIXEL_ID`) sem aviso de cookies. **Não está publicado** (404 no www). Não foi apagado. |

## Elegibilidade para "Mensurar conversões nos dispositivos dos clientes"

| Site | Pixel direto na página | Exige login com e-mail/celular | Elegível |
|---|---|---|---|
| www.hairacademiadabeleza.com.br | SIM | NÃO | **NÃO** |
| app.hairacademiadabeleza.com.br (Conexão Hair) | não tem Pixel | SIM | não se aplica |

O recurso novo não deve rodar no www, porque o site não tem login. Não foi criado login para isso.

## Verificação (rodada de verdade, Chromium, 375 px)

`scripts/site-hair/regressao-lgpd-pixel.cjs` — 17 verificações, todas passando, agora no CI. Conferido que o teste **reprova** quando o Pixel carrega antes do aceite (7 falhas numa cópia quebrada de propósito).

- Sem aceite: nenhuma requisição à Meta nem ao Google, nada na CAPI, `fbq` nem existe.
- Após aceite: eventos saem com `eventID`; a CAPI recebe o mesmo `event_id` e o mesmo nome.
- Recusar e recarregar: continua sem nada.
- Revogar pelo rodapé: Pixel recebe `revoke` e o clique no WhatsApp não gera mais evento.
- Nenhum telefone em texto nos dados do evento.

Não dá para testar daqui: o Gerenciador de Eventos real (Test Events) e o recebimento de verdade pela Meta.

---

🟢 **EXECUTADO**
- www: auditado inteiro. Banner, política, deduplicação e dados dos eventos já estavam certos. Nada precisou mudar no site.
- Teste automático novo trava esse comportamento a cada mudança no site.

🔴 **ATENÇÃO**
- Matrícula acontece no WhatsApp e na secretaria: a Meta só vê o clique e o formulário, nunca a venda. CPA do Gerenciador ≠ custo por matrícula.
- O app Conexão Hair tem alunos menores de idade, CPF e data de nascimento. **Nunca colocar Pixel no app.**
- A tarefa cita as contas de anúncio `992197167609378` e `1324292576492251`. A conta em uso pelas campanhas LAN/WOLF é `1131702072853623`. Confirmar quais são as três.

🟡 **DECISÃO DO AUGUSTO**
- Pixel `2824321584567060` (www): o site não é elegível, então o recurso não deve ligar. Recomendação: **manter como está** e, em 12/11, abrir Gerenciador de Eventos → Fontes de dados → Pixel → Configurações e conferir se a opção apareceu. Se aparecer, **desligar** para não mudar a régua dos relatórios. Anotar data e quem decidiu.
- Banner sem "Personalizar": hoje só existe uma finalidade opcional (publicidade), então Aceitar/Recusar já é a escolha completa. Se um dia entrar outra finalidade (ex.: Google Analytics), aí sim adicionar.

🔵 **AUTOMAÇÃO**
- Relatório semanal comparando leads do CRM (origem `ads_meta`, já separada por academia LAN/WOLF) com as conversões do Gerenciador de Eventos, para ver o "pulo de régua" depois de 12/11 antes de aumentar verba na Black Friday (27/11).

➡️ **PRÓXIMO PASSO**
- Até 11/11: exportar do Gerenciador de Anúncios os leads e o custo por resultado das campanhas LAN e WOLF ("foto do antes") e guardar junto deste relatório.
