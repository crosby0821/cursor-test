import { CHEST_CARDS, CHANCE_CARDS } from '../data/cards'
import { BOARD_TILES } from '../data/board'
import type { CardDefinition, CardInstance, GameState } from './types'

export function shuffleDeck<T>(items: T[], rng: () => number = Math.random): T[] {
  const deck = [...items]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export function createCardInstances(
  defs: CardDefinition[],
  prefix: string
): CardInstance[] {
  return defs.map((d, i) => ({
    ...d,
    instanceId: `${prefix}-${i}`,
  }))
}

export function initDecks(rng?: () => number): {
  chanceDeck: CardInstance[]
  chestDeck: CardInstance[]
} {
  return {
    chanceDeck: shuffleDeck(createCardInstances(CHANCE_CARDS, 'ch'), rng),
    chestDeck: shuffleDeck(createCardInstances(CHEST_CARDS, 'cc'), rng),
  }
}

export function drawCard(
  state: GameState,
  deck: 'chance' | 'chest'
): { card: CardInstance; chanceDeck: CardInstance[]; chestDeck: CardInstance[] } {
  if (deck === 'chance') {
    const [card, ...rest] = state.chanceDeck
    const reshuffled = rest.length === 0 ? shuffleDeck(state.chanceDeck) : rest
    return {
      card: card ?? createCardInstances(CHANCE_CARDS, 'ch')[0],
      chanceDeck: reshuffled.length ? reshuffled : shuffleDeck(createCardInstances(CHANCE_CARDS, 'ch')),
      chestDeck: state.chestDeck,
    }
  }
  const [card, ...rest] = state.chestDeck
  const reshuffled = rest.length === 0 ? shuffleDeck(state.chestDeck) : rest
  return {
    card: card ?? createCardInstances(CHEST_CARDS, 'cc')[0],
    chanceDeck: state.chanceDeck,
    chestDeck: reshuffled.length ? reshuffled : shuffleDeck(createCardInstances(CHEST_CARDS, 'cc')),
  }
}

export function countPlayerBuildings(state: GameState, playerId: string): {
  tiers: number
  hotels: number
  lines: number
} {
  let tiers = 0
  let hotels = 0
  let lines = 0
  for (const tile of BOARD_TILES) {
    if (tile.kind !== 'property') continue
    const ps = state.properties[tile.id]
    if (ps?.ownerId !== playerId) continue
    lines++
    tiers += ps.exposureTier
    if (ps.exposureTier === 5) hotels++
  }
  return { tiers, hotels, lines }
}
