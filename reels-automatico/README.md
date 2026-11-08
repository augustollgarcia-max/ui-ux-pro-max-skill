# REELS AUTOMÁTICO — máquina de Reels com Claude Code

Transforma um vídeo bruto (gravado no celular) em um Reel pronto: **corta os silêncios, enquadra em 9:16,
normaliza o áudio, transcreve com Whisper, grava legendas palavra por palavra, gancho animado e imagens de apoio**.
Configura uma vez e reutiliza para todos os vídeos. Ajustes se fazem por comando, sem editar cena a cena.

## Pastas

| Pasta | O que vai aqui |
|---|---|
| `ARQUIVO-BRUTO/` | Os vídeos gravados (mp4/mov), do jeito que saíram do celular |
| `REFERENCIAS/` | 3 a 5 Reels de referência para o Claude aprender o estilo (ritmo de corte, duração) |
| `IMAGENS/` | Fotos, prints e artes para entrar como B-roll |
| `ESTILO/` | `perfil-padrao.json` (editável) e `perfil.json` (aprendido das referências) |
| `SAIDA/<nome>/` | `reel-final.mp4`, `edicao.json` (o plano), `transcricao.json`, `relatorio.md` |

## Instalar (uma vez)

```bash
bash setup.sh
```

Instala/confere: FFmpeg (cortes e exportação), faster-whisper (legendas sincronizadas), yt-dlp (referências),
Remotion (animações). Hyperframes é opcional: `npx hyperframes init hyperframes`.

## Usar

```bash
# 1. Ensinar o estilo (opcional, mas recomendado): coloque 3 a 5 vídeos em REFERENCIAS/ ou baixe
python3 reel.py baixar "https://www.instagram.com/reel/XXXX/"
python3 reel.py aprender --transcrever

# 2. Montar o Reel
python3 reel.py montar ARQUIVO-BRUTO/meu-video.mp4 --gancho "Pare de perder cliente no WhatsApp"

# 3. Ajustar por comando (re-renderiza só o que mudou)
python3 reel.py ajustar meu-video --gancho "Novo gancho"
python3 reel.py ajustar meu-video --remover 12.5-15        # tempos do vídeo final
python3 reel.py ajustar meu-video --inserir IMAGENS/print.png@4:2.5
python3 reel.py ajustar meu-video --estilo legenda_cor_destaque='"#00FF88"' --estilo zoom_dinamico=false
python3 reel.py ajustar meu-video --motor remotion          # acabamento com animações React

# Corrigir uma palavra da legenda: edite SAIDA/meu-video/transcricao.json e rode
python3 reel.py renderizar meu-video
```

Com o Claude Code aberto nesta pasta basta pedir em português: *"monta o reel do video-3 com gancho X"*,
*"tira o trecho dos 12 aos 15 segundos"*, *"coloca o print do WhatsApp aos 4 segundos"*, *"muda a cor da legenda para verde"*.
A skill `.claude/skills/reels-automatico` traduz isso para os comandos acima.

## O que cada etapa faz

1. **Cortes dinâmicos**: `silencedetect` acha as pausas; cada trecho de fala vira um bloco e os blocos alternam zoom
   (`zoom_fator`, `zoom_a_cada_seg`) simulando os jump cuts dos Reels.
2. **Enquadro 9:16**: `crop` central (padrão) ou `blur` (vídeo inteiro sobre fundo desfocado). Vídeo de celular com rotação nos metadados é tratado.
3. **Áudio**: `loudnorm` para -14 LUFS (padrão Instagram/TikTok).
4. **Transcrição**: faster-whisper (`modelo_whisper`: tiny/base/small/medium/large-v3) com tempo de cada palavra.
5. **Legendas**: 2 a 4 palavras por linha, palavra falada em destaque, animação de entrada. Motor `ffmpeg` (libass, rápido)
   ou `remotion` (React, mola/spring, mais acabamento).
6. **Gancho**: cartão nos primeiros `gancho_duracao_seg` segundos.
7. **Imagens**: B-roll com fade em `IMG@INICIO:DURACAO`.

Tudo que foi decidido fica em `SAIDA/<nome>/edicao.json`. Editar esse arquivo e rodar `renderizar` reproduz a edição.

## Perfil de estilo (`ESTILO/perfil-padrao.json`)

| Chave | Efeito |
|---|---|
| `enquadro` | `crop` ou `blur` |
| `silencio_db`, `silencio_min_seg`, `folga_corte_seg` | sensibilidade dos cortes |
| `zoom_dinamico`, `zoom_fator`, `zoom_a_cada_seg` | jump cuts simulados |
| `legenda_palavras_por_linha`, `legenda_fonte`, `legenda_tamanho`, `legenda_cor`, `legenda_cor_destaque`, `legenda_posicao_vertical`, `legenda_maiusculas` | aparência das legendas |
| `gancho_duracao_seg`, `gancho_tamanho`, `gancho_cor`, `gancho_fundo` | cartão do gancho |
| `idioma`, `modelo_whisper` | transcrição |

`reel.py aprender` grava em `ESTILO/perfil.json` só o que mede nas referências (duração alvo, ritmo de corte, palavras por linha);
o resto continua vindo do `perfil-padrao.json`.

## Limites conhecidos

- Whisper `small` erra palavras raras ("Reels" pode virar "rio"): corrija em `transcricao.json` ou use `modelo_whisper: "medium"`.
- yt-dlp só baixa o que a plataforma permite; Instagram/YouTube bloqueiam alguns IPs. Baixe no seu computador, não em servidor.
- Remotion precisa de Chrome/Chromium; baixa um sozinho na primeira vez (ou `REEL_CHROMIUM=/caminho/chrome`).
- Sem áudio não há corte nem legenda: a máquina é para vídeo falado.
