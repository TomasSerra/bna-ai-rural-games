import {
  Beef,
  Blocks,
  Brush,
  Camera,
  Clapperboard,
  Coffee,
  Dog,
  Milk,
  Mountain,
  Sprout,
  Sun,
  Tractor,
  Warehouse,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { Horse } from '@shared/components/icons/Horse';
import type { EstiloId } from '@videos/types';

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
    en: 'in a vast open Argentine pampa at golden-hour sunrise, tall golden-green grass swaying gently in the breeze, soft warm light, a few scattered ombú trees and a wide sky with slowly drifting clouds — the scene fills the full frame edge-to-edge, no empty space',
    icon: Sun,
  },
  {
    id: 'granja',
    label: 'Granja',
    en: 'at a classic rural farm with a weathered red barn, wooden post-and-rail fences, stacked hay bales and farm tools, warm countryside daylight with dust motes floating in the air — the scene fills the full frame edge-to-edge, no empty space',
    icon: Warehouse,
  },
  {
    id: 'soja',
    label: 'Sembrado de soja',
    en: 'in a vast green soybean field under a wide bright sky, neat parallel rows of crops rippling in the wind toward the horizon, warm late-afternoon light — the scene fills the full frame edge-to-edge, no empty space',
    icon: Sprout,
  },
  {
    id: 'patagonia',
    label: 'Patagonia',
    en: 'on the windswept Patagonian steppe with dry golden grassland bending in the wind and snow-capped Andes mountains in the distance under a dramatic wide sky, cool crisp daylight — the scene fills the full frame edge-to-edge, no empty space',
    icon: Mountain,
  },
  {
    id: 'corral',
    label: 'Corral con vacas',
    en: 'in a rustic wooden cattle corral with dusty ground and a softly blurred herd of cows shifting slowly behind the person, warm countryside daylight — the scene fills the full frame edge-to-edge, no empty space',
    icon: Beef,
  },
];

export const ACCIONES: Option[] = [
  {
    id: 'tractor',
    label: 'Manejando un tractor',
    en: 'sitting at the wheel of a green farm tractor, both hands on the steering wheel turning it slightly, gently bouncing as the tractor rolls forward, shown from the waist up',
    icon: Tractor,
  },
  {
    id: 'caballo',
    label: 'A caballo',
    en: 'riding a horse, sitting upright and confident in the saddle, swaying naturally with the horse\'s slow walk while holding the leather reins with one hand',
    icon: Horse,
  },
  {
    id: 'ordenando',
    label: 'Ordeñando una vaca',
    en: 'milking a dairy cow by hand with steady rhythmic hand movements, sitting on a small wooden stool close beside the cow',
    icon: Milk,
  },
  {
    id: 'arreando',
    label: 'Arreando ovejas',
    en: 'herding a small flock of sheep across the field, waving an arm to guide them alongside an attentive working sheepdog trotting nearby',
    icon: Dog,
  },
  {
    id: 'mate',
    label: 'Tomando mate',
    en: 'holding a traditional Argentine mate gourd with a metal bombilla in one hand at chest height, the mate simply resting in the hand and the person smiling warmly at the camera',
    icon: Coffee,
  },
];

interface EstiloOption extends Option {
  id: EstiloId;
}

export const ESTILOS: EstiloOption[] = [
  {
    id: 'realista',
    label: 'Realista',
    en: "photorealistic cinematic photograph — natural skin texture and realistic detail, true-to-life colors, soft natural daylight and a shallow depth of field like a high-quality DSLR portrait. Keep the person's real likeness exactly as in the reference photo; no stylization or cartoon effect. The entire scene (background and objects) is photorealistic and fills the full frame edge-to-edge — no empty white space, no vignette",
    icon: Camera,
  },
  {
    id: 'pixar',
    label: 'Pixar 3D',
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
    id: 'lego',
    label: 'Lego 3D',
    en: '3D toy brick world style — everything built from glossy plastic interlocking bricks and minifigure-style parts, including a blocky plastic minifigure with cylindrical head and clip hands. Bright saturated plastic colors, subtle plastic reflections and the slightly snappy movement of brick-built animation. The entire scene (background, vehicles, animals and objects) is constructed from plastic bricks in the same style filling the full frame edge-to-edge — no empty white space, no vignette',
    icon: Blocks,
  },
];
