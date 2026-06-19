import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import './index.css';

// ── Kiosk hardening ────────────────────────────────────────────────────────
// Block zoom (pinch, double-tap, ctrl+wheel, ctrl/cmd+/-), context menu,
// text/image selection and drag. The public download routes are shown on the
// visitor's phone after scanning a QR, and must keep native long-press →
// "Save image/video", so each public page sets
// document.body.classList.add('allow-native-gestures') and we early-return from
// every listener while that class is present.
const PUBLIC_ROUTES = ['/imagenes/descargar', '/videos/descargar'];
const isMobilePreviewRoute = () =>
  PUBLIC_ROUTES.some((p) => window.location.pathname.startsWith(p));
const isNativeGestureMode = () =>
  document.body.classList.contains('allow-native-gestures') || isMobilePreviewRoute();

const isEditable = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
};

// iOS pinch-zoom
(['gesturestart', 'gesturechange', 'gestureend'] as const).forEach((name) => {
  document.addEventListener(
    name,
    (e) => {
      if (isNativeGestureMode()) return;
      e.preventDefault();
    },
    { passive: false },
  );
});

// Trackpad / ctrl+wheel zoom
document.addEventListener(
  'wheel',
  (e) => {
    if (isNativeGestureMode()) return;
    if (e.ctrlKey) e.preventDefault();
  },
  { passive: false },
);

// Keyboard zoom (Ctrl/Cmd + +/-/0)
document.addEventListener('keydown', (e) => {
  if (isNativeGestureMode()) return;
  if ((e.ctrlKey || e.metaKey) && ['=', '+', '-', '0'].includes(e.key)) {
    e.preventDefault();
  }
});

// Double-tap zoom (iOS Safari): swallow the 2nd touchend within 300ms.
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    if (isNativeGestureMode()) return;
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  },
  { passive: false },
);

// Multi-touch pinch fallback for browsers that ignore user-scalable=no.
document.addEventListener(
  'touchmove',
  (e) => {
    if (isNativeGestureMode()) return;
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);

// Context menu (right-click + some long-press paths)
document.addEventListener('contextmenu', (e) => {
  if (isNativeGestureMode()) return;
  e.preventDefault();
});

// Text selection
document.addEventListener('selectstart', (e) => {
  if (isNativeGestureMode()) return;
  if (isEditable(e.target)) return;
  e.preventDefault();
});

// Image / text drag
document.addEventListener('dragstart', (e) => {
  if (isNativeGestureMode()) return;
  e.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>,
);
