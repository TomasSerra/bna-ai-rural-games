import { Sparkles } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { PhotoCapture } from "@shared/components/PhotoCapture";
import { OptionsForm } from "@imagenes/components/OptionsForm";
import type { Opciones } from "@imagenes/types";

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

      <section className="flex shrink-0 flex-col gap-4 pt-4">
        <div className="relative w-full">
          <img src="/imagenes/cartel.png" alt="" className="block w-full" />
          <div className="absolute inset-0 flex flex-col gap-3 px-8 pt-6 pb-1">
            <h2 className="text-3xl font-kievit-black tracking-wide text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)]">
              Elegí la escena de campo
            </h2>
            <div className="flex-1 min-h-0 overflow-auto">
              <OptionsForm value={opciones} onChange={setOpciones} />
            </div>
          </div>
        </div>
        <div className="h-20 shrink-0">
          {photo && (
            <Button
              className="h-full w-full rounded-full border-2 border-[#356B22] bg-gradient-to-b from-[#6FB23E] to-[#3E7D29] text-3xl text-white shadow-xl hover:from-[#7cc049] hover:to-[#46892f] [&_svg]:size-8"
              disabled={!canGenerate}
              onClick={onGenerate}
            >
              <Sparkles /> Generar imagen
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
