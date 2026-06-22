import { GAME_CONFIG, type GameConfig, type SizeSlot } from '../config';
import type { LoadedAssets } from '../assets';
import { pickEnemyType } from '../enemies';
import type { Box, Entity, GameSnapshot } from '../types';
import { ScrollingBackground } from './background';
import { boxesOverlap, drawContain, shrinkBox } from './drawing';

export interface GameEngineCallbacks {
  /** Se llama cuando cambia el puntaje o las vidas (para refrescar el HUD). */
  onChange?: (snapshot: GameSnapshot) => void;
  /** Se llama una vez cuando las vidas llegan a 0. */
  onGameOver?: (finalScore: number) => void;
}

/**
 * Motor del juego, desacoplado de React. Mantiene el estado, actualiza la física
 * (update) y se dibuja sobre un canvas (render). React solo lo monta y escucha los
 * callbacks para reflejar puntaje/vidas en el HUD.
 */
export class GameEngine {
  private readonly cfg: GameConfig = GAME_CONFIG;
  private readonly bg: ScrollingBackground;

  // Dimensiones lógicas del canvas (en px CSS, sin DPR).
  private width = 0;
  private height = 0;

  // Estado del juego.
  private score = 0;
  private lives = GAME_CONFIG.lives;
  private elapsed = 0;
  private speed = GAME_CONFIG.speed.base;
  private entities: Entity[] = [];
  private currentLane = Math.floor(GAME_CONFIG.lanes / 2);
  private tractorXFrac = 0; // se inicializa en resize()
  private invulnUntil = 0; // timestamp (ms acumulados) hasta el que es invulnerable
  private spawnTimer = 0;
  private gameOver = false;

  constructor(
    private readonly assets: LoadedAssets,
    private readonly callbacks: GameEngineCallbacks = {},
  ) {
    this.bg = new ScrollingBackground(assets.bg);
    this.tractorXFrac = this.laneCenterXFrac(this.currentLane);
  }

  /** Actualiza las dimensiones lógicas (llamar en mount y en cada resize). */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  // ---- Input -------------------------------------------------------------

  moveLeft(): void {
    this.currentLane = Math.max(0, this.currentLane - 1);
  }

  moveRight(): void {
    this.currentLane = Math.min(this.cfg.lanes - 1, this.currentLane + 1);
  }

  // ---- Geometría de carriles --------------------------------------------

  private laneCenterXFrac(lane: number): number {
    const { centerXFrac, widthFrac } = this.cfg.road;
    const left = centerXFrac - widthFrac / 2;
    const laneWidth = widthFrac / this.cfg.lanes;
    return left + laneWidth * (lane + 0.5);
  }

  /** Caja en px de un sprite centrado en (xFrac, yFrac) con el slot dado. */
  private slotBox(xFrac: number, yFrac: number, slot: SizeSlot): Box {
    const w = slot.wFrac * this.width;
    const h = slot.hFrac * this.height;
    return {
      x: xFrac * this.width - w / 2,
      y: yFrac * this.height - h / 2,
      w,
      h,
    };
  }

  // ---- Loop --------------------------------------------------------------

  update(dt: number): void {
    if (this.gameOver) return;

    this.elapsed += dt;

    // Subir velocidad con el tiempo, hasta el tope.
    this.speed = Math.min(
      this.cfg.speed.max,
      this.cfg.speed.base + this.elapsed * this.cfg.difficulty.speedIncreasePerSecond,
    );

    // Fondo.
    this.bg.update(this.speed * dt, this.height);

    // Mover tractor hacia su carril objetivo (interpolado).
    const targetX = this.laneCenterXFrac(this.currentLane);
    const step = this.cfg.tractor.laneChangeSpeed * dt;
    const diff = targetX - this.tractorXFrac;
    if (Math.abs(diff) <= step) {
      this.tractorXFrac = targetX;
    } else {
      this.tractorXFrac += Math.sign(diff) * step;
    }

    // Mover entidades hacia abajo y descartar las que salen de pantalla.
    for (const e of this.entities) {
      e.yFrac += this.speed * dt;
      if (e.yFrac - e.sizeSlot.hFrac / 2 > 1) e.dead = true;
    }

    // Spawns.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = this.nextSpawnInterval();
    }

