/**
 * Neon Equation — Game Coordinator
 *
 * Ties the engine and renderer together with the animation loop.
 */

import { GameEngine, CONFIG } from './engine';
import { Renderer } from './renderer';
import { parseInput } from './expression';
import {
  playExplosion,
  playCombo,
  playMiss,
  playCommand,
  playClear,
  playGameOver,
  playVictory,
  initAudio,
} from './sound';

export class Game {
  engine: GameEngine;
  private renderer: Renderer;
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private fps = 0;
  private frameCount = 0;
  private fpsTimer = 0;

  // Callbacks
  onFpsUpdate?: (fps: number) => void;
  onStateChange?: () => void;
  audioInitialized = false;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new GameEngine();
    this.renderer = new Renderer(canvas);

    // Wire up engine state changes to UI
    this.engine.onUpdate = () => {
      if (this.onStateChange) this.onStateChange();
    };

    // Game over callback for mode-based games
    this.engine.onGameOver = () => {
      if (this.engine.mode === 'timeAttack') {
        playGameOver();
      } else if (this.engine.mode === 'targetScore') {
        playVictory();
      }
    };
  }

  /** Start the game */
  start() {
    if (this.running) return;
    this.running = true;

    // Set initial size
    const canvas = this.renderer['canvas'];
    const parent = canvas.parentElement;
    if (parent) {
      this.resize(parent.clientWidth, parent.clientHeight);
    }

    this.engine.init(14);
    this.lastTime = performance.now();
    this.fpsTimer = this.lastTime;
    this.loop(this.lastTime);
  }

  /** Stop the game */
  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  /** Main animation loop */
  private loop = (time: number) => {
    if (!this.running) return;

    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // FPS tracking
    this.frameCount++;
    if (time - this.fpsTimer > 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = time;
      if (this.onFpsUpdate) this.onFpsUpdate(this.fps);
    }

    // Update physics
    this.engine.update(dt);

    // Render
    this.renderer.render(this.engine);

    this.rafId = requestAnimationFrame(this.loop);
  };

  /** Resize the game */
  resize(width: number, height: number) {
    this.engine.resize(width, height);
    this.renderer.resize(width, height);
  }

  /** Initialize audio on first interaction */
  ensureAudio() {
    if (!this.audioInitialized) {
      initAudio();
      this.audioInitialized = true;
    }
  }

  /** Process player input — with sound */
  processInput(input: string) {
    if (!input.trim()) return;
    if (this.engine.gameOver) return;

    const parsed = parseInput(input);

    if (!parsed) {
      this.engine.lastResult = `Can't parse: "${input}"`;
      this.engine.lastResultType = '';
      this.engine.lastAction = performance.now();
      playMiss();
      return;
    }

    switch (parsed.type) {
      case 'math': {
        const killed = this.engine.processMathResult(parsed.result);
        if (killed > 0) {
          playExplosion(killed);
          if (this.engine.combo > 1) playCombo(this.engine.combo);
        } else {
          playMiss();
        }
        break;
      }
      case 'gravity':
        this.engine.setGravity(parsed.value);
        playCommand();
        break;
      case 'speed':
        this.engine.multiplySpeed(parsed.value);
        playCommand();
        break;
      case 'spawn':
        this.engine.spawn(parsed.value);
        playCommand();
        break;
      case 'clear':
        this.engine.clearAll();
        playClear();
        break;
    }
  }
}
