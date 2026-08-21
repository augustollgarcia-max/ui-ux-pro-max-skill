# Publicar o Conexão Hair na Play Store

App: **Conexão Hair** (PWA em `app.hairacademiadabeleza.com.br`)
Método: **TWA** — o app Android abre o site dentro dele, sem barra de navegador.
Vantagem: toda atualização do site aparece no app automaticamente, sem republicar na loja.

---

## ⚠️ Leia primeiro: o que decide o prazo

| Tipo de conta no Play Console | Exigência antes de publicar |
|---|---|
| **Empresa (organização)** | Nenhuma. Publica direto. |
| Pessoal criada **antes** de 13/11/2023 | Nenhuma. Publica direto. |
| Pessoal criada **depois** de 13/11/2023 | **12 testadores reais × 14 dias seguidos** de teste fechado |

A HAIR é empresa — vale abrir como **organização**. Precisa de CNPJ e de um número
**D-U-N-S** (gratuito, sai em alguns dias pelo site da Dun & Bradstreet).

Custo da conta: **US$ 25**, pagamento único.

---

## Etapa 1 — Publicar o assetlinks.json (sem isso o app fica com barra de navegador)

O Google precisa confirmar que o app e o site são da mesma dona. Isso é feito por um arquivo
no site do app.

O arquivo precisa ficar acessível exatamente aqui:

```
https://app.hairacademiadabeleza.com.br/.well-known/assetlinks.json
```

Conteúdo (o `SHA256` sai na Etapa 2, ou o Google fornece após ativar o Play App Signing):

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "br.com.hairacademiadabeleza.conexao",
    "sha256_cert_fingerprints": ["COLE_AQUI_O_SHA256_DO_CERTIFICADO"]
  }
}]
```

**Onde colocar:** no repositório `conexao-hair-deploy`, criar a pasta `.well-known/` na raiz e
salvar o arquivo dentro. É um arquivo estático — não mexe em login, service worker nem PWA.

---

## Etapa 2 — Gerar o app (num computador, não dá pra fazer numa sessão bloqueada)

Precisa de **Node.js** instalado. Abra o terminal e rode:

```bash
# 1. instalar a ferramenta
npm install -g @bubblewrap/cli

# 2. criar o projeto a partir do PWA
bubblewrap init --manifest https://app.hairacademiadabeleza.com.br/manifest.json
```

Ele vai perguntar várias coisas. Responda assim:

| Pergunta | Resposta |
|---|---|
| Domain | `app.hairacademiadabeleza.com.br` |
| Application name | `Conexão Hair` |
| Short name | `Conexão Hair` |
| Application ID / package | `br.com.hairacademiadabeleza.conexao` |
| Display mode | `standalone` |
| Status bar color | `#006b3a` |
| Splash screen color | `#0b1a0e` |
| Icon URL | `https://app.hairacademiadabeleza.com.br/icon-512.png` |
| Include support for shortcuts | `No` |
| Signing key — create new? | `Yes` |

Na primeira vez ele oferece baixar o JDK e o Android SDK sozinho — **aceite**.

```bash
# 3. gerar o arquivo que sobe pra loja
bubblewrap build
```

Saem dois arquivos:
- **`app-release-bundle.aab`** ← é este que sobe na Play Store
- `app-release-signed.apk` ← só para testar no celular antes

```bash
# 4. pegar o SHA256 para o assetlinks.json da Etapa 1
keytool -list -v -keystore android.keystore -alias android
```

Copie a linha **SHA256** e cole no `assetlinks.json`.

> 🔑 **Guarde o arquivo `android.keystore` e a senha em lugar seguro.**
> Se perder, você perde o direito de atualizar o app e precisa publicar outro do zero.
> Guarde uma cópia fora do computador (nuvem privada, pen drive).

---

## Etapa 3 — Ficha da loja (é só copiar e colar)

**Nome do app** (máx. 30 caracteres)
```
Conexão Hair
```

**Descrição curta** (máx. 80 caracteres)
```
A formação da HAIR Academia da Beleza no seu bolso.
```

**Descrição completa** (máx. 4000 caracteres)
```
O Conexão Hair é o aplicativo dos alunos da HAIR Academia da Beleza, em Ribeirão Preto.

Ele acompanha você do primeiro dia de aula até a formatura — e depois, na carreira.

O QUE VOCÊ ENCONTRA

• Cronograma das aulas e avisos da coordenação
• Registro de presença e acompanhamento da sua frequência
• Sua evolução técnica, com retorno dos professores
• Biblioteca de conteúdos e materiais de apoio
• Portfólio dos seus trabalhos, para mostrar ao mercado
• Certificados de conclusão
• Oportunidades de trabalho e conexão com salões e barbearias
• Ações sociais da escola e sua participação nelas

PARA QUEM É

O acesso é exclusivo para alunos matriculados nas formações da HAIR Academia da Beleza:
Conexão Barber, Conexão Beauty e Conexão Brow & Lash.

Se você ainda não é aluno, conheça as formações em hairacademiadabeleza.com.br
ou fale com a gente pelo WhatsApp (16) 99168-7977.

SOBRE A HAIR

Mais de 4.000 profissionais formados desde 2017. Formação prática, com modelos reais,
tecnologia de acompanhamento e conexão direta com o mercado da beleza.

HAIR Academia da Beleza
Av. Portugal, 318 — Vila Seixas — Ribeirão Preto/SP
```

