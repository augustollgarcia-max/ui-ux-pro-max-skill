# Automação "EU QUERO" no WhatsApp (LetsBot)

Pedido do dono (Augusto, 03/11/2026): quem responder "EU QUERO" ao vídeo recebe
atendimento automático, escolhe visita ou valores, vira lead etiquetado e cai para
um atendente humano. Esta ficha é a especificação; o fluxo é criado no LetsBot a
partir dela (conector precisa estar autorizado na conta claude.ai).

## Gatilhos (palavras que acordam o fluxo)

`eu quero` · `quero` · `curso de barbeiro` · `barbeiro` · `valores` · `visita`
(comparação parcial, sem diferenciar maiúsculas; só no canal WhatsApp).

## Fluxo

**1. Mensagem de boas-vindas (com 3 botões)**

> Que bom que você quer dar o próximo passo. 👋
> Este é o curso de barbeiro da HAIR Academia da Beleza: 2 meses, aulas de manhã, à noite ou aos domingos, kit de materiais incluso e aula dentro de barbearias reais.
> O que você quer agora?

Botões: `Conhecer o espaço` · `Saber os valores` · `Ver o vídeo`

**2a. Botão "Conhecer o espaço"**

> Atendimento com hora marcada:
> Av. Presidente Vargas, 1265, 16º andar (Trio Office), Ribeirão Preto.
> Me diga o melhor dia e período (manhã, tarde ou noite) e eu confirmo o horário da sua visita.

Ações automáticas: etiqueta **Lead · Curso Barbeiro · Visita**, contato atribuído ao atendente de turno, bot para de responder nesta conversa (humano assume).

**2b. Botão "Saber os valores"**

> Os valores dependem do formato (manhã, noite ou domingos) e das condições do mês.
> Um consultor da HAIR te manda agora os valores e as formas de pagamento. Qual formato você prefere: manhã, noite ou domingos?

Ações automáticas: etiqueta **Lead · Curso Barbeiro · Valores**, contato atribuído ao atendente de turno, bot para de responder nesta conversa.

**2c. Botão "Ver o vídeo"**

Envia o vídeo `apresentacao-curso.mp4` (720p, 10 MB) com a legenda:

> Tudo o que o aluno recebe, em 1 minuto e 51 segundos. Depois me diga: visita ou valores?

**3. Fora do horário** (fora de seg–sex 9h–19h e sáb 9h–13h): mesma mensagem 1, mais a frase "Nosso atendimento humano responde no próximo horário comercial; sua mensagem já ficou registrada."

## O que o time vê

- Etiquetas novas: `Lead · Curso Barbeiro · Visita` e `Lead · Curso Barbeiro · Valores`.
- Caixa "Aguardando resposta" do LetsBot lista os leads parados há mais de 15 minutos.
- Relatório semanal: quantos "EU QUERO", quantos escolheram visita, quantos valores.

## Dados que precisam ser confirmados antes de ligar

| Item | Status |
|---|---|
| Número do WhatsApp conectado ao LetsBot é o 5516992558810 (número público do site) | conferir no painel |
| Quem é o atendente de turno (nome no LetsBot) | Augusto define |
| Link público do vídeo para o bot enviar | após o PR entrar na `main`, fica em `https://www.hairacademiadabeleza.com.br/business/apresentacao-curso/apresentacao-curso.mp4` |
| Horário comercial para a mensagem "fora do horário" | Augusto confirma |

## Como criar (quando o conector estiver autorizado)

1. `upload_file` com o link público do vídeo → URL interna do LetsBot.
2. `create_interactive_conversation` com os gatilhos e os 3 botões (textos acima).
3. `create_label` para as duas etiquetas; `create_simple_conversation` para "valores" e "visita" com `label_id` e `agent_id`.
4. Fluxo nasce **desligado**; ligar com `set_bot_conversation_active` depois do teste com o próprio número do Augusto.
