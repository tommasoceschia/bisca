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
    <div className="bg-black/50 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto">
      <h3 className="text-white text-lg font-semibold mb-2 text-center">
        Quante mani prenderai?
      </h3>

      <div className="text-green-300 text-sm text-center mb-4">
        Carte in mano: {cardsPerPlayer} | Scommesse totali: {currentTotalBets}
      </div>

      {forbiddenBet !== null && (
        <div className="text-yellow-400 text-xs text-center mb-4">
          Non puoi scommettere {forbiddenBet} (la somma diventerebbe {cardsPerPlayer})
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {[...Array(cardsPerPlayer + 1)].map((_, bet) => {
          const isAvailable = availableBets.includes(bet);
          const isForbidden = bet === forbiddenBet;

          return (
            <button
              key={bet}
              onClick={() => isAvailable && onPlaceBet(bet)}
              disabled={disabled || !isAvailable}
              className={cn(
                "w-12 h-12 rounded-lg font-bold text-lg transition-all",
                isAvailable && !disabled && "bg-green-600 hover:bg-green-500 text-white cursor-pointer",
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
