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

  // Pixar and caricatura push the model hardest away from the reference face.
  // For those, repeat an explicit per-feature reminder so identity wins over
  // the style's pull toward a generic cartoon face.
  const STYLIZED_LABELS: Partial<Record<EstiloId, string>> = {
    pixar: 'animated 3D',
    caricatura2d: '2D hand-drawn caricature',
    caricatura3d: '3D caricature',
    ghibli: 'Ghibli 2D anime',
  };
  const stylizedLabel = STYLIZED_LABELS[opciones.estilo];
  const stylizedIdentityLine = stylizedLabel
    ? `IMPORTANT: even though the style is ${stylizedLabel}, the rendered face must keep the person's actual identifiable features from the reference image — their exact eye shape and color, their exact nose shape, their exact mouth shape, their exact hair color and style, their gender. Apply the style as a surface treatment (lighting, shading, line work) but DO NOT redraw the face into a generic cartoon character.`
    : '';

  // The mate gourd must be HELD, not drunk — keep it out of the mouth.
  const mateLine =
    opciones.accion === 'mate'
      ? `The mate gourd is only held in the hand and is NOT being drunk: it is not raised to the lips, the bombilla is not in the mouth, the person is not sipping — the mate simply rests in their hand.`
      : '';

  const lines = [
    `Render the EXACT same person from the reference image. Treat the reference photo as the ground truth for the face: keep the exact facial proportions and the exact size, shape and spacing of the eyes, nose, mouth, eyebrows and jawline, plus the same skin tone, the same hair color and style, the same gender, age and ethnicity, and every distinguishing mark (moles, freckles, facial hair, scars). The generated face must be an unmistakable, instantly recognizable likeness of that exact individual — do not invent a new face, do not beautify or average the features, do not blend with anyone else.`,
    `Style: ${estilo}.`,
    stylizedIdentityLine,
    `Action: ${accion}.`,
    mateLine,
    `Scene: ${ambiente}.`,
    extraRef ? `Match the ${extraRef.label} to the second reference image.` : '',
    opciones.estilo === 'caricatura2d' || opciones.estilo === 'caricatura3d'
      ? `Vertical 9:16 composition with the character centered and the scene visible all around them — leave clear room for the background on every side. Cinematic, rich detail.`
      : `Waist-up vertical 9:16 portrait, cinematic, rich detail.`,
    `FINAL REMINDER: (1) the face in the generated image is a clear, recognizable likeness of the person in the reference image — same eyes, same nose, same mouth, same jawline, same gender, do not stylize the facial structure away from that reference; (2) the background fills the entire frame in the chosen style — no empty white space.`,
  ].filter(Boolean);

  return { prompt: lines.join(' '), extraReferenceUrl: extraRef?.url ?? null };
}
