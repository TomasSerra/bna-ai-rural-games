import { useEffect, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@shared/components/ui/alert';
import { processVideo, supportsVideoProcessing } from '@videos/lib/processVideo';

// veo uses the uploaded selfie as the literal first frame — without trimming,
// the MP4 visibly freezes before the animation starts.
const TRIM_START_SECONDS = 0.7;
const WATERMARK_URL = '/videos/watermark.png';

function fallbackDownload(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function VideoPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // iOS Safari drops the user-gesture context across `await`, so we prepare
  // the File eagerly on mount — the click handler then calls navigator.share
  // synchronously and the share sheet actually opens.
  const [downloadFile, setDownloadFile] = useState<File | null>(null);
  // Same blob as downloadFile, exposed as an object URL for the <video> preview
  // so the user sees exactly what they're downloading (watermark burned in).
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
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
      setErrorMsg('No se especificó el video.');
      return;
    }

    let cancelled = false;
    let createdObjectUrl: string | null = null;
    (async () => {
      try {
        const resp = await fetch(u);
        if (!resp.ok) throw new Error(`No pude descargar el video (${resp.status}).`);
        const rawBlob = await resp.blob();

        // Trim + burn-in watermark via mediabunny (WebCodecs). If the browser
        // doesn't support WebCodecs, or if the pipeline fails on an edge-case
        // device, fall back to the raw MP4 so the user still gets something.
        let finalBlob = rawBlob;
        if (supportsVideoProcessing()) {
          try {
            finalBlob = await processVideo(rawBlob, {
              trimStartSeconds: TRIM_START_SECONDS,
              watermarkUrl: WATERMARK_URL,
            });
          } catch (processErr) {
            console.warn('Video processing failed, downloading raw MP4:', processErr);
          }
        } else {
          console.warn('Browser lacks WebCodecs support — downloading raw MP4.');
        }

        if (cancelled) return;
        const filename = `bna-campo-argentina-${Date.now()}.mp4`;
        setDownloadFile(
          new File([finalBlob], filename, { type: finalBlob.type || 'video/mp4' }),
        );
        createdObjectUrl = URL.createObjectURL(finalBlob);
        setPreviewUrl(createdObjectUrl);
      } catch (err) {
        if (cancelled) return;
        console.error('Video prep failed:', err);
        const msg =
          err instanceof Error ? err.message : String(err) || 'No pude preparar el video.';
        setErrorMsg(msg);
      }
    })();

    return () => {
      cancelled = true;
      if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl);
    };
  }, []);

  const handleDownload = () => {
    if (!downloadFile) return;
    setDownloading(true);

    const nav = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean;
      share?: (data: { files: File[]; title?: string }) => Promise<void>;
    };

    // No awaits between the click and nav.share — iOS requires the share call
    // to happen inside the same task as the user gesture.
    if (nav.canShare?.({ files: [downloadFile] }) && nav.share) {
      nav
        .share({ files: [downloadFile], title: 'Mi video de Campo' })
        .catch(() => {
          fallbackDownload(downloadFile);
        })
        .finally(() => setDownloading(false));
      return;
    }

    fallbackDownload(downloadFile);
    setDownloading(false);
  };

  return (
    <div className="flex min-h-dvh w-dvw flex-col items-center gap-4 bg-[url('/videos/bg-game.png')] bg-cover bg-center bg-no-repeat p-4">
      {errorMsg && (
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>No pudimos preparar el video</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {!errorMsg && (
        <>
          <div className="relative aspect-[9/16] h-[80dvh] max-w-full overflow-hidden rounded-lg border bg-muted shadow-sm">
            {previewUrl && (
              <video
                src={previewUrl}
                autoPlay
                muted
                playsInline
                loop
                disablePictureInPicture
                disableRemotePlayback
                controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                onLoadedData={() => setVideoLoaded(true)}
                className={`h-full w-full object-cover transition-opacity duration-200 ${
                  videoLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
            {!videoLoaded && (
              <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-muted">
                <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-base font-medium text-primary-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando video...
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={handleDownload}
            disabled={!downloadFile || downloading}
            className="h-20 w-[90%] text-3xl [&_svg]:size-8 gap-4"
          >
            {!downloadFile || downloading ? (
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
        </>
      )}
    </div>
  );
}
