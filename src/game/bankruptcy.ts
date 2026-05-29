import type { GameState } from './types'

/** Solvency helpers (plan: bankruptcy.ts). */

export function isSolvent(player: { solvent: boolean }): boolean {
  return player.solvent
}

export function canPayAmount(capital: number, amount: number): boolean {
  return capital >= amount
}

export function shouldEnterInsolvency(capital: number, amount: number): boolean {
  return capital < amount
}

export function getRequiredPayment(state: GameState): number | null {
  if (state.pendingRent) return state.pendingRent.amount
  if (state.pendingBuy) return state.pendingBuy.price
  if (state.pendingObligation != null) return state.pendingObligation
  return null
}

export function canAffordRequiredPayment(state: GameState, capital: number): boolean {
  const required = getRequiredPayment(state)
  if (required == null) return capital >= 0
  return canPayAmount(capital, required)
}

export function enterInsolvency(
  state: GameState,
  amount: number,
  message: string
): GameState {
  return {
    ...state,
    phase: 'insolvency',
    pendingObligation: amount,
    message,
  }
}

export function exitInsolvencyPhase(state: GameState): GameState {
  if (state.pendingRent) {
    return { ...state, phase: 'payRent', pendingObligation: null }
  }
  if (state.pendingBuy) {
    return { ...state, phase: 'buyPrompt', pendingObligation: null }
  }
  return { ...state, phase: 'preRoll', pendingObligation: null }
}
