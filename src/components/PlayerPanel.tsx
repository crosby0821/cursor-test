import { BOARD_TILES } from '../data/board'
import { calcMcrHint } from '../game/property'
import { canBuildExposure } from '../game/property'
import { canManageAssets, canRoll, isActiveTurn } from '../game/turn'
import { useGame, useGameDispatch } from '../context/GameContext'
import { getTile } from '../data/board'

function requiredPayment(state: ReturnType<typeof useGame>['state']): number | null {
  if (state.pendingRent) return state.pendingRent.amount
  if (state.pendingBuy) return state.pendingBuy.price
  if (state.pendingObligation != null) return state.pendingObligation
  return null
}

export function PlayerPanel() {
  const { state } = useGame()
  const dispatch = useGameDispatch()
  const current = state.players[state.currentPlayerIndex]
  const activeTurn = isActiveTurn(state)
  const canManage = canManageAssets(state)
  const owed = requiredPayment(state)

  const ownedTiles = BOARD_TILES.filter((t) => {
    const ps = state.properties[t.id]
    return ps?.ownerId === current?.id
  })

  return (
    <div className="panel">
      <h3>Current actuary</h3>
      {current && (
        <>
          <div className="player-list-item">
            <span
              className="dot"
              style={{ background: current.color }}
            />
            <strong>{current.name}</strong>
            {activeTurn && state.phase !== 'gameOver' && (
              <span style={{ marginLeft: '0.5rem', color: 'var(--accent2)' }}>
                (your turn)
              </span>
            )}
          </div>
          <div className="stat">
            <span>Capital:</span> ${current.capital}
          </div>
          <div className="stat">
            <span>MCR hint:</span> ${calcMcrHint(state, current)}
          </div>
          <div className="stat">
            <span>Position:</span>{' '}
            {getTile(current.position).name}
          </div>
          {current.inJail && (
            <div className="stat" style={{ color: '#f59e0b' }}>
              In Regulatory Examination ({current.jailTurns}/3 turns)
            </div>
          )}
        </>
      )}

      {activeTurn && state.phase !== 'gameOver' && current && (
        <div className="handoff-cue">
          Pass device to <strong>{current.name}</strong>
        </div>
      )}

      <div className="message-box">{state.message}</div>

      <div className="actions">
        {activeTurn && canRoll(state.phase) && !current?.inJail && (
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'ROLL_DICE' })}>
            Roll dice
          </button>
        )}
        {activeTurn && current?.inJail && canRoll(state.phase) && (
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'ROLL_DICE' })}>
            Roll for doubles
          </button>
        )}
        {activeTurn && state.phase === 'buyPrompt' && state.pendingBuy && (
          <>
            <button
              className="btn btn-primary"
              onClick={() => dispatch({ type: 'BUY_PROPERTY' })}
            >
              Underwrite (${state.pendingBuy.price})
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'DECLINE_BUY' })}
            >
              Pass
            </button>
          </>
        )}
        {activeTurn && state.phase === 'payRent' && (
          <button
            className="btn btn-primary"
            onClick={() => dispatch({ type: 'PAY_RENT' })}
          >
            Pay claims (${state.pendingRent?.amount})
          </button>
        )}
        {activeTurn && state.phase === 'cardReveal' && (
          <button
            className="btn btn-primary"
            onClick={() => dispatch({ type: 'RESOLVE_CARD' })}
          >
            Resolve card
          </button>
        )}
        {activeTurn && state.phase === 'insolvency' && (
          <>
            {owed != null && (
              <div className="stat" style={{ color: '#f59e0b' }}>
                Required: ${owed}
              </div>
            )}
            {!current?.restructureUsed && (
              <button
                className="btn btn-secondary"
                onClick={() => dispatch({ type: 'RAISE_CAPITAL_DONE' })}
              >
                Try pay again
              </button>
            )}
            <button
              className="btn btn-danger"
              onClick={() => dispatch({ type: 'DECLARE_INSOLVENT' })}
            >
              Declare insolvent
            </button>
          </>
        )}
        {activeTurn && current?.inJail && canRoll(state.phase) && (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'PAY_JAIL_FINE' })}
            >
              Pay $50 compliance fee
            </button>
            {current.jailFreeCards > 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => dispatch({ type: 'USE_JAIL_CARD' })}
              >
                Use Actuarial Opinion
              </button>
            )}
          </>
        )}
        {activeTurn &&
          (state.phase === 'preRoll' || state.phase === 'buyPrompt') &&
          state.lastDice &&
          !state.lastDice.isDoubles && (
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'END_TURN' })}
            >
              End turn
            </button>
          )}
      </div>

      {current && ownedTiles.length > 0 && (
        <>
          <h3 style={{ marginTop: '1rem' }}>Your lines</h3>
          <ul className="log">
            {ownedTiles.map((t) => {
              const ps = state.properties[t.id]!
              const canBuild =
                canManage &&
                t.kind === 'property' &&
                canBuildExposure(state, current.id, t.id)
              return (
                <li key={t.id}>
                  {t.name}
                  {ps.exposureTier > 0 && ` (T${ps.exposureTier})`}
                  {ps.mortgaged && ' [ceded]'}
                  {canManage && (
                    <div className="actions">
                      {canBuild && (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                          onClick={() =>
                            dispatch({
                              type: 'BUILD_EXPOSURE',
                              tileId: t.id,
                            })
                          }
                        >
                          +Exposure $50
                        </button>
                      )}
                      {ps.exposureTier > 0 && (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                          onClick={() =>
                            dispatch({
                              type: 'SELL_EXPOSURE',
                              tileId: t.id,
                            })
                          }
                        >
                          Sell tier
                        </button>
                      )}
                      {!ps.mortgaged && ps.exposureTier === 0 && (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                          onClick={() =>
                            dispatch({ type: 'MORTGAGE', tileId: t.id })
                          }
                        >
                          Cede
                        </button>
                      )}
                      {ps.mortgaged && (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                          onClick={() =>
                            dispatch({ type: 'UNMORTGAGE', tileId: t.id })
                          }
                        >
                          Recover
                        </button>
                      )}
                      {state.phase === 'insolvency' && activeTurn && (
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                          onClick={() =>
                            dispatch({
                              type: 'SELL_ASSETS_TO_BANK',
                              tileId: t.id,
                            })
                          }
                        >
                          Liquidate
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      <h3 style={{ marginTop: '1rem' }}>All players</h3>
      {state.players.map((p) => (
        <div
          key={p.id}
          className="player-list-item"
          style={{ opacity: p.solvent ? 1 : 0.4 }}
        >
          <span className="dot" style={{ background: p.color }} />
          {p.name}: ${p.capital}
          {!p.solvent && ' (insolvent)'}
          {p.id === current?.id && ' *'}
        </div>
      ))}
    </div>
  )
}
