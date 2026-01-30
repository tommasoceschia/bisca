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
 * Crea N mazzi combinati.
 */
export function createDecks(count: number): Card[] {
  const allCards: Card[] = [];

  for (let i = 0; i < count; i++) {
    const deck = createDeck();
    // Aggiungi suffisso per rendere gli ID unici
    for (const card of deck) {
      allCards.push({
        ...card,
        id: `${card.id}-${i}`,
      });
    }
  }

  return allCards;
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

/**
 * Ritorna il nome leggibile di una carta.
 */
export function getCardName(card: Card): string {
  const rankNames: Record<number, string> = {
    1: "Asso",
    11: "Jack",
    12: "Regina",
    13: "Re",
  };

  const suitNames: Record<Suit, string> = {
    [Suit.HEARTS]: "Cuori",
    [Suit.DIAMONDS]: "Quadri",
    [Suit.CLUBS]: "Fiori",
    [Suit.SPADES]: "Picche",
  };

  const rankName = rankNames[card.rank] || card.rank.toString();
  return `${rankName} di ${suitNames[card.suit]}`;
}
