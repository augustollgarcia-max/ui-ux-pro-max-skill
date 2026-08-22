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

**1. A Fase 4 não tem tela.**
`empresa_cadastrar`, `profissional_cadastrar` e `login_profissional` estão no
banco e não são chamados por nenhuma linha do `work.html`. A tela de login ainda
diz *"Acesso liberado pela coordenação da HAIR. Ainda não tem conta? Fale com a
escola."* A meta de 400 salões existe no banco; a porta não existe.

**2. O site não cita o Conexão Work.** Nenhuma vez. O único botão de entrada é
"Acessar Conexão", que leva ao app do aluno.

**3. O profissional avulso nasce invisível.**
`empresa_listar_talentos` lê só `perfis_conexao`, ou seja, só aluno da HAIR. Quem
se cadastrar como profissional avulso não aparece para empresa nenhuma. A própria
migration da Fase 4 registra isso como decisão adiada para uma Fase 5. Anunciar
"profissional avulso" no site antes disso é prometer o que não entrega.

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
| 7 | **Fase 5** — juntar profissional avulso ao `empresa_listar_talentos` | banco + repo do app |

Sem o passo 7, o passo 3 entrega uma conta que ninguém vê.

O passo 4 é o único que depende de acesso que eu não tenho.

---

## 6. O que precisa da sua decisão

1. **O profissional avulso entra já na comunicação do site, ou só depois da
   Fase 5?** Recomendo só depois — hoje ele se cadastra e fica invisível.
2. **O cadastro do salão é livre ou passa por aprovação da coordenação?**
   Hoje `empresa_cadastrar` cria conta ativa na hora, sem filtro.
3. **Vai cobrar alguma coisa em algum momento?** Se sim, a landing nasce com
   outro tom, e é mais barato acertar agora do que reescrever depois.
