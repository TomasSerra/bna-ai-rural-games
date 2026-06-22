import { useEffect, useRef, useState } from 'react';
import { preloadAssets } from '../assets';
import { GameEngine, type GameEngineCallbacks } from '../engine/GameEngine';

interface UseGameEngineResult {
  /** true cuando los assets cargaron y el engine está corriendo. */
  ready: boolean;
  /** Mensaje de error si falló la precarga de assets. */
  error: string | null;
  /** Referencia al engine (para enviarle input desde el componente). */
  engineRef: React.MutableRefObject<GameEngine | null>;
}

/**
 * Precarga assets, monta el `GameEngine` sobre el canvas, ajusta el tamaño por DPR
 * y corre el game loop con requestAnimationFrame. Limpia todo al desmontar.
 */
export function useGameEngine(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  callbacks: GameEngineCallbacks,
): UseGameEngineResult {
  const engineRef = useRef<GameEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mantener callbacks frescos sin reiniciar el loop.
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    let mounted = true;
    let rafId = 0;
    let lastTime = 0;
    let resizeObserver: ResizeObserver | null = null;

    preloadAssets()
      .then((assets) => {
        if (!mounted) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('No se pudo inicializar el canvas 2D.');
          return;
        }

        const engine = new GameEngine(assets, {
          onChange: (s) => callbacksRef.current.onChange?.(s),
          onGameOver: (s) => callbacksRef.current.onGameOver?.(s),
        });
        engineRef.current = engine;

        const applySize = () => {
          const dpr = window.devicePixelRatio || 1;
          const { clientWidth, clientHeight } = canvas;
          canvas.width = Math.round(clientWidth * dpr);
          canvas.height = Math.round(clientHeight * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          engine.resize(clientWidth, clientHeight);
        };
        applySize();

        resizeObserver = new ResizeObserver(applySize);
        resizeObserver.observe(canvas);

        setReady(true);

        const loop = (time: number) => {
          if (!mounted) return;
          if (lastTime === 0) lastTime = time;
          // dt en segundos, acotado para evitar saltos tras pausas.
          const dt = Math.min(0.05, (time - lastTime) / 1000);
          lastTime = time;

          engine.update(dt);
          engine.render(ctx);
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      });

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      engineRef.current = null;
    };
  }, [canvasRef]);

  return { ready, error, engineRef };
}
