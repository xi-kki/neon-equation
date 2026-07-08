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

export function randomValue(): number {
  // Weighted: mostly 1-20, occasionally higher
  if (Math.random() < 0.8) {
    return Math.floor(Math.random() * 20) + 1;
  }
  return Math.floor(Math.random() * 50) + 21;
}
