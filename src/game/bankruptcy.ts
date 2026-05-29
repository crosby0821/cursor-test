import type { Player } from './types'

/** Solvency helpers (plan: bankruptcy.ts). */

export function isSolvent(player: Player): boolean {
  return player.solvent
}

export function canPayAmount(capital: number, amount: number): boolean {
  return capital >= amount
}

export function shouldEnterInsolvency(capital: number, amount: number): boolean {
  return capital < amount
}
