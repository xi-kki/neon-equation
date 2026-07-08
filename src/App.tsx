import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { Game } from './game/game';
import { parseInput, formatResult } from './game/expression';
import type { ParsedInput } from './types';

const COMMAND_HELP = [
  { cmd: '5 + 3', desc: 'Destroy particles with value 8' },
  { cmd: '10 * 2', desc: 'Destroy particles with value 20' },
  { cmd: 'gravity 0.5', desc: 'Set gravity (0–5)' },
  { cmd: 'speed 2', desc: 'Multiply all speeds' },
  { cmd: 'spawn 10', desc: 'Spawn 10 new particles' },
  { cmd: 'clear', desc: 'Clear all particles' },
];

export default function App() {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [particleCount, setParticleCount] = useState(0);
  const [gravity, setGravity] = useState(0.15);
  const [lastResult, setLastResult] = useState('');
  const [lastResultType, setLastResultType] = useState<'destroy' | 'command' | 'clear' | ''>('');
  const [input, setInput] = useState('');
  const [fps, setFps] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [flash, setFlash] = useState(false);

  const gameRef = useRef<Game | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastActionRef = useRef(0);
  const flashTimeoutRef = useRef<number>(0);

  const onStateChange = useCallback(() => {
    const g = gameRef.current?.engine;
    if (!g) return;
    setScore(g.score);
    setCombo(g.combo);
    setParticleCount(g.particles.filter(p => p.alive).length);
    setGravity(g.gravity);
    setLastResult(g.lastResult);
    setLastResultType(g.lastResultType);

    // Flash on new action
    const now = performance.now();
    if (g.lastAction > lastActionRef.current) {
      lastActionRef.current = g.lastAction;
      setFlash(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = window.setTimeout(() => setFlash(false), 300);
    }
  }, []);

  // Focus input on any key (for game feel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't steal focus if typing in input
      if (e.target instanceof HTMLInputElement) return;
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const g = gameRef.current;
    if (!g || !input.trim()) return;

    g.processInput(input);
    setInput('');
  };

  const handleReset = () => {
    const g = gameRef.current;
    if (g) {
      g.engine.init(14);
      g.engine.lastResult = 'Game reset!';
      g.engine.lastResultType = 'clear';
      g.engine.lastAction = performance.now();
    }
  };

  const getResultColor = () => {
    switch (lastResultType) {
      case 'destroy': return 'text-neon-teal';
      case 'command': return 'text-neon-yellow';
      case 'clear':   return 'text-neon-red';
      default:        return 'text-gray-400';
    }
  };

  return (
    <div className={`relative w-full h-full bg-black ${flash ? 'animate-flash' : ''}`}>
      {/* Game Canvas */}
      <GameCanvas gameRef={gameRef} onStateChange={onStateChange} />

      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between pointer-events-none">
        {/* Score Panel */}
        <div className="glass-panel rounded-lg px-4 py-3 min-w-[140px]">
          <div className="text-gray-500 text-xs uppercase tracking-widest">Score</div>
          <div className="text-2xl font-bold text-white neon-text" style={{ color: '#4ECDC4' }}>
            {score.toLocaleString()}
          </div>
          {combo > 1 && (
            <div className="text-neon-yellow text-sm font-semibold animate-fade-in-up">
              🔥 {combo}x Combo!
            </div>
          )}
        </div>

        {/* Stats Panel */}
        <div className="glass-panel rounded-lg px-4 py-3 min-w-[180px]">
          <div className="flex justify-between gap-4 text-xs">
            <div>
              <div className="text-gray-500 uppercase tracking-wider">Particles</div>
              <div className="text-white font-bold text-lg">{particleCount}</div>
            </div>
            <div>
              <div className="text-gray-500 uppercase tracking-wider">Gravity</div>
              <div className="text-white font-bold text-lg">{gravity.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-500 uppercase tracking-wider">FPS</div>
              <div className="text-neon-green font-bold text-lg">{fps}</div>
            </div>
          </div>
        </div>

        {/* Help Toggle */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="pointer-events-auto glass-panel rounded-lg px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          {showHelp ? '✕ Close' : '? Help'}
        </button>
      </div>

      {/* Result toast */}
      {lastResult && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className={`animate-fade-in-up text-lg font-bold ${getResultColor()} neon-text text-center`}>
            {lastResult}
          </div>
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="glass-panel rounded-xl p-6 max-w-md w-full mx-4 pointer-events-auto max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4 neon-text" style={{ color: '#4ECDC4' }}>
              ⌨️ Commands
            </h2>
            <div className="space-y-3 mb-6">
              {COMMAND_HELP.map(({ cmd, desc }) => (
                <div key={cmd} className="flex items-start gap-3">
                  <code className="text-neon-yellow text-sm whitespace-nowrap font-bold">{cmd}</code>
                  <span className="text-gray-400 text-sm">{desc}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-bold text-white mb-2">🎮 Tips</h3>
              <ul className="text-gray-400 text-xs space-y-1.5">
                <li>• Type any math expression to destroy matching particles</li>
                <li>• Build combos by chaining destructions</li>
                <li>• Use <code className="text-neon-yellow">gravity</code> to change physics</li>
                <li>• Use <code className="text-neon-yellow">speed</code> to multiply velocity</li>
                <li>• Use <code className="text-neon-yellow">spawn</code> to add more particles</li>
                <li>• Press any key to instantly focus the input</li>
              </ul>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Bottom Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a math expression... (e.g. 5+3, gravity 0.5, speed 2, spawn 10)"
              className="neon-input flex-1 rounded-lg px-4 py-3 text-lg font-mono"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim()
                  ? 'linear-gradient(135deg, #4ECDC4, #45B7D1)'
                  : 'rgba(255,255,255,0.05)',
                color: '#000',
                textShadow: input.trim() ? '0 0 10px rgba(78,205,196,0.5)' : 'none',
              }}
            >
              ⚡ Go
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3 rounded-lg text-gray-500 hover:text-white border border-white/10 hover:border-white/30 transition-colors text-sm"
              title="Reset game"
            >
              ↺
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
