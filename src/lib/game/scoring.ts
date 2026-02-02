/**
 * Calcola il punteggio di un round per un giocatore.
 *
 * Regole:
 * - Esatto = +punti pari alle mani dichiarate
 * - Eccezione: 0 dichiarato e 0 preso = 1 punto
 * - Sbagliato = -differenza tra dichiarate e prese
 */
export function calculateRoundScore(bet: number, tricksWon: number): number {
  if (tricksWon === bet) {
    // Previsione esatta
    return bet === 0 ? 1 : bet;
  }

  // Previsione sbagliata: penalità
  return -Math.abs(tricksWon - bet);
}

/**
 * Ordina i giocatori per punteggio (dal più alto al più basso).
 */
export function rankPlayers(
  players: Array<{ id: string; nickname: string; score: number }>
): Array<{ id: string; nickname: string; score: number; rank: number }> {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return sorted.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
}
