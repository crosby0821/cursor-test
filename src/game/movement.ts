import { BOARD_SIZE, GO_POSITION } from './constants'
import { calcGoPremium } from './property'
import type { GameState, Player } from './types'

export interface MoveResult {
  newPosition: number
  passedGo: boolean
  goPremium: number
}

export function movePlayer(
  player: Player,
  spaces: number,
  state: GameState
): MoveResult {
  const oldPos = player.position
  const newPosition = (oldPos + spaces) % BOARD_SIZE
  const passedGo = oldPos + spaces >= BOARD_SIZE
  const goPremium = passedGo ? calcGoPremium(state, player.id) : 0
  return { newPosition, passedGo, goPremium }
}

export function setPlayerPosition(player: Player, position: number): Player {
  return { ...player, position }
}

export function advanceToPosition(
  player: Player,
  target: number,
  state: GameState
): { player: Player; goPremium: number } {
  if (target === player.position) {
    return { player, goPremium: 0 }
  }
  const passedGo =
    target < player.position || (target === GO_POSITION && player.position > 0)
  const goPremium =
    passedGo || target === GO_POSITION
      ? calcGoPremium(state, player.id)
      : 0
  return {
    player: { ...player, position: target },
    goPremium,
  }
}
