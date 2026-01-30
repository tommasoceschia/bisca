"use client";

import { cn } from "@/lib/utils";
import { Player, ROUND_STRUCTURE } from "@/types/game";
import { rankPlayers } from "@/lib/game/scoring";

interface ScoreBoardProps {
  players: Player[];
  currentRound: number;
  isBettingPhase?: boolean;
}

export function ScoreBoard({ players, currentRound, isBettingPhase = false }: ScoreBoardProps) {
  const rankedPlayers = rankPlayers(
    players.map((p) => ({ id: p.id, nickname: p.nickname, score: p.score }))
  );

  const cardsThisRound = ROUND_STRUCTURE[currentRound];

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 min-w-0 sm:min-w-64 max-w-[50vw] sm:max-w-none">
      <div className="flex justify-between items-center mb-1 sm:mb-3 text-green-200 text-[10px] sm:text-sm">
        <span>R{currentRound + 1}/9</span>
        <span>{cardsThisRound}🃏</span>
      </div>

      <table className="w-full text-[10px] sm:text-sm">
        <thead>
          <tr className="text-green-300/70 text-left">
            <th className="pb-1 sm:pb-2 hidden sm:table-cell">#</th>
            <th className="pb-1 sm:pb-2">Nome</th>
            <th className="pb-1 sm:pb-2 text-center">B</th>
            <th className="pb-1 sm:pb-2 text-center">P</th>
            <th className="pb-1 sm:pb-2 text-right">Pts</th>
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
                <td className="py-1 sm:py-2 text-green-400 hidden sm:table-cell">{ranked.rank}</td>
                <td className={cn("py-1 sm:py-2 text-white truncate max-w-[60px] sm:max-w-none", player.isHost && "font-bold")}>
                  {player.nickname.length > 6 ? player.nickname.slice(0, 6) + "…" : player.nickname}
                  {player.isHost && <span className="hidden sm:inline"> 👑</span>}
                </td>
                <td className={cn("py-1 sm:py-2 text-center", betStatus)}>
                  {player.bet !== null ? player.bet : (isBettingPhase ? "?" : "-")}
                </td>
                <td className={cn("py-1 sm:py-2 text-center", betStatus)}>
                  {player.tricksWon}
                </td>
                <td className="py-1 sm:py-2 text-right font-mono text-green-200">
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