**Categoria:** Educação
**Tags:** educação, beleza, barbearia, cabeleireiro, curso
**E-mail de contato:** (preencher — obrigatório)
**Site:** `https://hairacademiadabeleza.com.br`
**Política de privacidade:** `https://hairacademiadabeleza.com.br/privacidade`

---

## Etapa 4 — Imagens da loja

| Item | Tamanho | Situação |
|---|---|---|
| Ícone | 512 × 512 PNG | ✅ já existe: `icon-512.png` no repo do app |
| Imagem de destaque | 1024 × 500 PNG | ✅ gerada: `assets/play-feature-graphic.png` |
| Screenshots do celular | mín. 2, entre 320px e 3840px | ❌ **falta** — ver abaixo |

**Como tirar os screenshots (5 minutos):**
1. Abra `app.hairacademiadabeleza.com.br` no celular e faça login
2. Tire print de 4 a 6 telas: início, cronograma, evolução, biblioteca, portfólio, certificados
3. Suba direto no Play Console

Não use telas com dados reais de aluno — use uma conta de teste ou apague o nome depois.

---

## Etapa 5 — Formulário de Segurança de Dados

O Google pergunta o que o app coleta. Responda exatamente assim — está tudo conferido no
código do app:

**Coleta dados?** Sim
**Compartilha com terceiros?** Sim (apenas prestadores de serviço: Google, Supabase, Firebase, Vercel)
**Dados criptografados em trânsito?** Sim
**Usuário pode pedir exclusão?** Sim

| Categoria | Coletado | Obrigatório | Para quê |
|---|---|---|---|
| Nome | Sim | Sim | Funcionalidade do app |
| E-mail | Sim | Sim | Funcionalidade do app · Login |
| Telefone | Sim | Não | Funcionalidade do app |
| **ID do usuário (CPF)** | **Sim** | **Sim** | Funcionalidade do app · emissão de certificado |
| Data de nascimento | Sim | Não | Funcionalidade do app |
| Fotos | Sim | Não | Funcionalidade do app · portfólio |
| Arquivos enviados | Sim | Não | Funcionalidade do app |

> ⚠️ **Não esconda o CPF.** É a causa mais comum de reprovação. Declare como
> "ID do usuário" ou "Outras informações pessoais".

**Classificação de conteúdo:** responda o questionário — o app não tem violência, sexo,
jogos de azar nem compras. Deve sair como **Livre**.

---

## Etapa 6 — Subir

1. Acesse `play.google.com/console` e crie o app
2. Preencha ficha, imagens, segurança de dados e classificação
3. Suba o `app-release-bundle.aab`
4. **Ative o Play App Signing** quando ele oferecer (recomendado — o Google guarda uma cópia
   da chave, então perder o keystore deixa de ser fatal)
5. Se ativar o Play App Signing, o Google mostra um **novo SHA256**. Atualize o
   `assetlinks.json` da Etapa 1 com ele, senão o app abre com barra de navegador.
6. Enviar para revisão

**Prazo de revisão:** de algumas horas a 7 dias na primeira publicação.

---

## Checklist final

- [ ] Conta no Play Console criada (de preferência como organização)
- [ ] CNPJ e e-mail preenchidos na política de privacidade (`privacidade.html`)
- [ ] `assetlinks.json` publicado em `app.hairacademiadabeleza.com.br/.well-known/`
- [ ] `.aab` gerado pelo Bubblewrap
- [ ] Keystore guardado em lugar seguro, com backup
- [ ] Screenshots tirados
- [ ] Segurança de dados preenchida, com o CPF declarado
- [ ] Política de privacidade no ar em `hairacademiadabeleza.com.br/privacidade`

---

## O que já está pronto

- ✅ Política de privacidade escrita e publicada no site
- ✅ Imagem de destaque 1024×500
- ✅ Textos da loja
- ✅ Respostas do formulário de segurança de dados
- ✅ Ícones 192 e 512 já existem no app
- ✅ Manifest do PWA já está correto (nome, cores, modo standalone)

## O que só você pode fazer

- Criar e pagar a conta no Play Console
- Rodar o Bubblewrap num computador com internet liberada
- Tirar os screenshots
- Subir e enviar para revisão
