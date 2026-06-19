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

  // Etiqueta corta del estilo para los estilos NO fotográficos. "realista" no
  // entra acá porque su objetivo es justamente quedarse fiel a la foto.
  const STYLIZED_LABELS: Partial<Record<EstiloId, string>> = {
    pixar: 'Disney/Pixar 3D animated',
    caricatura2d: '2D hand-drawn caricature',
    lego: 'LEGO 3D plastic-brick',
  };
  const stylizedLabel = STYLIZED_LABELS[opciones.estilo];
  const isStylized = Boolean(stylizedLabel);

  // The mate gourd must be HELD, not drunk — keep it out of the mouth.
  const mateLine =
    opciones.accion === 'mate'
      ? `The mate gourd is only held in the hand and is NOT being drunk: it is not raised to the lips, the bombilla is not in the mouth, the person is not sipping — the mate simply rests in their hand.`
      : '';

  // El primer renglón fija la PRIORIDAD: para estilos no fotográficos, lo más
  // importante es que sea una conversión total al estilo (no una foto retocada);
  // para "realista" es lo opuesto, una edición fiel de la misma foto.
  const openingLine = isStylized
    ? `Completely re-render this person as a brand-new ${stylizedLabel} artwork. This is a FULL style conversion, NOT a photo edit and NOT a filter: the result must clearly look like a ${stylizedLabel} image and must NOT look like a photograph of a real person. Redraw the face, hair, body, clothing and the whole scene from scratch in the ${stylizedLabel} style, with its characteristic shapes, proportions, textures, shading and lighting.`
    : `Treat this as a photorealistic photo edit of the SAME photograph: keep the person's face and hair PIXEL-FAITHFUL to the reference — identical facial features, identical hairstyle, hair color and hairline, identical skin tone and complexion. Do NOT regenerate, swap, beautify, slim, age, rejuvenate or otherwise alter the face or hair. Only change the surrounding scene, clothing and body pose to fit the action; the head and face must look like the exact same photo of this person.`;

  // La identidad se preserva a nivel de RASGOS reconocibles, no de píxeles, para
  // no pelear contra la conversión de estilo.
  const identityLine = isStylized
    ? `While converting to the style, preserve the person's IDENTITY so they stay instantly recognizable as the same individual: carry over their eye color and eye shape, eyebrow shape, nose shape, mouth and smile, overall face shape and jawline, skin tone, hair color and hairstyle, facial hair, gender, approximate age, ethnicity, and any distinguishing marks (moles, freckles, glasses, scars). Translate those real features faithfully INTO the ${stylizedLabel} style — do not invent a different person, but do not keep photographic realism either.`
    : `Treat the reference photo as the ground truth for the face: keep the exact facial proportions and the exact size, shape and spacing of the eyes, nose, mouth, eyebrows and jawline, plus the same skin tone, hair color and style, gender, age, ethnicity and every distinguishing mark. The face must be an unmistakable likeness — do not beautify, average or blend the features.`;

  const finalReminder = isStylized
    ? `FINAL REMINDER: (1) the ENTIRE image, face included, is fully rendered in the ${stylizedLabel} style and must NOT resemble the original photograph or look like a real photo; (2) the person is still clearly recognizable through their preserved features — same eye color, nose, mouth, face shape, hair color and gender; (3) the background fills the entire frame in the chosen style — no empty white space.`
    : `FINAL REMINDER: (1) the face is a clear, pixel-faithful likeness of the person in the reference image — same eyes, nose, mouth, jawline and gender; (2) the background fills the entire frame — no empty white space.`;

  const lines = [
    openingLine,
    `Style: ${estilo}.`,
    identityLine,
    `Action: ${accion}.`,
    mateLine,
    `Scene: ${ambiente}.`,
    extraRef ? `Match the ${extraRef.label} to the second reference image.` : '',
    opciones.estilo === 'caricatura2d'
      ? `Vertical 9:16 composition with the character centered and the scene visible all around them — leave clear room for the background on every side. Cinematic, rich detail.`
      : `Waist-up vertical 9:16 portrait, cinematic, rich detail.`,
    finalReminder,
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
