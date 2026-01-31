"use client";

import { cn } from "@/lib/utils";
import { Player, ROUND_STRUCTURE } from "@/types/game";
import { rankPlayers } from "@/lib/game/scoring";

interface ScoreBoardProps {
  players: Player[];
  currentRound: number;
  isBettingPhase?: boolean;
  playOrder?: string[]; // Display order (winner leads)
}

export function ScoreBoard({ players, currentRound, isBettingPhase = false, playOrder }: ScoreBoardProps) {
  const rankedPlayers = rankPlayers(
    players.map((p) => ({ id: p.id, nickname: p.nickname, score: p.score }))
  );

  // Order players by playOrder if provided, otherwise by score rank
  const orderedPlayers = playOrder
    ? playOrder.map((id) => players.find((p) => p.id === id)!).filter(Boolean)
    : rankedPlayers.map((r) => players.find((p) => p.id === r.id)!);

  const cardsThisRound = ROUND_STRUCTURE[currentRound];

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 min-w-[200px] sm:min-w-[280px] shadow-lg border border-green-800/30">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-green-700/50">
        <span className="text-green-100 font-bold text-sm sm:text-base">
          Round {currentRound + 1}/9
        </span>
        <span className="text-yellow-400 font-bold text-sm sm:text-base">
          {cardsThisRound} 🃏
        </span>
      </div>

      <table className="w-full text-sm sm:text-base">
        <thead>
          <tr className="text-green-300 font-semibold">
            <th className="pb-2 text-center w-8">#</th>
            <th className="pb-2 text-left">Giocatore</th>
            <th className="pb-2 text-center w-12" title="Scommessa">Bet</th>
            <th className="pb-2 text-center w-12" title="Prese">Prese</th>
            <th className="pb-2 text-center w-14">Punti</th>
          </tr>
        </thead>
        <tbody>
          {orderedPlayers.map((player) => {
            const ranked = rankedPlayers.find((r) => r.id === player.id)!;
            const betStatus = player.bet !== null
              ? player.tricksWon === player.bet
                ? "text-green-400"
                : player.tricksWon > player.bet
                  ? "text-red-400"
                  : "text-yellow-400"
              : "";

            return (
              <tr
                key={player.id}
                className={cn(
                  "border-t border-green-800/40",
                  !player.connected && "opacity-40"
                )}
              >
                <td className="py-2 text-center text-green-400 font-medium">{ranked.rank}</td>
                <td className={cn("py-2 text-white truncate max-w-[100px]", player.isHost && "font-bold")}>
                  {player.nickname.length > 10 ? player.nickname.slice(0, 10) + "…" : player.nickname}
                  {player.isHost && " 👑"}
                </td>
                <td className={cn("py-2 text-center font-bold text-base sm:text-lg", betStatus)}>
                  {player.bet !== null ? player.bet : (isBettingPhase ? "?" : "-")}
                </td>
                <td className={cn("py-2 text-center font-bold text-base sm:text-lg", betStatus)}>
                  {player.tricksWon}
                </td>
                <td className="py-2 text-center font-mono font-bold text-base sm:text-lg text-green-200">
                  {player.score >= 0 ? `+${player.score}` : player.score}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
