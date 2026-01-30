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
 * Calcola i punteggi di fine round per tutti i giocatori.
 */
export function calculateRoundScores(
  players: Array<{ id: string; bet: number; tricksWon: number }>
): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const player of players) {
    scores[player.id] = calculateRoundScore(player.bet, player.tricksWon);
  }

  return scores;
}

/**
 * Determina il vincitore della partita.
 * Ritorna l'ID del giocatore con il punteggio più alto.
 */
export function determineWinner(scores: Record<string, number>): string {
  let winnerId = "";
  let highestScore = -Infinity;

  for (const [playerId, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      winnerId = playerId;
    }
  }

  return winnerId;
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
