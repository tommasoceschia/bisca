import { Suit, SUIT_POWER, Card, PlayedCard } from "@/types/game";

/**
 * Confronta due semi. Ritorna:
 * - positivo se a > b
 * - negativo se a < b
 * - 0 se uguali
 */
export function compareSuits(a: Suit, b: Suit): number {
  return SUIT_POWER[a] - SUIT_POWER[b];
}

/**
 * Calcola il rank effettivo di una carta.
 * L'Asso di Cuori può essere alto (14) o basso (0) in base alla scelta del giocatore.
 */
export function getEffectiveRank(card: Card | PlayedCard, aceIsHigh?: boolean): number {
  // Asso di Cuori: scelta del giocatore
  if (card.suit === Suit.HEARTS && card.rank === 1) {
    if (aceIsHigh === undefined) {
      // Default: se non specificato, è alto
      return 14;
    }
    return aceIsHigh ? 14 : 0;
  }

  // Asso normale (non di cuori): vale 14 (più alto del Re)
  if (card.rank === 1) {
    return 14;
  }

  return card.rank;
}

/**
 * Confronta due carte e determina quale vince.
 * Ritorna:
 * - positivo se a vince su b
 * - negativo se b vince su a
 */
export function compareCards(a: PlayedCard, b: PlayedCard): number {
  // Prima confronta i semi
  const suitComparison = compareSuits(a.suit, b.suit);

  if (suitComparison !== 0) {
    // Seme diverso: il seme più forte vince sempre
    return suitComparison;
  }

  // Stesso seme: confronta i rank
  const rankA = getEffectiveRank(a, a.aceIsHigh);
  const rankB = getEffectiveRank(b, b.aceIsHigh);

  return rankA - rankB;
}

/**
 * Determina il vincitore di una presa.
 * Ritorna l'ID del giocatore vincitore.
 */
export function determineTrickWinner(cards: PlayedCard[]): string {
  if (cards.length === 0) {
    throw new Error("Nessuna carta nella presa");
  }

  let winner = cards[0];

  for (let i = 1; i < cards.length; i++) {
    const challenger = cards[i];

    if (compareCards(challenger, winner) > 0) {
      winner = challenger;
    }
  }

  return winner.playerId;
}

/**
 * Verifica se una carta è l'Asso di Cuori (richiede scelta alto/basso).
 */
export function isAceOfHearts(card: Card): boolean {
  return card.suit === Suit.HEARTS && card.rank === 1;
}
