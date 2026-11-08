import { Composition } from "remotion";
import { Reel } from "./Reel";
import type { ReelProps } from "./tipos";

const padrao: ReelProps = {
  video: "",
  duracao: 5,
  gancho: "Gancho de exemplo",
  perfil: {
    largura: 1080, altura: 1920, fps: 30,
    legenda_palavras_por_linha: 3, legenda_fonte: "Inter Display Black", legenda_tamanho: 96,
    legenda_cor: "#FFFFFF", legenda_cor_destaque: "#FFD400", legenda_contorno: 6,
    legenda_posicao_vertical: 0.72, legenda_maiusculas: true,
    gancho_duracao_seg: 2.6, gancho_tamanho: 104, gancho_cor: "#FFFFFF", gancho_fundo: "#000000AA",
  },
  linhas: [[{ inicio: 0.3, fim: 0.7, texto: "legenda" }, { inicio: 0.7, fim: 1.2, texto: "de" }, { inicio: 1.2, fim: 1.8, texto: "exemplo" }]],
  imagens: [],
};

export const Root = () => (
  <Composition
    id="Reel"
    component={Reel}
    defaultProps={padrao}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={150}
    calculateMetadata={({ props }) => ({
      width: props.perfil.largura,
      height: props.perfil.altura,
      fps: props.perfil.fps,
      durationInFrames: Math.max(1, Math.ceil(props.duracao * props.perfil.fps)),
    })}
  />
);
