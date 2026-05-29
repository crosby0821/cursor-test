import { BOARD_SIZE } from './constants'
import { countPlayerBuildings } from './cards'
import type { CardInstance, GameState } from './types'

/** Pure helpers for card effect calculations (testable, plan: cardEffects.ts). */

export function calcCollectAmount(card: CardInstance): number {
  return card.amount ?? 0
}

export function calcPayAmount(card: CardInstance): number {
  return card.amount ?? 0
}

export function calcPayEachPlayerTotal(
  card: CardInstance,
  otherSolventCount: number
): number {
  return (card.amount ?? 0) * otherSolventCount
}

export function calcRepairsCost(
  state: GameState,
  playerId: string,
  perTier: number
): number {
  const { tiers } = countPlayerBuildings(state, playerId)
  return tiers * perTier
}

export function calcAssessmentCost(
  state: GameState,
  playerId: string,
  perLine: number
): number {
  const { tiers, hotels, lines } = countPlayerBuildings(state, playerId)
  return lines * perLine + tiers * perLine + hotels * (perLine * 4)
}

export function calcGoBackPosition(
  currentPosition: number,
  spaces: number
): number {
  return (currentPosition - spaces + BOARD_SIZE) % BOARD_SIZE
}

export function canAfford(capital: number, cost: number): boolean {
  return capital >= cost
}
