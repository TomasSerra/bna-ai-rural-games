import { useCallback, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { GamePage } from './types';
import { HomePage } from './pages/HomePage';
import { GameOverPage } from './pages/GameOverPage';
import { GameCanvas } from './components/GameCanvas';

interface JuegoTractorGameProps {
  /** Vuelve siempre a la pantalla principal (launcher). */
  onExit: () => void;
}

/**
 * Juego del tractor: endless runner de 3 carriles. Esquivá vacas y juntá monedas.
 * Máquina de páginas: home → playing → gameover. Comparte el contrato `onExit` con
 * los demás juegos. Todos los parámetros ajustables viven en `config.ts`.
 */
export default function JuegoTractorGame({ onExit }: JuegoTractorGameProps) {
  const [page, setPage] = useState<GamePage>('home');
  const [finalScore, setFinalScore] = useState(0);
  // Key para forzar un GameCanvas nuevo en cada partida (resetea el engine).
  const [runId, setRunId] = useState(0);

  const startGame = useCallback(() => {
    setRunId((id) => id + 1);
    setPage('playing');
  }, []);

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    setPage('gameover');
  }, []);

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-black">
      {page === 'home' && (
        <button
          type="button"
          onClick={onExit}
          className="absolute left-6 top-6 z-30 flex items-center gap-2 rounded-full bg-white/85 px-5 py-3 text-lg font-medium text-primary shadow-md transition-colors hover:bg-white"
        >
          <ArrowLeft className="size-5" />
          Volver
        </button>
      )}

      {page === 'home' && <HomePage onStart={startGame} />}
      {page === 'playing' && <GameCanvas key={runId} onGameOver={handleGameOver} />}
      {page === 'gameover' && <GameOverPage score={finalScore} onExit={onExit} />}
    </div>
  );
}