    // Colisiones.
    this.handleCollisions();

    // Limpieza.
    this.entities = this.entities.filter((e) => !e.dead);
  }

  private nextSpawnInterval(): number {
    const { spawnIntervalBase, spawnIntervalMin, spawnIntervalDecPerSecond, spawnJitter } =
      this.cfg.difficulty;
    const base = Math.max(
      spawnIntervalMin,
      spawnIntervalBase - this.elapsed * spawnIntervalDecPerSecond,
    );
    const jitter = (Math.random() * 2 - 1) * spawnJitter;
    return Math.max(0.2, base + jitter);
  }

  private spawn(): void {
    const lane = Math.floor(Math.random() * this.cfg.lanes);
    const isCoin = Math.random() < this.cfg.difficulty.coinSpawnChance;

    if (isCoin) {
      this.entities.push({
        kind: 'coin',
        asset: 'coin',
        sizeSlot: this.cfg.coin.sizeSlot,
        lane,
        yFrac: -0.1,
        dead: false,
      });
    } else {
      const type = pickEnemyType();
      this.entities.push({
        kind: 'enemy',
        asset: type.asset,
        sizeSlot: type.sizeSlot,
        lane,
        yFrac: -0.1,
        dead: false,
      });
    }
  }

  private handleCollisions(): void {
    const tractorBox = shrinkBox(
      this.slotBox(this.tractorXFrac, this.cfg.tractor.yFrac, this.cfg.tractor.sizeSlot),
      this.cfg.collision.hitboxScale,
    );

    const now = this.elapsed * 1000;
    const invulnerable = now < this.invulnUntil;

    for (const e of this.entities) {
      if (e.dead) continue;
      const entityBox = shrinkBox(
        this.slotBox(this.laneCenterXFrac(e.lane), e.yFrac, e.sizeSlot),
        this.cfg.collision.hitboxScale,
      );
      if (!boxesOverlap(tractorBox, entityBox)) continue;

      if (e.kind === 'coin') {
        e.dead = true;
        this.score += this.cfg.coin.points;
        this.emitChange();
      } else if (!invulnerable) {
        // Enemigo: pierde vida + invulnerabilidad. La vaca se elimina para no
        // re-disparar el choque en el frame siguiente.
        e.dead = true;
        this.lives = Math.max(0, this.lives - 1);
        this.invulnUntil = now + this.cfg.collision.invulnerabilityMs;
        this.emitChange();
        if (this.lives === 0) {
          this.gameOver = true;
          this.callbacks.onGameOver?.(this.score);
        }
      }
    }
  }

  private emitChange(): void {
    this.callbacks.onChange?.({ score: this.score, lives: this.lives });
  }

  // ---- Render ------------------------------------------------------------

  render(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, this.width, this.height);

    this.bg.render(ctx, this.width, this.height);

    // Entidades.
    for (const e of this.entities) {
      drawContain(
        ctx,
        this.assets[e.asset],
        this.slotBox(this.laneCenterXFrac(e.lane), e.yFrac, e.sizeSlot),
      );
    }

    // Tractor (parpadea durante la invulnerabilidad).
    const now = this.elapsed * 1000;
    const invulnerable = now < this.invulnUntil;
    const blink =
      invulnerable &&
      Math.floor((this.elapsed * this.cfg.collision.blinkHz) % 2) === 0;
    if (!blink) {
      drawContain(
        ctx,
        this.assets.tractor,
        this.slotBox(this.tractorXFrac, this.cfg.tractor.yFrac, this.cfg.tractor.sizeSlot),
      );
    }
  }

  getSnapshot(): GameSnapshot {
    return { score: this.score, lives: this.lives };
  }

  isGameOver(): boolean {
    return this.gameOver;
  }
}
