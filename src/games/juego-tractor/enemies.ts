import type { EnemyType } from './types';

/**
 * Registro de tipos de enemigo.
 *
 * Hoy solo existe la vaca. Para sumar un enemigo nuevo:
 *   1. Colocar su imagen en `/public/tractor/` y registrarla en `assets.ts`.
 *   2. Agregar una entrada acá con su `asset`, `sizeSlot` y `weight`.
 * El spawner elige al azar según el `weight` de cada tipo.
 */
export const ENEMY_TYPES: EnemyType[] = [
  {
    id: 'cow',
    asset: 'cow',
    sizeSlot: { wFrac: 0.13, hFrac: 0.17 },
    weight: 1,
  },
  {
    id: 'pig',
    asset: 'pig',
    sizeSlot: { wFrac: 0.13, hFrac: 0.17 },
    weight: 1,
  },
  {
    id: 'fardo',
    asset: 'fardo',
    sizeSlot: { wFrac: 0.13, hFrac: 0.17 },
    weight: 1,
  },
];

/** Elige un tipo de enemigo al azar, ponderado por `weight`. */
export function pickEnemyType(rand: () => number = Math.random): EnemyType {
  const total = ENEMY_TYPES.reduce((sum, e) => sum + e.weight, 0);
  let r = rand() * total;
  for (const enemy of ENEMY_TYPES) {
    r -= enemy.weight;
    if (r <= 0) return enemy;
  }
  return ENEMY_TYPES[ENEMY_TYPES.length - 1];
}
