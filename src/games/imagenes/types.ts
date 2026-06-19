export type EstiloId = 'ghibli' | 'pixar' | 'caricatura2d' | 'caricatura3d';

export interface Opciones {
  ambiente: string;
  accion: string;
  estilo: EstiloId;
}
