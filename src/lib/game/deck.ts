import { Card, Suit } from "@/types/game";

/**
 * Crea un mazzo standard di 52 carte.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];

  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
      });
    }
  }

  return deck;
}

/**
 * Mescola un array in modo casuale (Fisher-Yates shuffle).
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Calcola quanti mazzi servono in base al numero di giocatori.
 * 1 mazzo per 2-6 giocatori, 2 mazzi per 7+ giocatori.
 */
export function calculateDeckCount(playerCount: number): number {
  return playerCount > 6 ? 2 : 1;
}

/**
 * Distribuisce le carte ai giocatori.
 */
export function dealCards(
  deck: Card[],
  playerCount: number,
  cardsPerPlayer: number
): { hands: Card[][]; remainingDeck: Card[] } {
  const shuffled = shuffle(deck);
  const hands: Card[][] = [];

  for (let i = 0; i < playerCount; i++) {
    hands.push([]);
  }

  let cardIndex = 0;
  for (let round = 0; round < cardsPerPlayer; round++) {
    for (let player = 0; player < playerCount; player++) {
      if (cardIndex < shuffled.length) {
        hands[player].push(shuffled[cardIndex]);
        cardIndex++;
      }
    }
  }

  return {
    hands,
    remainingDeck: shuffled.slice(cardIndex),
  };
}

