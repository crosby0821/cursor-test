import type { DiceRoll } from './types'

export function rollDice(rng: () => number = Math.random): DiceRoll {
  const die1 = Math.floor(rng() * 6) + 1
  const die2 = Math.floor(rng() * 6) + 1
  return {
    die1,
    die2,
    total: die1 + die2,
    isDoubles: die1 === die2,
  }
}
