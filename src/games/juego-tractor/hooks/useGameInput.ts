import { useEffect } from 'react';

interface InputHandlers {
  onLeft: () => void;
  onRight: () => void;
  /** Mientras `enabled` sea false no se escucha input (p.ej. en menús). */
  enabled: boolean;
  /** Elemento sobre el que se escuchan los gestos touch. */
  targetRef: React.RefObject<HTMLElement>;
}

/** Umbral mínimo (px) de desplazamiento horizontal para contar como swipe. */
const SWIPE_THRESHOLD = 30;

/**
 * Maneja el input del juego:
 * - Teclado: ←/→ y A/D para cambiar de carril.
 * - Touch/puntero: swipe horizontal (una posición de carril por gesto).
 */
export function useGameInput({ onLeft, onRight, enabled, targetRef }: InputHandlers): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        onLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        onRight();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [enabled, onLeft, onRight]);

  useEffect(() => {
    if (!enabled) return;
    const el = targetRef.current;
    if (!el) return;

    let startX: number | null = null;
    let handled = false;

    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      handled = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (startX === null || handled) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        if (dx < 0) onLeft();
        else onRight();
        handled = true;
      }
    };
    const onPointerUp = () => {
      startX = null;
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [enabled, onLeft, onRight, targetRef]);
}
