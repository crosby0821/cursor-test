import type { GamePhase, GameState } from './types'

/** Turn phase helpers (plan: turn.ts). */

export function canRoll(phase: GamePhase): boolean {
  return phase === 'preRoll'
}

export function canBuildOrManage(phase: GamePhase): boolean {
  return phase === 'preRoll' || phase === 'buyPrompt' || phase === 'insolvency'
}

export function isGameOver(phase: GamePhase): boolean {
  return phase === 'gameOver'
}

export function isActiveTurn(state: GameState): boolean {
  if (isGameOver(state.phase)) return false
  const current = state.players[state.currentPlayerIndex]
  return Boolean(current?.solvent)
}

export function canManageAssets(state: GameState): boolean {
  return isActiveTurn(state) && canBuildOrManage(state.phase)
}
