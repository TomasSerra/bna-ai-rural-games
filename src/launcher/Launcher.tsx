import { useNavigate } from 'react-router-dom';

interface GameEntry {
  to: string;
  label: string;
  description: string;
  image: string;
  /** Color distintivo del botón. */
  color: string;
}

const GAMES: GameEntry[] = [
  {
    to: '/imagenes',
    label: 'Imágen IA',
    description: 'Sacate una foto y convertila en una imagen con inteligencia artificial.',
    image: '/launcher/selfie.png',
    color: '#0072bc',
  },
  {
    to: '/videos',
    label: 'Video IA',
    description: 'Sacate una foto y generá un video animado con inteligencia artificial.',
    image: '/launcher/video.png',
    color: '#7c3aed',
  },
  {
    to: '/juego-tractor',
    label: 'Juego tractor',
    description: 'Próximamente: un nuevo juego para disfrutar en el campo.',
    image: '/launcher/tractor.png',
    color: '#15803d',
  },
];

export function Launcher() {
  const navigate = useNavigate();

  return (
    <div className="flex h-dvh w-dvw flex-col items-center justify-center gap-12 overflow-hidden bg-gradient-to-b from-[#004a73] via-[#003a5c] to-[#001f30] px-8 py-10">
      <header className="flex flex-col items-center gap-5 text-center text-white">
        <img src="/shared/logo-bna.png" alt="Banco Nación" className="h-16 w-auto" />
        <h1 className="font-kievit-black text-4xl tracking-wide md:text-5xl">
          ¿Qué querés jugar?
        </h1>
      </header>

      <nav className="flex w-full max-w-3xl flex-col gap-6">
        {GAMES.map(({ to, label, description, image, color }) => (
          <button
            key={to}
            type="button"
            onClick={() => navigate(to)}
            style={{ backgroundColor: color }}
            className="group flex w-full items-center gap-7 rounded-3xl px-9 py-7 text-left text-white shadow-xl transition-all duration-150 hover:-translate-y-1 hover:shadow-2xl hover:brightness-110 active:translate-y-0"
          >
            <span className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20">
              <img
                src={image}
                alt=""
                className="size-full object-contain p-2 transition-transform duration-150 group-hover:scale-110"
              />
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-kievit-black text-3xl tracking-wide">{label}</span>
              <span className="text-lg text-white/85">{description}</span>
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
