import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ApiKeyDialog } from '@shared/components/ApiKeyDialog';
import { IdleVideoOverlay } from '@shared/components/IdleVideoOverlay';
import { CapturePage } from '@videos/pages/CapturePage';
import { GeneratePage } from '@videos/pages/GeneratePage';
import { HomePage } from '@videos/pages/HomePage';
import type { Opciones } from '@videos/types';

const STORAGE_KEY = 'fal_api_key';

const DEFAULT_OPCIONES: Opciones = {
  ambiente: 'campo',
  accion: 'tractor',
  estilo: 'pixar',
};

type Page = 'home' | 'capture' | 'generate';

interface VideosGameProps {
  /** Vuelve siempre a la pantalla principal (launcher). */
  onExit: () => void;
}

export default function VideosGame({ onExit }: VideosGameProps) {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? '');
  const [keyDialogOpen, setKeyDialogOpen] = useState<boolean>(false);

  const [photo, setPhoto] = useState<{ base64: string; dataUrl: string } | null>(null);
  const [opciones, setOpciones] = useState<Opciones>(DEFAULT_OPCIONES);
  const [page, setPage] = useState<Page>('home');

  const lastSecretTapRef = useRef<number>(0);

  useEffect(() => {
    if (!apiKey) setKeyDialogOpen(true);
  }, [apiKey]);

  const canGenerate = useMemo(() => Boolean(apiKey && photo), [apiKey, photo]);

  const handleSaveKey = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
    setKeyDialogOpen(false);
  };

  const handleSecretTap = () => {
    const now = Date.now();
    if (now - lastSecretTapRef.current < 600) {
      setKeyDialogOpen(true);
      lastSecretTapRef.current = 0;
    } else {
      lastSecretTapRef.current = now;
    }
  };

  return (
    <div className="h-dvh w-dvw overflow-hidden bg-[url('/videos/bg-game.png')] bg-cover bg-center bg-no-repeat">
      <ApiKeyDialog
        open={keyDialogOpen}
        onSave={handleSaveKey}
        onClose={apiKey ? () => setKeyDialogOpen(false) : undefined}
        initialKey={apiKey}
      />

      {/* Botón para volver: solo en la pantalla de inicio del juego. */}
      {page === 'home' && (
        <button
          type="button"
          onClick={onExit}
          className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full bg-white/85 px-5 py-3 text-lg font-medium text-primary shadow-md transition-colors hover:bg-white"
        >
          <ArrowLeft className="size-5" />
          Volver
        </button>
      )}

      {/* Hidden hot-corner: double-tap the top-right corner to open the API key dialog. */}
      <button
        type="button"
        aria-label="Configuración"
        onClick={handleSecretTap}
        className="absolute right-0 top-0 z-10 size-24 cursor-default bg-transparent opacity-0"
      />

      {page === 'home' && <HomePage onStart={() => setPage('capture')} />}

      {page === 'capture' && (
        <CapturePage
          photo={photo}
          setPhoto={setPhoto}
          opciones={opciones}
          setOpciones={setOpciones}
          canGenerate={canGenerate}
          onGenerate={() => setPage('generate')}
        />
      )}

      {page === 'generate' && photo && (
        <GeneratePage
          apiKey={apiKey}
          photo={photo}
          opciones={opciones}
          onBack={() => setPage('capture')}
          onDone={onExit}
        />
      )}

      <IdleVideoOverlay />
    </div>
  );
}
