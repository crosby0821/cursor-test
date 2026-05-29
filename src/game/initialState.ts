import type { GameState } from './types'
import { initPropertyStates } from './property'
import { initDecks } from './cards'

export function createInitialState(): GameState {
  const decks = initDecks()
  return {
    started: false,
    players: [],
    currentPlayerIndex: 0,
    phase: 'preRoll',
    properties: initPropertyStates(),
    chanceDeck: decks.chanceDeck,
    chestDeck: decks.chestDeck,
    consecutiveDoubles: 0,
    lastDice: null,
    pendingRent: null,
    pendingBuy: null,
    pendingCard: null,
    pendingObligation: null,
    freeParkingPool: 0,
    freeParkingPayout: true,
    log: [],
    winnerId: null,
    message: 'Welcome to Actuarialopoly',
  }
}
