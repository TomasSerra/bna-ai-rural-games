/**
 * ⭐ Configuración central del juego del tractor.
 *
 * TODOS los parámetros ajustables del juego viven acá. Cambiar el comportamiento
 * (velocidad, vidas, dificultad, puntajes, tamaños de los sprites, etc.) no debería
 * requerir tocar ningún otro archivo.
 *
 * Convención de unidades:
 * - Las posiciones y tamaños se expresan como FRACCIONES (0..1) del tamaño lógico
 *   del canvas. Así el juego es responsive a cualquier resolución/relación de aspecto
 *   (la TV se usa en vertical 16:9).
 * - Las velocidades están en "fracciones de alto por segundo" (1 = recorrer todo el
 *   alto del canvas en 1 segundo).
 */

/** Caja de tamaño de un sprite, en fracciones del ancho/alto del canvas. */
export interface SizeSlot {
  /** Ancho del slot como fracción del ancho del canvas. */
  wFrac: number;
  /** Alto del slot como fracción del alto del canvas. */
  hFrac: number;
}

export const GAME_CONFIG = {
  /** Cantidad de vidas (corazones) iniciales. */
  lives: 3,

  /** Cantidad de carriles. */
  lanes: 3,

  /**
   * Franja de "camino" dentro del fondo, sobre la que se distribuyen los carriles.
   * Centrada horizontalmente. Ajustar para alinear los carriles con el bg.png.
   */
  road: {
    /** Centro horizontal del camino (fracción del ancho). */
    centerXFrac: 0.5,
    /** Ancho del camino (fracción del ancho del canvas). */
    widthFrac: 0.52,
  },

  tractor: {
    /** Posición fija en Y (fracción del alto). Más cerca de 1 = más abajo. */
    yFrac: 0.82,
    /** Tamaño del slot del tractor. */
    sizeSlot: { wFrac: 0.14, hFrac: 0.18 } as SizeSlot,
    /**
     * Velocidad de cambio de carril (fracciones de ancho por segundo).
     * Controla qué tan rápido se desliza de un carril al otro.
     */
    laneChangeSpeed: 3.2,
  },

  /** Velocidad de scroll del fondo y de caída de las entidades. */
  speed: {
    /** Velocidad inicial (fracciones de alto por segundo). */
    base: 0.45,
    /** Velocidad máxima a la que puede llegar. */
    max: 1.3,
  },

  /** Progresión de dificultad. */
  difficulty: {
    /** Cuánto sube la velocidad por segundo transcurrido. */
    speedIncreasePerSecond: 0.012,
    /** Intervalo inicial entre spawns (segundos). */
    spawnIntervalBase: 0.8,
    /** Intervalo mínimo al que puede bajar (segundos). */
    spawnIntervalMin: 0.32,
    /** Cuánto baja el intervalo de spawn por segundo transcurrido. */
    spawnIntervalDecPerSecond: 0.015,
    /** Variación aleatoria (+/-) aplicada a cada intervalo de spawn (segundos). */
    spawnJitter: 0.2,
    /**
     * Probabilidad de que un spawn sea una moneda en lugar de un enemigo (0..1).
     * El resto de las veces aparece un enemigo del registro `enemies.ts`.
     */
    coinSpawnChance: 0.3,
  },

  coin: {
    /** Puntos que otorga juntar una moneda. */
    points: 10,
    /** Tamaño del slot de la moneda. */
    sizeSlot: { wFrac: 0.09, hFrac: 0.09 } as SizeSlot,
  },

  collision: {
    /** Tiempo de invulnerabilidad tras un choque (milisegundos). */
    invulnerabilityMs: 1500,
    /** Frecuencia de parpadeo durante la invulnerabilidad (veces por segundo). */
    blinkHz: 6,
    /**
     * Escala de la hitbox respecto del slot visual (0..1). < 1 hace la colisión
     * más "perdonadora" (hay que solaparse bastante para chocar).
     */
    hitboxScale: 0.7,
  },
} as const;

export type GameConfig = typeof GAME_CONFIG;
