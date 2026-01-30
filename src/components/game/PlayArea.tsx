"use client";

import { cn } from "@/lib/utils";
import { PlayedCard, Player, SUIT_SYMBOLS, SUIT_NAMES_IT } from "@/types/game";
import { Card } from "./Card";

interface PlayAreaProps {
  playedCards: PlayedCard[];
  players: Player[];
  winnerId?: string | null;
}

export function PlayArea({ playedCards, players, winnerId }: PlayAreaProps) {
  const getPlayerName = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    return player?.nickname || "???";
  };

  if (playedCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 sm:h-48">
        <div className="text-green-300/50 text-sm sm:text-lg">
          In attesa della prima carta...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4">
      {/* Lead suit indicator */}
      {playedCards.length > 0 && (
        <div className="text-green-200 text-xs sm:text-sm">
          Seme:{" "}
          <span className={cn(
            playedCards[0].suit === "hearts" || playedCards[0].suit === "diamonds"
              ? "text-red-400"
              : "text-gray-300"
          )}>
            {SUIT_SYMBOLS[playedCards[0].suit]} {SUIT_NAMES_IT[playedCards[0].suit]}
          </span>
        </div>
      )}

      {/* Played cards */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
        {playedCards.map((card) => {
          const isWinner = winnerId === card.playerId;

          return (
            <div
              key={card.id}
              className={cn(
                "flex flex-col items-center gap-1 sm:gap-2 transition-all",
                isWinner && "scale-105 sm:scale-110"
              )}
            >
              <div className={cn(
                "relative",
                isWinner && "ring-2 sm:ring-4 ring-yellow-400 rounded-lg"
              )}>
                <Card card={card} size="sm" disabled />
                {card.aceIsHigh !== undefined && (
                  <div className={cn(
                    "absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2",
                    "bg-yellow-500 text-yellow-900 text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold"
                  )}>
                    {card.aceIsHigh ? "A" : "B"}
                  </div>
                )}
              </div>
              <div className={cn(
                "text-[10px] sm:text-sm truncate max-w-[50px] sm:max-w-none",
                isWinner ? "text-yellow-400 font-bold" : "text-green-200"
              )}>
                {getPlayerName(card.playerId).length > 5
                  ? getPlayerName(card.playerId).slice(0, 5) + "…"
                  : getPlayerName(card.playerId)}
                {isWinner && " 👑"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
