import { GAME_CONFIG } from '../config';

interface HudProps {
  score: number;
  lives: number;
}

/** Rutas de los corazones del HUD (swap del SVG conserva el tamaño del slot). */
const HEART_FILLED = '/tractor/heart-filled.svg';
const HEART_EMPTY = '/tractor/heart-empty.svg';

/**
 * Overlay del juego: corazones arriba a la izquierda y puntaje arriba a la derecha.
 * Se renderiza en React (no en el canvas) para mantener nitidez de texto y permitir
 * tamaños relativos al viewport.
 */
export function Hud({ score, lives }: HudProps) {
  const maxLives = GAME_CONFIG.lives;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-between p-[3vh]">
      <div className="flex gap-[1.2vh]">
        {Array.from({ length: maxLives }).map((_, i) => (
          <img
            key={i}
            src={i < lives ? HEART_FILLED : HEART_EMPTY}
            alt=""
            className="h-[7vh] w-[7vh] drop-shadow-md"
          />
        ))}
      </div>

      <div className="rounded-full bg-black/40 px-[2.5vh] py-[1vh] font-kievit-black text-[5vh] leading-none text-white drop-shadow-md">
        {score}
      </div>
    </div>
  );
}
