import type { SizeSlot } from './config';

/** Estado de la máquina de páginas del juego. */
export type GamePage = 'home' | 'playing' | 'gameover';

/** Categorías de entidad que se mueven por la pista. */
export type EntityKind = 'enemy' | 'coin';

/** Clave de un asset en el manifest (`assets.ts`). */
export type AssetKey = 'bg' | 'tractor' | 'cow' | 'pig' | 'fardo' | 'coin';

/** Caja en píxeles de canvas (footprint donde se dibuja un sprite). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Definición de un tipo de enemigo. Agregar un enemigo nuevo es sumar una entrada
 * a `ENEMY_TYPES` en `enemies.ts` (con su asset correspondiente en el manifest).
 */
export interface EnemyType {
  /** Identificador único. */
  id: string;
  /** Clave del asset a dibujar. */
  asset: AssetKey;
  /** Tamaño del slot del enemigo. */
  sizeSlot: SizeSlot;
  /** Peso relativo de aparición frente a otros enemigos. */
  weight: number;
}

/** Una entidad viva en la pista (enemigo o moneda). */
export interface Entity {
  kind: EntityKind;
  /** Asset a dibujar. */
  asset: AssetKey;
  /** Slot de tamaño (fracciones del canvas). */
  sizeSlot: SizeSlot;
  /** Carril en el que cae (0..lanes-1). */
  lane: number;
  /** Posición vertical del centro, en fracción del alto del canvas. */
  yFrac: number;
  /** Marca para eliminar en el próximo barrido. */
  dead: boolean;
}

/** Snapshot del estado expuesto a React (HUD). */
export interface GameSnapshot {
  score: number;
  lives: number;
}
