import { describe, it, expect } from 'vitest'
import { canPayAmount, isSolvent, shouldEnterInsolvency } from './bankruptcy'
import { createInitialState } from './initialState'
import { gameReducer } from './reducer'

describe('bankruptcy', () => {
  it('detects insolvency when capital is insufficient', () => {
    expect(shouldEnterInsolvency(50, 100)).toBe(true)
    expect(canPayAmount(150, 100)).toBe(true)
  })

  it('DECLARE_INSOLVENT eliminates current player', () => {
    let s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['A', 'B'],
    })
    s = {
      ...s,
      phase: 'insolvency',
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, capital: 0, solvent: true } : p
      ),
    }
    s = gameReducer(s, { type: 'DECLARE_INSOLVENT' })
    expect(isSolvent(s.players[0])).toBe(false)
    expect(s.currentPlayerIndex).toBe(1)
  })
})
