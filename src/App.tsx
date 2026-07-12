import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { Game } from './game/game';
import { parseInput } from './game/expression';
import { GAME_MODES } from './types';
import { getDifficultyPhase } from './types';
import type { GameMode } from './game/engine';
import { playKeypress } from './game/sound';

const COMMAND_HELP = [
  { cmd: '5 + 3', desc: 'Destroy particles with value 8' },
  { cmd: '10 * 2', desc: 'Destroy particles with value 20' },
  { cmd: 'gravity 0.5', desc: 'Set gravity (0–5)' },
  { cmd: 'speed 2', desc: 'Multiply all speeds' },
  { cmd: 'spawn 10', desc: 'Spawn 10 new particles' },
  { cmd: 'clear', desc: 'Clear all particles' },
];

type Screen = 'menu' | 'playing' | 'gameover';

const HIGH_SCORE_KEY = 'neon-equation-highscores';

interface HighScores {
  timeAttack: number;
  targetScore: number;
}

function loadHighScores(): HighScores {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { timeAttack: 0, targetScore: 0 };
}

function saveHighScore(mode: GameMode, score: number) {
  if (mode === 'sandbox') return;
  const scores = loadHighScores();
  const key = mode as keyof HighScores;
  if (score > scores[key]) {
    scores[key] = score;
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('sandbox');
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
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [targetScore, setTargetScore] = useState(5000);
  const [highScores, setHighScores] = useState<HighScores>(loadHighScores);
  const [finalScore, setFinalScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [particleValueRange, setParticleValueRange] = useState('1-5');
  const [difficultyPhase, setDifficultyPhase] = useState(getDifficultyPhase(0));
  const [showPhaseHint, setShowPhaseHint] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const gameRef = useRef<Game | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const flashTimeoutRef = useRef<number>(0);
  const lastActionRef = useRef(0);
  // Track which combo values we've already played sounds for
  const lastPlayedCombo = useRef(0);

  const onStateChange = useCallback(() => {
    const g = gameRef.current?.engine;
    if (!g) return;
    setScore(g.score);
    setCombo(g.combo);
    setParticleCount(g.particles.filter(p => p.alive).length);
    setGravity(g.gravity);
    setLastResult(g.lastResult);
    setLastResultType(g.lastResultType);

    // Time remaining for time attack
    if (g.timeAttack) {
      setTimeRemaining(Math.ceil(g.timeAttack.timeRemaining));
    }

    // Particle value range
    const alive = g.particles.filter(p => p.alive);
    if (alive.length > 0) {
      const vals = alive.map(p => p.value);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      setParticleValueRange(min === max ? `${min}` : `${min}–${max}`);
    } else {
      setParticleValueRange('none');
    }

    // Difficulty phase — update whenever score crosses a threshold
    const newPhase = getDifficultyPhase(g.score);
    setDifficultyPhase(prev => {
      if (prev.label !== newPhase.label) {
        setShowPhaseHint(true);
        // Auto-hide after 4 seconds
        setTimeout(() => setShowPhaseHint(false), 4000);
        return newPhase;
      }
      return prev;
    });

    // Flash on new action
    const now = performance.now();
    if (g.lastAction > lastActionRef.current) {
      lastActionRef.current = g.lastAction;
      setFlash(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = window.setTimeout(() => setFlash(false), 300);
    }

    // Game over detection
    if (g.gameOver && screen === 'playing') {
      setFinalScore(g.score);
      const mode = g.mode;
      const oldScore = highScores[mode as keyof HighScores] || 0;
      const isNew = g.score > oldScore;
      setIsNewHighScore(isNew);
      if (mode !== 'sandbox') saveHighScore(mode, g.score);
      setHighScores(loadHighScores());
      setScreen('gameover');
    }
  }, [screen, highScores]);

  // Focus input on any key (for game feel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'playing') return;
      if (e.target instanceof HTMLInputElement) return;
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen]);

  const startGame = (mode: GameMode) => {
    setSelectedMode(mode);
    setScreen('playing');
    setInput('');
    setShowHelp(false);
    setFinalScore(0);
    setIsNewHighScore(false);
    setShowPhaseHint(true);
    lastActionRef.current = 0;
    lastPlayedCombo.current = 0;

    // Auto-hide phase hint after 6 seconds on fresh start
    setTimeout(() => setShowPhaseHint(false), 6000);

    // Start game on next tick so canvas is mounted
    setTimeout(() => {
      const g = gameRef.current;
      if (g) {
        g.ensureAudio();
        g.engine.startMode(mode);
      }
    }, 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const g = gameRef.current;
    if (!g || !input.trim()) return;
    g.processInput(input);
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (soundEnabled) playKeypress();
  };

  const handleReset = () => {
    const g = gameRef.current;
    if (g) {
      g.engine.startMode(selectedMode);
      g.ensureAudio();
    }
  };

  const backToMenu = () => {
    const g = gameRef.current;
    if (g) g.engine.gameOver = true; // stop loop
    setScreen('menu');
  };

  const getResultColor = () => {
    switch (lastResultType) {
      case 'destroy': return 'text-neon-teal';
      case 'command': return 'text-neon-yellow';
      case 'clear':   return 'text-neon-red';
      default:        return 'text-gray-400';
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ==================== MENU SCREEN ====================
  if (screen === 'menu') {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {/* Animated background particles (CSS only) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-20 animate-float"
              style={{
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: ['#4ECDC4', '#FF6B6B', '#FFEAA7', '#6C5CE7', '#45B7D1'][i % 5],
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-lg mx-auto px-6 animate-fade-in-up">
          {/* Logo */}
          <div className="mb-2">
            <span className="text-6xl">🎲</span>
          </div>
          <h1 className="text-5xl font-extrabold mb-2 neon-text" style={{ color: '#4ECDC4', textShadow: '0 0 20px #4ECDC4, 0 0 60px #4ECDC4' }}>
            Neon Equation
          </h1>
          <p className="text-gray-400 text-sm mb-8 font-mono">
            Math-powered physics sandbox
          </p>

          {/* Game Modes */}
          <div className="space-y-3 mb-6">
            {(Object.entries(GAME_MODES) as [GameMode, { label: string; desc: string }][]).map(([mode, { label, desc }]) => {
              const hsKey = mode as keyof HighScores;
              const hs = mode !== 'sandbox' ? highScores[hsKey] : null;
              return (
                <button
                  key={mode}
                  onClick={() => startGame(mode)}
                  className="w-full glass-panel rounded-xl p-4 text-left hover:border-neon-teal/50 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold text-white group-hover:text-neon-teal transition-colors">
                      {label}
                    </span>
                    {hs !== null && hs > 0 && (
                      <span className="text-xs text-neon-yellow font-mono">
                        🏆 {hs.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </button>
              );
            })}
          </div>

          {/* Sound toggle */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1 rounded-md transition-colors ${soundEnabled ? 'text-neon-teal bg-neon-teal/10' : 'text-gray-500 bg-white/5'}`}
            >
              {soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF'}
            </button>
          </div>

          {/* Quick how-to-play guide */}
          <div className="mt-5 glass-panel rounded-xl p-4 text-left">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2">🎮 How to Play</h3>
            <div className="space-y-1.5 text-xs text-gray-400">
              <p>• <span className="text-neon-teal font-semibold">Particles</span> with numbers bounce around</p>
              <p>• <span className="text-neon-yellow font-semibold">Type any math</span> to hit the number you see</p>
              <p>• Starts with <span className="text-neon-green">1–5</span> (just type the number!)</p>
              <p>• Gets harder as you score → up to <span className="text-neon-red">1–50</span></p>
              <p>• Use <code className="text-neon-yellow">gravity</code>, <code className="text-neon-yellow">speed</code>, <code className="text-neon-yellow">spawn</code> to control physics</p>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-600">
            <p className="font-mono">🎲 + 🧮 + 💥 = Neon Equation</p>
          </div>
        </div>
      </div>
    );
  }

  // ==================== GAME OVER SCREEN ====================
  if (screen === 'gameover') {
    const modeLabel = GAME_MODES[selectedMode].label;
    const isVictory = selectedMode === 'targetScore' && finalScore >= 5000;

    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {/* Sparkle background */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: '2px',
                height: '2px',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: ['#4ECDC4', '#FF6B6B', '#FFEAA7', '#6C5CE7'][i % 4],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center animate-fade-in-up">
          <div className="text-6xl mb-4">
            {isVictory ? '🏆' : '💥'}
          </div>
          <h2 className="text-3xl font-extrabold mb-2 neon-text" style={{ color: isVictory ? '#FFEAA7' : '#FF6B6B' }}>
            {isVictory ? 'Victory!' : 'Game Over'}
          </h2>
          <p className="text-gray-400 text-sm mb-2">{modeLabel}</p>

          <div className="my-8">
            <div className="text-6xl font-extrabold text-white neon-text mb-2" style={{ color: '#4ECDC4' }}>
              {finalScore.toLocaleString()}
            </div>
            <div className="text-gray-500 text-xs uppercase tracking-widest">Final Score</div>
          </div>

          {isNewHighScore && (
            <div className="animate-fade-in-up text-neon-yellow text-lg font-bold mb-6">
              🎉 NEW HIGH SCORE!
            </div>
          )}

          <div className="space-y-3 max-w-xs mx-auto">
            <button
              onClick={() => startGame(selectedMode)}
              className="w-full px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #4ECDC4, #45B7D1)',
                color: '#000',
              }}
            >
              🔄 Play Again
            </button>
            <button
              onClick={backToMenu}
              className="w-full px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-gray-400 border border-white/10 hover:border-white/30 transition-colors"
            >
              ← Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== PLAYING SCREEN ====================
  return (
    <div className={`relative w-full h-full bg-black ${flash ? 'animate-flash' : ''}`}>
      {/* Game Canvas */}
      <GameCanvas gameRef={gameRef} onStateChange={onStateChange} />

          {/* HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 flex items-start justify-between pointer-events-none">
        {/* Score Panel */}
        <div className="glass-panel rounded-lg px-3 md:px-4 py-2 md:py-3 min-w-[100px] md:min-w-[140px]">
          <div className="text-gray-500 text-[10px] md:text-xs uppercase tracking-widest">
            {selectedMode === 'timeAttack' ? 'Score' : selectedMode === 'targetScore' ? 'Score / Target' : 'Score'}
          </div>
          <div className={`text-xl md:text-2xl font-bold neon-text ${selectedMode === 'targetScore' && score >= 5000 ? 'text-neon-yellow' : ''}`} style={{ color: '#4ECDC4' }}>
            {score.toLocaleString()}
            {selectedMode === 'targetScore' && (
              <span className="text-sm text-gray-500"> / {(targetScore).toLocaleString()}</span>
            )}
          </div>
          {combo > 1 && (
            <div className="text-neon-yellow text-xs md:text-sm font-semibold animate-fade-in-up">
              🔥 {combo}x Combo!
            </div>
          )}
        </div>

        {/* Center: Timer or Mode indicator */}
        {selectedMode === 'timeAttack' && (
          <div className={`glass-panel rounded-lg px-4 py-2 md:py-3 ${timeRemaining <= 10 ? 'animate-pulse' : ''}`}>
            <div className="text-gray-500 text-[10px] md:text-xs uppercase tracking-widest">Time</div>
            <div className={`text-xl md:text-2xl font-bold font-mono ${timeRemaining <= 10 ? 'text-neon-red' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
        )}

        {/* Stats Panel */}
        <div className="glass-panel rounded-lg px-2 md:px-4 py-2 md:py-3 min-w-[140px] md:min-w-[180px]">
          <div className="flex justify-between gap-2 md:gap-4 text-[10px] md:text-xs">
            <div>
              <div className="text-gray-500 uppercase tracking-wider">Particles</div>
              <div className="text-white font-bold text-sm md:text-lg">{particleCount}</div>
            </div>
            <div className="hidden md:block">
              <div className="text-gray-500 uppercase tracking-wider">Values</div>
              <div className="text-white font-bold text-sm md:text-lg">{particleValueRange}</div>
            </div>
            <div>
              <div className="text-gray-500 uppercase tracking-wider">Grav</div>
              <div className="text-white font-bold text-sm md:text-lg">{gravity.toFixed(1)}</div>
            </div>
            <div className="hidden sm:block">
              <div className="text-gray-500 uppercase tracking-wider">FPS</div>
              <div className="text-neon-green font-bold text-sm md:text-lg">{fps}</div>
            </div>
          </div>
        </div>

        {/* Help & Menu buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="pointer-events-auto glass-panel rounded-lg px-2 md:px-3 py-1 md:py-2 text-gray-400 hover:text-white transition-colors text-xs md:text-sm"
          >
            {showHelp ? '✕' : '?'}
          </button>
          <button
            onClick={backToMenu}
            className="pointer-events-auto glass-panel rounded-lg px-2 md:px-3 py-1 md:py-2 text-gray-400 hover:text-white transition-colors text-xs md:text-sm"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Result toast */}
      {lastResult && (
        <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className={`animate-fade-in-up text-sm md:text-lg font-bold ${getResultColor()} neon-text text-center`}>
            {lastResult}
          </div>
        </div>
      )}

      {/* Difficulty phase hint banner */}
      {showPhaseHint && (
        <div className="absolute top-[72px] md:top-20 left-1/2 -translate-x-1/2 pointer-events-none z-10 text-center">
          <div className="glass-panel rounded-xl px-4 md:px-6 py-2 md:py-3 animate-fade-in-up">
            <div className="text-xs md:text-sm font-bold text-white">{difficultyPhase.label}</div>
            <div className="text-[10px] md:text-xs text-gray-400 mt-0.5">{difficultyPhase.description}</div>
            <div className="flex gap-2 md:gap-3 mt-1 justify-center">
              {difficultyPhase.examples.map((ex, i) => (
                <code key={i} className="text-[10px] md:text-xs text-neon-yellow font-mono">{ex}</code>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="glass-panel rounded-xl p-4 md:p-6 max-w-md w-full mx-3 md:mx-4 pointer-events-auto max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 neon-text" style={{ color: '#4ECDC4' }}>
              ⌨️ Commands
            </h2>
            <div className="space-y-3 mb-6">
              {COMMAND_HELP.map(({ cmd, desc }) => (
                <div key={cmd} className="flex items-start gap-3">
                  <code className="text-neon-yellow text-xs md:text-sm whitespace-nowrap font-bold">{cmd}</code>
                  <span className="text-gray-400 text-xs md:text-sm">{desc}</span>
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

      {/* Bottom Input Bar + Quick Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 pb-1 md:pb-2">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              inputMode="text"
              placeholder="Type math... (e.g. 5+3, gravity 0.5)"
              className="neon-input flex-1 rounded-lg px-3 md:px-4 py-2 md:py-3 text-base md:text-lg font-mono"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-xs md:text-sm uppercase tracking-wider transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim()
                  ? 'linear-gradient(135deg, #4ECDC4, #45B7D1)'
                  : 'rgba(255,255,255,0.05)',
                color: '#000',
                textShadow: input.trim() ? '0 0 10px rgba(78,205,196,0.5)' : 'none',
              }}
            >
              ⚡
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 md:px-4 py-2 md:py-3 rounded-lg text-gray-500 hover:text-white border border-white/10 hover:border-white/30 transition-colors text-sm"
              title="Reset game"
            >
              ↺
            </button>
          </form>

          {/* Mobile quick-action buttons */}
          <div className="flex gap-2 mt-1.5 md:hidden justify-center">
            <button
              type="button"
              onClick={() => { const g = gameRef.current; if (g) { g.processInput('spawn 5'); setInput(''); } }}
              className="glass-panel rounded-lg px-3 py-1.5 text-xs text-gray-300 hover:text-white active:scale-95 transition-all"
            >
              ➕ Spawn
            </button>
            <button
              type="button"
              onClick={() => { setInput(prev => prev + '+'); inputRef.current?.focus(); }}
              className="glass-panel rounded-lg w-9 h-8 text-sm text-neon-teal hover:text-white active:scale-95 transition-all"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => { setInput(prev => prev + '-'); inputRef.current?.focus(); }}
              className="glass-panel rounded-lg w-9 h-8 text-sm text-neon-teal hover:text-white active:scale-95 transition-all"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => { setInput(prev => prev + '*'); inputRef.current?.focus(); }}
              className="glass-panel rounded-lg w-9 h-8 text-sm text-neon-teal hover:text-white active:scale-95 transition-all"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => { setInput(prev => prev + '/'); inputRef.current?.focus(); }}
              className="glass-panel rounded-lg w-9 h-8 text-sm text-neon-teal hover:text-white active:scale-95 transition-all"
            >
              ÷
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
