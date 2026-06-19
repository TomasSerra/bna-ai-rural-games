import {
  Beef,
  Brush,
  Clapperboard,
  Coffee,
  Dog,
  Grape,
  Laugh,
  Milk,
  Mountain,
  Scissors,
  Sparkles,
  Sprout,
  Sun,
  Tractor,
  Warehouse,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { Horse } from '@shared/components/icons/Horse';
import type { EstiloId } from '@imagenes/types';

export type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

interface Option {
  id: string;
  label: string;
  en: string;
  icon: IconComponent;
}

export const AMBIENTES: Option[] = [
  {
    id: 'campo',
    label: 'Campo abierto',
    en: 'in a vast open Argentine pampa at golden-hour sunrise, tall golden-green grass stretching to a flat horizon, soft warm light, a few scattered ombú trees and a wide sky with gentle clouds — the scene fills the full frame edge-to-edge, no empty space',
    icon: Sun,
  },
  {
    id: 'granja',
    label: 'Granja',
    en: 'at a classic rural farm with a weathered red barn, wooden post-and-rail fences, stacked hay bales and farm tools, warm countryside daylight — the scene fills the full frame edge-to-edge, no empty space',
    icon: Warehouse,
  },
  {
    id: 'soja',
    label: 'Sembrado de soja',
    en: 'in a vast green soybean field under a wide bright sky, neat parallel rows of crops stretching to the horizon, warm late-afternoon light — the scene fills the full frame edge-to-edge, no empty space',
    icon: Sprout,
  },
  {
    id: 'vinedo',
    label: 'Viñedo',
    en: 'in a sunlit Mendoza vineyard with long rows of grapevines on wooden trellises and the snow-capped Andes mountains softly blurred in the distance, warm golden light — the scene fills the full frame edge-to-edge, no empty space',
    icon: Grape,
  },
  {
    id: 'patagonia',
    label: 'Patagonia',
    en: 'on the windswept Patagonian steppe with dry golden grassland and snow-capped Andes mountains in the distance under a dramatic wide sky, cool crisp daylight — the scene fills the full frame edge-to-edge, no empty space',
    icon: Mountain,
  },
  {
    id: 'corral',
    label: 'Corral con vacas',
    en: 'in a rustic wooden cattle corral with dusty ground and a softly blurred herd of cows behind the person, warm countryside daylight — the scene fills the full frame edge-to-edge, no empty space',
    icon: Beef,
  },
];

export const ACCIONES: Option[] = [
  {
    id: 'tractor',
    label: 'Manejando un tractor',
    en: 'sitting at the wheel of a green farm tractor, both hands on the steering wheel, shown from the waist up',
    icon: Tractor,
  },
  {
    id: 'caballo',
    label: 'A caballo',
    en: 'riding a horse, sitting upright and confident in the saddle while holding the leather reins with one hand',
    icon: Horse,
  },
  {
    id: 'ordenando',
    label: 'Ordeñando una vaca',
    en: 'milking a dairy cow by hand, sitting on a small wooden stool close beside the cow',
    icon: Milk,
  },
  {
    id: 'arreando',
    label: 'Arreando ovejas',
    en: 'herding a small flock of sheep across the field alongside an attentive working sheepdog',
    icon: Dog,
  },
  {
    id: 'mate',
    label: 'Tomando mate',
    en: 'holding a traditional Argentine mate gourd with a metal bombilla in one hand at chest height, the mate simply resting in the hand',
    icon: Coffee,
  },
  {
    id: 'esquilando',
    label: 'Esquilando ovejas',
    en: 'shearing a sheep with traditional hand shears, leaning over the sheep with focus',
    icon: Scissors,
  },
];

interface EstiloOption extends Option {
  id: EstiloId;
}

export const ESTILOS: EstiloOption[] = [
  {
    id: 'pixar',
    label: 'Animación 3D',
    en: "Disney Pixar 3D animated style — smooth polished textures, big expressive eyes with bright catchlights, vibrant saturated colors, soft cinematic lighting and a playful polished look reminiscent of modern Pixar/Disney films (Encanto, Luca, Coco, Turning Red). Keep the person's real likeness clearly recognizable: their actual eye color, eye shape, eyebrow shape, nose shape, mouth shape, hair color, hairstyle, skin tone, facial hair and any distinguishing marks must be preserved — do NOT replace the face with a generic Pixar character. The entire scene (background and objects) is rendered in the same Pixar 3D style filling the full frame edge-to-edge — no empty white space, no vignette",
    icon: Clapperboard,
  },
  {
    id: 'caricatura2d',
    label: 'Caricatura 2D',
    en: 'hand-drawn 2D caricature in the polished style of a professional caricature artist — exaggerated proportions with a noticeably oversized head and a small body, bold clean inked outlines around the face and hair, smooth hand-colored shading with subtle painted texture, detailed individual strands of hair, polished comic-style line work, recognizable real features brought out with slight playful exaggeration (eyes, smile, hair) while keeping the actual likeness of the reference photo. FRAMING: the character is positioned in the center of the canvas and occupies only the middle portion of the frame, with clear space all around them. BACKGROUND (MANDATORY): a fully drawn scene in the same caricature style covers 100% of the canvas — every pixel of the background, including above the head, beside the shoulders, below the body and in all four corners, must be drawn-in scene content; NO blank paper, NO white margins, NO empty space, NO vignette',
    icon: Brush,
  },
  {
    id: 'caricatura3d',
    label: 'Caricatura 3D',
    en: "semi-realistic 3D caricature sculpt with strongly exaggerated proportions but realistic skin, hair and material detail — rendered like a high-end character bust with subsurface scattering, realistic pores and soft cinematic studio lighting. PROPORTIONS (mandatory): the head is enormous and clearly dominates the frame — roughly the same size as the entire torso — sitting on a noticeably small, narrow body with small shoulders and short little arms. FACIAL FEATURES (mandatory exaggeration while keeping the real likeness of the reference photo): the eyes are big and wide-open with detailed irises and visible catchlights; the nose is large and prominent (long/wide/bulbous following whatever shape the real nose has, just bigger); the mouth is small and compact. Keep the person's actual eye color, eye shape, eyebrow shape, hair color and hairstyle, skin tone, facial hair, jawline and any distinguishing marks — do NOT generalize the face, the viewer must instantly recognize the real person, only with the playful exaggeration described. The entire scene (background and objects) is rendered in the same semi-realistic 3D caricature style filling the full frame edge-to-edge — no empty white space, no vignette",
    icon: Laugh,
  },
  {
    id: 'ghibli',
    label: 'Anime',
    en: "hand-painted 2D anime in the style of Studio Ghibli films (Spirited Away, My Neighbor Totoro, Howl's Moving Castle) — soft watercolor backgrounds, gentle pastel colors, hand-drawn cel-shaded characters with clean line work, warm cinematic atmosphere; the styling is light so the person's actual facial features (their real eye shape and color, their real nose, their real mouth, their real hair color and style) remain clearly recognizable — do NOT replace the face with a generic anime character, do NOT enlarge the eyes into oversized anime eyes",
    icon: Sparkles,
  },
];
