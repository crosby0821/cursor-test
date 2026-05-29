import { useGame, useGameDispatch } from '../context/GameContext'

export function CardModal() {
  const { state } = useGame()
  const dispatch = useGameDispatch()
  if (state.phase !== 'cardReveal' || !state.pendingCard) return null

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>
          {state.pendingCard.card.deck === 'chance'
            ? 'Stochastic event'
            : 'Industry event'}
        </h3>
        <p>{state.pendingCard.card.text}</p>
        <button
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => dispatch({ type: 'RESOLVE_CARD' })}
        >
          Resolve card
        </button>
      </div>
    </div>
  )
}
