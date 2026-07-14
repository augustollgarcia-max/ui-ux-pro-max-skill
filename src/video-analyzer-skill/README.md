# Video Analyzer Skill para Claude

Uma skill poderosa que permite ao Claude analisar vídeos automaticamente e extrair:

- 🔊 **Configuração de Áudio** - Setup completo de microfone, interface, software e settings
- 🎨 **Templates Visuais** - Resolução, aspect ratio, FPS e recomendações de design
- 📋 **Recomendações Completas** - Guia total para montar seu estúdio profissional

## 🚀 Como Usar

### 1. Instalação

```bash
# Clonar/atualizar o repositório
git clone https://github.com/augustollgarcia-max/ui-ux-pro-max-skill.git
cd ui-ux-pro-max-skill

# Instalar dependências
pip install -r src/video-analyzer-skill/requirements.txt
```

### 2. Usar no Claude Code

Abra o repositório no Claude Code e simplesmente envie links de vídeos:

```
Analise este vídeo para eu montar meu estúdio de produção:
https://youtube.com/watch?v=dQw4w9WgXcQ
```

Claude responderá com:
- Setup de áudio completo
- Especificações visuais
- Recomendações de equipamento
- Ferramentas sugeridas

### 3. Exemplos de Prompts

#### Análise Completa
```
Analise este vídeo e monte um setup completo para mim:
https://youtube.com/watch?v=...
```

#### Apenas Áudio
```
Extraia as recomendações de áudio deste link:
https://vimeo.com/...
```

#### Apenas Visual
```
Quais são as especificações visuais deste vídeo?
https://youtube.com/watch?v=...
```

## 📊 O Que a Skill Extrai

### 🔊 Áudio Setup
- Tipo de microfone recomendado
- Interface de áudio necessária
- Software de gravação
- Sample rate, bit depth, canais
- Bitrate alvo

### 🎨 Visual Templates
- Resolução nativa
- Aspect ratio calculado
- FPS do vídeo
- Frames-chave extraídas
- Ferramentas de design recomendadas

### 📋 Recomendações
- Tipo de produção
- Setup de iluminação
- Tipo de fundo/backdrop
- Custo estimado

## 🔧 Estrutura

```
src/video-analyzer-skill/
├── video_analyzer.py        # Motor principal
├── claude_integration.py     # Integração Claude
├── skill.json               # Configuração
├── requirements.txt         # Dependências
└── README.md               # Este arquivo
```

## 📦 Dependências

- **Python 3.8+**
- **yt-dlp** - Download e análise de vídeos

## 💡 Recursos Técnicos

- Suporta YouTube, Vimeo, Dailymotion e mais
- Extrai metadados sem baixar vídeo completo
- Análise de formatos de áudio disponíveis
- Cálculo automático de aspect ratio
- Geração de recomendações inteligentes

## 🎯 Casos de Uso

1. **Montando Estúdio** - Analise vídeos de referência para saber o setup ideal
2. **Criando Conteúdo** - Extraia templates visuais para seus projetos
3. **Design de UI/UX** - Mapeie especificações visuais para criar interfaces
4. **Produção de Vídeo** - Configure seu ambiente baseado em referências

## ⚙️ Instalação Avançada

### Com Claude Code (Recomendado)

1. Abra o repositório no Claude Code
2. A skill se ativa automaticamente
3. Envie um link de vídeo

### Manual com Python

```bash
cd src/video-analyzer-skill
python video_analyzer.py "https://youtube.com/watch?v=..."
```

## 📝 Notas

- A skill NÃO baixa o vídeo completo
- Usa apenas APIs públicas (yt-dlp)
- Funciona com qualquer plataforma de vídeo suportada por yt-dlp
- Resultados salvos em `video_analysis_output/`

## 🔐 Privacidade

- Nenhum vídeo é armazenado
- Apenas metadados são processados
- Análise local no seu computador
- Sem envio de dados para servidores externos

## 📄 Licença

MIT

## 🤝 Suporte

Para dúvidas ou melhorias, abra uma issue no repositório!
