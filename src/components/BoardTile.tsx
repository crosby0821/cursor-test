import { BOARD_TILES } from '../data/board'
import { SEGMENT_COLORS } from '../game/constants'
import type { GameState } from '../game/types'
import type { BoardTile as TileType } from '../game/types'

function getSegmentColor(tile: TileType): string | undefined {
  if (tile.kind === 'property') return SEGMENT_COLORS[tile.segment]
  return undefined
}

interface Props {
  tileId: number
  state: GameState
  isActive: boolean
}

export function BoardTileView({ tileId, state, isActive }: Props) {
  const tile = BOARD_TILES[tileId]
  const ps = state.properties[tileId]
  const playersHere = state.players.filter(
    (p) => p.solvent && p.position === tileId
  )
  const owner = ps?.ownerId
    ? state.players.find((p) => p.id === ps.ownerId)
    : null
  const segColor = getSegmentColor(tile)

  let price = ''
  if (
    tile.kind === 'property' ||
    tile.kind === 'railroad' ||
    tile.kind === 'utility'
  ) {
    price = `$${tile.price}`
  }

  return (
    <div
      className={`tile ${isActive ? 'active' : ''}`}
      title={tile.name}
      data-tile-id={tileId}
    >
      {segColor && (
        <div
          className="tile-color-bar"
          style={{ background: segColor }}
        />
      )}
      <div className="tile-name">{tile.name}</div>
      {price && <div className="tile-price">{price}</div>}
      {ps && ps.exposureTier > 0 && (
        <div className="tile-price">Tier {ps.exposureTier}</div>
      )}
      {ps?.mortgaged && <div className="tile-price">Ceded</div>}
      <div className="owners">
        {owner && (
          <span
            className="player-token"
            style={{ background: owner.color }}
            title={owner.name}
          />
        )}
        {playersHere.map((p) => (
          <span
            key={p.id}
            className="player-token"
            style={{ background: p.color, outline: '2px solid white' }}
            title={p.name}
          />
        ))}
      </div>
    </div>
  )
}

export function getTileGridStyle(
  tileId: number
): { gridColumn: number; gridRow: number } {
  if (tileId === 20) return { gridColumn: 1, gridRow: 1 }
  if (tileId === 30) return { gridColumn: 11, gridRow: 1 }
  if (tileId === 0) return { gridColumn: 11, gridRow: 11 }
  if (tileId === 10) return { gridColumn: 1, gridRow: 11 }
  if (tileId >= 21 && tileId <= 29) {
    return { gridColumn: tileId - 19, gridRow: 1 }
  }
  if (tileId >= 31 && tileId <= 39) {
    return { gridColumn: 11, gridRow: tileId - 29 }
  }
  if (tileId >= 11 && tileId <= 19) {
    return { gridColumn: 1, gridRow: 21 - tileId }
  }
  if (tileId >= 1 && tileId <= 9) {
    return { gridColumn: 11 - tileId, gridRow: 11 }
  }
  return { gridColumn: 1, gridRow: 1 }
}
