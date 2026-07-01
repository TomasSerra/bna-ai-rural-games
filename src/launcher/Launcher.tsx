import { useNavigate } from "react-router-dom";

interface GameEntry {
  to: string;
  label: string;
  description: string;
  image: string;
}

const GAMES: GameEntry[] = [
  {
    to: "/imagenes",
    label: "Imágen IA",
    description:
      "Sacate una foto y convertila en una imagen con inteligencia artificial.",
    image: "/launcher/card-imagen.png",
  },
  {
    to: "/videos",
    label: "Video IA",
    description:
      "Sacate una foto y generá un video animado con inteligencia artificial.",
    image: "/launcher/card-videos.png",
  },
  {
    to: "/juego-tractor",
    label: "Juego tractor",
    description: "Manejá el tractor, junta monedas y esquiva los obstáculos",
    image: "/launcher/card-tractor.png",
  },
];

export function Launcher() {
  const navigate = useNavigate();

  return (
    <div className="relative flex h-dvh w-dvw flex-col items-center justify-center gap-12 overflow-hidden bg-[url('/imagenes/bg-game.png')] bg-cover bg-center bg-no-repeat px-8 py-10">
      <div aria-hidden className="absolute inset-0 z-0 bg-black/40" />
      <header className="relative z-10 flex flex-col items-center gap-5 text-center text-white">
        <img
          src="/shared/logo-bna.png"
          alt="Banco Nación"
          className="h-16 w-auto"
        />
        <h1 className="font-kievit-black text-4xl tracking-wide md:text-5xl">
          ¡Elegí un juego!
        </h1>
      </header>

      <nav className="relative z-10 flex w-full max-w-5xl flex-wrap items-stretch justify-center gap-6">
        {GAMES.map(({ to, label, description, image }) => (
          <button
            key={to}
            type="button"
            onClick={() => navigate(to)}
            className="group flex aspect-[4/5] w-60 flex-col overflow-hidden rounded-3xl text-left text-white shadow-xl transition-all duration-150 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 sm:w-72"
          >
            <span className="w-full bg-white px-4 py-3 text-center font-kievit-black text-2xl leading-tight tracking-wide text-black">
              {label}
            </span>
            <span className="relative flex min-h-0 flex-1 items-end overflow-hidden">
              <img
                src={image}
                alt=""
                className="absolute inset-0 z-0 size-full object-cover transition-transform duration-150 group-hover:scale-105"
              />
              <span
                aria-hidden
                className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-black/90"
              />
              <span className="relative z-10 p-6 text-base leading-snug text-white/90 drop-shadow-md">
                {description}
              </span>
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
