interface GameOverPageProps {
  score: number;
  /** Snapshot del canvas al perder (dataURL); se muestra de fondo congelado. */
  frame: string | null;
  /** Finaliza la partida y vuelve a la pantalla de selección (launcher). */
  onExit: () => void;
}

/** Pantalla de fin de juego: escena congelada + puntaje final y botón para finalizar. */
export function GameOverPage({ score, frame, onExit }: GameOverPageProps) {
  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-black">
      {frame && (
        <img src={frame} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2vh] bg-black/60 px-[6vh] text-center">
        <img
          src="/shared/logo-bna.png"
          alt="BNA"
          className="absolute left-1/2 top-[4vh] w-[28vh] -translate-x-1/2 object-contain"
        />
        <h1 className="m-0 font-kievit-black text-[8vh] leading-none text-white">¡Bien jugado!</h1>
        <p className="m-0 text-[3.5vh] font-medium text-white/90">Tu puntaje</p>
        <p className="m-0 font-kievit-black text-[10vh] leading-none text-yellow-400">{score}</p>

        <button
          type="button"
          onClick={onExit}
          className="mt-[3vh] rounded-full border-2 border-white bg-white px-[8vh] py-[2vh] text-[4vh] font-extrabold tracking-wide text-primary transition-transform active:scale-95"
        >
          FINALIZAR
        </button>
      </div>
    </div>
  );
}
