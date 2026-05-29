import { describe, it, expect, vi } from 'vitest'
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
    const random = vi.spyOn(Math, 'random')
    random.mockReturnValueOnce(0.1).mockReturnValueOnce(0.6)
    const startPos = s.players[0].position
    s = gameReducer(s, { type: 'ROLL_DICE' })
    random.mockRestore()
    expect(s.lastDice).not.toBeNull()
    expect(s.lastDice?.total).toBeGreaterThan(0)
    expect(s.players[0].position).not.toBe(startPos)
  })

  it('sends player to regulatory examination on third double', () => {
    let s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['A', 'B'],
    })
    s = { ...s, consecutiveDoubles: 2, phase: 'preRoll' }
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    s = gameReducer(s, { type: 'ROLL_DICE' })
    random.mockRestore()
    expect(s.players[0].inJail).toBe(true)
    expect(s.players[0].position).toBe(10)
  })

  it('RESET_GAME returns to lobby state', () => {
    let s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['A', 'B'],
    })
    expect(s.started).toBe(true)
    s = gameReducer(s, { type: 'RESET_GAME' })
    expect(s.started).toBe(false)
    expect(s.players).toHaveLength(0)
  })
})
