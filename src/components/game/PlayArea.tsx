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
      <div className="flex items-center justify-center h-48">
        <div className="text-green-300/50 text-lg">
          In attesa della prima carta...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Lead suit indicator */}
      {playedCards.length > 0 && (
        <div className="text-green-200 text-sm">
          Seme iniziale:{" "}
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
      <div className="flex flex-wrap justify-center gap-4">
        {playedCards.map((card) => {
          const isWinner = winnerId === card.playerId;

          return (
            <div
              key={card.id}
              className={cn(
                "flex flex-col items-center gap-2 transition-all",
                isWinner && "scale-110"
              )}
            >
              <div className={cn(
                "relative",
                isWinner && "ring-4 ring-yellow-400 rounded-lg"
              )}>
                <Card card={card} size="md" disabled />
                {card.aceIsHigh !== undefined && (
                  <div className={cn(
                    "absolute -bottom-2 left-1/2 -translate-x-1/2",
                    "bg-yellow-500 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold"
                  )}>
                    {card.aceIsHigh ? "ALTO" : "BASSO"}
                  </div>
                )}
              </div>
              <div className={cn(
                "text-sm",
                isWinner ? "text-yellow-400 font-bold" : "text-green-200"
              )}>
                {getPlayerName(card.playerId)}
                {isWinner && " 👑"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
