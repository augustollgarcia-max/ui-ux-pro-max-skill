# Conexão Work no site — arquitetura

Escrito em 22/08/2026, depois de ler as 5 migrations do Work, o `work.html`,
o `vercel.json` dos dois projetos e o `index.html` do site.

---

## 1. O que já existe

Três superfícies, três públicos, **um banco só**.

| Superfície | Endereço | Repositório | Quem entra | Login |
|---|---|---|---|---|
| Site | `hairacademiadabeleza.com.br` | `ui-ux-pro-max-skill` → `site-hair/` | quem quer estudar | nenhum |
| Conexão Hair | `app.hairacademiadabeleza.com.br` | `conexao-hair-deploy` → `index.html` | aluno matriculado | CPF + senha ou Google |
| Conexão Work | `app.hairacademiadabeleza.com.br/work.html` | `conexao-hair-deploy` → `work.html` | salão, barbearia e (novo) profissional avulso | CNPJ/CPF + senha; profissional só telefone |

Banco: Supabase `zoyyfvfvnxrpojhypsjh`, compartilhado pelas três. RLS ligado em
toda tabela nova e **zero política pro anon** — quem escreve é sempre uma RPC
`SECURITY DEFINER` com `REVOKE FROM PUBLIC` e `GRANT` explícito.

### O que o Work já tem no banco (Fases 0 a 4)

| Frente | Tabelas | Situação |
|---|---|---|
| Conta da empresa | `empresas` + `login_empresa` | senha bcrypt, trava após 10 erros em 15 min |
| Talentos | lê `perfis_conexao` via `empresa_listar_talentos` | mostra selo da melhor nota, e **só** se o aluno marcou `mostrar_notas` |
| Vagas | `oportunidades` com `empresa_id` | pronto |
| Marketplace "Desapega Pro" | `marketplace_itens` | pronto |
| Eventos & Network | `work_eventos`, `work_evento_inscricoes` | pronto |
| Podcasts | `podcasts` | **é aqui que a Rádio Educadora encosta** |
| Biblioteca de Gestão | `biblioteca_gestao` | pronto |
| Caixa de mensagens | `mensagens_coordenacao` com status | telefone nunca é exposto — a coordenação é a ponte |
| Cadastro aberto (Fase 4) | `empresa_cadastrar`, `profissionais_work`, `profissional_cadastrar`, `login_profissional` | **no banco, sem tela** |

A tela é o `work.html`: 40KB, página única, sem framework, mesmo padrão do app do
aluno. Oito painéis e uma barra de cinco botões com o ∞ do hub no centro.

---

## 2. Os três buracos

**1. A Fase 4 não tinha tela — ~~resolvido em 22/08~~.**
`empresa_cadastrar`, `profissional_cadastrar` e `login_profissional` estavam no
banco sem nenhuma chamada. Agora `assets/work-onboarding.js` chama as três, e a
capa oficial dá entrada aos três acessos. **A porta existe.**

**2. O site não cita o Conexão Work.** Nenhuma vez. O único botão de entrada é
"Acessar Conexão", que leva ao app do aluno.

**3. O profissional avulso nasce invisível.**
`empresa_listar_talentos` lê só `perfis_conexao`, ou seja, só aluno da HAIR. Quem
se cadastrar como profissional avulso não aparece para empresa nenhuma. A própria
migration da Fase 4 registra isso como decisão adiada para uma Fase 5.

**A Fase 5 subiu em 22/08 e resolveu a invisibilidade** — o avulso aparece. Mas
ele aparece *idêntico* a um aluno da HAIR, e é isso que a seção 6 fecha.

---

## 3. A regra

Uma linha, e ela já vale no projeto sem estar escrita em lugar nenhum:

> **Vitrine no domínio raiz. Produto no subdomínio.**

- `hairacademiadabeleza.com.br` — sem login, indexado pelo Google, vende
- `app.hairacademiadabeleza.com.br` — com login, fora do índice, opera

O Conexão Work é produto. Logo, **não** vira página do site.

*Divergência conhecida:* `/mapa` e `/consultoria` são vitrine e hoje moram no
projeto do app. Não bloqueia nada, mas fica anotado para não virar praxe.

---

## 4. O desenho

### 4.1 Endereço próprio — `work.hairacademiadabeleza.com.br`

O código **fica onde está**: mesmo repositório, mesmo projeto Vercel. Muda só o
endereço — um domínio a mais apontando para o mesmo projeto, com rewrite de `/`
para `/work.html`.

Por que não mudar o Work para o repositório do site:

- **O CSP.** O `vercel.json` do app libera `connect-src` para o Supabase; o do
  site não define CSP nenhum. Mudar o Work de casa obrigaria a carregar a
  política inteira junto, e um erro aí derruba o login do salão.
- `push-config.js`, a chave anon e os contratos de RPC já vivem no repositório do app.
- Endereço se troca em cinco minutos. Migração de repositório custa dias e quebra coisa.

Por que não deixar em `app.…/work.html`:

- Não dá para falar no telefone com um dono de barbearia.
- "app" já significa "aluno" na cabeça de quem usa.

