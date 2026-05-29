import { getTile, isOwnableTile } from '../data/board'
import { initDecks } from './cards'
import {
  EXPOSURE_BUILD_COST,
  EXPOSURE_SELL_RETURN,
  JAIL_FINE,
  PLAYER_COLORS,
  STARTING_CAPITAL,
  UNMORTGAGE_MULTIPLIER,
} from './constants'
import { rollDice } from './dice'
import { createInitialState } from './initialState'
import { movePlayer } from './movement'
import {
  calcAdverseDevelopment,
  calcMcrHint,
  canBuildExposure,
  initPropertyStates,
  ownsFullSegment,
  shouldAdverseDevelopment,
} from './property'
import type { GameAction, GameState, Player } from './types'
import { applyCardEffect } from './applyCardEffect'
import {
  canAffordRequiredPayment,
  enterInsolvency,
  exitInsolvencyPhase,
} from './bankruptcy'
import { endTurnIfNeeded, resolveLanding, sendToJail } from './landing'
import {
  appendLog,
  checkWinner,
  currentPlayer,
  transferCapital,
  updatePlayer,
} from './stateHelpers'

export function gameReducer(
  state: GameState,
  action: GameAction
): GameState {
  switch (action.type) {
    case 'RESET_GAME':
      return createInitialState()

    case 'START_GAME': {
      const names = action.playerNames.slice(0, 4)
      if (names.length < 2) return state
      const decks = initDecks()
      const players: Player[] = names.map((name, i) => ({
        id: `p${i}`,
        name: name.trim() || `Actuary ${i + 1}`,
        color: PLAYER_COLORS[i],
        position: 0,
        capital: STARTING_CAPITAL,
        inJail: false,
        jailTurns: 0,
        jailFreeCards: 0,
        solvent: true,
        restructureUsed: false,
      }))
      return {
        ...createInitialState(),
        started: true,
        players,
        properties: initPropertyStates(),
        chanceDeck: decks.chanceDeck,
        chestDeck: decks.chestDeck,
        freeParkingPayout: action.freeParkingPayout ?? true,
        phase: 'preRoll',
        message: `${players[0].name}'s turn — roll the dice`,
      }
    }

    case 'ROLL_DICE': {
      if (state.phase !== 'preRoll' && state.phase !== 'buyPrompt') return state
      const player = currentPlayer(state)
      if (!player.solvent) return state

      if (player.inJail) {
        const dice = rollDice()
        let s: GameState = {
          ...state,
          lastDice: dice,
          log: appendLog(state, `${player.name} rolled ${dice.die1}+${dice.die2}`),
        }
        if (dice.isDoubles) {
          s = updatePlayer(s, player.id, { inJail: false, jailTurns: 0 })
          const move = movePlayer(
            s.players.find((p) => p.id === player.id)!,
            dice.total,
            s
          )
          const p = s.players.find((x) => x.id === player.id)!
          s = updatePlayer(s, player.id, {
            position: move.newPosition,
            capital: p.capital + move.goPremium,
          })
          return resolveLanding(s, player.id)
        }
        const turns = player.jailTurns + 1
        if (turns >= 3) {
          if (player.capital < JAIL_FINE) {
            return enterInsolvency(s, JAIL_FINE, 'Cannot pay compliance fee to leave examination')
          }
          s = updatePlayer(s, player.id, {
            inJail: false,
            jailTurns: 0,
            capital: player.capital - JAIL_FINE,
          })
          const move = movePlayer(
            s.players.find((p) => p.id === player.id)!,
            dice.total,
            s
          )
          const p2 = s.players.find((x) => x.id === player.id)!
          s = updatePlayer(s, player.id, {
            position: move.newPosition,
            capital: p2.capital + move.goPremium,
          })
          return resolveLanding(s, player.id)
        }
        return endTurnIfNeeded(
          updatePlayer(s, player.id, { jailTurns: turns }),
          false
        )
      }

      const dice = rollDice()
      let doubles = state.consecutiveDoubles
      if (dice.isDoubles) doubles++
      else doubles = 0

      if (doubles >= 3) {
        const jailed = sendToJail(
          { ...state, lastDice: dice, consecutiveDoubles: 0 },
          player.id
        )
        return endTurnIfNeeded(jailed, false)
      }

      const move = movePlayer(player, dice.total, state)
      let s = updatePlayer(state, player.id, {
        position: move.newPosition,
        capital: player.capital + move.goPremium,
      })
      s = {
        ...s,
        lastDice: dice,
        consecutiveDoubles: doubles,
        log: appendLog(
          s,
          `${player.name} rolled ${dice.die1}+${dice.die2}${move.passedGo ? `, collected $${move.goPremium} premium` : ''}`
        ),
        message: `Rolled ${dice.total}`,
      }
      return resolveLanding(s, player.id)
    }

    case 'BUY_PROPERTY': {
      const buy = state.pendingBuy
      if (!buy || state.phase !== 'buyPrompt') return state
      const player = currentPlayer(state)
      if (player.capital < buy.price) {
        return enterInsolvency(state, buy.price, `Cannot underwrite for $${buy.price}`)
      }
      const tile = getTile(buy.tileId)
      let s = updatePlayer(state, player.id, {
        capital: player.capital - buy.price,
      })
      s = {
        ...s,
        properties: {
          ...s.properties,
          [buy.tileId]: {
            ...s.properties[buy.tileId],
            ownerId: player.id,
          },
        },
        pendingBuy: null,
        log: appendLog(s, `${player.name} underwrote ${tile.name}`),
        phase: 'preRoll',
        message: `Underwrote ${tile.name}`,
      }
      const extra =
        state.lastDice?.isDoubles && state.consecutiveDoubles > 0 && state.consecutiveDoubles < 3
      return endTurnIfNeeded(s, Boolean(extra))
    }

    case 'DECLINE_BUY': {
      if (state.phase !== 'buyPrompt') return state
      const extra =
        state.lastDice?.isDoubles && state.consecutiveDoubles > 0 && state.consecutiveDoubles < 3
      return endTurnIfNeeded(
        { ...state, pendingBuy: null, phase: 'preRoll' },
        Boolean(extra)
      )
    }

    case 'PAY_RENT': {
      const rent = state.pendingRent
      if (!rent || state.phase !== 'payRent') return state
      const player = currentPlayer(state)
      if (player.capital < rent.amount) {
        return enterInsolvency(state, rent.amount, `Cannot pay $${rent.amount} claims`)
      }
      let s = transferCapital(state, player.id, rent.toPlayerId, rent.amount)
      const owner = s.players.find((p) => p.id === rent.toPlayerId)!
      const tile = getTile(rent.tileId)
      if (tile.kind === 'property') {
        if (shouldAdverseDevelopment(tile.lossRatioVolatility)) {
          const shock = calcAdverseDevelopment(rent.amount)
          if (owner.capital >= shock) {
            s = updatePlayer(s, rent.toPlayerId, {
              capital: owner.capital - shock,
            })
            s = {
              ...s,
              log: appendLog(
                s,
                `Adverse development: ${owner.name} strengthened reserves $${shock}`
              ),
            }
          }
        }
      }
      s = {
        ...s,
        pendingRent: null,
        pendingObligation: null,
        log: appendLog(s, `${player.name} paid $${rent.amount} — ${rent.description}`),
      }
      const extra =
        state.lastDice?.isDoubles && state.consecutiveDoubles > 0 && state.consecutiveDoubles < 3
      return endTurnIfNeeded(s, Boolean(extra))
    }

    case 'PAY_TAX':
      return state

    case 'RESOLVE_CARD':
      return applyCardEffect(state)

    case 'BUILD_EXPOSURE': {
      const player = currentPlayer(state)
      if (!canBuildExposure(state, player.id, action.tileId)) return state
      if (player.capital < EXPOSURE_BUILD_COST) {
        return enterInsolvency(state, EXPOSURE_BUILD_COST, 'Cannot afford exposure build')
      }
      const ps = state.properties[action.tileId]
      let s = updatePlayer(state, player.id, {
        capital: player.capital - EXPOSURE_BUILD_COST,
      })
      s = {
        ...s,
        properties: {
          ...s.properties,
          [action.tileId]: { ...ps, exposureTier: ps.exposureTier + 1 },
        },
        log: appendLog(s, `${player.name} increased exposure on ${getTile(action.tileId).name}`),
      }
      return s
    }

    case 'SELL_EXPOSURE': {
      const player = currentPlayer(state)
      const ps = state.properties[action.tileId]
      if (ps?.ownerId !== player.id || ps.exposureTier <= 0) return state
      let s = updatePlayer(state, player.id, {
        capital: player.capital + EXPOSURE_SELL_RETURN,
      })
      s = {
        ...s,
        properties: {
          ...s.properties,
          [action.tileId]: { ...ps, exposureTier: ps.exposureTier - 1 },
        },
      }
      return s
    }

    case 'MORTGAGE': {
      const player = currentPlayer(state)
      const ps = state.properties[action.tileId]
      const tile = getTile(action.tileId)
      if (!ps || ps.ownerId !== player.id || ps.mortgaged) return state
      if (!isOwnableTile(tile)) return state
      if (ps.exposureTier > 0) return state
      const value = Math.floor(tile.price * 0.5)
      let s = updatePlayer(state, player.id, { capital: player.capital + value })
      s = {
        ...s,
        properties: {
          ...s.properties,
          [action.tileId]: { ...ps, mortgaged: true },
        },
        log: appendLog(s, `${player.name} ceded ${tile.name} for $${value}`),
      }
      return s
    }

    case 'UNMORTGAGE': {
      const player = currentPlayer(state)
      const ps = state.properties[action.tileId]
      const tile = getTile(action.tileId)
      if (!ps || ps.ownerId !== player.id || !ps.mortgaged) return state
      if (!isOwnableTile(tile)) return state
      const cost = Math.floor(tile.price * 0.5 * UNMORTGAGE_MULTIPLIER)
      if (player.capital < cost) {
        return enterInsolvency(state, cost, `Cannot recover ceded line for $${cost}`)
      }
      let s = updatePlayer(state, player.id, { capital: player.capital - cost })
      s = {
        ...s,
        properties: {
          ...s.properties,
          [action.tileId]: { ...ps, mortgaged: false },
        },
      }
      return s
    }

    case 'PAY_JAIL_FINE': {
      const player = currentPlayer(state)
      if (!player.inJail || player.capital < JAIL_FINE) return state
      return updatePlayer(state, player.id, {
        capital: player.capital - JAIL_FINE,
        inJail: false,
        jailTurns: 0,
      })
    }

    case 'USE_JAIL_CARD': {
      const player = currentPlayer(state)
      if (!player.inJail || player.jailFreeCards < 1) return state
      return updatePlayer(state, player.id, {
        jailFreeCards: player.jailFreeCards - 1,
        inJail: false,
        jailTurns: 0,
      })
    }

    case 'END_TURN':
      return endTurnIfNeeded(
        { ...state, pendingBuy: null, pendingRent: null },
        false
      )

    case 'RAISE_CAPITAL_DONE': {
      const player = currentPlayer(state)
      if (state.phase !== 'insolvency') return state

      if (canAffordRequiredPayment(state, player.capital)) {
        return exitInsolvencyPhase(state)
      }

      if (!player.restructureUsed) {
        return {
          ...updatePlayer(state, player.id, { restructureUsed: true }),
          message:
            'Restructure attempt used. Liquidate more assets or declare insolvent.',
        }
      }

      return {
        ...state,
        message: 'Insufficient capital. Declare insolvent to continue.',
      }
    }

    case 'DECLARE_INSOLVENT': {
      const player = currentPlayer(state)
      let s = updatePlayer(state, player.id, { solvent: false })
      s = {
        ...s,
        pendingObligation: null,
        log: appendLog(s, `${player.name} is insolvent`),
      }
      return endTurnIfNeeded(checkWinner(s), false)
    }

    case 'SELL_ASSETS_TO_BANK': {
      const player = currentPlayer(state)
      const ps = state.properties[action.tileId]
      if (ps?.ownerId !== player.id) return state
      const tile = getTile(action.tileId)
      if (!isOwnableTile(tile)) return state
      let value = Math.floor(tile.price * 0.5)
      if (ps.exposureTier > 0 && tile.kind === 'property') {
        value += ps.exposureTier * EXPOSURE_SELL_RETURN
      }
      let s = updatePlayer(state, player.id, { capital: player.capital + value })
      s = {
        ...s,
        properties: {
          ...s.properties,
          [action.tileId]: { ownerId: null, exposureTier: 0, mortgaged: false },
        },
      }
      return s
    }

    default:
      return state
  }
}

export { createInitialState, calcMcrHint, currentPlayer, ownsFullSegment }
