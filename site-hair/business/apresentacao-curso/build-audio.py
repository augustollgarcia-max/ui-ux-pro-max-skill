#!/usr/bin/env python3
"""Monta a trilha final: narração por cena (posicionada na linha do tempo) +
música de fundo com ducking. Uso: build-audio.py <pasta_voz> <musica.mp3> <saida.wav>
A linha do tempo (pré/pós de cada cena) espelha a tabela TL de motion.html."""
import json, subprocess, sys
voz, musica, saida = sys.argv[1:4]
dur = json.load(open(f"{voz}/duracoes.json"))
ids = ["s01","s02","s03","s04","s05","s06","s07","s08","s09","s10","s11"]
PRE = {"s01": 1.2}; POST = {"s11": 4.0}
t = 0.0; starts = {}; tl = []
for i in ids:
    pre = PRE.get(i, 0.5); post = POST.get(i, 0.8)
    starts[i] = t + pre
    d = round(pre + dur[i] + post, 2)
    tl.append([i, d]); t += d
total = round(t, 2)
print("TIMELINE", json.dumps(tl), "total", total)
inputs = []; fc = []
for n, i in enumerate(ids):
    inputs += ["-i", f"{voz}/{i}.wav"]
    ms = int(starts[i] * 1000)
    fc.append(f"[{n}:a]adelay={ms}|{ms}[v{n}]")
fc.append("".join(f"[v{n}]" for n in range(len(ids))) + f"amix=inputs={len(ids)}:normalize=0:dropout_transition=0,apad=whole_dur={total}[vo]")
inputs += ["-i", musica]
m = len(ids)
fc.append(f"[{m}:a]atrim=0:{total},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.5,afade=t=out:st={total-3.5}:d=3.5,volume=0.42[mus]")
fc.append("[vo]asplit=2[vo1][sc]")
fc.append("[mus][sc]sidechaincompress=threshold=0.015:ratio=7:attack=40:release=700:makeup=1[musd]")
fc.append("[musd][vo1]amix=inputs=2:normalize=0,alimiter=limit=0.95[out]")
cmd = ["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(fc), "-map", "[out]", "-ar", "48000", "-ac", "2", saida]
subprocess.run(cmd, check=True)
json.dump({"timeline": tl, "total": total, "starts": starts}, open(f"{voz}/timeline.json", "w"), indent=1)
print("ok", saida)
