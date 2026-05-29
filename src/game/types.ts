export type LossRatioVolatility = 'low' | 'medium' | 'high'

export type TileKind =
  | 'go'
  | 'property'
  | 'railroad'
  | 'utility'
  | 'tax'
  | 'chance'
  | 'chest'
  | 'jail'
  | 'gotojail'
  | 'parking'
  | 'freetax'

export type SegmentColor =
  | 'brown'
  | 'lightblue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'darkblue'

export interface BaseTile {
  id: number
  name: string
  kind: TileKind
}

export interface PropertyTile extends BaseTile {
  kind: 'property'
  segment: SegmentColor
  groupId: string
  price: number
  rent: [number, number, number, number, number, number]
  lossRatioVolatility: LossRatioVolatility
}

export interface RailroadTile extends BaseTile {
  kind: 'railroad'
  price: number
}

export interface UtilityTile extends BaseTile {
  kind: 'utility'
  price: number
  utilityIndex: 0 | 1
}

export interface TaxTile extends BaseTile {
  kind: 'tax'
  amount: number
}

export interface SimpleTile extends BaseTile {
  kind: 'go' | 'chance' | 'chest' | 'jail' | 'gotojail' | 'parking' | 'freetax'
}

export type BoardTile =
  | PropertyTile
  | RailroadTile
  | UtilityTile
  | TaxTile
  | SimpleTile

export interface PropertyState {
  ownerId: string | null
  exposureTier: number
  mortgaged: boolean
}

export interface Player {
  id: string
  name: string
  color: string
  position: number
  capital: number
  inJail: boolean
  jailTurns: number
  jailFreeCards: number
  solvent: boolean
  restructureUsed: boolean
}

export type GamePhase =
  | 'preRoll'
  | 'buyPrompt'
  | 'payRent'
  | 'cardReveal'
  | 'insolvency'
  | 'gameOver'

export type CardEffectType =
  | 'collect'
  | 'pay'
  | 'payEachPlayer'
  | 'collectFromEach'
  | 'advance'
  | 'advanceNearestRailroad'
  | 'advanceNearestUtility'
  | 'goBack'
  | 'goToJail'
  | 'getOutOfJail'
  | 'repairs'
  | 'assessment'

export interface CardDefinition {
  id: string
  deck: 'chance' | 'chest'
  text: string
  effect: CardEffectType
  amount?: number
  spaces?: number
}

export interface CardInstance extends CardDefinition {
  instanceId: string
}

export interface PendingCard {
  card: CardInstance
  playerId: string
}

export interface DiceRoll {
  die1: number
  die2: number
  total: number
  isDoubles: boolean
}

export interface GameState {
  started: boolean
  players: Player[]
  currentPlayerIndex: number
  phase: GamePhase
  properties: Record<number, PropertyState>
  chanceDeck: CardInstance[]
  chestDeck: CardInstance[]
  consecutiveDoubles: number
  lastDice: DiceRoll | null
  pendingRent: { amount: number; toPlayerId: string; tileId: number; description: string } | null
  pendingBuy: { tileId: number; price: number } | null
  pendingCard: PendingCard | null
  freeParkingPool: number
  log: string[]
  winnerId: string | null
  message: string
}

export type GameAction =
  | { type: 'START_GAME'; playerNames: string[] }
  | { type: 'ROLL_DICE' }
  | { type: 'BUY_PROPERTY' }
  | { type: 'DECLINE_BUY' }
  | { type: 'PAY_RENT' }
  | { type: 'PAY_TAX' }
  | { type: 'RESOLVE_CARD' }
  | { type: 'BUILD_EXPOSURE'; tileId: number }
  | { type: 'SELL_EXPOSURE'; tileId: number }
  | { type: 'MORTGAGE'; tileId: number }
  | { type: 'UNMORTGAGE'; tileId: number }
  | { type: 'PAY_JAIL_FINE' }
  | { type: 'USE_JAIL_CARD' }
  | { type: 'END_TURN' }
  | { type: 'RAISE_CAPITAL_DONE' }
  | { type: 'DECLARE_INSOLVENT' }
  | { type: 'SELL_ASSETS_TO_BANK'; tileId: number }
