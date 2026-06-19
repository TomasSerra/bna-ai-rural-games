export type EstiloId = 'realista' | 'pixar' | 'caricatura2d' | 'lego';

export interface Opciones {
  ambiente: string;
  accion: string;
  estilo: EstiloId;
}
