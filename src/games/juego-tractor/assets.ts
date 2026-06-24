import type { AssetKey } from './types';

/**
 * Manifest central de imágenes del juego.
 *
 * Para cambiar un sprite mañana: reemplazar el archivo en `/public/tractor/`
 * (no hace falta tocar código). El sistema de dibujo usa "contain" sobre un slot
 * de tamaño fijo, así que la imagen nueva conserva el espacio aunque tenga otra
 * resolución en px.
 *
 * Los corazones del HUD (`heart-filled.svg` / `heart-empty.svg`) NO van acá: se
 * renderizan como <img> en el HUD de React (ver `components/Hud.tsx`).
 */
export const ASSET_SOURCES: Record<AssetKey, string> = {
  bg: '/tractor/bg-tile.png',
  tractor: '/tractor/tractor.png',
  cow: '/tractor/cow.png',
  pig: '/tractor/pig.png',
  fardo: '/tractor/fardo.png',
  coin: '/tractor/coin.png',
};

export type LoadedAssets = Record<AssetKey, HTMLImageElement>;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar el asset: ${src}`));
    img.src = src;
  });
}

/** Precarga todas las imágenes del manifest antes de arrancar el game loop. */
export async function preloadAssets(): Promise<LoadedAssets> {
  const keys = Object.keys(ASSET_SOURCES) as AssetKey[];
  const images = await Promise.all(keys.map((k) => loadImage(ASSET_SOURCES[k])));
  const loaded = {} as LoadedAssets;
  keys.forEach((k, i) => {
    loaded[k] = images[i];
  });
  return loaded;
}
