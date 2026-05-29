import { BOARD_TILES, getTile, isPropertyTile } from '../data/board'
import {
  BOARD_SIZE,
  GO_BASE_PREMIUM,
  GO_SEGMENT_BONUS,
  VOLATILITY_SHOCK_CHANCE,
} from './constants'
import type {
  BoardTile,
  DiceRoll,
  GameState,
  LossRatioVolatility,
  Player,
  PropertyState,
  PropertyTile,
} from './types'

const RAILROAD_RENT = [25, 50, 100, 200]
const UTILITY_MULT = [4, 10]

export function initPropertyStates(): Record<number, PropertyState> {
  const states: Record<number, PropertyState> = {}
  for (const tile of BOARD_TILES) {
    if (
      tile.kind === 'property' ||
      tile.kind === 'railroad' ||
      tile.kind === 'utility'
    ) {
      states[tile.id] = {
        ownerId: null,
        exposureTier: 0,
        mortgaged: false,
      }
    }
  }
  return states
}

export function getPropertyState(
  state: GameState,
  tileId: number
): PropertyState | undefined {
  return state.properties[tileId]
}

export function ownsFullSegment(
  state: GameState,
  playerId: string,
  groupId: string
): boolean {
  const groupTiles = BOARD_TILES.filter(
    (t) => t.kind === 'property' && t.groupId === groupId
  )
  return groupTiles.every((t) => {
    const ps = state.properties[t.id]
    return ps?.ownerId === playerId && !ps.mortgaged
  })
}

export function countControlledSegments(state: GameState, playerId: string): number {
  const groups = new Set(
    BOARD_TILES.filter((t) => t.kind === 'property').map((t) => t.groupId)
  )
  let count = 0
  for (const g of groups) {
    if (ownsFullSegment(state, playerId, g)) count++
  }
  return count
}

export function calcGoPremium(state: GameState, playerId: string): number {
  return (
    GO_BASE_PREMIUM +
    GO_SEGMENT_BONUS * countControlledSegments(state, playerId)
  )
}

function countOwnedRailroads(state: GameState, ownerId: string): number {
  return BOARD_TILES.filter(
    (t) =>
      t.kind === 'railroad' && state.properties[t.id]?.ownerId === ownerId
  ).length
}

function countOwnedUtilities(state: GameState, ownerId: string): number {
  return BOARD_TILES.filter(
    (t) => t.kind === 'utility' && state.properties[t.id]?.ownerId === ownerId
  ).length
}

export function calcClaimsRent(
  state: GameState,
  tileId: number,
  dice: DiceRoll | null
): number {
  const tile = getTile(tileId)
  const ps = state.properties[tileId]
  if (!ps?.ownerId || ps.mortgaged) return 0

  if (tile.kind === 'property') {
    const prop = tile as PropertyTile
    const tier = ps.exposureTier
    const hasMonopoly = ownsFullSegment(state, ps.ownerId, prop.groupId)
    if (tier === 0 && !hasMonopoly) return prop.rent[0]
    return prop.rent[Math.min(tier, 5)]
  }

  if (tile.kind === 'railroad') {
    const n = countOwnedRailroads(state, ps.ownerId)
    return RAILROAD_RENT[Math.max(0, n - 1)] ?? 25
  }

  if (tile.kind === 'utility' && dice) {
    const n = countOwnedUtilities(state, ps.ownerId)
    const mult = UTILITY_MULT[Math.max(0, n - 1)] ?? 4
    return mult * dice.total
  }

  return 0
}

export function shouldAdverseDevelopment(
  volatility: LossRatioVolatility,
  rng: () => number = Math.random
): boolean {
  const chance = VOLATILITY_SHOCK_CHANCE[volatility] ?? 0.1
  return rng() < chance
}

export function calcAdverseDevelopment(rent: number): number {
  return Math.floor(rent * 0.25)
}

export function canBuildExposure(
  state: GameState,
  playerId: string,
  tileId: number
): boolean {
  const tile = getTile(tileId)
  if (!isPropertyTile(tile)) return false
  const ps = state.properties[tileId]
  if (ps?.ownerId !== playerId || ps.mortgaged) return false
  if (!ownsFullSegment(state, playerId, tile.groupId)) return false
  if (ps.exposureTier >= 5) return false

  const groupTiles = BOARD_TILES.filter(
    (t) => t.kind === 'property' && t.groupId === tile.groupId
  )
  const tiers = groupTiles.map((t) => state.properties[t.id]?.exposureTier ?? 0)
  const minTier = Math.min(...tiers)
  const maxTier = Math.max(...tiers)
  if (ps.exposureTier > minTier) return false
  if (maxTier - minTier > 1) return false

  return true
}

export function getOwnablePrice(tile: BoardTile): number {
  if (
    tile.kind === 'property' ||
    tile.kind === 'railroad' ||
    tile.kind === 'utility'
  ) {
    return tile.price
  }
  return 0
}

export function playerTotalAssets(
  state: GameState,
  player: Player
): number {
  let assets = player.capital
  for (const [idStr, ps] of Object.entries(state.properties)) {
    if (ps.ownerId !== player.id) continue
    const tileId = Number(idStr)
    const tile = getTile(tileId)
    if (
      tile.kind === 'property' ||
      tile.kind === 'railroad' ||
      tile.kind === 'utility'
    ) {
      const price = tile.price
      assets += Math.floor(price * (ps.mortgaged ? 0.5 : 1))
      if (tile.kind === 'property' && !ps.mortgaged) {
        assets += ps.exposureTier * 25
      }
    }
  }
  return assets
}

export function calcMcrHint(state: GameState, player: Player): number {
  return Math.floor(playerTotalAssets(state, player) * 0.1)
}

export function findNearestRailroad(from: number): number {
  const railroads = [5, 15, 25, 35]
  for (let i = 1; i <= BOARD_SIZE; i++) {
    const pos = (from + i) % BOARD_SIZE
    if (railroads.includes(pos)) return pos
  }
  return 5
}

export function findNearestUtility(from: number): number {
  const utils = [12, 28]
  for (let i = 1; i <= BOARD_SIZE; i++) {
    const pos = (from + i) % BOARD_SIZE
    if (utils.includes(pos)) return pos
  }
  return 12
}
