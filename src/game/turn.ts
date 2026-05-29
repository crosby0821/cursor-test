import type { GamePhase } from './types'

/** Turn phase helpers (plan: turn.ts). */

export function canRoll(phase: GamePhase): boolean {
  return phase === 'preRoll' || phase === 'buyPrompt'
}

export function canBuildOrManage(phase: GamePhase): boolean {
  return phase === 'preRoll' || phase === 'buyPrompt' || phase === 'insolvency'
}

export function isGameOver(phase: GamePhase): boolean {
  return phase === 'gameOver'
}
