import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { createInitialState, gameReducer } from '../game/reducer'
import type { GameAction, GameState } from '../game/types'

interface GameContextValue {
  state: GameState
  dispatch: (action: GameAction) => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)

  const value = useMemo(
    () => ({
      state,
      dispatch: dispatch as (action: GameAction) => void,
    }),
    [state]
  )

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}

export function useGameDispatch() {
  const { dispatch } = useGame()
  return useCallback((action: GameAction) => dispatch(action), [dispatch])
}
