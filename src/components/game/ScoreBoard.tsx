"use client";

import { cn } from "@/lib/utils";
import { Player, ROUND_STRUCTURE } from "@/types/game";
import { rankPlayers } from "@/lib/game/scoring";

interface ScoreBoardProps {
  players: Player[];
  currentRound: number;
  showBets?: boolean;
}

export function ScoreBoard({ players, currentRound, showBets = true }: ScoreBoardProps) {
  const rankedPlayers = rankPlayers(
    players.map((p) => ({ id: p.id, nickname: p.nickname, score: p.score }))
  );

  const cardsThisRound = ROUND_STRUCTURE[currentRound];

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 min-w-64">
      <div className="flex justify-between items-center mb-3 text-green-200 text-sm">
        <span>Round {currentRound + 1}/9</span>
        <span>{cardsThisRound} carte</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-green-300/70 text-left">
            <th className="pb-2">#</th>
            <th className="pb-2">Giocatore</th>
            {showBets && <th className="pb-2 text-center">Bet</th>}
            {showBets && <th className="pb-2 text-center">Prese</th>}
            <th className="pb-2 text-right">Punti</th>
          </tr>
        </thead>
        <tbody>
          {rankedPlayers.map((ranked) => {
            const player = players.find((p) => p.id === ranked.id)!;
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
                  "border-t border-green-800/30",
                  !player.connected && "opacity-50"
                )}
              >
                <td className="py-2 text-green-400">{ranked.rank}</td>
                <td className={cn("py-2 text-white", player.isHost && "font-bold")}>
                  {player.nickname}
                  {player.isHost && " 👑"}
                  {!player.connected && " (offline)"}
                </td>
                {showBets && (
                  <td className={cn("py-2 text-center", betStatus)}>
                    {player.bet !== null ? player.bet : "-"}
                  </td>
                )}
                {showBets && (
                  <td className={cn("py-2 text-center", betStatus)}>
                    {player.tricksWon}
                  </td>
                )}
                <td className="py-2 text-right font-mono text-green-200">
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
