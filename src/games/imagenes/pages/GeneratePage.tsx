import { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import Lottie from 'lottie-react';
import { ArrowLeft, RotateCw, ThumbsUp } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@shared/components/ui/button';
import { EmailSendDialog } from '@shared/components/EmailSendDialog';
import { GenerationError } from '@shared/components/GenerationError';
import { Skeleton } from '@shared/components/ui/skeleton';
import { toFriendlyError, type FriendlyError } from '@shared/lib/errors';
import { generateImage } from '@imagenes/lib/flux';
import { buildPrompt } from '@imagenes/lib/prompt';
import type { Opciones } from '@imagenes/types';
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
  'Trazando los contornos de la caricatura…',
  'Poniéndole onda de anime al atardecer…',
  'Sembrando los últimos píxeles…',
  'Casi pronto, último retoque al rancho…',
];

type Phase = 'generating' | 'done' | 'error';

interface GeneratePageProps {
  apiKey: string;
  photo: { base64: string; dataUrl: string };
  opciones: Opciones;
  onBack: () => void;
  onDone: () => void;
}

export function GeneratePage({ apiKey, photo, opciones, onBack, onDone }: GeneratePageProps) {
  const [phase, setPhase] = useState<Phase>('generating');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [friendlyError, setFriendlyError] = useState<FriendlyError | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>(STATUS_MESSAGES[0]);
  const [showConfetti, setShowConfetti] = useState(false);
  const currentResultRef = useRef<string | null>(null);
  const hasRunRef = useRef(false);

  const run = async () => {
    setPhase('generating');
    setFriendlyError(null);
    setPublicUrl(null);
    try {
      const { prompt, extraReferenceUrl } = buildPrompt(opciones);
      const { blob, url: falUrl } = await generateImage({
        apiKey,
        prompt,
        inputImageBase64: photo.base64,
        extraReferenceUrl,
      });
      if (currentResultRef.current) URL.revokeObjectURL(currentResultRef.current);
      const objectUrl = URL.createObjectURL(blob);
      currentResultRef.current = objectUrl;
      setResultUrl(objectUrl);
      setPublicUrl(falUrl);
      setPhase('done');
    } catch (err) {
      console.warn('[imagenes] generación falló', err);
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
      <header className="relative flex items-center justify-center">
        {phase === 'error' && (
          <Button variant="ghost" size="sm" onClick={onBack} className="absolute left-0">
            <ArrowLeft className="size-4" /> Volver
          </Button>
        )}
        <h2 className="whitespace-nowrap text-center text-3xl font-kievit-black tracking-wide text-white drop-shadow-md">
          {phase === 'generating' ? 'Generando Imagen' : 'Resultado'}
        </h2>
      </header>

      <div className="flex flex-1 min-h-0 items-center justify-center">
        <div className="relative aspect-[9/16] h-full max-h-full w-auto max-w-full overflow-hidden rounded-2xl border-4 border-[#C9A06A] bg-muted">
          {phase === 'generating' && (
            <>
              <img
                src={photo.dataUrl}
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

          {phase === 'done' && resultUrl && (
            <img
              src={resultUrl}
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
              value={`${window.location.origin}/imagenes/descargar?u=${encodeURIComponent(publicUrl)}`}
              level="M"
              className="h-full w-full"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-2xl font-kievit-black tracking-wide text-black">Escaneá para llevártela</p>
            <p className="text-lg text-black">
              Apuntá la cámara de tu celular al QR
            </p>
            <EmailSendDialog mediaType="image" mediaUrl={publicUrl} />
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
