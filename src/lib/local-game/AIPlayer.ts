import {
  GameState,
  GamePhase,
  Player,
  Card,
  PlayedCard,
  Suit,
  SUIT_POWER,
  AIDifficulty,
} from "@/types/game";
import { getAvailableBets } from "@/lib/game/betting";
import { isAceOfHearts, getEffectiveRank, sortHandCards } from "@/lib/game/suit-hierarchy";

export interface AIDecision {
  type: "bet" | "play_card";
  value: number | { cardId: string; aceIsHigh?: boolean };
}

export function makeAIDecision(
  player: Player,
  gameState: GameState,
  difficulty: AIDifficulty
): AIDecision {
  if (gameState.phase === GamePhase.BETTING) {
    return makeBetDecision(player, gameState, difficulty);
  } else {
    return makePlayDecision(player, gameState, difficulty);
  }
}

// ============ BETTING STRATEGIES ============

function makeBetDecision(
  player: Player,
  gameState: GameState,
  difficulty: AIDifficulty
): AIDecision {
  const availableBets = getAvailableBets(
    gameState.cardsPerPlayer,
    gameState.totalBets
  );

  let bet: number;

  switch (difficulty) {
    case "easy":
      bet = easyBet(availableBets);
      break;
    case "medium":
      bet = mediumBet(player.hand, availableBets);
      break;
    case "hard":
      bet = hardBet(player.hand, availableBets, gameState);
      break;
    default:
      bet = availableBets[0];
  }

  return { type: "bet", value: bet };
}

function easyBet(availableBets: number[]): number {
  // Random valid bet
  return availableBets[Math.floor(Math.random() * availableBets.length)];
}

function mediumBet(hand: Card[], availableBets: number[]): number {
  // Count strong cards (hearts and high diamonds)
  const strongCards = hand.filter(
    (c) =>
      c.suit === Suit.HEARTS ||
      (c.suit === Suit.DIAMONDS && c.rank >= 10)
  );

  // Conservative betting: about 70% of strong cards
  const targetBet = Math.round(strongCards.length * 0.7);

  // Find closest available bet
  return findClosestBet(targetBet, availableBets);
}

function hardBet(
  hand: Card[],
  availableBets: number[],
  gameState: GameState
): number {
  // Calculate expected tricks based on card strength
  let expectedTricks = 0;

  for (const card of hand) {
    const strength = evaluateCardStrength(card);
    // Normalize to probability (max strength is ~70 for Ace of Hearts high)
    const winProbability = Math.min(strength / 50, 1);
    expectedTricks += winProbability;
  }

  // Consider position - later position has more information
  const playerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayerId);
  const position = playerIndex + 1;
  const totalPlayers = gameState.players.length;

  // Adjust based on position (later = slightly more accurate)
  if (position === totalPlayers) {
    // Last to bet - can be more precise
    expectedTricks = Math.round(expectedTricks);
  } else {
    // Earlier positions - be more conservative
    expectedTricks = Math.floor(expectedTricks * 0.8);
  }

  return findClosestBet(expectedTricks, availableBets);
}

// ============ PLAY STRATEGIES ============

function makePlayDecision(
  player: Player,
  gameState: GameState,
  difficulty: AIDifficulty
): AIDecision {
  const hand = player.hand;

  let choice: { card: Card; aceIsHigh?: boolean };

  switch (difficulty) {
    case "easy":
      choice = easyPlay(hand);
      break;
    case "medium":
      choice = mediumPlay(hand, player, gameState);
      break;
    case "hard":
      choice = hardPlay(hand, player, gameState);
      break;
    default:
      choice = { card: hand[0] };
  }

  return {
    type: "play_card",
    value: {
      cardId: choice.card.id,
      aceIsHigh: isAceOfHearts(choice.card) ? choice.aceIsHigh : undefined,
    },
  };
}

function easyPlay(hand: Card[]): { card: Card; aceIsHigh?: boolean } {
  // Random card
  const card = hand[Math.floor(Math.random() * hand.length)];
  // Random ace choice
  const aceIsHigh = Math.random() > 0.5;
  return { card, aceIsHigh };
}

function mediumPlay(
  hand: Card[],
  player: Player,
  gameState: GameState
): { card: Card; aceIsHigh?: boolean } {
  const sortedHand = sortHandCards(hand);
  const needsWins = player.tricksWon < (player.bet ?? 0);
  const currentTrick = gameState.currentTrick;
  const isLeading = currentTrick.cards.length === 0;

  let selectedCard: Card;
  let aceIsHigh = true;

  if (isLeading) {
    // Leading: play weak if we have enough wins, strong if we need more
    if (needsWins) {
      selectedCard = sortedHand[sortedHand.length - 1]; // Strongest
    } else {
      selectedCard = sortedHand[0]; // Weakest
    }
  } else {
    // Following: try to win if needed, otherwise dump weak card
    const currentWinner = findCurrentWinner(currentTrick.cards);

    if (needsWins) {
      // Try to find a card that can win
      const winningCard = findMinimalWinningCard(sortedHand, currentWinner);
      if (winningCard) {
        selectedCard = winningCard;
      } else {
        // Can't win, dump weakest
        selectedCard = sortedHand[0];
      }
    } else {
      // Don't need wins, try to lose
      const losingCard = findLosingCard(sortedHand, currentWinner);
      selectedCard = losingCard || sortedHand[0];
    }
  }

  // Ace of Hearts decision
  if (isAceOfHearts(selectedCard)) {
    aceIsHigh = needsWins;
  }

  return { card: selectedCard, aceIsHigh };
}

