import { useEffect, useRef, useState } from "react";

const IDLE_MS = 3 * 60 * 1000;
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "wheel",
] as const;

export function IdleScreenOverlay() {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    const clearTimer = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const scheduleIdle = () => {
      clearTimer();
      timeoutRef.current = window.setTimeout(() => setVisible(true), IDLE_MS);
    };

    const handleActivity = () => {
      if (visibleRef.current) setVisible(false);
      scheduleIdle();
    };

    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, handleActivity, {
        passive: true,
        capture: true,
      });
    });

    scheduleIdle();

    return () => {
      clearTimer();
      ACTIVITY_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, handleActivity, {
          capture: true,
        } as EventListenerOptions);
      });
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#006ca1] via-[#006293] to-[#00537c] px-20 text-center select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Logo */}
      <img
        src="/shared/logo-bna.png"
        alt="Banco Nación"
        className="pointer-events-none h-16 w-auto md:h-20 absolute top-24 left-0 right-0 mx-auto"
        draggable={false}
      />

      <div className="flex flex-col items-center gap-6">
        {/* Titular */}
        <h1 className="font-kievit-black text-4xl leading-9 tracking-wide text-white md:text-6xl">
          Banco Nación
          <br />
          cumple <span className="text-[#f4d160]">135</span> años y
          <br />
          acompaña la
          <br />
          <span className="text-[#f4d160]">Expo Rural 2026.</span>
        </h1>

        {/* Separador con brote */}
        <div className="my-10 flex w-full max-w-md items-center gap-4 text-[#f4d160]">
          <span className="h-0.5 flex-1 bg-white/60" />
        </div>

        {/* Llamado a la acción */}
        <p className="font-kievit-medium text-2xl leading-snug tracking-wide text-white md:text-3xl">
          Acercate a nuestro stand y disfrutá de todas las actividades.
        </p>
      </div>
    </div>
  );
}
