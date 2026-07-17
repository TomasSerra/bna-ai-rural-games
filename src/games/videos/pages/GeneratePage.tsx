import { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import Lottie from 'lottie-react';
import { ArrowLeft, Check, RotateCw, ThumbsUp } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@shared/components/ui/button';
import { EmailSendDialog } from '@shared/components/EmailSendDialog';
import { GenerationError } from '@shared/components/GenerationError';
import { Skeleton } from '@shared/components/ui/skeleton';
import { toFriendlyError, type FriendlyError } from '@shared/lib/errors';
import { generateImage } from '@videos/lib/image';
import { generateVideo } from '@videos/lib/video';
import { processVideo, supportsVideoProcessing } from '@videos/lib/processVideo';
import { buildImagePrompt, buildVideoPrompt } from '@videos/lib/prompt';
import { cn } from '@shared/lib/utils';
import type { Opciones } from '@videos/types';
import loadingAnimation from '@shared/assets/tractor.json';

const STATUS_MESSAGES = [
  'Cebando un mate para inspirarse…',
  'Arrancando el tractor con la manija…',
  'Ensillando el caballo, que se hace el rebelde…',
  'Convenciendo a la vaca de que se deje ordeñar…',
  'Arreando ovejas que andan dispersas…',
  'Afilando la tijera de esquilar…',
  'Negociando con el perro ovejero…',
  'Sacudiéndole la tierra a las botas…',
  'Acomodando el sombrero para la foto…',
  'Eligiendo la mejor parra del viñedo…',
  'Contando las hileras de soja…',
  'Esperando que pinte el sol en la Patagonia…',
  'Abriendo la tranquera del corral…',
  'Pintando el campo dorado del amanecer…',
  'Buscando el ombú para la sombra…',
  'Espantando una mosca del mate…',
  'Dándole brillo de Pixar al paisaje…',
  'Modelando la caricatura cuadro por cuadro…',
  'Amasando la plastilina del rancho…',
  'Encastrando los bloquecitos del campo…',
  'Animando los primeros movimientos…',
  'Acomodando la cámara para el plano…',
  'Renderizando el videíto del campo…',
  'Casi pronto, último retoque al rancho…',
];

type Phase = 'generating' | 'done' | 'error';
type Step = 'image' | 'video';

interface GeneratePageProps {
  apiKey: string;
  photo: { base64: string; dataUrl: string };
  opciones: Opciones;
  onBack: () => void;
  onDone: () => void;
}

export function GeneratePage({ apiKey, photo, opciones, onBack, onDone }: GeneratePageProps) {
  const [phase, setPhase] = useState<Phase>('generating');
  const [step, setStep] = useState<Step>('image');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [friendlyError, setFriendlyError] = useState<FriendlyError | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>(STATUS_MESSAGES[0]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  // Cuando el <video> no reproduce en este equipo, mostramos la imagen generada
  // como fallback visual (el QR/descarga siguen apuntando al video real).
  const [previewFailed, setPreviewFailed] = useState(false);
  const currentResultRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rawBlobRef = useRef<Blob | null>(null);
  const recoverStageRef = useRef<'blob' | 'remote' | 'reencode' | 'done'>('blob');
  const hasRunRef = useRef(false);

  const run = async () => {
    setPhase('generating');
    setStep('image');
    setGeneratedImageUrl(null);
    setFriendlyError(null);
    setPublicUrl(null);
    setVideoReady(false);
    setPreviewFailed(false);
    recoverStageRef.current = 'blob';
    try {
      // Paso 1 — generar la imagen estilizada (preserva identidad).
      const imagePrompt = buildImagePrompt(opciones);
      const image = await generateImage({
        apiKey,
        prompt: imagePrompt.prompt,
        inputImageBase64: photo.base64,
        extraReferenceUrl: imagePrompt.extraReferenceUrl,
      });
      // Reemplaza el fondo borroso (selfie → imagen estilizada).
      setGeneratedImageUrl(`data:image/jpeg;base64,${image.base64}`);
      setStep('video');

      // Paso 2 — animar esa imagen.
      const { prompt } = buildVideoPrompt(opciones);
      const { blob, url: falUrl } = await generateVideo({
        apiKey,
        prompt,
        inputImageBase64: image.base64,
      });
      if (currentResultRef.current) URL.revokeObjectURL(currentResultRef.current);
      rawBlobRef.current = blob;
      const objectUrl = URL.createObjectURL(blob);
      currentResultRef.current = objectUrl;
      setResultUrl(objectUrl);
      setPublicUrl(falUrl);
      setPhase('done');
    } catch (err) {
      console.warn('[videos] generación falló', err);
      setFriendlyError(toFriendlyError(err));
      setPhase('error');
    }
  };

  const regenerate = () => {
    // Re-arm so the user-triggered "Regenerar" / "Reintentar" can run again.
    hasRunRef.current = true;
    run();
  };

  useEffect(() => {
    // Guard against React StrictMode double-invocation in dev — without this,
    // every "Generar" would submit TWO requests to fal.ai and charge twice.
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    run();
    return () => {
      if (currentResultRef.current) URL.revokeObjectURL(currentResultRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'done') return;
    setShowConfetti(true);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'generating') return;
    setStatusMsg(STATUS_MESSAGES[Math.floor(Math.random() * STATUS_MESSAGES.length)]);
    const id = window.setInterval(() => {
      setStatusMsg((prev) => {
        const pool = STATUS_MESSAGES.filter((m) => m !== prev);
        return pool[Math.floor(Math.random() * pool.length)];
      });
    }, 2200);
    return () => window.clearInterval(id);
  }, [phase]);

  // Algunas TVs con Opera/Android ignoran el atributo `autoPlay`: pedimos la
  // reproducción a mano (muted → autoplay permitido) y reintentamos si el
  // navegador la rechaza, hasta que haya frames decodificados.
  const tryPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p) p.catch(() => requestAnimationFrame(tryPlay));
  };

  // Cuando el preview no pinta (blob en blanco en esa TV), recuperamos por
  // etapas, de más barata a más costosa:
  //   1. blob → URL remota de fal directo: streaming HTTP con range requests,
  //      esquiva tanto los problemas de este browser con blobs grandes en
  //      <video> como el `moov` al final del MP4 crudo de pixverse.
  //   2. re-encode local a H.264 limpio (SOLO sirve si el equipo puede
  //      encodear vía WebCodecs; varias TVs no pueden y esto no aplica).
  const recoverPreview = async () => {
    // Etapa 1: probar la URL remota directa.
    if (recoverStageRef.current === 'blob') {
      recoverStageRef.current = 'remote';
      if (publicUrl) {
        setVideoReady(false);
        setResultUrl(publicUrl); // el <video> pasa a streamear el MP4 remoto
        return;
      }
    }

    // Etapa 2: re-encode local (si el equipo puede encodear).
    if (recoverStageRef.current === 'remote') {
      recoverStageRef.current = 'reencode';
      const raw = rawBlobRef.current;
      if (raw && supportsVideoProcessing()) {
        try {
          const reencoded = await processVideo(raw); // transcode limpio: sin trim ni watermark
          if (currentResultRef.current) URL.revokeObjectURL(currentResultRef.current);
          const objectUrl = URL.createObjectURL(reencoded);
          currentResultRef.current = objectUrl;
          setVideoReady(false);
          setResultUrl(objectUrl);
          return;
        } catch (err) {
          recoverStageRef.current = 'done';
          console.warn('[videos] no se pudo re-encodear el video', err);
          setPreviewFailed(true); // fallback a la imagen generada
          return;
        }
      }
    }

    // Sin más opciones que probar: mostramos la imagen generada como fallback.
    recoverStageRef.current = 'done';
    setPreviewFailed(true);
  };

  // Watchdog: si a los ~3.5s el <video> no tiene dimensiones decodificadas
  // (videoWidth 0 / readyState bajo), asumimos fallo de decodificación silencioso
  // y disparamos la recuperación.
  useEffect(() => {
    if (phase !== 'done' || !resultUrl) return;
    const id = window.setTimeout(() => {
      const v = videoRef.current;
      if (!v || v.videoWidth === 0 || v.readyState < 2) {
        void recoverPreview();
      }
    }, 3500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, resultUrl]);

  return (
    <div className="flex h-dvh w-dvw flex-col gap-4 overflow-hidden p-6">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          colors={['#22c4e4', '#ffffff', '#2080bf', '#e3eef3']}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
          tweenDuration={3000}
          onConfettiComplete={(instance) => {
            instance?.reset();
            setShowConfetti(false);
          }}
          className="pointer-events-none fixed inset-0 z-50"
        />
      )}
      <header className="relative flex flex-col items-center justify-center gap-3">
        {phase === 'error' && (
          <Button variant="ghost" size="sm" onClick={onBack} className="absolute left-0 top-0">
            <ArrowLeft className="size-4" /> Volver
          </Button>
        )}
        {phase === 'generating' ? (
          <div className="flex items-center justify-center gap-3">
            <StepPill label="Generando imagen" active={step === 'image'} done={step === 'video'} />
            <div className="h-1 w-8 rounded-full bg-white/40" />
            <StepPill label="Generando video" active={step === 'video'} done={false} />
          </div>
        ) : (
          <h2 className="whitespace-nowrap text-center text-3xl font-kievit-black tracking-wide text-white drop-shadow-md">
            Resultado
          </h2>
        )}
      </header>

      <div className="flex flex-1 min-h-0 items-center justify-center">
        <div className="relative aspect-[9/16] h-full max-h-full w-auto max-w-full overflow-hidden rounded-2xl border-4 border-[#C9A06A] bg-muted">
          {phase === 'generating' && (
            <>
              <img
                src={generatedImageUrl ?? photo.dataUrl}
                alt=""
                aria-hidden
                className="h-full w-full scale-110 object-cover blur-2xl"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                <Lottie
                  animationData={loadingAnimation}
                  loop
                  className="w-2/3 max-w-[70%]"
                />
                <p
                  key={statusMsg}
                  className="animate-in fade-in rounded-full bg-primary px-8 py-4 text-center text-3xl text-white shadow-md"
                >
                  {statusMsg}
                </p>
              </div>
            </>
          )}

          {phase === 'done' && resultUrl && !previewFailed && (
            <video
              ref={videoRef}
              src={resultUrl}
              autoPlay
              muted
              playsInline
              loop
              // Kick off playback imperatively: some Android/Opera TVs ignore the
              // `autoPlay` attribute and would otherwise stay on a blank first
              // frame forever. tryPlay() re-asserts muted and retries on reject.
              onLoadedData={tryPlay}
              // Fade in once playback has actually started, so we never flash the
              // bare `bg-muted` container before the first frame is decoded.
              onPlaying={() => setVideoReady(true)}
              // Some TV decoders reject the raw MP4 with a hard error → recover
              // by re-encoding. (Silent failures are caught by the watchdog.)
              onError={(e) => {
                const err = e.currentTarget.error;
                console.warn('[videos] error de reproducción', err?.code, err?.message);
                void recoverPreview();
              }}
              className={cn(
                'h-full w-full object-cover transition-opacity duration-200',
                videoReady ? 'opacity-100' : 'opacity-0',
              )}
            />
          )}

          {/* Fallback: la TV no pudo reproducir el video → mostramos la imagen
              generada. El QR/descarga siguen apuntando al video real. */}
          {phase === 'done' && previewFailed && generatedImageUrl && (
            <img
              src={generatedImageUrl}
              alt="Imagen generada"
              className="h-full w-full object-cover"
            />
          )}

          {phase === 'error' && friendlyError && (
            <GenerationError error={friendlyError} />
          )}
        </div>
      </div>

      {phase === 'generating' && (
        <>
          <Skeleton className="h-16 w-full" />
          <div className="flex items-center justify-center gap-6 rounded-2xl border bg-card p-6">
            <Skeleton className="size-48 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </div>
        </>
      )}

      {phase === 'done' && (
        <Button
          onClick={onDone}
          className="h-16 w-full rounded-full border-2 border-[#356B22] bg-gradient-to-b from-[#6FB23E] to-[#3E7D29] text-2xl text-white shadow-xl hover:from-[#7cc049] hover:to-[#46892f] [&_svg]:size-7"
        >
          <ThumbsUp /> Listo
        </Button>
      )}

      {phase === 'done' && publicUrl && (
        <div className="flex items-center justify-center gap-6 rounded-2xl border bg-card p-6">
          <div className="size-48 shrink-0 rounded-lg bg-white p-3">
            <QRCodeSVG
              value={`${window.location.origin}/videos/descargar?u=${encodeURIComponent(publicUrl)}`}
              level="M"
              className="h-full w-full"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-2xl font-kievit-black tracking-wide text-black">Escaneá para llevártelo</p>
            <p className="text-lg text-black">
              Apuntá la cámara de tu celular al QR
            </p>
            <EmailSendDialog mediaType="video" mediaUrl={publicUrl} />
          </div>
        </div>
      )}

      {phase === 'error' && (
        <Button
          onClick={regenerate}
          className="h-16 w-full rounded-full border-2 border-[#356B22] bg-gradient-to-b from-[#6FB23E] to-[#3E7D29] text-2xl text-white shadow-xl hover:from-[#7cc049] hover:to-[#46892f] [&_svg]:size-7"
        >
          <RotateCw /> Reintentar
        </Button>
      )}
    </div>
  );
}

interface StepPillProps {
  label: string;
  active: boolean;
  done: boolean;
}

function StepPill({ label, active, done }: StepPillProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full px-5 py-2 text-xl font-kievit-black tracking-wide shadow-md transition-colors',
        done
          ? 'bg-primary text-white'
          : active
            ? 'bg-white text-primary'
            : 'bg-white/30 text-white/70'
      )}
    >
      {done ? (
        <Check className="size-5" />
      ) : (
        <span
          className={cn(
            'size-3 rounded-full',
            active ? 'animate-pulse bg-primary' : 'bg-white/50'
          )}
        />
      )}
      {label}
    </div>
  );
}
