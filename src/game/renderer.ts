/**
 * Neon Equation — Canvas Renderer
 *
 * Renders the game with full neon aesthetic:
 * - Glow effects via shadow blur
 * - Particle trails with fading opacity
 * - Screen shake via canvas transform
 * - Neon explosions
 */

import type { Particle, ExplosionSpark } from '../types';
import type { GameEngine } from './engine';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private bgGradient: CanvasGradient | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
  }

  /** Render a single frame */
  render(engine: GameEngine) {
    const ctx = this.ctx;
    const w = engine.width;
    const h = engine.height;

    ctx.save();

    // --- Screen shake ---
    if (engine.shakeIntensity > 0.1) {
      const sx = (Math.random() - 0.5) * engine.shakeIntensity * 0.7;
      const sy = (Math.random() - 0.5) * engine.shakeIntensity * 0.7;
      ctx.translate(sx, sy);
    }

    // --- Background ---
    this.drawBackground(w, h);

    // --- Sparks (behind particles) ---
    this.drawSparks(engine.sparks);

    // --- Trails ---
    for (const p of engine.particles) {
      this.drawTrail(p);
    }

    // --- Particles ---
    for (const p of engine.particles) {
      this.drawParticle(p);
    }

    // --- Subtle vignette overlay ---
    this.drawVignette(w, h);

    ctx.restore();
  }

  private drawBackground(w: number, h: number) {
    const ctx = this.ctx;

    // Dark gradient background
    if (!this.bgGradient || true) {
      this.bgGradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      this.bgGradient.addColorStop(0, '#0a0a1a');
      this.bgGradient.addColorStop(0.5, '#050510');
      this.bgGradient.addColorStop(1, '#000000');
    }

    ctx.fillStyle = this.bgGradient;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  private drawTrail(p: Particle) {
    const ctx = this.ctx;
    if (p.trail.length < 2) return;

    for (let i = 0; i < p.trail.length; i++) {
      const t = p.trail[i];
      const alpha = (i / p.trail.length) * 0.35;
      const radius = (p.radius * (i / p.trail.length)) * 0.4;

      ctx.beginPath();
      ctx.arc(t.x, t.y, Math.max(radius, 1), 0, Math.PI * 2);
      ctx.fillStyle = p.glowColor;
      ctx.globalAlpha = alpha;
      ctx.fill();

      // Inner glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.glowColor;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
  }

  private drawParticle(p: Particle) {
    const ctx = this.ctx;

    // Outer glow
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = p.glowColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color + '30';     // very transparent
    ctx.fill();
    ctx.restore();

    // Midsize glow
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = p.glowColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = p.color + '60';
    ctx.fill();
    ctx.restore();

    // Main body
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = p.glowColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();

    // Bright center
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Value text
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.glowColor;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(p.radius * 0.7)}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.value.toString(), p.x, p.y + 1);
    ctx.restore();
  }

  private drawSparks(sparks: ExplosionSpark[]) {
    const ctx = this.ctx;
    for (const s of sparks) {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = s.color;
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * s.life, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  private drawVignette(w: number, h: number) {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.8);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  /** Resize canvas to match container */
  resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.scale(dpr, dpr);
    this.bgGradient = null; // Will be recreated next frame
  }
}
