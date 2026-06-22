import type { EstiloId, Opciones } from '@imagenes/types';
import { ACCIONES, AMBIENTES, ESTILOS } from './options';

interface ExtraReference {
  label: string;
  url: string;
}

const EXTRA_REFERENCES: Record<string, ExtraReference> = {
  mate: {
    label: 'traditional Argentine mate gourd with a metal bombilla',
    url: '/shared/mate.png',
  },
  asado: {
    label: 'costillar a la estaca (beef rib rack mounted on an iron cross stake over the fire)',
    url: '/shared/costillar.png',
  },
};

export interface BuiltPrompt {
  prompt: string;
  extraReferenceUrl: string | null;
}

export function buildPrompt(opciones: Opciones): BuiltPrompt {
  const ambiente = AMBIENTES.find((a) => a.id === opciones.ambiente)?.en ?? '';
  const accion = ACCIONES.find((a) => a.id === opciones.accion)?.en ?? '';
  const estilo = ESTILOS.find((e) => e.id === opciones.estilo)?.en ?? 'photograph';

  const extraRef = EXTRA_REFERENCES[opciones.accion] ?? null;

  // Etiqueta corta de cada estilo. Todos los estilos de este juego son no
  // fotográficos, así que el objetivo siempre es una conversión total de estilo
  // preservando la identidad a nivel de rasgos (no de píxeles).
  const STYLIZED_LABELS: Record<EstiloId, string> = {
    pixar: 'Disney/Pixar 3D animated',
    caricatura2d: '2D hand-drawn caricature',
    caricatura3d: 'semi-realistic 3D caricature',
    ghibli: 'Studio Ghibli 2D anime',
  };
  const stylizedLabel = STYLIZED_LABELS[opciones.estilo] ?? 'illustrated';

  // The mate gourd must be HELD, not drunk — keep it out of the mouth.
  const mateLine =
    opciones.accion === 'mate'
      ? `The mate gourd is only held in the hand and is NOT being drunk: it is not raised to the lips, the bombilla is not in the mouth, the person is not sipping — the mate simply rests in their hand.`
      : '';

  const asadoLine =
    opciones.accion === 'asado'
      ? `Use the second reference image ONLY as the shape and layout guide for the costillar a la estaca (the beef rib rack on the iron cross stake): match its silhouette and structure, but fully re-render it in the same ${stylizedLabel} style, materials and lighting as the rest of the scene — do NOT paste it as a flat 2D drawing, it must be a natural three-dimensional part of the scene.`
      : '';

  const lines = [
    `Completely re-render this person as a brand-new ${stylizedLabel} artwork. This is a FULL style conversion, NOT a photo edit and NOT a filter: the result must clearly look like a ${stylizedLabel} image and must NOT look like a photograph of a real person. Redraw the face, hair, body, clothing and the whole scene from scratch in the ${stylizedLabel} style, with its characteristic shapes, proportions, textures, shading and lighting.`,
    `Style: ${estilo}.`,
    `While converting to the style, preserve the person's IDENTITY so they stay instantly recognizable as the same individual: carry over their eye color and eye shape, eyebrow shape, nose shape, mouth and smile, overall face shape and jawline, skin tone, hair color and hairstyle, facial hair, gender, approximate age, ethnicity, and any distinguishing marks (moles, freckles, glasses, scars). Translate those real features faithfully INTO the ${stylizedLabel} style — do not invent a different person, but do not keep photographic realism either.`,
    `Action: ${accion}.`,
    mateLine,
    asadoLine,
    `Scene: ${ambiente}.`,
    extraRef ? `Match the ${extraRef.label} to the second reference image.` : '',
    opciones.estilo === 'caricatura2d' || opciones.estilo === 'caricatura3d'
      ? `Vertical 9:16 composition with the character centered and the scene visible all around them — leave clear room for the background on every side. Cinematic, rich detail.`
      : `Waist-up vertical 9:16 portrait, cinematic, rich detail.`,
    `FINAL REMINDER: (1) the ENTIRE image, face included, is fully rendered in the ${stylizedLabel} style and must NOT resemble the original photograph or look like a real photo; (2) the person is still clearly recognizable through their preserved features — same eye color, nose, mouth, face shape, hair color and gender; (3) the background fills the entire frame in the chosen style — no empty white space.`,
  ].filter(Boolean);

  return { prompt: lines.join(' '), extraReferenceUrl: extraRef?.url ?? null };
}
