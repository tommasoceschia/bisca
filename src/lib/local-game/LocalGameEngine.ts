import {
  GameState,
  GamePhase,
  Player,
  Card,
  PlayedCard,
  Trick,
  Suit,
  ROUND_STRUCTURE,
  AIDifficulty,
} from "@/types/game";
import { createDeck, shuffle } from "@/lib/game/deck";
import { determineTrickWinner, isAceOfHearts } from "@/lib/game/suit-hierarchy";
import { calculateRoundScore } from "@/lib/game/scoring";
import { getAvailableBets } from "@/lib/game/betting";
import { makeAIDecision } from "./AIPlayer";

export interface LocalGameConfig {
  humanPlayerId: string;
  humanNickname: string;
  aiCount: number; // 1-4
  aiDifficulty: AIDifficulty;
}

type GameStateListener = (state: GameState) => void;

const AI_NAMES = [
  "Marco", "Giulia", "Alessandro", "Francesca",
  "Luca", "Elena", "Andrea", "Chiara",
  "Matteo", "Sara", "Giovanni", "Valentina",
];

function generateAINames(count: number): string[] {
  const shuffled = [...AI_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export class LocalGameEngine {
  private state: GameState;
  private listeners: Set<GameStateListener> = new Set();
  private config: LocalGameConfig;
  private processingAction: boolean = false;
  private aiTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(config: LocalGameConfig) {
    this.config = config;

    // Create players
    const aiNames = generateAINames(config.aiCount);
    const players: Player[] = [
      {
        id: config.humanPlayerId,
        nickname: config.humanNickname,
        seatIndex: 0,
        hand: [],
        bet: null,
        tricksWon: 0,
        score: 0,
        connected: true,
        isHost: true,
        isAI: false,
      },
      ...aiNames.map((name, i) => ({
        id: `ai_${i + 1}`,
        nickname: name,
        seatIndex: i + 1,
        hand: [],
        bet: null,
        tricksWon: 0,
        score: 0,
        connected: true,
        isHost: false,
        isAI: true,
        aiDifficulty: config.aiDifficulty,
      })),
    ];

    // Initialize game state in WAITING phase
    this.state = {
      id: "local",
      phase: GamePhase.WAITING,
      players,
      currentRound: 0,
      cardsPerPlayer: ROUND_STRUCTURE[0],
      isBlindRound: false,
      currentTrick: { cards: [], leadSuit: null, winnerId: null },
      currentPlayerId: null,
      roundLeaderId: null,
      totalBets: 0,
      readyForNextRound: [],
      lastRoundWinnerId: null,
      playOrder: players.map((p) => p.id),
    };
  }

  subscribe(listener: GameStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const personalizedState = this.personalizeState();
    this.listeners.forEach((l) => l(personalizedState));
  }

  private personalizeState(): GameState {
    // In blind round: hide own cards, show others
    // Otherwise: show own cards, hide others
    const humanId = this.config.humanPlayerId;

    return {
      ...this.state,
      players: this.state.players.map((p) => {
        if (this.state.isBlindRound) {
          // Blind round: hide your own hand
          if (p.id === humanId) {
            return { ...p, hand: p.hand.map((c) => ({ ...c, hidden: true })) };
          }
          return p;
        } else {
          // Normal round: hide others' hands
          if (p.id !== humanId) {
            return { ...p, hand: p.hand.map((c) => ({ ...c, hidden: true })) };
          }
          return p;
        }
      }),
    };
  }

  getState(): GameState {
    return this.personalizeState();
  }

  getFullState(): GameState {
    return this.state;
  }

  startGame(): void {
    if (this.state.phase !== GamePhase.WAITING) return;

    const cardsPerPlayer = ROUND_STRUCTURE[0];
    this.dealNewRound(cardsPerPlayer);
    this.state.phase = GamePhase.BETTING;
    this.state.currentPlayerId = this.state.players[0].id;
    this.state.roundLeaderId = this.state.players[0].id;

    this.notifyListeners();
    this.scheduleAITurnIfNeeded();
  }

  private dealNewRound(cardsPerPlayer: number): void {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    const playerCount = this.state.players.length;

    // Deal cards
    let cardIndex = 0;
    for (let round = 0; round < cardsPerPlayer; round++) {
      for (let player = 0; player < playerCount; player++) {
        if (cardIndex < shuffled.length) {
          this.state.players[player].hand.push(shuffled[cardIndex]);
          cardIndex++;
        }
      }
    }

    this.state.cardsPerPlayer = cardsPerPlayer;
    this.state.isBlindRound = cardsPerPlayer === 1;
    this.state.totalBets = 0;
    this.state.currentTrick = { cards: [], leadSuit: null, winnerId: null };

    // Reset player round state
    for (const p of this.state.players) {
      p.bet = null;
      p.tricksWon = 0;
    }
  }

  placeBet(playerId: string, bet: number): void {
    if (this.processingAction) return;
    if (this.state.phase !== GamePhase.BETTING) return;
    if (this.state.currentPlayerId !== playerId) return;

    this.processingAction = true;

    try {
      const playerIndex = this.state.players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) return;

      // Validate bet
      const availableBets = getAvailableBets(
        this.state.cardsPerPlayer,
        this.state.totalBets
      );
      if (!availableBets.includes(bet)) return;

      // Place bet
      this.state.players[playerIndex].bet = bet;
      this.state.totalBets += bet;

      // Check if all bets placed
      const allBetsPlaced = this.state.players.every((p) => p.bet !== null);

      if (allBetsPlaced) {
        this.state.phase = GamePhase.PLAYING;
        this.state.currentPlayerId = this.state.roundLeaderId;
      } else {
        const nextIndex = (playerIndex + 1) % this.state.players.length;
        this.state.currentPlayerId = this.state.players[nextIndex].id;
      }

      this.notifyListeners();
      this.scheduleAITurnIfNeeded();
    } finally {
      this.processingAction = false;
    }
  }

  playCard(playerId: string, cardId: string, aceIsHigh?: boolean): void {
    if (this.processingAction) return;
    if (this.state.phase !== GamePhase.PLAYING) return;
    if (this.state.currentPlayerId !== playerId) return;

    // Check if already played this trick
    if (this.state.currentTrick.cards.some((c) => c.playerId === playerId)) {
      return;
    }

    this.processingAction = true;

    try {
      const playerIndex = this.state.players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) return;

      const player = this.state.players[playerIndex];
      const cardIndex = player.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return;

      const card = player.hand.splice(cardIndex, 1)[0];
      const playedCard: PlayedCard = {
        ...card,
        playerId,
        aceIsHigh: isAceOfHearts(card) ? aceIsHigh : undefined,
      };

      // Add to trick
      this.state.currentTrick.cards.push(playedCard);
      if (!this.state.currentTrick.leadSuit) {
        this.state.currentTrick.leadSuit = playedCard.suit;
      }

      // Check if trick is complete
      if (this.state.currentTrick.cards.length === this.state.players.length) {
        const winnerId = determineTrickWinner(this.state.currentTrick.cards);
        this.state.currentTrick.winnerId = winnerId;

        const winnerIndex = this.state.players.findIndex((p) => p.id === winnerId);
        this.state.players[winnerIndex].tricksWon++;

        // Rotate playOrder so winner is first
        const winnerPlayOrderIdx = this.state.playOrder.indexOf(winnerId);
        this.state.playOrder = [
          ...this.state.playOrder.slice(winnerPlayOrderIdx),
          ...this.state.playOrder.slice(0, winnerPlayOrderIdx),
        ];

        // Check if round is complete
        if (this.state.players[0].hand.length === 0) {
          this.endRound();
        } else {
          // Next trick - show winning card briefly
          this.state.currentPlayerId = winnerId;
          this.notifyListeners();

          // Delay clearing trick
          setTimeout(() => {
            this.state.currentTrick = { cards: [], leadSuit: null, winnerId: null };
            this.notifyListeners();
            this.scheduleAITurnIfNeeded();
          }, 1500);
          return;
        }
      } else {
        // Next player
        const nextIndex = (playerIndex + 1) % this.state.players.length;
        this.state.currentPlayerId = this.state.players[nextIndex].id;
      }

      this.notifyListeners();
      this.scheduleAITurnIfNeeded();
    } finally {
      this.processingAction = false;
    }
  }

  private endRound(): void {
    // Calculate scores
    for (const p of this.state.players) {
      p.score += calculateRoundScore(p.bet!, p.tricksWon);
    }

    // Check if game is complete
    if (this.state.currentRound >= ROUND_STRUCTURE.length - 1) {
      this.state.phase = GamePhase.GAME_END;
    } else {
      this.state.phase = GamePhase.ROUND_END;
      this.state.lastRoundWinnerId = this.state.currentTrick.winnerId;
      this.state.readyForNextRound = [];

      // Auto-ready AI players
      for (const p of this.state.players) {
        if (p.isAI) {
          this.state.readyForNextRound.push(p.id);
        }
      }
    }

    this.state.currentTrick = { cards: [], leadSuit: null, winnerId: null };
  }

  markReady(playerId: string): void {
    if (this.state.phase !== GamePhase.ROUND_END) return;
    if (this.state.readyForNextRound.includes(playerId)) return;

    this.state.readyForNextRound.push(playerId);

    // Check if all players ready
    const allReady = this.state.players.every((p) =>
      this.state.readyForNextRound.includes(p.id)
    );

    if (allReady) {
      this.startNextRound();
    } else {
      this.notifyListeners();
    }
  }

  private startNextRound(): void {
    const winnerId = this.state.lastRoundWinnerId!;
    this.state.currentRound++;
    const cardsPerPlayer = ROUND_STRUCTURE[this.state.currentRound];

    // Clear hands and deal new cards
    for (const p of this.state.players) {
      p.hand = [];
    }
    this.dealNewRound(cardsPerPlayer);

    this.state.phase = GamePhase.BETTING;
    this.state.currentPlayerId = winnerId;
    this.state.roundLeaderId = winnerId;
    this.state.readyForNextRound = [];
    this.state.lastRoundWinnerId = null;

    this.notifyListeners();
    this.scheduleAITurnIfNeeded();
  }

  private scheduleAITurnIfNeeded(): void {
    if (this.aiTimeoutId) {
      clearTimeout(this.aiTimeoutId);
      this.aiTimeoutId = null;
    }

    if (this.state.phase !== GamePhase.BETTING && this.state.phase !== GamePhase.PLAYING) {
      return;
    }

    const currentPlayer = this.state.players.find(
      (p) => p.id === this.state.currentPlayerId
    );

    if (!currentPlayer?.isAI) return;

    // Schedule AI move with delay
    const thinkingTime = this.getAIThinkingTime();

    this.aiTimeoutId = setTimeout(() => {
      this.executeAITurn(currentPlayer);
    }, thinkingTime);
  }

  private getAIThinkingTime(): number {
    const difficulty = this.config.aiDifficulty;
    switch (difficulty) {
      case "easy":
        return 500 + Math.random() * 500; // 500-1000ms
      case "medium":
        return 1000 + Math.random() * 1000; // 1000-2000ms
      case "hard":
        return 1500 + Math.random() * 1500; // 1500-3000ms
      default:
        return 1000;
    }
  }

  private executeAITurn(player: Player): void {
    const decision = makeAIDecision(
      player,
      this.state,
      this.config.aiDifficulty
    );

    if (decision.type === "bet") {
      this.placeBet(player.id, decision.value as number);
    } else {
      const { cardId, aceIsHigh } = decision.value as { cardId: string; aceIsHigh?: boolean };
      this.playCard(player.id, cardId, aceIsHigh);
    }
  }

  destroy(): void {
    if (this.aiTimeoutId) {
      clearTimeout(this.aiTimeoutId);
    }
    this.listeners.clear();
  }
}
