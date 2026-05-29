import type { GameState, Player } from './types'
import { LOG_MAX_ENTRIES } from './constants'

export function appendLog(state: GameState, entry: string): string[] {
  return [entry, ...state.log].slice(0, LOG_MAX_ENTRIES)
}

export function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex]
}

export function updatePlayer(
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

export function solventPlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.solvent)
}

export function checkWinner(state: GameState): GameState {
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

export function nextPlayerIndex(state: GameState): number {
  let idx = (state.currentPlayerIndex + 1) % state.players.length
  while (!state.players[idx].solvent && idx !== state.currentPlayerIndex) {
    idx = (idx + 1) % state.players.length
  }
  return idx
}

export function transferCapital(
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
