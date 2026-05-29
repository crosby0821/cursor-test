import { useGame } from '../context/GameContext'

export function CardModal() {
  const { state } = useGame()
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
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          Click &quot;Resolve card&quot; in the panel when ready.
        </p>
      </div>
    </div>
  )
}
