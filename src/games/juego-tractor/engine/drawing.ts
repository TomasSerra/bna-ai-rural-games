import type { Box } from '../types';

/**
 * Dibuja una imagen "contain" dentro de un slot: la escala al máximo posible sin
 * deformar ni salirse de la caja, y la centra. Así el slot define el footprint y la
 * imagen mantiene el mismo espacio aunque cambie su resolución original.
 */
export function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slot: Box,
): void {
  const scale = Math.min(slot.w / img.width, slot.h / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = slot.x + (slot.w - w) / 2;
  const y = slot.y + (slot.h - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

/**
 * Dibuja una imagen "cover" cubriendo toda la caja destino (recorta lo que sobra).
 * Se usa para el fondo, que debe ocupar todo el ancho/alto disponible.
 */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dest: Box,
): void {
  const scale = Math.max(dest.w / img.width, dest.h / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const sx = (img.width - dest.w / scale) / 2;
  const sy = (img.height - dest.h / scale) / 2;
  ctx.drawImage(
    img,
    sx,
    sy,
    dest.w / scale,
    dest.h / scale,
    dest.x,
    dest.y,
    dest.w,
    dest.h,
  );
  void w;
  void h;
}

/** Test de solapamiento entre dos cajas (AABB). */
export function boxesOverlap(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/** Devuelve una caja encogida hacia su centro por un factor (0..1). */
export function shrinkBox(box: Box, scale: number): Box {
  const w = box.w * scale;
  const h = box.h * scale;
  return {
    x: box.x + (box.w - w) / 2,
    y: box.y + (box.h - h) / 2,
    w,
    h,
  };
}
