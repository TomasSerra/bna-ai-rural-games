import { useCallback, useRef, useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { useGameInput } from '../hooks/useGameInput';
import type { GameSnapshot } from '../types';
import { GAME_CONFIG } from '../config';
import { Hud } from './Hud';

interface GameCanvasProps {
  /** Se llama con el puntaje final cuando se acaban las vidas. */
  onGameOver: (finalScore: number) => void;
}

/**
 * Monta el canvas del juego (con el game loop vía `useGameEngine`), conecta el input
 * (teclado + swipe) y pinta el HUD por encima.
 */
export function GameCanvas({ onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>({
    score: 0,
    lives: GAME_CONFIG.lives,
  });

  const handleChange = useCallback((s: GameSnapshot) => setSnapshot(s), []);

  const { error, engineRef } = useGameEngine(canvasRef, {
    onChange: handleChange,
    onGameOver,
  });

  const onLeft = useCallback(() => engineRef.current?.moveLeft(), [engineRef]);
  const onRight = useCallback(() => engineRef.current?.moveRight(), [engineRef]);

  useGameInput({ onLeft, onRight, enabled: true, targetRef: containerRef });

  return (
    <div ref={containerRef} className="relative h-dvh w-dvw touch-none overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <Hud score={snapshot.score} lives={snapshot.lives} />
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 px-8 text-center text-xl text-white">
          {error}
        </div>
      )}
    </div>
  );
}
