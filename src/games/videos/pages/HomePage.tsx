interface HomePageProps {
  onStart: () => void;
}

export function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="flex h-dvh w-dvw flex-col items-center justify-between overflow-hidden bg-[url('/videos/bg-home.png')] bg-cover bg-center bg-no-repeat">
      <div className="flex w-full flex-1 flex-col items-center pt-[2dvh]">
        <img
          src="/shared/logo-bna.png"
          alt="BNA"
          className="w-48 sm:w-48 mb-8"
        />

        <h1 className="m-0 text-center text-7xl font-kievit-black leading-none text-white">
          Generá tu
          <br />
          video con IA
        </h1>
        <p className="mb-0 mt-6 w-[90%] text-center text-3xl font-medium text-white sm:text-4xl">
          Sacate una foto y convertite en protagonista de un video de campo
        </p>
      </div>
      <div className="flex w-full items-center justify-center pb-[8dvh]">
        <button
          type="button"
          onClick={onStart}
          className="rounded-full bg-white px-32 py-8 text-3xl font-kievit-black tracking-wide text-black transition-transform active:scale-95 sm:text-5xl"
        >
          EMPEZAR
        </button>
      </div>
    </div>
  );
}
