import { AlertTriangle, ServerCrash, WifiOff } from 'lucide-react';
import type { FriendlyError, FriendlyErrorKind } from '@shared/lib/errors';

const ICONS: Record<FriendlyErrorKind, typeof WifiOff> = {
  connection: WifiOff,
  server: ServerCrash,
  unknown: AlertTriangle,
};

interface GenerationErrorProps {
  error: FriendlyError;
}

/**
 * Card de error del flujo de generación, con la estética cálida del kiosco.
 * No incluye botón de acción: el botón "Reintentar" vive en cada GeneratePage.
 */
export function GenerationError({ error }: GenerationErrorProps) {
  const Icon = ICONS[error.kind];

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border-2 border-[#C9A06A] bg-[#FFF8EC] px-8 py-10 text-center shadow-xl">
        <div className="flex size-20 items-center justify-center rounded-full bg-[#F1E2C6] text-[#5B3A1E]">
          <Icon className="size-10" />
        </div>
        <h3 className="text-2xl font-kievit-black tracking-wide text-[#5B3A1E]">
          {error.title}
        </h3>
        <p className="text-lg leading-snug text-[#7A5A38]">{error.description}</p>
      </div>
    </div>
  );
}
