export type Palavra = { inicio: number; fim: number; texto: string };

export type Imagem = { arquivo: string; inicio: number; duracao: number };

export type Perfil = {
  largura: number;
  altura: number;
  fps: number;
  legenda_palavras_por_linha: number;
  legenda_fonte: string;
  legenda_tamanho: number;
  legenda_cor: string;
  legenda_cor_destaque: string;
  legenda_contorno: number;
  legenda_posicao_vertical: number;
  legenda_maiusculas: boolean;
  gancho_duracao_seg: number;
  gancho_tamanho: number;
  gancho_cor: string;
  gancho_fundo: string;
};

export type ReelProps = {
  video: string; // nome do arquivo dentro de remotion/public/
  duracao: number;
  gancho: string | null;
  perfil: Perfil;
  linhas: Palavra[][]; // legendas já agrupadas pelo reel.py
  imagens: Imagem[]; // nomes dentro de remotion/public/
};
