import { getTile, isOwnableTile } from '../data/board'
import { JAIL_POSITION } from './constants'
import { drawCard } from './cards'
import { calcClaimsRent, getOwnablePrice } from './property'
import {
  appendLog,
  checkWinner,
  nextPlayerIndex,
  transferCapital,
  updatePlayer,
} from './stateHelpers'
import type { GameState } from './types'
import { enterInsolvency } from './bankruptcy'

export function sendToJail(state: GameState, playerId: string): GameState {
  let s = updatePlayer(state, playerId, {
    position: JAIL_POSITION,
    inJail: true,
    jailTurns: 0,
  })
  s = { ...s, consecutiveDoubles: 0, message: 'Sent to Regulatory Examination' }
  return s
}

export function resolveLanding(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!
  const tile = getTile(player.position)
  let s: GameState = { ...state, message: `Landed on ${tile.name}` }

  if (tile.kind === 'gotojail') {
    return sendToJail(s, playerId)
  }

  if (tile.kind === 'tax') {
    if (player.capital < tile.amount) {
      return enterInsolvency(s, tile.amount, `Cannot pay ${tile.name}`)
    }
    s = transferCapital(s, playerId, null, tile.amount)
    s = {
      ...s,
      freeParkingPool: s.freeParkingPool + tile.amount,
      log: appendLog(s, `${player.name} paid $${tile.amount} — ${tile.name}`),
      phase: 'preRoll',
      message: `Paid $${tile.amount}`,
    }
    return endTurnIfNeeded(s, false)
  }

  if (tile.kind === 'freetax') {
    return endTurnIfNeeded(
      { ...s, message: 'No action — actuarial holiday' },
      false
    )
  }

  if (tile.kind === 'parking') {
    if (s.freeParkingPayout && s.freeParkingPool > 0) {
      const pool = s.freeParkingPool
      s = updatePlayer(s, playerId, { capital: player.capital + pool })
      s = {
        ...s,
        freeParkingPool: 0,
        log: appendLog(
          s,
          `${player.name} collected $${pool} from Reserve Release Pool`
        ),
        message: `Collected $${pool} from Reserve Release Pool`,
      }
    }
    return endTurnIfNeeded(s, false)
  }

  if (tile.kind === 'chance' || tile.kind === 'chest') {
    const deck = tile.kind === 'chance' ? 'chance' : 'chest'
    const drawn = drawCard(s, deck)
    s = { ...s, chanceDeck: drawn.chanceDeck, chestDeck: drawn.chestDeck }
    return {
      ...s,
      phase: 'cardReveal',
      pendingCard: { card: drawn.card, playerId },
      message: drawn.card.text,
    }
  }

  if (isOwnableTile(tile)) {
    const ps = s.properties[tile.id]
    if (!ps?.ownerId) {
      return {
        ...s,
        phase: 'buyPrompt',
        pendingBuy: { tileId: tile.id, price: getOwnablePrice(tile) },
        message: `Underwrite ${tile.name} for $${getOwnablePrice(tile)}?`,
      }
    }
    if (ps.ownerId === playerId || ps.mortgaged) {
      return endTurnIfNeeded(s, false)
    }
    const rent = calcClaimsRent(s, tile.id, s.lastDice)
    return {
      ...s,
      phase: 'payRent',
      pendingRent: {
        amount: rent,
        toPlayerId: ps.ownerId,
        tileId: tile.id,
        description: `Claims on ${tile.name}`,
      },
      message: `Pay $${rent} claims to ${s.players.find((p) => p.id === ps.ownerId)?.name}`,
    }
  }

  return endTurnIfNeeded(s, false)
}

export function endTurnIfNeeded(state: GameState, extraRoll: boolean): GameState {
  if (extraRoll && state.lastDice?.isDoubles && state.consecutiveDoubles < 3) {
    return {
      ...state,
      phase: 'preRoll',
      message: 'Doubles — roll again!',
    }
  }
  const idx = nextPlayerIndex(state)
  return checkWinner({
    ...state,
    currentPlayerIndex: idx,
    phase: state.phase === 'gameOver' ? 'gameOver' : 'preRoll',
    consecutiveDoubles: 0,
    lastDice: extraRoll ? state.lastDice : null,
    pendingBuy: null,
    pendingRent: null,
    message: `${state.players[idx].name}'s turn`,
  })
}