### 4.2 Três portas no site, não uma

| Quem chega | O que quer | Para onde vai |
|---|---|---|
| Quero estudar | formação | `#formacoes` → WhatsApp — já existe |
| Sou aluno | minha turma | `app.…` — já existe, mal rotulado |
| Tenho salão / sou profissional | contratar, anunciar, aprender gestão | `work.…` — **falta** |

No site:

- **Botão do topo.** "Acessar Conexão" vira **"Entrar"** e abre o modal que o
  site já tem, com duas escolhas: *Sou aluno* e *Sou salão ou profissional*.
- **Seção nova `#conexao-work`**, entre `#estrutura` e `#dez-anos`. A página
  passa a contar a história inteira: como ensinamos → o que você usa → onde você
  trabalha depois → 10 anos → fale com a gente.
- **Menu.** Hoje o item "Conexão Hair" aponta para a seção de **ação social** —
  o nome está errado desde o começo. Vira "Ação social", e entra "Conexão Work".
  No celular o menu passa a rolar na horizontal, em vez de ganhar mais uma linha.

### 4.3 Uma landing de verdade em `/work`

Âncora não é endereço. `#conexao-work` não vai na bio do Instagram, não entra em
cartão impresso e o Google não ranqueia. Então, além da seção, uma página inteira:

`site-hair/work.html` → sai em `hairacademiadabeleza.com.br/work`
(o `cleanUrls` do site já está ligado, não precisa de rewrite).

É a peça de venda para o salão: o que é, o que resolve (talento já formado, vaga,
equipamento, evento, biblioteca de gestão), a prova (4.000 formados desde 2017,
as ações sociais) e **um** botão: *Criar conta grátis* → `work.hairacademiadabeleza.com.br`.

### 4.4 O mapa

```
hairacademiadabeleza.com.br              vitrine · sem login · indexada
├── /                                     seção #conexao-work (chamada curta)
└── /work                                 landing do Work (peça de venda)
                                              │  "Criar conta grátis"
                                              ▼
work.hairacademiadabeleza.com.br         produto · com login · noindex
└── work.html                             talentos · vagas · marketplace ·
                                          eventos · podcasts · biblioteca
                                              │
                                              ▼
                              Supabase — RLS + RPC SECURITY DEFINER
                              (mesmo banco do app do aluno)
```

---

## 5. Ordem de execução

**Porta antes da placa.** Anunciar o Work no site antes de existir cadastro joga
o salão numa tela que manda ele "falar com a escola".

| # | O quê | Onde |
|---|---|---|
| 1 | Tela de cadastro da empresa — chama `empresa_cadastrar` | repo do app |
| 2 | Abertura com escolha: *Sou salão* / *Sou profissional* | repo do app |
| 3 | Cadastro e login do profissional avulso — `profissional_cadastrar`, `login_profissional` | repo do app |
| 4 | Domínio `work.…` apontado, com `noindex` | painel da Vercel + registro.br |
| 5 | Seção `#conexao-work`, menu e modal do "Entrar" | repo do site |
| 6 | Landing `/work` | repo do site |
| 7 | **Fase 5** — níveis prata/ouro e as duas fontes em `empresa_listar_talentos` (seção 6) | banco + repo do app |

Sem o passo 7, o passo 3 entrega uma conta que ninguém vê. Ele pode andar em
paralelo com 5 e 6, mas tem que estar no ar antes de o site convidar
profissional avulso a se cadastrar.

O passo 4 é o único que depende de acesso que eu não tenho.

---

## 6. Níveis de talento — o que já subiu e o que falta

Decisão do dono, 22/08: **o avulso aparece com áurea de prata** — dados simples,
sem histórico e sem foto de corte. **Ouro é aluno da HAIR ou quem paga o Clube.**

A Fase 5 subiu no mesmo dia e já entregou boa parte disso, sem saber da decisão.

### 6.1 O que a Fase 5 já fez

`empresa_listar_talentos` agora une as duas fontes e devolve, para o avulso:

| Campo | Valor |
|---|---|
| `tipo_perfil` | `'hair'` ou `'avulso'` — dá para separar |
| `experiencias` | `'[]'` fixo — **já nasce sem histórico** |
| `selo_nota` | `null` — **já nasce sem nota** |
| nome, cidade, `especialidades`, `foto_url`, `sobre` | preenchidos — os "dados simples" |

Ou seja: o *conteúdo* da prata já está certo, e cortado no banco, não na tela.
`plano_work` (`free` | `premium`) também já existe nas duas tabelas, declarado
como metadado que ainda não bloqueia nada.

### 6.2 O que falta — e por que cada coisa importa

**a) O nível não sai no payload.** Nem `plano_work`, nem nada equivalente. Como
o cartão do `work.html` (linha ~276) só olha `destaque` e `selo_nota`, **hoje um
avulso aparece igual a um aluno da HAIR**, só que sem a nota. O salão não tem
como saber quem a escola formou e quem se cadastrou pela rua. É exatamente a
confusão que a decisão do dono existe para evitar.

