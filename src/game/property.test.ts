import { describe, it, expect } from 'vitest'
import { createInitialState } from './initialState'
import { gameReducer } from './reducer'
import {
  calcClaimsRent,
  calcGoPremium,
  countControlledSegments,
  initPropertyStates,
} from './property'
import type { GameState } from './types'

function stateWithOwners(): GameState {
  let s = gameReducer(createInitialState(), {
    type: 'START_GAME',
    playerNames: ['A', 'B'],
  })
  s = {
    ...s,
    properties: {
      ...s.properties,
      1: { ownerId: 'p0', exposureTier: 0, mortgaged: false },
      3: { ownerId: 'p0', exposureTier: 0, mortgaged: false },
    },
  }
  return s
}

describe('calcGoPremium', () => {
  it('adds segment bonus for full brown control', () => {
    const s = stateWithOwners()
    expect(countControlledSegments(s, 'p0')).toBe(1)
    expect(calcGoPremium(s, 'p0')).toBe(200 + 10)
  })
})

describe('calcClaimsRent', () => {
  it('returns base rent for mortgaged property', () => {
    const s = stateWithOwners()
    s.properties[1] = { ownerId: 'p0', exposureTier: 2, mortgaged: true }
    expect(calcClaimsRent(s, 1, null)).toBe(0)
  })

  it('returns tier rent when exposure built', () => {
    const s = stateWithOwners()
    s.properties[1] = { ownerId: 'p0', exposureTier: 2, mortgaged: false }
    expect(calcClaimsRent(s, 1, null)).toBe(30)
  })
})

describe('initPropertyStates', () => {
  it('creates state for ownable tiles', () => {
    const props = initPropertyStates()
    expect(props[1]?.ownerId).toBeNull()
    expect(props[5]?.ownerId).toBeNull()
  })
})
