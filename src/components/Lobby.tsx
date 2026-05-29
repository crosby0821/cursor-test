import { useState } from 'react'
import { useGameDispatch } from '../context/GameContext'

export function Lobby() {
  const dispatch = useGameDispatch()
  const [count, setCount] = useState(2)
  const [names, setNames] = useState(['Actuary 1', 'Actuary 2', 'Actuary 3', 'Actuary 4'])
  const [freeParkingPayout, setFreeParkingPayout] = useState(true)

  const start = () => {
    dispatch({
      type: 'START_GAME',
      playerNames: names.slice(0, count),
      freeParkingPayout,
    })
  }

  return (
    <div className="lobby">
      <h2>Start a session</h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
        Local pass-and-play for 2–4 actuaries. Each player starts with $1,500
        capital.
      </p>
      <label htmlFor="player-count">Number of players</label>
      <select
        id="player-count"
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
      >
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value={4}>4</option>
      </select>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <label htmlFor={`name-${i}`}>Player {i + 1} name</label>
          <input
            id={`name-${i}`}
            value={names[i]}
            onChange={(e) => {
              const next = [...names]
              next[i] = e.target.value
              setNames(next)
            }}
          />
        </div>
      ))}
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={freeParkingPayout}
          onChange={(e) => setFreeParkingPayout(e.target.checked)}
        />
        Reserve Release Pool payout (taxes collected go to landing player)
      </label>
      <button
        className="btn btn-primary"
        style={{ marginTop: '1.5rem', width: '100%' }}
        onClick={start}
      >
        Begin underwriting
      </button>
    </div>
  )
}
