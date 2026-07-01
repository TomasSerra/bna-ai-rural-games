interface HomePageProps {
  onStart: () => void;
}

/** Pantalla de inicio del juego: título, instrucciones y botón "Jugar". */
export function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="flex h-dvh w-dvw flex-col items-center justify-between overflow-hidden bg-[url('/tractor/bg-tractor-game.png')] bg-cover bg-center bg-no-repeat">
      <div className="flex w-full flex-1 flex-col items-center pt-[2dvh]">
        <img src="/shared/logo-bna.png" alt="BNA" className="w-[400px] mb-8" />

        <h1 className="m-0 text-center text-7xl font-kievit-black leading-tight text-white">
          Juntá las monedas
        </h1>
        <p className="mb-0 mt-6 w-[90%] text-center text-3xl font-medium text-white sm:text-4xl">
          Manejá el tractor, junta monedas y esquiva los obstáculos
        </p>
      </div>
      <div className="flex w-full items-center justify-center pb-[8dvh]">
        <button
          type="button"
          onClick={onStart}
          className="rounded-full bg-white px-32 py-8 text-3xl font-kievit-black tracking-wide text-black transition-transform active:scale-95 sm:text-5xl"
        >
          JUGAR
        </button>
      </div>
    </div>
  );
}
