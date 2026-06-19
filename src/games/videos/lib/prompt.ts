import type { EstiloId, Opciones } from '@videos/types';
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

export interface BuiltImagePrompt {
  prompt: string;
  extraReferenceUrl: string | null;
}

export interface BuiltVideoPrompt {
  prompt: string;
}

// ─── Paso 1: prompt para nano-banana/edit (estilización + identidad) ──────────
// Portado de bna-ai-imagenes-rural: la imagen estilizada es donde se decide el
// estilo y se preserva la cara, así que el prompt es deliberadamente detallado.

export function buildImagePrompt(opciones: Opciones): BuiltImagePrompt {
  const ambiente = AMBIENTES.find((a) => a.id === opciones.ambiente)?.en ?? '';
  const accion = ACCIONES.find((a) => a.id === opciones.accion)?.en ?? '';
  const estilo = ESTILOS.find((e) => e.id === opciones.estilo)?.en ?? 'photograph';

  const extraRef = EXTRA_REFERENCES[opciones.accion] ?? null;

  // Los estilos que más alejan la cara del original reciben un recordatorio
  // explícito de identidad. "realista" es fotográfico y no lo necesita.
  const STYLIZED_LABELS: Partial<Record<EstiloId, string>> = {
    pixar: 'Pixar 3D',
    caricatura2d: '2D hand-drawn caricature',
    lego: 'LEGO 3D',
  };
  const stylizedLabel = STYLIZED_LABELS[opciones.estilo];
  const stylizedIdentityLine = stylizedLabel
    ? `IMPORTANT: even though the style is ${stylizedLabel}, the rendered face must keep the person's actual identifiable features from the reference image — their exact eye shape and color, their exact nose shape, their exact mouth shape, their exact hair color and style, their gender. Apply the style as a surface treatment (lighting, shading, line work) but DO NOT redraw the face into a generic cartoon character.`
    : '';

  // Realista: no hay estilización, así que tratamos esto como una EDICIÓN
  // fotográfica de la misma foto — la cara y el pelo deben quedar idénticos,
  // solo cambia el entorno/acción.
  const realistaIdentityLine =
    opciones.estilo === 'realista'
      ? `Since the style is photorealistic, treat this as a photo edit of the SAME photograph: keep the person's face and hair PIXEL-FAITHFUL to the reference — identical facial features, identical hairstyle, hair color and hairline, identical skin tone and complexion. Do NOT regenerate, swap, beautify, slim, age, rejuvenate or otherwise alter the face or hair in any way. Only change the surrounding scene, clothing and body pose to fit the action; the head and face must look like the exact same photo of this person.`
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
    realistaIdentityLine,
    `Action: ${accion}.`,
    mateLine,
    `Scene: ${ambiente}.`,
    extraRef ? `Match the ${extraRef.label} to the second reference image.` : '',
    opciones.estilo === 'caricatura2d'
      ? `Vertical 9:16 composition with the character centered and the scene visible all around them — leave clear room for the background on every side. Cinematic, rich detail.`
      : `Waist-up vertical 9:16 portrait, cinematic, rich detail.`,
    `FINAL REMINDER: (1) the face in the generated image is a clear, recognizable likeness of the person in the reference image — same eyes, same nose, same mouth, same jawline, same gender, do not stylize the facial structure away from that reference; (2) the background fills the entire frame in the chosen style — no empty white space.`,
  ].filter(Boolean);

  return { prompt: lines.join(' '), extraReferenceUrl: extraRef?.url ?? null };
}

// ─── Paso 2: prompt para pixverse image-to-video (solo movimiento) ────────────
// La imagen de referencia YA trae el estilo, la escena y la cara. pixverse solo
// agrega movimiento: el prompt insiste en preservar todo lo visual y describe la
// acción a animar.

export function buildVideoPrompt(opciones: Opciones): BuiltVideoPrompt {
  const accion = ACCIONES.find((a) => a.id === opciones.accion)?.en ?? '';

  const mateLine =
    opciones.accion === 'mate'
      ? `The mate gourd stays resting in the hand — it is never raised to the lips.`
      : '';

  // Caricatura 2D: dejar explícito que el movimiento es animación 2D dibujada,
  // no 3D ni live-action, para que respete el estilo plano de la imagen.
  const estilo2dLine =
    opciones.estilo === 'caricatura2d'
      ? `This is a hand-drawn 2D cartoon animation: animate it as flat 2D drawn animation, keeping the 2D illustrated look of the reference image — do NOT turn it into 3D or photorealistic motion.`
      : '';

  const lines = [
    `Animate the provided reference image. Keep the exact same person, face, art style, colors, lighting, scene and composition as the reference image — do not restyle, do not change or redraw the face, do not alter the background.`,
    estilo2dLine,
    `Action: ${accion}.`,
    mateLine,
    `Motion: subtle natural movement matching the action, with a slow, gentle cinematic camera push-in; smooth and loopable. No on-screen text, no watermark.`,
  ].filter(Boolean);

  return { prompt: lines.join(' ') };
}
