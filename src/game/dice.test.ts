import { describe, it, expect } from 'vitest'
import { rollDice } from './dice'

describe('rollDice', () => {
  it('uses injected rng', () => {
    let i = 0
    const rng = () => {
      const vals = [0, 0.999, 0.5, 0.999]
      return vals[i++ % vals.length]
    }
    const roll = rollDice(rng)
    expect(roll.die1).toBeGreaterThanOrEqual(1)
    expect(roll.die1).toBeLessThanOrEqual(6)
    expect(roll.total).toBe(roll.die1 + roll.die2)
  })
})
