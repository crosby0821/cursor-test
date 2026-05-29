import { describe, it, expect } from 'vitest'
import { createInitialState } from './initialState'
import { gameReducer } from './reducer'
import { resolveLanding } from './landing'

describe('landing', () => {
  it('tax payment adds to free parking pool', () => {
    let s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['A', 'B'],
    })
    s = {
      ...s,
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, position: 4, capital: 2000 } : p
      ),
    }
    s = resolveLanding(s, 'p0')
    expect(s.freeParkingPool).toBeGreaterThan(0)
  })

  it('parking pays out pool when enabled', () => {
    let s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['A', 'B'],
      freeParkingPayout: true,
    })
    const before = s.players[0].capital
    s = {
      ...s,
      freeParkingPool: 200,
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, position: 20 } : p
      ),
    }
    s = resolveLanding(s, 'p0')
    expect(s.players[0].capital).toBe(before + 200)
    expect(s.freeParkingPool).toBe(0)
  })

  it('parking does not pay out when disabled', () => {
    let s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['A', 'B'],
      freeParkingPayout: false,
    })
    const before = s.players[0].capital
    s = {
      ...s,
      freeParkingPool: 200,
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, position: 20 } : p
      ),
    }
    s = resolveLanding(s, 'p0')
    expect(s.players[0].capital).toBe(before)
    expect(s.freeParkingPool).toBe(200)
  })
})
