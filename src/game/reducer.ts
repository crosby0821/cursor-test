import { getTile, isOwnableTile } from '../data/board'
import { initDecks } from './cards'
import { countPlayerBuildings } from './cards'
import {
  BOARD_SIZE,
  EXPOSURE_BUILD_COST,
  EXPOSURE_SELL_RETURN,
  JAIL_FINE,
  JAIL_POSITION,
  PLAYER_COLORS,
  STARTING_CAPITAL,
  UNMORTGAGE_MULTIPLIER,
} from './constants'
import { rollDice } from './dice'
import { createInitialState } from './initialState'
import { advanceToPosition, movePlayer } from './movement'
import {
  calcAdverseDevelopment,
  calcClaimsRent,
  calcMcrHint,
  canBuildExposure,
  findNearestRailroad,
  findNearestUtility,
  getOwnablePrice,
  initPropertyStates,
  ownsFullSegment,
  shouldAdverseDevelopment,
} from './property'
import type {
  GameAction,
  GameState,
  Player,
} from './types'
import { drawCard } from './cards'

function appendLog(state: GameState, entry: string): string[] {
  return [entry, ...state.log].slice(0, 5)
}

function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex]
}

function updatePlayer(
  state: GameState,
  playerId: string,
  patch: Partial<Player>
): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, ...patch } : p
    ),
  }
}

function solventPlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.solvent)
}

function checkWinner(state: GameState): GameState {
  const alive = solventPlayers(state)
  if (alive.length === 1 && state.started) {
    return {
      ...state,
      phase: 'gameOver',
      winnerId: alive[0].id,
      message: `${alive[0].name} wins — last solvent actuary!`,
    }
  }
  return state
}

function nextPlayerIndex(state: GameState): number {
  let idx = (state.currentPlayerIndex + 1) % state.players.length
  while (!state.players[idx].solvent && idx !== state.currentPlayerIndex) {
    idx = (idx + 1) % state.players.length
  }
  return idx
}

function transferCapital(
  state: GameState,
  fromId: string | null,
  toId: string | null,
  amount: number
): GameState {
  let s = state
  if (fromId) {
    const p = s.players.find((x) => x.id === fromId)!
    s = updatePlayer(s, fromId, { capital: p.capital - amount })
  }
  if (toId) {
    const p = s.players.find((x) => x.id === toId)!
    s = updatePlayer(s, toId, { capital: p.capital + amount })
  }
  return s
}

function sendToJail(state: GameState, playerId: string): GameState {
  let s = updatePlayer(state, playerId, {
    position: JAIL_POSITION,
    inJail: true,
    jailTurns: 0,
  })
  s = { ...s, consecutiveDoubles: 0, message: 'Sent to Regulatory Examination' }
  return s
}

