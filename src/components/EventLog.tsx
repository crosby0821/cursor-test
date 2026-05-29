import { useGame } from '../context/GameContext'

export function EventLog() {
  const { state } = useGame()
  return (
    <div className="panel" style={{ marginTop: '1rem' }}>
      <h3>Event log</h3>
      <ul className="log">
        {state.log.length === 0 && <li>No events yet</li>}
        {state.log.map((entry, i) => (
          <li key={`${i}-${entry.slice(0, 12)}`}>{entry}</li>
        ))}
      </ul>
    </div>
  )
}
