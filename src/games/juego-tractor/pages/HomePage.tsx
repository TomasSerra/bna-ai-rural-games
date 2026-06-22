interface HomePageProps {
  onStart: () => void;
}

/** Pantalla de inicio del juego: título, instrucciones y botón "Jugar". */
export function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[url('/tractor/bg.png')] bg-cover bg-center">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2vh] bg-black/55 px-[6vh] text-center">
        <img src="/tractor/tractor.png" alt="" className="h-[22vh] object-contain drop-shadow-lg" />
        <h1 className="m-0 font-kievit-black text-[7vh] leading-none text-white">Esquivá las vacas</h1>
        <p className="m-0 max-w-[60vh] text-[3vh] font-medium text-white/90">
          Manejá el tractor, esquivá las vacas y juntá monedas. Deslizá o usá las flechas
          para cambiar de carril.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-[2vh] rounded-full border-2 border-white bg-transparent px-[8vh] py-[2vh] text-[4vh] font-extrabold tracking-wide text-white transition-transform active:scale-95"
        >
          JUGAR
        </button>
      </div>
    </div>
  );
}
