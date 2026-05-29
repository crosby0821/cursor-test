import { Board } from './components/Board'
import { CardModal } from './components/CardModal'
import { EventLog } from './components/EventLog'
import { Lobby } from './components/Lobby'
import { PlayerPanel } from './components/PlayerPanel'
import { GameProvider, useGame, useGameDispatch } from './context/GameContext'
import { BOARD_TILES } from './data/board'
import './styles/game.css'

function GameOverBanner() {
  const { state } = useGame()
  const dispatch = useGameDispatch()

  if (state.phase !== 'gameOver' || !state.winnerId) return null

  const winner = state.players.find((p) => p.id === state.winnerId)

  return (
    <div className="winner-banner">
      <h2>{winner?.name} wins!</h2>
      <p>Last solvent actuary standing.</p>
      <div className="game-over-stats">
        {state.players.map((p) => {
          const linesOwned = BOARD_TILES.filter(
            (t) => state.properties[t.id]?.ownerId === p.id
          ).length
          return (
            <div key={p.id} className="stat">
              <span
                className="dot"
                style={{ background: p.color, marginRight: '0.35rem' }}
              />
              {p.name}: ${p.capital}
              {linesOwned > 0 && ` · ${linesOwned} line${linesOwned === 1 ? '' : 's'}`}
              {!p.solvent && ' (insolvent)'}
            </div>
          )
        })}
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: '1rem' }}
        onClick={() => dispatch({ type: 'RESET_GAME' })}
      >
        New session
      </button>
    </div>
  )
}

function GameScreen() {
  const { state } = useGame()

  if (!state.started) {
    return <Lobby />
  }

  return (
    <>
      <GameOverBanner />
      <div className="game-layout">
        <div>
          <Board />
          <EventLog />
        </div>
        <PlayerPanel />
      </div>
      <CardModal />
    </>
  )
}

export default function App() {
  return (
    <GameProvider>
      <div className="app">
        <header className="app-header">
          <h1>Actuarialopoly</h1>
          <p>
            Actuarial-themed board game inspired by classic property games
          </p>
        </header>
        <GameScreen />
      </div>
    </GameProvider>
  )
}
