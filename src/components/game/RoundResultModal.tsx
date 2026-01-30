"use client";

import { cn } from "@/lib/utils";
import { Player, ROUND_STRUCTURE } from "@/types/game";
import { calculateRoundScore } from "@/lib/game/scoring";

interface RoundResultModalProps {
  players: Player[];
  currentRound: number;
  readyPlayers: string[];
  currentPlayerId: string;
  onReady: () => void;
}

export function RoundResultModal({
  players,
  currentRound,
  readyPlayers,
  currentPlayerId,
  onReady,
}: RoundResultModalProps) {
  const isReady = readyPlayers.includes(currentPlayerId);
  const cardsThisRound = ROUND_STRUCTURE[currentRound];

  // Sort players by score this round (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = calculateRoundScore(a.bet ?? 0, a.tricksWon);
    const scoreB = calculateRoundScore(b.bet ?? 0, b.tricksWon);
    return scoreB - scoreA;
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-green-800 to-green-900 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl border border-green-600/30">
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
          Round {currentRound + 1} Completato!
        </h2>
        <p className="text-green-200/70 text-center text-sm mb-4">
          {cardsThisRound} {cardsThisRound === 1 ? "carta" : "carte"} per giocatore
        </p>

        {/* Results table */}
        <div className="bg-black/30 rounded-lg p-3 mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-green-300/70 text-left border-b border-green-700/50">
                <th className="pb-2">Giocatore</th>
                <th className="pb-2 text-center">Bet</th>
                <th className="pb-2 text-center">Prese</th>
                <th className="pb-2 text-right">+/-</th>
                <th className="pb-2 text-right">Tot</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => {
                const roundScore = calculateRoundScore(player.bet ?? 0, player.tricksWon);
                const isExact = player.bet === player.tricksWon;
                const isOver = player.tricksWon > (player.bet ?? 0);

                return (
                  <tr
                    key={player.id}
                    className="border-t border-green-800/30"
                  >
                    <td className="py-2 text-white">
                      {player.nickname}
                      {player.id === currentPlayerId && (
                        <span className="text-yellow-400 ml-1">(tu)</span>
                      )}
                    </td>
                    <td className="py-2 text-center text-green-200">
                      {player.bet ?? "-"}
                    </td>
                    <td className="py-2 text-center text-green-200">
                      {player.tricksWon}
                    </td>
                    <td
                      className={cn(
                        "py-2 text-right font-bold",
                        isExact
                          ? "text-green-400"
                          : isOver
                          ? "text-red-400"
                          : "text-yellow-400"
                      )}
                    >
                      {roundScore >= 0 ? `+${roundScore}` : roundScore}
                    </td>
                    <td className="py-2 text-right text-green-200 font-mono">
                      {player.score >= 0 ? `+${player.score}` : player.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Ready status */}
        <div className="mb-4">
          <p className="text-green-200/70 text-sm text-center mb-2">
            Pronti: {readyPlayers.length}/{players.length}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={cn(
                  "px-2 py-1 rounded text-xs",
                  readyPlayers.includes(player.id)
                    ? "bg-green-500/30 text-green-300"
                    : "bg-gray-500/30 text-gray-400"
                )}
              >
                {player.nickname}
                {readyPlayers.includes(player.id) && " ✓"}
              </div>
            ))}
          </div>
        </div>

        {/* Ready button */}
        <button
          onClick={onReady}
          disabled={isReady}
          className={cn(
            "w-full py-3 px-6 font-semibold rounded-lg transition-colors",
            isReady
              ? "bg-green-700/50 text-green-300 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-400 text-white"
          )}
        >
          {isReady ? "In attesa degli altri..." : "Pronto!"}
        </button>
      </div>
    </div>
  );
}
