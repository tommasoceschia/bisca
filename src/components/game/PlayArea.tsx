"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { PlayedCard, Player, SUIT_SYMBOLS, SUIT_NAMES_IT, Suit, SUIT_POWER } from "@/types/game";
import { Card } from "./Card";

interface PlayAreaProps {
  playedCards: PlayedCard[];
  players: Player[];
  winnerId?: string | null;
}

// Helper to get effective rank for ace of hearts
function getEffectiveRank(card: PlayedCard): number {
  if (card.suit === Suit.HEARTS && card.rank === 1) {
    return card.aceIsHigh ? 14 : 0;
  }
  return card.rank === 1 ? 14 : card.rank;
}

export function PlayArea({ playedCards, players, winnerId }: PlayAreaProps) {
  const getPlayerName = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    return player?.nickname || "???";
  };

  // Calculate current leader in real-time (before trick is complete)
  const currentWinnerId = useMemo(() => {
    // If server determined winner (trick complete), use that
    if (winnerId) return winnerId;
    if (playedCards.length === 0) return null;

    // Calculate current leader from cards played so far
    let winner = playedCards[0];
    for (let i = 1; i < playedCards.length; i++) {
      const challenger = playedCards[i];
      const winnerPower = SUIT_POWER[winner.suit];
      const challengerPower = SUIT_POWER[challenger.suit];

      if (challengerPower > winnerPower) {
        winner = challenger;
      } else if (challengerPower === winnerPower) {
        if (getEffectiveRank(challenger) > getEffectiveRank(winner)) {
          winner = challenger;
        }
      }
    }
    return winner.playerId;
  }, [playedCards, winnerId]);

  // Is this the final winner (trick complete) or just current leader?
  const isFinalWinner = !!winnerId;

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
    <div className="flex flex-col items-center gap-2 sm:gap-3">
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
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {playedCards.map((card) => {
          const isCurrentLeader = currentWinnerId === card.playerId;
          const isWinner = isFinalWinner && isCurrentLeader;

          return (
            <div
              key={card.id}
              className={cn(
                "flex flex-col items-center gap-1 sm:gap-2 transition-all",
                isCurrentLeader && "scale-105 sm:scale-110"
              )}
            >
              <div className={cn(
                "relative rounded-lg",
                isWinner && "ring-4 ring-yellow-400",
                isCurrentLeader && !isWinner && "ring-2 ring-yellow-400/70"
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
                isCurrentLeader ? "text-yellow-400 font-bold" : "text-green-200"
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

      {/* Current leader label (not final winner) */}
      {currentWinnerId && !isFinalWinner && playedCards.length > 1 && (
        <div className="text-yellow-400/80 text-xs sm:text-sm mt-1">
          {getPlayerName(currentWinnerId)} sta vincendo questa mano
        </div>
      )}
    </div>
  );
}
