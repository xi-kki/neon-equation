import { useEffect, useRef, useCallback } from 'react';
import { Game } from '../game/game';

interface GameCanvasProps {
  gameRef: React.MutableRefObject<Game | null>;
  onStateChange: () => void;
}

export default function GameCanvas({ gameRef, onStateChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const game = gameRef.current;
    if (!container || !game) return;
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      game.resize(rect.width, rect.height);
    }
  }, [gameRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new Game(canvas);
    game.onStateChange = onStateChange;
    gameRef.current = game;

    // Initial resize
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        game.resize(rect.width, rect.height);
      }
    }

    game.start();

    const observer = new ResizeObserver(handleResize);
    if (container) observer.observe(container);

    return () => {
      game.stop();
      observer.disconnect();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
