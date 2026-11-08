# CLAUDE.md — reels-automatico

Esta pasta é a máquina de Reels do Augusto. Ele pede por áudio/texto; você traduz para `python3 reel.py ...` e executa.
Regras:

1. **Nunca mande o Augusto editar cena a cena.** Tudo é comando: `montar`, `ajustar`, `renderizar`, `aprender`, `baixar`.
2. Vídeo novo em `ARQUIVO-BRUTO/` → `python3 reel.py montar ARQUIVO-BRUTO/<arquivo> --gancho "<gancho>"`. Se ele não deu gancho,
   proponha um a partir da transcrição (`SAIDA/<nome>/transcricao.txt`) e já renderize com ele.
3. Ajustes: `ajustar <nome> --gancho/--remover INI-FIM/--inserir IMG@INICIO:DUR/--estilo CHAVE=VALOR/--motor remotion`.
   Tempos de `--remover` são do vídeo FINAL (o que ele assistiu).
4. Palavra errada na legenda → edite `SAIDA/<nome>/transcricao.json` (campo `texto`) e rode `renderizar <nome>`.
5. Antes de dizer "pronto": `ffprobe` do `reel-final.mp4` (1080x1920, 30 fps, áudio) e 2 ou 3 frames extraídos com `ffmpeg -ss`
   para conferir gancho, legenda e imagens. Relate o que conferiu.
6. Referências: `baixar <url>` só quando o download é permitido; depois `aprender --transcrever`.
7. Não instale nada fora do `setup.sh` sem avisar. Não commite mídia (o `.gitignore` já cuida).
8. Logos da Vértice e da HAIR nunca mudam (regra do repositório): imagens de logo entram como estão.
