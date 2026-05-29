import { BOARD_TILES } from '../data/board'
import { useGame } from '../context/GameContext'
import { BoardTileView, getTileGridStyle } from './BoardTile'

export function Board() {
  const { state } = useGame()
  const current = state.players[state.currentPlayerIndex]

  return (
    <div className="board-wrapper">
      <div className="board">
        {BOARD_TILES.map((tile) => {
          const style = getTileGridStyle(tile.id)
          return (
            <div
              key={tile.id}
              style={{
                gridColumn: style.gridColumn,
                gridRow: style.gridRow,
              }}
            >
              <BoardTileView
                tileId={tile.id}
                state={state}
                isActive={current?.position === tile.id}
              />
            </div>
          )
        })}
        <div className="board-center">
          <h2>Actuarialopoly</h2>
          {state.lastDice && (
            <div className="dice-display">
              {state.lastDice.die1} + {state.lastDice.die2} ={' '}
              {state.lastDice.total}
              {state.lastDice.isDoubles && ' (doubles)'}
            </div>
          )}
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>
            Pool: ${state.freeParkingPool}
          </p>
        </div>
      </div>
    </div>
  )
}
