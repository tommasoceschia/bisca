"use client";

import { cn } from "@/lib/utils";
import { getAvailableBets, getForbiddenBet } from "@/lib/game/betting";

interface BettingPanelProps {
  cardsPerPlayer: number;
  currentTotalBets: number;
  onPlaceBet: (bet: number) => void;
  disabled?: boolean;
}

export function BettingPanel({
  cardsPerPlayer,
  currentTotalBets,
  onPlaceBet,
  disabled = false,
}: BettingPanelProps) {
  const availableBets = getAvailableBets(cardsPerPlayer, currentTotalBets);
  const forbiddenBet = getForbiddenBet(cardsPerPlayer, currentTotalBets);

  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-6 max-w-md mx-auto">
      <h3 className="text-white text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-center">
        Quante mani?
      </h3>

      <div className="text-green-300 text-xs sm:text-sm text-center mb-2 sm:mb-4">
        Carte: {cardsPerPlayer} | Tot: {currentTotalBets}
        {forbiddenBet !== null && (
          <span className="text-yellow-400 ml-2">
            (no {forbiddenBet})
          </span>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {[...Array(cardsPerPlayer + 1)].map((_, bet) => {
          const isAvailable = availableBets.includes(bet);
          const isForbidden = bet === forbiddenBet;

          return (
            <button
              key={bet}
              onClick={() => isAvailable && onPlaceBet(bet)}
              disabled={disabled || !isAvailable}
              className={cn(
                "w-9 h-9 sm:w-12 sm:h-12 rounded-lg font-bold text-base sm:text-lg transition-all",
                isAvailable && !disabled && "bg-green-600 hover:bg-green-500 text-white cursor-pointer active:scale-95",
                isForbidden && "bg-red-900/50 text-red-400 cursor-not-allowed line-through",
                !isAvailable && !isForbidden && "bg-gray-700 text-gray-500 cursor-not-allowed",
                disabled && "opacity-50"
              )}
            >
              {bet}
            </button>
          );
        })}
      </div>
    </div>
  );
}
