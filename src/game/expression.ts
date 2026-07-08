/**
 * Math Expression Parser for Neon Equation
 *
 * Handles two modes:
 * 1. Commands: `gravity 0.5`, `speed 2`, `spawn 10`, `clear`
 * 2. Math expressions: `5+3`, `2*10`, `(15-3)/4`, `7^2`
 */

import type { ParsedInput, Command, MathExpr } from '../types';

export function parseInput(input: string): ParsedInput {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const parts = trimmed.split(/\s+/);

  // Command: gravity
  if (parts[0].toLowerCase() === 'gravity' || parts[0] === 'g') {
    const val = parseFloat(parts[1]);
    if (!isNaN(val) && val >= 0 && val <= 5) {
      return { type: 'gravity', value: val } as Command;
    }
  }

  // Command: speed
  if (parts[0].toLowerCase() === 'speed' || parts[0] === 's') {
    const val = parseFloat(parts[1]);
    if (!isNaN(val) && val > 0 && val <= 10) {
      return { type: 'speed', value: val } as Command;
    }
  }

  // Command: spawn
  if (parts[0].toLowerCase() === 'spawn' || parts[0] === 'n') {
    const val = parseInt(parts[1]);
    if (!isNaN(val) && val > 0) {
      return { type: 'spawn', value: Math.min(val, 50) } as Command;
    }
  }

  // Command: clear
  if (lower === 'clear' || lower === 'reset' || lower === 'c') {
    return { type: 'clear', value: 0 } as Command;
  }

  // Math expression evaluation
  try {
    // Only allow safe characters
    const sanitized = trimmed.replace(/[^0-9+\-*/().%\s^]/g, '');
    if (!sanitized) return null;

    // Replace ^ with ** for exponentiation
    const withExp = sanitized.replace(/\^/g, '**');

    // Use Function constructor for safe eval in client-side game context
    const result = Function('"use strict"; return (' + withExp + ')')();
    if (typeof result === 'number' && isFinite(result) && !isNaN(result)) {
      // Round to avoid floating point issues
      const rounded = Math.round(result * 100) / 100;
      return { type: 'math', result: rounded } as MathExpr;
    }
  } catch {
    // Not valid math — ignore
  }

  return null;
}

/**
 * Format a number nicely for display
 */
export function formatResult(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}