Falta um campo derivado, nunca coluna crua:

```
nivel = 'ouro'   se tipo_perfil = 'hair'
              ou se plano_work = 'premium' e plano_expira_em não venceu
        'prata'  caso contrário
```

**b) Falta `plano_expira_em`.** Sem ela, ouro comprado é ouro para sempre.
Com ela, o ouro **decai sozinho** quando o pagamento para: sem rotina agendada,
sem ninguém precisar lembrar de rebaixar.

**c) Falta onde guardar o histórico do avulso.** `profissionais_work` não tem
coluna de experiências — por isso o SQL devolve `'[]'` fixo. O Clube vai vender
"abre seu histórico" e não existe campo para escrever esse histórico. Sem
`experiencias jsonb default '[]'`, a promessa não tem onde encostar.

**d) Falta a ordenação por nível.** Hoje é `destaque desc, nome`. Como o avulso
entra com `destaque = false`, ele se mistura por ordem alfabética com os alunos
sem destaque. Ouro precisa vir antes de prata.

**e) Falta o cartão.** Áurea, selo "Formado na HAIR" (que já dá para montar a
partir do `tipo_perfil`) e o aviso do que o Clube abre.

### 6.3 Três marcas diferentes, que nunca se misturam

Esta é a parte que precisa ficar rígida, senão o produto perde o que vende.

| Marca | O que significa | Como se consegue |
|---|---|---|
| **Áurea prata / ouro** | nível de exibição | prata é o padrão; ouro vem de ser aluno da HAIR **ou** de pagar o Clube |
| **Selo "Formado na HAIR"** | de onde a pessoa veio | só matrícula na escola — **nunca** se compra |
| **Selo de nota** | quanto a pessoa entrega | só quem tem nota lançada pelo professor **e** autorizou mostrar |

Se a áurea de ouro puder ser comprada e vier junto com selo de nota, o salão
deixa de conseguir distinguir "a escola avaliou" de "essa pessoa pagou". Aí o
Conexão Work perde exatamente aquilo que ele tem de diferente de um grupo de
WhatsApp. Por isso: **ouro compra visibilidade, não compra reputação.**

### 6.4 O que cada nível mostra

| | Prata (grátis) | Ouro (aluno HAIR ou Clube) |
|---|---|---|
| Nome, cidade | sim | sim |
| Especialidades | sim | sim |
| Foto de perfil | sim | sim |
| Uma linha de "sobre" | sim | sim |
| Disponível para vaga | sim | sim |
| **Histórico / experiências** | **não** | sim |
| **Portfólio de fotos de corte** | **não** | sim |
| Selo de nota | não | só se for aluno e tiver autorizado |
| Selo "Formado na HAIR" | não | só se for aluno |
| Posição na lista | depois | antes |

Portfólio de foto de corte não entra agora nem no ouro do avulso: o `work.html`
ainda não tem StorageService, então não há upload de arquivo. Fica registrado
como pendência, não como esquecimento.

### 6.5 Ordenação

Ouro primeiro, prata depois. **Dentro do ouro, aluno da HAIR e membro do Clube
ficam misturados**, ordenados por destaque e nome.

Motivo: se todo aluno da escola vier sempre na frente, o Clube não compra nada —
com centenas de formados, o pagante nunca aparece, e ninguém renova. Quem
protege a credibilidade da escola é o selo "Formado na HAIR" no cartão, não a
posição na lista.

Se você preferir o contrário — aluno sempre primeiro —, é uma linha de `order
by`. Mas aí o Clube precisa vender outra coisa que não seja aparecer.

### 6.6 Como alguém vira ouro, por enquanto

Não existe pagamento automático no projeto. Então, na largada, `plano_work` é um
campo que a **coordenação vira na mão**, depois do PIX. É suficiente para começar
a cobrar e não trava nada esperando gateway.

A coluna `origem`, que já existe, cobre os casos de graça:
`cortesia` (liberado por acordo), `so_barbeiros` (grupo parceiro),
`vendedor_equipamento` (entrou para anunciar equipamento).

### 6.7 A áurea, visualmente

O app inteiro já é dourado. Então:

- **Ouro** — borda e brilho dourados, do jeito que os cartões da casa já são
- **Prata** — a mesma forma, em cinza-prata sem brilho

Prata não pode parecer defeito nem cartão quebrado. Tem que parecer o padrão da
casa — e o ouro, o degrau acima. É a diferença entre "esse aqui está incompleto"
e "aquele ali é destaque".

Prévia pronta em `preview-talentos.html`, no repositório do app, com os três
cartões lado a lado.

---

## 7. O que ainda precisa da sua decisão

1. **O cadastro do salão é livre ou passa por aprovação da coordenação?**
   `empresa_cadastrar` cria conta ativa na hora, sem filtro. Com 400 salões como
   meta, entra qualquer um que souber o endereço.
2. **Quanto custa o Clube, e é mensal ou anual?** Decide se `plano_expira_em`
   anda de mês em mês ou de ano em ano, e muda o texto da landing `/work`.
