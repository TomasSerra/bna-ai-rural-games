import { ArrowLeft, Tractor } from 'lucide-react';

interface JuegoTractorPlaceholderProps {
  /** Vuelve siempre a la pantalla principal (launcher). */
  onExit: () => void;
}

/**
 * Placeholder del tercer juego (todavía no desarrollado). Comparte el contrato
 * `onExit` con los juegos reales, así reemplazarlo más adelante es un cambio
 * mínimo en el router.
 */
export default function JuegoTractorPlaceholder({ onExit }: JuegoTractorPlaceholderProps) {
  return (
    <div className="flex h-dvh w-dvw flex-col items-center justify-center gap-10 bg-gradient-to-b from-[#003a5c] to-[#001f30] text-white">
      <button
        type="button"
        onClick={onExit}
        className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full bg-white/85 px-5 py-3 text-lg font-medium text-primary shadow-md transition-colors hover:bg-white"
      >
        <ArrowLeft className="size-5" />
        Volver
      </button>

      <Tractor className="size-32 opacity-90" strokeWidth={1.5} />
      <h1 className="font-kievit-black text-6xl tracking-wide">Juego tractor</h1>
      <p className="text-2xl text-white/80">Próximamente</p>

      <button
        type="button"
        onClick={onExit}
        className="mt-4 rounded-full border-2 border-white px-14 py-4 text-2xl font-medium transition-colors hover:bg-white hover:text-primary"
      >
        Volver al inicio
      </button>
    </div>
  );
}