function resolveLanding(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!
  const tile = getTile(player.position)
  let s: GameState = { ...state, message: `Landed on ${tile.name}` }

  if (tile.kind === 'gotojail') {
    return sendToJail(s, playerId)
  }

  if (tile.kind === 'tax') {
    if (player.capital < tile.amount) {
      return { ...s, phase: 'insolvency', message: `Cannot pay ${tile.name}` }
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

function endTurnIfNeeded(state: GameState, extraRoll: boolean): GameState {
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

function applyCardEffect(state: GameState): GameState {
  const pending = state.pendingCard
  if (!pending) return state
  const { card, playerId } = pending
  let s: GameState = { ...state, pendingCard: null }
  const player = s.players.find((p) => p.id === playerId)!

  switch (card.effect) {
    case 'collect': {
      s = updatePlayer(s, playerId, {
        capital: player.capital + (card.amount ?? 0),
      })
      break
    }
    case 'pay': {
      const amt = card.amount ?? 0
      if (player.capital < amt) return { ...s, phase: 'insolvency' }
      s = updatePlayer(s, playerId, { capital: player.capital - amt })
      break
    }
    case 'payEachPlayer': {
      const amt = card.amount ?? 0
      const others = s.players.filter((p) => p.solvent && p.id !== playerId)
      const total = amt * others.length
      if (player.capital < total) return { ...s, phase: 'insolvency' }
      s = updatePlayer(s, playerId, { capital: player.capital - total })
      for (const o of others) {
        s = updatePlayer(s, o.id, { capital: o.capital + amt })
      }
      break
    }
    case 'collectFromEach': {
      const amt = card.amount ?? 0
      for (const o of s.players) {
        if (!o.solvent || o.id === playerId) continue
        const pay = Math.min(amt, o.capital)
        s = transferCapital(s, o.id, playerId, pay)
      }
      break
    }
    case 'advance': {
      const target = card.spaces ?? 0
      const { player: moved, goPremium } = advanceToPosition(
        player,
        target,
        s
      )
      s = updatePlayer(s, playerId, {
        position: moved.position,
        capital: moved.capital + goPremium,
      })
      s = { ...s, log: appendLog(s, `${player.name} advanced to ${getTile(target).name}`) }
      return resolveLanding(s, playerId)
    }
    case 'advanceNearestRailroad': {
      const target = findNearestRailroad(player.position)
      const { player: moved, goPremium } = advanceToPosition(
        player,
        target,
        s
      )
      s = updatePlayer(s, playerId, {
        position: moved.position,
        capital: player.capital + goPremium,
      })
      return resolveLanding(s, playerId)
    }
    case 'advanceNearestUtility': {
      const target = findNearestUtility(player.position)
      const { player: moved, goPremium } = advanceToPosition(
        player,
        target,
        s
      )
      s = updatePlayer(s, playerId, {
        position: moved.position,
        capital: player.capital + goPremium,
      })
      return resolveLanding(s, playerId)
    }
    case 'goBack': {
      const pos = (player.position - (card.spaces ?? 3) + BOARD_SIZE) % BOARD_SIZE
      s = updatePlayer(s, playerId, { position: pos })
      return resolveLanding(s, playerId)
    }
    case 'goToJail':
      return endTurnIfNeeded(sendToJail(s, playerId), false)
    case 'getOutOfJail':
      s = updatePlayer(s, playerId, { jailFreeCards: player.jailFreeCards + 1 })
      break
    case 'repairs': {
      const { tiers } = countPlayerBuildings(s, playerId)
      const cost = tiers * (card.amount ?? 50)
      if (player.capital < cost) return { ...s, phase: 'insolvency' }
      s = updatePlayer(s, playerId, { capital: player.capital - cost })
      break
    }
    case 'assessment': {
      const { tiers, hotels, lines } = countPlayerBuildings(s, playerId)
      const perTier = card.amount ?? 25
      const cost = lines * perTier + tiers * perTier + hotels * (perTier * 4)
      if (player.capital < cost) return { ...s, phase: 'insolvency' }
      s = updatePlayer(s, playerId, { capital: player.capital - cost })
      break
    }
  }

  s = { ...s, log: appendLog(s, `Card: ${card.text}`) }
  return endTurnIfNeeded(s, false)
}

export function gameReducer(
  state: GameState,
  action: GameAction
): GameState {
  switch (action.type) {
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
          if (player.capital < JAIL_FINE) return { ...s, phase: 'insolvency' }
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
      if (player.capital < buy.price) return { ...state, phase: 'insolvency' }
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
        return { ...state, phase: 'insolvency' }
      }
      let s = transferCapital(state, player.id, rent.toPlayerId, rent.amount)
      const owner = s.players.find((p) => p.id === rent.toPlayerId)!
      const tile = getTile(rent.tileId)
      let shock = 0
      if (tile.kind === 'property') {
        if (shouldAdverseDevelopment(tile.lossRatioVolatility)) {
          shock = calcAdverseDevelopment(rent.amount)
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
      if (player.capital < EXPOSURE_BUILD_COST) return { ...state, phase: 'insolvency' }
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
      if (player.capital < cost) return { ...state, phase: 'insolvency' }
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
      if (player.capital >= 0) {
        if (state.pendingRent) return { ...state, phase: 'payRent' }
        if (state.pendingBuy) return { ...state, phase: 'buyPrompt' }
        return { ...state, phase: 'preRoll' }
      }
      return state
    }

    case 'DECLARE_INSOLVENT': {
      const player = currentPlayer(state)
      let s = updatePlayer(state, player.id, { solvent: false })
      s = { ...s, log: appendLog(s, `${player.name} is insolvent`) }
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
