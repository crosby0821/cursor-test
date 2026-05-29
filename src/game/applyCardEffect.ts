import { getTile } from '../data/board'
import { advanceToPosition } from './movement'
import {
  findNearestRailroad,
  findNearestUtility,
} from './property'
import { enterInsolvency } from './bankruptcy'
import { endTurnIfNeeded, resolveLanding, sendToJail } from './landing'
import {
  appendLog,
  transferCapital,
  updatePlayer,
} from './stateHelpers'
import type { GameState } from './types'
import {
  calcAssessmentCost,
  calcCollectAmount,
  calcGoBackPosition,
  calcPayAmount,
  calcPayEachPlayerTotal,
  calcRepairsCost,
} from './cardEffects'

export function applyCardEffect(state: GameState): GameState {
  const pending = state.pendingCard
  if (!pending) return state
  const { card, playerId } = pending
  let s: GameState = { ...state, pendingCard: null }
  const player = s.players.find((p) => p.id === playerId)!

  switch (card.effect) {
    case 'collect': {
      s = updatePlayer(s, playerId, {
        capital: player.capital + calcCollectAmount(card),
      })
      break
    }
    case 'pay': {
      const amt = calcPayAmount(card)
      if (player.capital < amt) {
        return enterInsolvency(s, amt, `Cannot pay $${amt} from card`)
      }
      s = updatePlayer(s, playerId, { capital: player.capital - amt })
      break
    }
    case 'payEachPlayer': {
      const others = s.players.filter((p) => p.solvent && p.id !== playerId)
      const total = calcPayEachPlayerTotal(card, others.length)
      if (player.capital < total) {
        return enterInsolvency(s, total, `Cannot pay $${total} to other players`)
      }
      s = updatePlayer(s, playerId, { capital: player.capital - total })
      const eachPay = calcPayAmount(card)
      for (const o of others) {
        s = updatePlayer(s, o.id, { capital: o.capital + eachPay })
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
      const { goPremium } = advanceToPosition(player, target, s)
      s = updatePlayer(s, playerId, {
        position: target,
        capital: player.capital + goPremium,
      })
      return resolveLanding(s, playerId)
    }
    case 'advanceNearestUtility': {
      const target = findNearestUtility(player.position)
      const { goPremium } = advanceToPosition(player, target, s)
      s = updatePlayer(s, playerId, {
        position: target,
        capital: player.capital + goPremium,
      })
      return resolveLanding(s, playerId)
    }
    case 'goBack': {
      const pos = calcGoBackPosition(player.position, card.spaces ?? 3)
      s = updatePlayer(s, playerId, { position: pos })
      return resolveLanding(s, playerId)
    }
    case 'goToJail':
      return endTurnIfNeeded(sendToJail(s, playerId), false)
    case 'getOutOfJail':
      s = updatePlayer(s, playerId, { jailFreeCards: player.jailFreeCards + 1 })
      break
    case 'repairs': {
      const cost = calcRepairsCost(s, playerId, card.amount ?? 50)
      if (player.capital < cost) {
        return enterInsolvency(s, cost, `Cannot pay $${cost} for repairs`)
      }
      s = updatePlayer(s, playerId, { capital: player.capital - cost })
      break
    }
    case 'assessment': {
      const cost = calcAssessmentCost(s, playerId, card.amount ?? 25)
      if (player.capital < cost) {
        return enterInsolvency(s, cost, `Cannot pay $${cost} assessment`)
      }
      s = updatePlayer(s, playerId, { capital: player.capital - cost })
      break
    }
  }

  s = { ...s, log: appendLog(s, `Card: ${card.text}`) }
  return endTurnIfNeeded(s, false)
}
