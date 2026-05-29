import { Board } from './components/Board'
import { CardModal } from './components/CardModal'
import { EventLog } from './components/EventLog'
import { Lobby } from './components/Lobby'
import { PlayerPanel } from './components/PlayerPanel'
import { GameProvider, useGame } from './context/GameContext'
import './styles/game.css'

function GameScreen() {
  const { state } = useGame()

  if (!state.started) {
    return <Lobby />
  }

  return (
    <>
      {state.phase === 'gameOver' && state.winnerId && (
        <div className="winner-banner">
          <h2>
            {state.players.find((p) => p.id === state.winnerId)?.name} wins!
          </h2>
          <p>Last solvent actuary standing.</p>
        </div>
      )}
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
