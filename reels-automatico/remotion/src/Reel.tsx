import {
  AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import type { Palavra, ReelProps } from "./tipos";

const cssCor = (hex: string) => {
  // aceita #RRGGBB e #RRGGBBAA
  const h = hex.replace("#", "");
  if (h.length === 8) {
    const a = parseInt(h.slice(6, 8), 16) / 255;
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a.toFixed(3)})`;
  }
  return `#${h}`;
};

const Gancho: React.FC<{ texto: string; perfil: ReelProps["perfil"] }> = ({ texto, perfil }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const entrada = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const fim = perfil.gancho_duracao_seg * fps;
  const saida = interpolate(frame, [fim - 8, fim], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const t = perfil.legenda_maiusculas ? texto.toUpperCase() : texto;
  return (
    <div style={{
      position: "absolute", top: height * 0.16, left: 0, right: 0, display: "flex", justifyContent: "center",
      opacity: saida, transform: `scale(${0.85 + 0.15 * entrada})`,
    }}>
      <div style={{
        background: cssCor(perfil.gancho_fundo), color: cssCor(perfil.gancho_cor), padding: "18px 40px",
        borderRadius: 24, fontFamily: `"${perfil.legenda_fonte}", Inter, Arial, sans-serif`, fontWeight: 900,
        fontSize: perfil.gancho_tamanho, lineHeight: 1.1, textAlign: "center", maxWidth: "86%",
      }}>{t}</div>
    </div>
  );
};

const Linha: React.FC<{ palavras: Palavra[]; perfil: ReelProps["perfil"] }> = ({ palavras, perfil }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps + palavras[0].inicio; // tempo absoluto no vídeo
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 220 } });
  const c = perfil.legenda_contorno;
  const sombra = `${c}px ${c}px 0 #000, -${c}px -${c}px 0 #000, ${c}px -${c}px 0 #000, -${c}px ${c}px 0 #000, 0 ${c}px 0 #000, 0 -${c}px 0 #000, ${c}px 0 0 #000, -${c}px 0 0 #000`;
  return (
    <div style={{
      position: "absolute", top: height * perfil.legenda_posicao_vertical, left: 60, right: 60,
      display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 22px",
      transform: `translateY(-50%) scale(${0.86 + 0.14 * pop})`,
      fontFamily: `"${perfil.legenda_fonte}", Inter, Arial, sans-serif`, fontWeight: 900,
      fontSize: perfil.legenda_tamanho, lineHeight: 1.15, textShadow: sombra,
    }}>
      {palavras.map((p, i) => {
        const ativa = t >= p.inicio && (i === palavras.length - 1 || t < palavras[i + 1].inicio);
        return (
          <span key={i} style={{ color: ativa ? perfil.legenda_cor_destaque : perfil.legenda_cor, transform: ativa ? "scale(1.08)" : "none", display: "inline-block" }}>
            {perfil.legenda_maiusculas ? p.texto.toUpperCase() : p.texto}
          </span>
        );
      })}
    </div>
  );
};

const ImagemBRoll: React.FC<{ arquivo: string; duracao: number }> = ({ arquivo, duracao }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const total = duracao * fps;
  const alpha = interpolate(frame, [0, 8, total - 8, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const entrada = spring({ frame, fps, config: { damping: 16 } });
  return (
    <div style={{ position: "absolute", left: width * 0.04, right: width * 0.04, top: height * 0.5 - height * 0.12, transform: `translateY(-50%) scale(${0.92 + 0.08 * entrada})`, opacity: alpha, display: "flex", justifyContent: "center" }}>
      <Img src={staticFile(arquivo)} style={{ width: "100%", borderRadius: 28, boxShadow: "0 24px 60px rgba(0,0,0,.45)" }} />
    </div>
  );
};

export const Reel: React.FC<ReelProps> = ({ video, gancho, perfil, linhas, imagens }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {video ? <OffthreadVideo src={staticFile(video)} /> : null}
      {imagens.map((im, i) => (
        <Sequence key={i} from={Math.round(im.inicio * fps)} durationInFrames={Math.max(1, Math.round(im.duracao * fps))}>
          <ImagemBRoll arquivo={im.arquivo} duracao={im.duracao} />
        </Sequence>
      ))}
      {linhas.map((l, i) => {
        const ini = Math.round(l[0].inicio * fps);
        const fim = Math.round((l[l.length - 1].fim + 0.15) * fps);
        return (
          <Sequence key={i} from={ini} durationInFrames={Math.max(1, fim - ini)}>
            <Linha palavras={l} perfil={perfil} />
          </Sequence>
        );
      })}
      {gancho ? (
        <Sequence from={0} durationInFrames={Math.round(perfil.gancho_duracao_seg * fps)}>
          <Gancho texto={gancho} perfil={perfil} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
