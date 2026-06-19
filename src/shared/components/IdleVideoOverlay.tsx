import { useEffect, useRef, useState } from 'react';

const IDLE_MS = 3 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'] as const;

export function IdleVideoOverlay() {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    // if (!window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches) return;

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
      window.addEventListener(evt, handleActivity, { passive: true, capture: true });
    });

    scheduleIdle();

    return () => {
      clearTimer();
      ACTIVITY_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, handleActivity, { capture: true } as EventListenerOptions);
      });
    };
  }, []);

  useEffect(() => {
    if (visible) {
      videoRef.current?.play().catch(() => { });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        src="/shared/idle-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className="pointer-events-none h-full w-full select-none object-cover"
      />
    </div>
  );
}
