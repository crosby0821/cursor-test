import { describe, it, expect } from 'vitest'
import { CHANCE_CARDS } from '../data/cards'
import { createCardInstances } from './cards'
import {
  calcCollectAmount,
  calcGoBackPosition,
  calcPayEachPlayerTotal,
  canAfford,
} from './cardEffects'
import { gameReducer } from './reducer'
import { createInitialState } from './initialState'

describe('cardEffects', () => {
  const [collectCard] = createCardInstances(
    CHANCE_CARDS.filter((c) => c.effect === 'collect'),
    't'
  )

  it('calcCollectAmount returns card amount', () => {
    expect(calcCollectAmount(collectCard)).toBe(collectCard.amount)
  })

  it('calcPayEachPlayerTotal multiplies by opponent count', () => {
    expect(calcPayEachPlayerTotal({ ...collectCard, effect: 'payEachPlayer', amount: 25 }, 2)).toBe(50)
  })

  it('calcGoBackPosition wraps on board', () => {
    expect(calcGoBackPosition(2, 3)).toBe(39)
  })

  it('canAfford checks capital', () => {
    expect(canAfford(100, 50)).toBe(true)
    expect(canAfford(10, 50)).toBe(false)
  })
})

describe('card effect via reducer', () => {
  it('RESOLVE_CARD collects surplus on collect effect', () => {
    let s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['A', 'B'],
    })
    const before = s.players[0].capital
    s = {
      ...s,
      phase: 'cardReveal',
      pendingCard: {
        playerId: 'p0',
        card: {
          id: 'x',
          instanceId: 'x-0',
          deck: 'chance',
          text: 'Test collect',
          effect: 'collect',
          amount: 50,
        },
      },
    }
    s = gameReducer(s, { type: 'RESOLVE_CARD' })
    expect(s.players[0].capital).toBe(before + 50)
  })
})
