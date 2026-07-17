import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Alert, AlertDescription } from '@shared/components/ui/alert';

interface PhotoCaptureProps {
  /** Receives base64 (no data: prefix) and a data URL for preview. */
  onCapture: (args: { base64: string; dataUrl: string }) => void;
  hasPhoto: boolean;
  previewUrl?: string;
  onReset: () => void;
}

const BUTTON_HEIGHT = 64; // h-16
const COLUMN_GAP = 12;    // gap-3
const PHOTO_ASPECT = 3 / 4;

const OUTPUT_WIDTH = 720;
const OUTPUT_HEIGHT = 960;
// Reintentos máximos, tanto para esperar un frame decodificado como para
// reintentar el draw si sale el "frame verde".
const MAX_CAPTURE_ATTEMPTS = 4;

type VideoWithRVFC = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
};

type ImageCaptureWithGrabFrame = ImageCapture & {
  grabFrame?: () => Promise<ImageBitmap>;
};

/**
 * Espera a un frame realmente presentado por el <video> antes de dibujar.
 * `requestVideoFrameCallback` garantiza que el cuadro ya fue decodificado y
 * subido a la GPU; si no está disponible, cae a `requestAnimationFrame`.
 *
 * IMPORTANTE: si el <video> está pausado o su stream se congeló, `rvfc` puede
 * no dispararse nunca. Un timeout de respaldo garantiza que la promesa siempre
 * resuelva, para que la captura no quede colgada indefinidamente.
 */
function waitForVideoFrame(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const rvfc = (video as VideoWithRVFC).requestVideoFrameCallback;
    if (typeof rvfc === 'function') rvfc.call(video, finish);
    else requestAnimationFrame(finish);
    window.setTimeout(finish, 200);
  });
}

/**
 * Dibuja cualquier fuente de imagen en un canvas 720x960, con crop 3:4 y
 * espejado horizontal (selfie). Devuelve el canvas, o null si no hay contexto 2D.
 */
function drawSource(
  source: CanvasImageSource,
  w: number,
  h: number,
): HTMLCanvasElement | null {
  if (w <= 0 || h <= 0) return null;
  let cropW: number;
  let cropH: number;
  if (w / h > PHOTO_ASPECT) {
    cropH = h;
    cropW = h * PHOTO_ASPECT;
  } else {
    cropW = w;
    cropH = w / PHOTO_ASPECT;
  }
  const sx = (w - cropW) / 2;
  const sy = (h - cropH) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  // `willReadFrequently` mantiene el canvas respaldado en CPU: `isGreenFrame`
  // hace varios `getImageData` y sin este hint cada uno fuerza un readback
  // GPU→CPU sincrónico (caro en el hardware del kiosco).
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.translate(OUTPUT_WIDTH, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, sx, sy, cropW, cropH, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  return canvas;
}

function drawVideoFrame(video: HTMLVideoElement): HTMLCanvasElement | null {
  return drawSource(video, video.videoWidth, video.videoHeight);
}

async function drawPhotoBlob(blob: Blob): Promise<HTMLCanvasElement | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob);
      try {
        return drawSource(bitmap, bitmap.width, bitmap.height);
      } finally {
        bitmap.close();
      }
    } catch (err) {
      // Algunos WebView anuncian createImageBitmap pero fallan con el JPEG
      // nativo de la cámara. Un <img> con object URL usa otro decoder.
      console.warn('[camera] createImageBitmap falló; usando Image', err);
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('No se pudo decodificar la foto de la cámara.'));
      image.src = objectUrl;
    });
    return drawSource(image, image.naturalWidth, image.naturalHeight);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Detecta el "frame verde": cuando Chromium/Android dibuja una textura de video
 * aún no subida a la GPU, el canvas sale casi uniforme y verde. Se marca como
 * inválido solo si es uniforme Y verde-dominante, para no confundir una foto
 * legítimamente plana con el bug.
 */
