/**
 * Neon Equation — Game Engine
 *
 * Handles particle physics, spawning, collisions, explosions,
 * screen shake, and score tracking.
 */

import type { Particle, ExplosionSpark, Vec2 } from '../types';
import { randomNeonColor, randomValue } from '../types';

export const CONFIG = {
  width: 800,
  height: 600,
  defaultGravity: 0.15,
  maxParticles: 40,
  damping: 0.99,
  wallBounce: 0.7,
  particleBounce: 0.5,
  spawnInterval: 3000,        // ms between auto-spawns
  shakeDecay: 0.85,           // per-frame decay
  maxShake: 20,
  trailLength: 12,
  particleMinR: 18,
  particleMaxR: 32,
  scorePerKill: 100,
  comboMultiplier: 1.5,
};

let nextId = 1;

export class GameEngine {
  particles: Particle[] = [];
  sparks: ExplosionSpark[] = [];
  score = 0;
  combo = 0;
  gravity = CONFIG.defaultGravity;
  speedMultiplier = 1;
  shakeIntensity = 0;
  lastResult = '';
  lastResultType: 'destroy' | 'command' | 'clear' | '' = '';
  lastAction = 0;             // timestamp of last action for feedback
  width = CONFIG.width;
  height = CONFIG.height;
  private spawnTimer = 0;
  private animationId = 0;
  private lastTime = 0;

  // Callbacks
  onUpdate?: (state: GameEngine) => void;

  /** Initialize with starting particles */
  init(count = 12) {
    this.particles = [];
    this.sparks = [];
    this.score = 0;
    this.combo = 0;
    this.gravity = CONFIG.defaultGravity;
    this.speedMultiplier = 1;
    this.shakeIntensity = 0;
    this.spawnTimer = 0;
    nextId = 1;

    for (let i = 0; i < count; i++) {
      this.spawnParticle();
    }
  }

  /** Create a new particle at a random position */
  spawnParticle(x?: number, y?: number): Particle {
    const r = CONFIG.particleMinR + Math.random() * (CONFIG.particleMaxR - CONFIG.particleMinR);
    const neon = randomNeonColor();

    const p: Particle = {
      id: nextId++,
      x: x ?? r + Math.random() * (this.width - r * 2),
      y: y ?? r + Math.random() * (this.height * 0.5),     // spawn in top half
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 2,
      value: randomValue(),
      radius: r,
      color: neon.main,
      glowColor: neon.glow,
      trail: [],
      maxTrail: CONFIG.trailLength,
      alive: true,
    };

    this.particles.push(p);
    return p;
  }

