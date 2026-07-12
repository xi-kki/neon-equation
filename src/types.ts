export interface Vec2 {
  x: number;
  y: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  radius: number;
  color: string;
  glowColor: string;
  trail: Vec2[];
  maxTrail: number;
  alive: boolean;
}

export interface ExplosionSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  radius: number;
}

export type CommandType = 'gravity' | 'speed' | 'spawn' | 'clear';

export interface Command {
  type: CommandType;
  value: number;
}

export interface MathExpr {
  type: 'math';
  result: number;
}

export type ParsedInput = Command | MathExpr | null;

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface GameModeConfig {
  sandbox: { label: string; desc: string };
  timeAttack: { label: string; desc: string };
  targetScore: { label: string; desc: string };
}

export const GAME_MODES: GameModeConfig = {
  sandbox: { label: '🎯 Sandbox', desc: 'Free play — starts easy (1–5), gets harder as you score!' },
  timeAttack: { label: '⏱️ Time Attack', desc: '60 seconds — starts easy (1–5), values ramp up!' },
  targetScore: { label: '🏆 Target Score', desc: 'Reach 5,000 pts — difficulty scales with your score!' },
};

/**
 * Progressive difficulty: returns value range based on score
 *
 * Phase 1 (0 pts):    1–5      — super simple, just type the number
 * Phase 2 (500 pts):   1–10     — add/subtract
 * Phase 3 (1500 pts):  1–20     — multiply/divide
 * Phase 4 (3000 pts):  1–35     — parentheses
 * Phase 5 (5000+ pts): 1–50     — exponents
 */
export function randomValue(score: number = 0): number {
  if (score < 500) {
    return Math.floor(Math.random() * 5) + 1;           // 1–5
  } else if (score < 1500) {
    return Math.floor(Math.random() * 10) + 1;          // 1–10
  } else if (score < 3000) {
    return Math.floor(Math.random() * 20) + 1;          // 1–20
  } else if (score < 5000) {
    return Math.floor(Math.random() * 35) + 1;          // 1–35
  } else {
    return Math.floor(Math.random() * 50) + 1;          // 1–50
  }
}

/** Get the current difficulty phase label and hint */
export function getDifficultyPhase(score: number): {
  label: string;
  description: string;
  examples: string[];
} {
  if (score < 500) {
    return {
      label: '🟢 Phase 1: Warm Up',
      description: 'Values 1–5 — Just type the number you see!',
      examples: ['Type 3 → destroys 3', 'Type 5 → destroys 5'],
    };
  } else if (score < 1500) {
    return {
      label: '🟡 Phase 2: Add & Subtract',
      description: 'Values 1–10 — Use + and -',
      examples: ['2+3 → destroys 5', '9-4 → destroys 5'],
    };
  } else if (score < 3000) {
    return {
      label: '🟠 Phase 3: Multiply & Divide',
      description: 'Values 1–20 — Use * and /',
      examples: ['3*4 → destroys 12', '20/2 → destroys 10'],
    };
  } else if (score < 5000) {
    return {
      label: '🔴 Phase 4: Parentheses',
      description: 'Values 1–35 — Combine operations',
      examples: ['(5+3)*2 → destroys 16', '(20-5)/3 → destroys 5'],
    };
  } else {
    return {
      label: '💜 Phase 5: Exponents',
      description: 'Values 1–50 — Use ^ for power',
      examples: ['3^2 → destroys 9', '5^2-1 → destroys 24'],
    };
  }
}

export const NEON_COLORS = [
  { main: '#FF6B6B', glow: '#FF0000' },
  { main: '#4ECDC4', glow: '#00FFFF' },
  { main: '#45B7D1', glow: '#00BFFF' },
  { main: '#96CEB4', glow: '#00FF7F' },
  { main: '#FFEAA7', glow: '#FFD700' },
  { main: '#6C5CE7', glow: '#8A2BE2' },
  { main: '#FF6B9D', glow: '#FF1493' },
  { main: '#FFA94D', glow: '#FF8C00' },
  { main: '#A29BFE', glow: '#9400D3' },
  { main: '#FD79A8', glow: '#FF69B4' },
];

export function randomNeonColor() {
  return NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
}


