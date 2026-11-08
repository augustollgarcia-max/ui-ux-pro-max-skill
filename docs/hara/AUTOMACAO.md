# Testes automáticos da HARA pública

Preferência do usuário registrada em `AGENTS.md`: automatizar verificações repetitivas e utilizar ambiente/agente adequado quando o sandbox local impedir a execução. Isso não autoriza merge ou produção.

## Quando executa

Workflow `.github/workflows/hara-public-tests.yml`, em pushes relevantes para `work/hara-public-chat` e `main`, em pull requests com mudanças no site/testes e por acionamento manual quando disponível. Os gatilhos ficam ativos na branch onde o workflow está presente; só passam a fazer parte da main após aprovação e merge.

## O que executa

1. 23 testes locais de segurança, política comercial, seletor Gemini e validação de captação, além do contrato estático do site.
2. Integração real do Lua com um Redis descartável criado dentro do runner: concorrência, 6 solicitações por minuto, cotas diárias, não consumir outros contadores ao bloquear, TTL e expiração.
3. Playwright em Chromium e WebKit, cada um com 24 combinações de quatro páginas e seis tamanhos de tela. Os tamanhos menores usam emulação de toque e DPR 2.
4. Consentimento, fontes, destino oficial do WhatsApp, conteúdo HTML tratado como texto, ausência de histórico persistente, descarte e revogação, teclado/foco, erro 429, cancelamento pendente e recuperação após timeout.
5. Capturas e JSON de resultados, inclusive imagem da tela em caso de falha. Artefatos retidos por sete dias.

## Isolamento

O job tem somente `contents: read`, checkout sem credenciais persistentes e não recebe secrets. As actions estão fixadas por SHA; Playwright por versão e Redis por digest. Os navegadores abrem somente o servidor de testes e interceptam requisições a terceiros. Não há envio de mensagens, deploy, promoção, migração, alteração de usuários ou mudança de produção dentro do workflow.

O teste do navegador utiliza a interface e o handler reais com origem/IP/transporte Redis simulados na fixture. O job Redis separado executa o Lua real em servidor Redis real, mas não testa Upstash/Vercel por rede. A integração real em homologação fica documentada separadamente em `HOMOLOGACAO.md`.

A suíte independe do Redis temporário de homologação, portanto pode ser repetida após sua expiração. Emulação móvel e WebKit não equivalem a teste em telefone físico/iOS Safari real. Não declarar esse teste físico concluído.

## Resultados

A execução e seu resultado devem ser conferidos no GitHub Actions. Um workflow salvo não constitui evidência de aprovação; registrar o link e a conclusão da execução após observá-los.

## Bloqueio observado em08/11/2026

O GitHub Actions deste fork está suspenso por escala de uso. A UI pública informa que um mantenedor pode reativar a execução. A nova rotina foi salva, mas não gerou nenhuma execução para o commit5abd7aac; não marcar como testes de navegador aprovados. Página verificada: https://github.com/augustollgarcia-max/ui-ux-pro-max-skill/actions . A política não foi alterada.

O download de um Chromium Headless Shell local também não foi concluído: o arquivo recebido estava vazio/truncado; as tentativas foram interrompidas. Permanecem válidos os testes locais sem navegador e as verificações manuais reais da homologação anterior.
