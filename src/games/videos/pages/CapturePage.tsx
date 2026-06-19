import { Sparkles } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { PhotoCapture } from '@shared/components/PhotoCapture';
import { OptionsForm } from '@videos/components/OptionsForm';
import type { Opciones } from '@videos/types';

interface CapturePageProps {
  photo: { base64: string; dataUrl: string } | null;
  setPhoto: (p: { base64: string; dataUrl: string } | null) => void;
  opciones: Opciones;
  setOpciones: (o: Opciones) => void;
  canGenerate: boolean;
  onGenerate: () => void;
}

export function CapturePage({
  photo,
  setPhoto,
  opciones,
  setOpciones,
  canGenerate,
  onGenerate,
}: CapturePageProps) {
  return (
    <div className="flex h-dvh w-dvw flex-col gap-4 overflow-hidden p-6">
      <section className="flex flex-[1.15] min-h-0 flex-col pt-4">
        <div className="flex-1 min-h-0">
          <PhotoCapture
            hasPhoto={Boolean(photo)}
            previewUrl={photo?.dataUrl}
            onCapture={(p) => setPhoto(p)}
            onReset={() => setPhoto(null)}
          />
        </div>
      </section>

      <section className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden pt-4">
        <h2 className="text-3xl font-kievit-black tracking-wide text-white drop-shadow-md">Elegí la escena de campo</h2>
        <div className="flex-1 min-h-0 overflow-auto">
          <OptionsForm value={opciones} onChange={setOpciones} />
        </div>
        {photo && (
          <Button
            className="h-20 w-full bg-gradient-to-r from-primary to-[#22639C] text-3xl text-primary-foreground hover:from-primary/90 hover:to-[#22639C]/90 [&_svg]:size-8"
            disabled={!canGenerate}
            onClick={onGenerate}
          >
            <Sparkles /> Generar video
          </Button>
        )}
      </section>
    </div>
  );
}