function hardPlay(
  hand: Card[],
  player: Player,
  gameState: GameState
): { card: Card; aceIsHigh?: boolean } {
  const sortedHand = sortHandCards(hand);
  const tricksNeeded = (player.bet ?? 0) - player.tricksWon;
  const tricksRemaining = player.hand.length;
  const currentTrick = gameState.currentTrick;
  const isLeading = currentTrick.cards.length === 0;
  const playersRemaining = gameState.players.length - currentTrick.cards.length;

  let selectedCard: Card;
  let aceIsHigh = true;

  if (isLeading) {
    if (tricksNeeded <= 0) {
      // Don't need more wins - lead with weakest
      selectedCard = sortedHand[0];
    } else if (tricksNeeded >= tricksRemaining) {
      // Need all remaining tricks - lead with strongest
      selectedCard = sortedHand[sortedHand.length - 1];
    } else {
      // Need some tricks - strategic leading
      // Lead with medium-strength card to probe
      const midIndex = Math.floor(sortedHand.length / 2);
      selectedCard = sortedHand[midIndex];
    }
  } else {
    const currentWinner = findCurrentWinner(currentTrick.cards);

    if (tricksNeeded <= 0) {
      // Don't need wins - play to lose
      const losingCard = findLosingCard(sortedHand, currentWinner);
      selectedCard = losingCard || sortedHand[0];
    } else if (playersRemaining === 1) {
      // Last to play - we know exactly what we need
      const winningCard = findMinimalWinningCard(sortedHand, currentWinner);
      if (winningCard && tricksNeeded > 0) {
        selectedCard = winningCard;
      } else {
        selectedCard = sortedHand[0]; // Dump weakest
      }
    } else {
      // Not last - consider probability
      if (tricksNeeded > 0) {
        const winningCard = findMinimalWinningCard(sortedHand, currentWinner);
        if (winningCard) {
          selectedCard = winningCard;
        } else {
          selectedCard = sortedHand[0];
        }
      } else {
        selectedCard = sortedHand[0];
      }
    }
  }

  // Ace of Hearts strategic decision
  if (isAceOfHearts(selectedCard)) {
    if (!isLeading) {
      const currentWinner = findCurrentWinner(currentTrick.cards);
      const wouldWinHigh = wouldBeatCard(selectedCard, currentWinner, true);
      const wouldWinLow = wouldBeatCard(selectedCard, currentWinner, false);

      if (tricksNeeded > 0) {
        // Need wins - prefer high if it matters
        aceIsHigh = wouldWinHigh;
      } else {
        // Don't need wins - prefer low if it loses
        aceIsHigh = !wouldWinLow;
      }
    } else {
      // Leading with Ace of Hearts
      aceIsHigh = tricksNeeded > 0;
    }
  }

  return { card: selectedCard, aceIsHigh };
}

// ============ HELPER FUNCTIONS ============

function evaluateCardStrength(card: Card): number {
  // Suit power (Hearts=4, Diamonds=3, Clubs=2, Spades=1) * 15
  const suitValue = SUIT_POWER[card.suit] * 15;
  // Rank value (Ace of Hearts can be 14, others as-is)
  const rankValue = isAceOfHearts(card) ? 14 : card.rank;
  return suitValue + rankValue;
}

function findClosestBet(target: number, available: number[]): number {
  return available.reduce((closest, bet) =>
    Math.abs(bet - target) < Math.abs(closest - target) ? bet : closest
  );
}

function findCurrentWinner(cards: PlayedCard[]): PlayedCard | null {
  if (cards.length === 0) return null;

  let winner = cards[0];
  for (let i = 1; i < cards.length; i++) {
    if (comparePlayedCards(cards[i], winner) > 0) {
      winner = cards[i];
    }
  }
  return winner;
}

function comparePlayedCards(a: PlayedCard, b: PlayedCard): number {
  const suitCompare = SUIT_POWER[a.suit] - SUIT_POWER[b.suit];
  if (suitCompare !== 0) return suitCompare;

  const rankA = getEffectiveRank(a, a.aceIsHigh);
  const rankB = getEffectiveRank(b, b.aceIsHigh);
  return rankA - rankB;
}

function wouldBeatCard(card: Card, target: PlayedCard | null, aceIsHigh: boolean): boolean {
  if (!target) return true;

  const playedCard: PlayedCard = { ...card, playerId: "", aceIsHigh };
  return comparePlayedCards(playedCard, target) > 0;
}

function findMinimalWinningCard(hand: Card[], currentWinner: PlayedCard | null): Card | null {
  if (!currentWinner) {
    // First to play, return weakest
    return hand[0];
  }

  // Find the weakest card that can still win
  const sortedHand = sortHandCards(hand);

  for (const card of sortedHand) {
    // For Ace of Hearts, check if it can win as high
    const aceIsHigh = isAceOfHearts(card) ? true : undefined;
    if (wouldBeatCard(card, currentWinner, aceIsHigh ?? true)) {
      return card;
    }
  }

  return null;
}

function findLosingCard(hand: Card[], currentWinner: PlayedCard | null): Card | null {
  if (!currentWinner) return hand[0];

  const sortedHand = sortHandCards(hand);

  // Find a card that loses to the current winner
  for (const card of sortedHand) {
    const aceIsHigh = isAceOfHearts(card) ? false : undefined;
    if (!wouldBeatCard(card, currentWinner, aceIsHigh ?? false)) {
      return card;
    }
  }

  return null;
}
