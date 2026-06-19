import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Launcher } from './launcher/Launcher';
import ImagenesGame from './games/imagenes/ImagenesGame';
import { ImagePage } from './games/imagenes/public/ImagePage';
import JuegoTractorPlaceholder from './games/juego-tractor/JuegoTractorPlaceholder';

// Code-split the videos game + its public page: mediabunny (WebCodecs) is heavy
// and only needed on the videos routes, so the launcher and the imágenes game
// never pay for it at startup.
const VideosGame = lazy(() => import('./games/videos/VideosGame'));
const VideoPage = lazy(() =>
  import('./games/videos/public/VideoPage').then((m) => ({ default: m.VideoPage })),
);

function GameLoading() {
  return (
    <div className="flex h-dvh w-dvw items-center justify-center bg-[#003a5c] text-2xl text-white">
      Cargando…
    </div>
  );
}

export function AppRoutes() {
  const navigate = useNavigate();
  const goToLauncher = () => navigate('/');

  return (
    <Routes>
      <Route path="/" element={<Launcher />} />

      {/* Juego de imágenes */}
      <Route path="/imagenes" element={<ImagenesGame onExit={goToLauncher} />} />
      <Route path="/imagenes/descargar" element={<ImagePage />} />

      {/* Juego de videos (lazy: mediabunny) */}
      <Route
        path="/videos"
        element={
          <Suspense fallback={<GameLoading />}>
            <VideosGame onExit={goToLauncher} />
          </Suspense>
        }
      />
      <Route
        path="/videos/descargar"
        element={
          <Suspense fallback={<GameLoading />}>
            <VideoPage />
          </Suspense>
        }
      />

      {/* Tercer juego (placeholder) */}
      <Route path="/juego-tractor" element={<JuegoTractorPlaceholder onExit={goToLauncher} />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
