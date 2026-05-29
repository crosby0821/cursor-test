import { describe, it, expect } from 'vitest'
import { movePlayer } from './movement'
import { calcGoPremium } from './property'
import { createInitialState } from './initialState'
import { gameReducer } from './reducer'

describe('movement', () => {
  it('movePlayer wraps around board', () => {
    const s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['A', 'B'],
    })
    const player = { ...s.players[0], position: 38 }
    const result = movePlayer(player, 5, s)
    expect(result.newPosition).toBe(3)
    expect(result.passedGo).toBe(true)
    expect(result.goPremium).toBeGreaterThan(0)
  })

  it('calcGoPremium includes segment bonus', () => {
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
    expect(calcGoPremium(s, 'p0')).toBe(210)
  })
})
