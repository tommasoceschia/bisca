// Gerarchia semi: Cuori > Quadri > Fiori > Picche
export enum Suit {
  HEARTS = "hearts",
  DIAMONDS = "diamonds",
  CLUBS = "clubs",
  SPADES = "spades",
}

// Potere del seme (più alto = più forte)
export const SUIT_POWER: Record<Suit, number> = {
  [Suit.HEARTS]: 4,
  [Suit.DIAMONDS]: 3,
  [Suit.CLUBS]: 2,
  [Suit.SPADES]: 1,
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.HEARTS]: "♥",
  [Suit.DIAMONDS]: "♦",
  [Suit.CLUBS]: "♣",
  [Suit.SPADES]: "♠",
};

export const SUIT_NAMES_IT: Record<Suit, string> = {
  [Suit.HEARTS]: "Cuori",
  [Suit.DIAMONDS]: "Quadri",
  [Suit.CLUBS]: "Fiori",
  [Suit.SPADES]: "Picche",
};

export interface Card {
  id: string;
  suit: Suit;
  rank: number; // 1-13 (Asso=1, Jack=11, Queen=12, King=13)
}

export interface PlayedCard extends Card {
  playerId: string;
  aceIsHigh?: boolean; // Solo per Asso di Cuori
}

export enum GamePhase {
  WAITING = "waiting",
  BETTING = "betting",
  PLAYING = "playing",
  TRICK_END = "trick_end",
  ROUND_END = "round_end",
  GAME_END = "game_end",
}

// Round structure: 5→4→3→2→1→2→3→4→5
export const ROUND_STRUCTURE = [5, 4, 3, 2, 1, 2, 3, 4, 5] as const;

export interface Player {
  id: string;
  nickname: string;
  seatIndex: number;
  hand: Card[];
  bet: number | null; // null = non ancora scommesso
  tricksWon: number;
  score: number;
  connected: boolean;
  isHost: boolean;
}

export interface Trick {
  cards: PlayedCard[];
  leadSuit: Suit | null;
  winnerId: string | null;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  currentRound: number; // 0-8 indice in ROUND_STRUCTURE
  cardsPerPlayer: number;
  isBlindRound: boolean; // true quando cardsPerPlayer = 1
  currentTrick: Trick;
  currentPlayerId: string | null;
  roundLeaderId: string | null;
  totalBets: number;
  readyForNextRound: string[]; // Player IDs who clicked ready
  lastRoundWinnerId: string | null; // Who won the last trick (leads next round)
  playOrder: string[]; // Order of play (first player leads, rotates after each trick)
}

export interface Room {
  id: string;
  code: string; // Codice breve per entrare
  hostId: string;
  createdAt: string;
  gameState: GameState | null;
  maxPlayers: number;
}

// Eventi Realtime
export type GameEvent =
  | { type: "player_joined"; player: Player }
  | { type: "player_left"; playerId: string }
  | { type: "game_started"; gameState: GameState }
  | { type: "bet_placed"; playerId: string; bet: number; totalBets: number }
  | { type: "card_played"; playerId: string; card: PlayedCard }
  | { type: "ace_choice_made"; playerId: string; isHigh: boolean }
  | { type: "trick_won"; winnerId: string; trick: Trick }
  | { type: "round_ended"; scores: Record<string, number> }
  | { type: "game_ended"; finalScores: Record<string, number> }
  | { type: "state_sync"; gameState: GameState };