  /** Remove a particle with explosion effects */
  destroyParticle(p: Particle) {
    p.alive = false;

    // Spawn explosion sparks
    const sparkCount = Math.floor(p.radius * 1.5);
    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.5;
      const speed = 1 + Math.random() * 4;
      this.sparks.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: p.glowColor,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.8,
        radius: 1.5 + Math.random() * 3,
      });
    }

    // Trigger screen shake proportional to size
    this.shakeIntensity = Math.min(CONFIG.maxShake, this.shakeIntensity + p.radius * 0.4);
  }

  /** Create a big explosion effect at a position */
  bigExplosion(x: number, y: number, color: string, intensity = 1) {
    const count = Math.floor(30 * intensity);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 6 * intensity;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1,
        maxLife: 0.5 + Math.random() * 1.5 * intensity,
        radius: 1 + Math.random() * 5 * intensity,
      });
    }
    this.shakeIntensity = Math.min(CONFIG.maxShake, this.shakeIntensity + 12 * intensity);
  }

  /** Process a math result — destroy matching particles */
  processMathResult(result: number): number {
    let killed = 0;
    const matchVal = Math.round(result);

    for (const p of this.particles) {
      if (!p.alive) continue;
      if (Math.round(p.value) === matchVal) {
        this.destroyParticle(p);
        killed++;
      }
    }

    if (killed > 0) {
      this.combo++;
      const points = Math.floor(CONFIG.scorePerKill * killed * Math.pow(CONFIG.comboMultiplier, this.combo - 1));
      this.score += points;
      this.lastResult = `+${points} pts (${killed} × ${matchVal})`;
      this.lastResultType = 'destroy';
      this.lastAction = performance.now();
    } else {
      this.combo = 0;
      this.lastResult = `No particles with value ${matchVal}`;
      this.lastResultType = '';
    }

    return killed;
  }

  /** Set gravity value */
  setGravity(val: number) {
    this.gravity = val;
    this.lastResult = `Gravity → ${val.toFixed(2)}`;
    this.lastResultType = 'command';
    this.lastAction = performance.now();
    this.bigExplosion(this.width / 2, this.height / 2, '#4ECDC4', 0.5);
  }

  /** Multiply all particle speeds */
  multiplySpeed(factor: number) {
    this.speedMultiplier = factor;
    for (const p of this.particles) {
      if (!p.alive) continue;
      p.vx *= factor;
      p.vy *= factor;
    }
    this.lastResult = `Speed × ${factor.toFixed(1)}`;
    this.lastResultType = 'command';
    this.lastAction = performance.now();
    this.shakeIntensity = Math.min(CONFIG.maxShake, this.shakeIntensity + 8);
  }

  /** Spawn N new particles */
  spawn(count: number) {
    for (let i = 0; i < count; i++) {
      this.spawnParticle();
    }
    this.lastResult = `Spawned ${count} particles`;
    this.lastResultType = 'command';
    this.lastAction = performance.now();
    this.shakeIntensity = Math.min(CONFIG.maxShake, this.shakeIntensity + 5);
  }

  /** Clear all particles */
  clearAll() {
    for (const p of this.particles) {
      if (!p.alive) continue;
      this.destroyParticle(p);
    }
    this.bigExplosion(this.width / 2, this.height / 2, '#FF6B6B', 2);
    this.lastResult = 'All particles cleared!';
    this.lastResultType = 'clear';
    this.lastAction = performance.now();
    this.combo = 0;
  }

  /** Main update — called every frame */
  update(dt: number) {
    // Cap dt to avoid physics explosion on tab switch
    const cappedDt = Math.min(dt, 0.05);
    const time = performance.now();

    // --- Particle physics ---
    const aliveParticles = this.particles.filter(p => p.alive);

    for (const p of aliveParticles) {
      // Gravity
      p.vy += this.gravity * 60 * cappedDt;

      // Apply velocity
      p.x += p.vx * 60 * cappedDt;
      p.y += p.vy * 60 * cappedDt;

      // Damping
      p.vx *= Math.pow(CONFIG.damping, 60 * cappedDt);
      p.vy *= Math.pow(CONFIG.damping, 60 * cappedDt);

      // Update trail
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > p.maxTrail) {
        p.trail.shift();
      }

      // Wall collisions
      if (p.x - p.radius < 0) {
        p.x = p.radius;
        p.vx = Math.abs(p.vx) * CONFIG.wallBounce;
      } else if (p.x + p.radius > this.width) {
        p.x = this.width - p.radius;
        p.vx = -Math.abs(p.vx) * CONFIG.wallBounce;
      }
      if (p.y - p.radius < 0) {
        p.y = p.radius;
        p.vy = Math.abs(p.vy) * CONFIG.wallBounce;
      } else if (p.y + p.radius > this.height) {
        p.y = this.height - p.radius;
        p.vy = -Math.abs(p.vy) * CONFIG.wallBounce;
      }
    }

    // --- Particle-particle collisions (simple) ---
    for (let i = 0; i < aliveParticles.length; i++) {
      for (let j = i + 1; j < aliveParticles.length; j++) {
        const a = aliveParticles[i];
        const b = aliveParticles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;
        if (dist < minDist && dist > 0.01) {
          // Separate
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;

          // Exchange velocity along collision normal
          const relVx = b.vx - a.vx;
          const relVy = b.vy - a.vy;
          const relVn = relVx * nx + relVy * ny;
          if (relVn < 0) {
            a.vx += relVn * nx * CONFIG.particleBounce;
            a.vy += relVn * ny * CONFIG.particleBounce;
            b.vx -= relVn * nx * CONFIG.particleBounce;
            b.vy -= relVn * ny * CONFIG.particleBounce;
          }
        }
      }
    }

    // --- Remove dead particles ---
    this.particles = this.particles.filter(p => p.alive);

    // --- Update explosion sparks ---
    for (const s of this.sparks) {
      s.x += s.vx * 60 * cappedDt;
      s.y += s.vy * 60 * cappedDt;
      s.vx *= 0.96;
      s.vy *= 0.96;
      s.vy += 0.05 * 60 * cappedDt; // sparks also feel gravity
      s.life -= (1 / s.maxLife) * 60 * cappedDt;
    }
    this.sparks = this.sparks.filter(s => s.life > 0);

    // --- Auto-spawn timer ---
    this.spawnTimer += 60 * cappedDt * 1000; // convert to ms
    if (this.spawnTimer > CONFIG.spawnInterval && this.particles.length < CONFIG.maxParticles) {
      this.spawnParticle();
      this.spawnTimer = 0;
    }

    // --- Decay screen shake ---
    this.shakeIntensity *= Math.pow(CONFIG.shakeDecay, 60 * cappedDt);
    if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;

    // --- Callback ---
    if (this.onUpdate) {
      this.onUpdate(this);
    }
  }

  /** Resize the game area */
  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}
