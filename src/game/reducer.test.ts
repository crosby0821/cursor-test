import { describe, it, expect } from 'vitest'
import { createInitialState } from './initialState'
import { gameReducer } from './reducer'

describe('gameReducer', () => {
  it('starts game with two players', () => {
    const s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['Alice', 'Bob'],
    })
    expect(s.started).toBe(true)
    expect(s.players).toHaveLength(2)
    expect(s.players[0].capital).toBe(1500)
  })

  it('rejects start with one player', () => {
    const s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['Solo'],
    })
    expect(s.started).toBe(false)
  })

  it('rolls and moves current player', () => {
    let s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['A', 'B'],
    })
    const startPos = s.players[0].position
    s = gameReducer(s, { type: 'ROLL_DICE' })
    expect(s.lastDice).not.toBeNull()
    expect(s.players[0].position).not.toBe(startPos)
  })
})
