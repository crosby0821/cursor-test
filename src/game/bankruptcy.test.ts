import { describe, it, expect } from 'vitest'
import {
  canPayAmount,
  getRequiredPayment,
  canAffordRequiredPayment,
  isSolvent,
  shouldEnterInsolvency,
} from './bankruptcy'
import { createInitialState } from './initialState'
import { gameReducer } from './reducer'

describe('bankruptcy', () => {
  it('detects insolvency when capital is insufficient', () => {
    expect(shouldEnterInsolvency(50, 100)).toBe(true)
    expect(canPayAmount(150, 100)).toBe(true)
  })

  it('getRequiredPayment prefers pending rent', () => {
    const state = {
      ...createInitialState(),
      pendingRent: { amount: 100, toPlayerId: 'p1', tileId: 1, description: 'test' },
      pendingBuy: { tileId: 2, price: 200 },
      pendingObligation: 50,
    }
    expect(getRequiredPayment(state)).toBe(100)
  })

  it('canAffordRequiredPayment checks obligation', () => {
    const state = {
      ...createInitialState(),
      pendingObligation: 100,
    }
    expect(canAffordRequiredPayment(state, 150)).toBe(true)
    expect(canAffordRequiredPayment(state, 50)).toBe(false)
  })

  it('RAISE_CAPITAL_DONE marks restructureUsed on failed retry', () => {
    let s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['A', 'B'],
    })
    s = {
      ...s,
      phase: 'insolvency',
      pendingRent: { amount: 500, toPlayerId: 'p1', tileId: 1, description: 'test' },
      pendingObligation: 500,
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, capital: 100, restructureUsed: false } : p
      ),
    }
    s = gameReducer(s, { type: 'RAISE_CAPITAL_DONE' })
    expect(s.players[0].restructureUsed).toBe(true)
    expect(s.phase).toBe('insolvency')
  })

  it('RAISE_CAPITAL_DONE exits insolvency when solvent enough', () => {
    let s = gameReducer(createInitialState(), {
      type: 'START_GAME',
      playerNames: ['A', 'B'],
    })
    s = {
      ...s,
      phase: 'insolvency',
      pendingRent: { amount: 50, toPlayerId: 'p1', tileId: 1, description: 'test' },
      pendingObligation: 50,
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, capital: 200 } : p
      ),
    }
    s = gameReducer(s, { type: 'RAISE_CAPITAL_DONE' })
    expect(s.phase).toBe('payRent')
    expect(s.pendingObligation).toBeNull()
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
