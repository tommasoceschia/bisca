/**
 * Valida una scommessa.
 * La regola è: la somma delle scommesse NON può MAI essere uguale al numero di carte.
 * Questo vale durante TUTTA la votazione, non solo alla fine.
 */
export function validateBet(
  bet: number,
  cardsPerPlayer: number,
  currentTotalBets: number
): { valid: boolean; error?: string; forbiddenBet?: number } {
  // Verifica range base
  if (bet < 0) {
    return { valid: false, error: "La scommessa non può essere negativa" };
  }

  if (bet > cardsPerPlayer) {
    return { valid: false, error: `La scommessa non può superare ${cardsPerPlayer}` };
  }

  // La somma parziale non può MAI essere uguale al numero di carte
  const newTotal = currentTotalBets + bet;
  if (newTotal === cardsPerPlayer) {
    return {
      valid: false,
      error: `Non puoi scommettere ${bet}: la somma diventerebbe ${cardsPerPlayer}`,
      forbiddenBet: bet,
    };
  }

  return { valid: true };
}

/**
 * Calcola quali scommesse sono disponibili per un giocatore.
 * Ritorna un array di numeri validi.
 */
export function getAvailableBets(
  cardsPerPlayer: number,
  currentTotalBets: number
): number[] {
  const available: number[] = [];

  for (let bet = 0; bet <= cardsPerPlayer; bet++) {
    const validation = validateBet(bet, cardsPerPlayer, currentTotalBets);
    if (validation.valid) {
      available.push(bet);
    }
  }

  return available;
}

/**
 * Calcola la scommessa proibita (quella che porterebbe la somma a cardsPerPlayer).
 * Ritorna null se tutte le scommesse sono valide, o il numero proibito.
 */
export function getForbiddenBet(
  cardsPerPlayer: number,
  currentTotalBets: number
): number | null {
  const forbidden = cardsPerPlayer - currentTotalBets;

  // Se la scommessa proibita è nel range valido, ritornala
  if (forbidden >= 0 && forbidden <= cardsPerPlayer) {
    return forbidden;
  }

  return null;
}
