import { useEffect, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@shared/components/ui/alert';

const WATERMARK_URL = '/videos/watermark.png';

function loadImage(src: string, crossOrigin?: 'anonymous'): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No pude cargar la imagen: ${src}`));
    img.src = src;
  });
}

async function composeWatermarked(falUrl: string): Promise<HTMLCanvasElement> {
  const [photo, watermark] = await Promise.all([
    loadImage(falUrl, 'anonymous'),
    loadImage(WATERMARK_URL),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = photo.naturalWidth;
  canvas.height = photo.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No pude inicializar el canvas.');

  ctx.drawImage(photo, 0, 0);

  // Same burn-in watermark as the video download: full width, anchored bottom.
  const watermarkHeight = canvas.width * (watermark.naturalHeight / watermark.naturalWidth);
  ctx.drawImage(watermark, 0, canvas.height - watermarkHeight, canvas.width, watermarkHeight);

  return canvas;
}

async function descargarCanvas(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95),
  );
  if (!blob) throw new Error('No pude generar el archivo para descargar.');

  const filename = `bna-campo-argentina-${Date.now()}.jpg`;
  const file = new File([blob], filename, { type: 'image/jpeg' });

  // iOS Safari: Web Share API opens the native share sheet → "Guardar en Fotos".
  // Android / desktop: fallback to <a download>.
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string }) => Promise<void>;
  };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: 'Mi imagen de Campo' });
      return;
    } catch {
      // User cancelled the share sheet — fall through to direct download.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ImagePage() {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    document.body.classList.add('allow-native-gestures');
    return () => document.body.classList.remove('allow-native-gestures');
  }, []);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const u = new URLSearchParams(window.location.search).get('u');
    if (!u) {
      setErrorMsg('No se especificó la imagen.');
      return;
    }

    composeWatermarked(u)
      .then((canvas) => {
        canvasRef.current = canvas;
        setPreviewSrc(canvas.toDataURL('image/jpeg', 0.92));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setErrorMsg(msg);
      });
  }, []);

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setDownloading(true);
    try {
      await descargarCanvas(canvasRef.current);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No pude descargar la imagen.';
      setErrorMsg(msg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex min-h-dvh w-dvw flex-col items-center gap-4 bg-[linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)),url('/imagenes/bg-game.png')] bg-cover bg-center bg-no-repeat p-4">
      {errorMsg && (
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>No pudimos preparar la imagen</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {!errorMsg && !previewSrc && (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-white" />
            <p className="text-base text-white">Preparando tu imagen…</p>
          </div>
        </div>
      )}

      {previewSrc && (
        <>
          <img
            src={previewSrc}
            alt="Tu imagen Mundial"
            draggable
            className="max-h-[80dvh] w-auto max-w-full rounded-2xl border-4 border-[#C9A06A] bg-muted object-contain shadow-xl"
            style={{
              WebkitTouchCallout: 'default',
              WebkitUserSelect: 'auto',
              userSelect: 'auto',
              touchAction: 'auto',
            }}
          />
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="h-20 w-[90%] gap-4 rounded-full border-2 border-[#356B22] bg-gradient-to-b from-[#6FB23E] to-[#3E7D29] text-3xl text-white shadow-xl hover:from-[#7cc049] hover:to-[#46892f] [&_svg]:size-8"
          >
            {downloading ? (
              <>
                <Loader2 className="animate-spin" />
                Preparando descarga…
              </>
            ) : (
              <>
                <Download />
                Descargar
              </>
            )}
          </Button>
          <p className="text-center text-xl text-foreground">
            Tambien podes <strong>mantener apretada</strong> la imagen <br /> y guardarla en tus fotos
          </p>
        </>
      )}
    </div>
  );
}