function isGreenFrame(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const GRID = 5;
  const stepX = canvas.width / (GRID + 1);
  const stepY = canvas.height / (GRID + 1);

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  const greens: number[] = [];

  for (let i = 1; i <= GRID; i++) {
    for (let j = 1; j <= GRID; j++) {
      const x = Math.floor(stepX * i);
      const y = Math.floor(stepY * j);
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      sumR += r;
      sumG += g;
      sumB += b;
      greens.push(g);
    }
  }

  const n = GRID * GRID;
  const avgR = sumR / n;
  const avgG = sumG / n;
  const avgB = sumB / n;

  const greenDominant = avgG > 60 && avgG > avgR * 1.4 && avgG > avgB * 1.4;
  const spread = Math.max(...greens) - Math.min(...greens);
  const uniform = spread < 24;

  return greenDominant && uniform;
}

export function PhotoCapture({ onCapture, hasPhoto, previewUrl, onReset }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const [streaming, setStreaming] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [cameraSession, setCameraSession] = useState(0);
  const [columnWidth, setColumnWidth] = useState<number | undefined>();
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      const photoH = Math.max(0, h - BUTTON_HEIGHT - COLUMN_GAP);
      setColumnWidth(photoH * PHOTO_ASPECT);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasPhoto]);

  useEffect(() => {
    if (hasPhoto) return;
    let stream: MediaStream | null = null;
    let cancelled = false;

    setStreaming(false);
    setCapturing(false);
    setCameraError(null);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: OUTPUT_WIDTH }, height: { ideal: OUTPUT_HEIGHT } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = videoRef.current;
        const track = stream.getVideoTracks()[0] ?? null;
        if (video && track) {
          streamRef.current = stream;
          trackRef.current = track;
          video.srcObject = stream;
          await video.play().catch(() => {});
          setStreaming(true);
        }
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : 'No pudimos acceder a la cámara.';
        setCameraError(msg);
        setStreaming(false);
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      if (streamRef.current === stream) streamRef.current = null;
      if (trackRef.current && stream?.getTracks().includes(trackRef.current)) trackRef.current = null;
      if (videoRef.current?.srcObject === stream) videoRef.current.srcObject = null;
      setStreaming(false);
    };
  }, [cameraSession, hasPhoto]);

  useEffect(() => {
    if (hasPhoto) setCountdown(null);
  }, [hasPhoto]);

  useEffect(() => {
    // Re-armar en el setup: en StrictMode (dev) el ciclo mount→unmount→remount
    // deja `mountedRef` en false tras el primer cleanup, y sin esto la captura
    // quedaría bloqueada para siempre.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (countdownTimerRef.current) window.clearTimeout(countdownTimerRef.current);
    };
  }, []);

  const restartCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    trackRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    setCapturing(false);
    setCameraSession((session) => session + 1);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const track = trackRef.current;
    if (!video || !track || track.readyState !== 'live') return;

    setCapturing(true);
    // Congelar exactamente el encuadre que vio la persona al llegar a cero.
    // El MediaStream sigue activo para ImageCapture y para los fallbacks.
    video.pause();

    try {
      let canvas: HTMLCanvasElement | null = null;

      if (typeof ImageCapture !== 'undefined') {
        let imageCapture: ImageCaptureWithGrabFrame | null = null;
        try {
          imageCapture = new ImageCapture(track) as ImageCaptureWithGrabFrame;
        } catch (err) {
          console.warn('[camera] no se pudo inicializar ImageCapture', err);
        }

        // Primero capturamos el frame del stream: coincide con el preview y es
        // prácticamente instantáneo. También evita leer la textura del <video>.
        if (imageCapture && typeof imageCapture.grabFrame === 'function') {
          let bitmap: ImageBitmap | null = null;
          try {
            bitmap = await imageCapture.grabFrame();
            const candidate = drawSource(bitmap, bitmap.width, bitmap.height);
            if (candidate && !isGreenFrame(candidate)) canvas = candidate;
          } catch (err) {
            console.warn('[camera] ImageCapture.grabFrame falló; usando takePhoto', err);
          } finally {
            bitmap?.close();
          }
        }

        // takePhoto puede tardar y usar otro encuadre del sensor; queda como
        // fallback robusto para los Android donde grabFrame devuelve verde.
        if (!canvas && imageCapture) {
          try {
            const blob = await imageCapture.takePhoto();
            const candidate = await drawPhotoBlob(blob);
            if (candidate && !isGreenFrame(candidate)) canvas = candidate;
          } catch (err) {
            console.warn('[camera] ImageCapture.takePhoto falló; usando canvas', err);
          }
        }
      }

      // Último recurso: copiar el frame congelado del <video>. Los callbacks
      // tienen timeout porque un video pausado no presenta frames nuevos.
      let waits = 0;
      while (!canvas && (video.readyState < 2 || video.videoWidth === 0) && waits < MAX_CAPTURE_ATTEMPTS) {
        await waitForVideoFrame(video);
        waits++;
      }
      for (let attempt = 0; attempt < MAX_CAPTURE_ATTEMPTS; attempt++) {
        if (canvas || video.videoWidth === 0) break;
        const candidate = drawVideoFrame(video);
        if (candidate && !isGreenFrame(candidate)) {
          canvas = candidate;
          break;
        }
        await waitForVideoFrame(video);
      }

      if (!canvas) {
        if (!mountedRef.current) return;
        setCaptureError('La cámara devolvió una imagen inválida. Intentá nuevamente.');
        restartCamera();
        return;
      }

      if (!mountedRef.current) return;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const base64 = dataUrl.split(',')[1] ?? '';
      if (!base64) {
        setCaptureError('No pudimos guardar la foto. Intentá nuevamente.');
        restartCamera();
        return;
      }
      setCaptureError(null);
      setCapturing(false);
      onCapture({ base64, dataUrl });
    } catch (err) {
      console.warn('[camera] la captura falló de forma inesperada', err);
      if (!mountedRef.current) return;
      setCaptureError('No pudimos capturar la foto. Intentá nuevamente.');
      restartCamera();
    }
  };

  const startCountdown = () => {
    if (!streaming || countdown !== null || capturing) return;

    setCaptureError(null);
    setCountdown(3);

    const tick = (nextValue: number) => {
      countdownTimerRef.current = window.setTimeout(() => {
        if (nextValue > 0) {
          setCountdown(nextValue);
          tick(nextValue - 1);
          return;
        }

        setCountdown(null);
        void capturePhoto();
      }, 1000);
    };

    tick(2);
  };

  if (hasPhoto && previewUrl) {
    return (
      <div ref={containerRef} className="flex h-full items-center justify-center">
        <div className="flex flex-col gap-3" style={{ width: columnWidth }}>
          <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl border-4 border-[#C9A06A] bg-muted shadow-xl">
            <img src={previewUrl} alt="Foto capturada" className="h-full w-full object-cover" />
          </div>
          <Button
            variant="outline"
            onClick={onReset}
            className="h-16 w-full min-w-max whitespace-nowrap rounded-full border-2 border-[#C9A06A] bg-[#FFF8EC] text-[#5B3A1E] text-2xl hover:bg-white hover:text-[#5B3A1E] [&_svg]:size-7"
          >
            <RefreshCw /> Volver a tomar la foto
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full items-center justify-center">
      <div className="flex flex-col gap-3" style={{ width: columnWidth }}>
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-4 border-[#C9A06A] bg-muted shadow-xl">
          {cameraError ? (
            <div className="flex h-full items-center justify-center p-4">
              <Alert variant="destructive">
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover [transform:scaleX(-1)]"
            />
          )}
          {!cameraError && captureError && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20">
              <Alert variant="destructive" className="bg-white/95">
                <AlertDescription>{captureError}</AlertDescription>
              </Alert>
            </div>
          )}
          {countdown !== null && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/20">
              <span className="font-kievit-black text-[10rem] leading-none text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.8)]">
                {countdown}
              </span>
            </div>
          )}
          {capturing && countdown === null && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/30">
              <span className="rounded-full bg-black/70 px-6 py-3 text-2xl font-bold text-white shadow-lg">
                Capturando…
              </span>
            </div>
          )}
        </div>

        <Button
          onClick={startCountdown}
          disabled={!streaming || countdown !== null || capturing}
          className="h-16 w-full rounded-full border-2 border-[#356B22] bg-gradient-to-b from-[#6FB23E] to-[#3E7D29] text-2xl text-white shadow-lg hover:from-[#7cc049] hover:to-[#46892f] [&_svg]:size-7"
        >
          <Camera /> {capturing ? 'Capturando…' : 'Capturar foto'}
        </Button>
      </div>
    </div>
  );
}
