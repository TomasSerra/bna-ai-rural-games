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
      className="fixed inset-0 z-[9999] overflow-hidden bg-black select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <img
        src="/shared/banner.webp"
        alt="Banco Nación Expo Rural 2026"
        className="pointer-events-none h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
