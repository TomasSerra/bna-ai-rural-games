import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGameEngine } from "../hooks/useGameEngine";
import { useGameInput } from "../hooks/useGameInput";
import type { GameSnapshot } from "../types";
import { GAME_CONFIG } from "../config";
import { Hud } from "./Hud";

interface GameCanvasProps {
  /**
   * Se llama al acabarse las vidas con el puntaje final y un snapshot (dataURL)
   * del canvas en ese instante, para mostrarlo congelado en la pantalla final.
   */
  onGameOver: (finalScore: number, frame: string) => void;
}

/** Ancho máximo del snapshot final; lo dibujamos a object-cover bajo un overlay. */
const SNAPSHOT_MAX_WIDTH = 960;

/**
 * Captura el último frame como JPEG escalado para el fondo de la pantalla final.
 * Usar JPEG (en vez de PNG) y reducir la resolución evita que el encode sincrónico
 * trabe el hilo principal varios segundos en dispositivos poco potentes (Android TV).
 */
function captureFrame(canvas: HTMLCanvasElement | null): string {
  if (!canvas) return "";
  const scale = Math.min(1, SNAPSHOT_MAX_WIDTH / canvas.width);
  if (scale === 1) return canvas.toDataURL("image/jpeg", 0.8);

  const off = document.createElement("canvas");
  off.width = Math.round(canvas.width * scale);
  off.height = Math.round(canvas.height * scale);
  const ctx = off.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", 0.8);
  ctx.drawImage(canvas, 0, 0, off.width, off.height);
  return off.toDataURL("image/jpeg", 0.8);
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

  // Captura el último frame dibujado (escena del juego) antes de desmontar el
  // canvas, para usarlo como fondo congelado en la pantalla final.
  const handleGameOver = useCallback(
    (finalScore: number) => {
      onGameOver(finalScore, captureFrame(canvasRef.current));
    },
    [onGameOver],
  );

  const { error, engineRef } = useGameEngine(canvasRef, {
    onChange: handleChange,
    onGameOver: handleGameOver,
  });

  const onLeft = useCallback(() => engineRef.current?.moveLeft(), [engineRef]);
  const onRight = useCallback(
    () => engineRef.current?.moveRight(),
    [engineRef],
  );

  useGameInput({ onLeft, onRight, enabled: true, targetRef: containerRef });

  return (
    <div
      ref={containerRef}
      className="relative h-dvh w-dvw touch-none overflow-hidden"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <Hud score={snapshot.score} lives={snapshot.lives} />

      {/* Controles táctiles: una flecha a cada lado, centradas verticalmente.
          Disparan el cambio de carril en pointerdown (respuesta inmediata) y
          frenan la propagación para no interferir con el gesto de swipe del
          contenedor. */}
      <button
        type="button"
        aria-label="Mover a la izquierda"
        onPointerDown={(e) => {
          e.stopPropagation();
          onLeft();
        }}
        className="absolute left-4 top-1/2 z-20 flex size-20 -translate-y-1/2 items-center justify-center rounded-full bg-white/50 text-primary shadow-lg backdrop-blur-sm transition-transform active:scale-90"
      >
        <ChevronLeft className="size-12" />
      </button>
      <button
        type="button"
        aria-label="Mover a la derecha"
        onPointerDown={(e) => {
          e.stopPropagation();
          onRight();
        }}
        className="absolute right-4 top-1/2 z-20 flex size-20 -translate-y-1/2 items-center justify-center rounded-full bg-white/50 text-primary shadow-lg backdrop-blur-sm transition-transform active:scale-90"
      >
        <ChevronRight className="size-12" />
      </button>

      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 px-8 text-center text-xl text-white">
          {error}
        </div>
      )}
    </div>
  );
}
