interface HomePageProps {
  onStart: () => void;
}

export function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="flex h-dvh w-dvw flex-col items-center justify-between overflow-hidden bg-[url('/imagenes/bg-home.png')] bg-cover bg-center bg-no-repeat">
      <div className="flex w-full flex-1 flex-col items-center justify-end pb-[8dvh]">
        <h1 className="m-0 text-center text-7xl font-kievit-black leading-tight text-white">
          ¡Te damos
          <br />
          la bienvenida!
        </h1>
        <p className="mb-0 mt-6 w-[90%] text-center text-3xl font-medium text-white sm:text-4xl">
          Sacate una foto y convertite en tu versión de campo con IA
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-12 rounded-full border-2 border-white bg-transparent px-16 py-4 text-3xl font-extrabold tracking-wide text-white transition-transform active:scale-95 sm:text-4xl"
        >
          COMENCEMOS
        </button>
      </div>
      <div className="flex w-full items-center justify-center pb-[5dvh]">
        <img src="/shared/logo-bna.png" alt="BNA" className="w-48 sm:w-64" />
      </div>
    </div>
  );
}
