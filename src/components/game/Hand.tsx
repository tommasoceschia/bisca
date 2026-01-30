"use client";

import { cn } from "@/lib/utils";
import { Card as CardType } from "@/types/game";
import { Card } from "./Card";

interface HandProps {
  cards: CardType[];
  selectedCardId?: string;
  disabled?: boolean;
  onCardClick?: (card: CardType) => void;
}

export function Hand({ cards, selectedCardId, disabled = false, onCardClick }: HandProps) {
  if (cards.length === 0) {
    return (
      <div className="flex justify-center items-center h-24 text-green-300/50">
        Nessuna carta in mano
      </div>
    );
  }

  return (
    <div className="flex justify-center items-end px-2 overflow-x-auto">
      <div className="flex gap-1 sm:gap-2 md:gap-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className={cn(
              "transition-all duration-200 flex-shrink-0",
              selectedCardId === card.id && "z-10"
            )}
          >
            <Card
              card={card}
              selected={selectedCardId === card.id}
              disabled={disabled}
              onClick={() => onCardClick?.(card)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Blind hand - player can see card backs, others see their cards
interface BlindHandProps {
  cardCount: number;
  selectedIndex?: number;
  disabled?: boolean;
  onCardClick?: (index: number) => void;
}

export function BlindHand({ cardCount, selectedIndex, disabled = false, onCardClick }: BlindHandProps) {
  if (cardCount === 0) {
    return (
      <div className="flex justify-center items-center h-24 text-green-300/50">
        Nessuna carta in mano
      </div>
    );
  }

  return (
    <div className="flex justify-center items-end gap-2 px-2">
      {[...Array(cardCount)].map((_, index) => (
        <button
          key={index}
          disabled={disabled}
          onClick={() => onCardClick?.(index)}
          className={cn(
            "w-16 h-24 sm:w-20 sm:h-28 rounded-lg shadow-md border-2 border-blue-800",
            "bg-gradient-to-br from-blue-700 to-blue-900",
            "flex items-center justify-center transition-all duration-200 flex-shrink-0",
            selectedIndex === index && "ring-2 ring-yellow-400 -translate-y-3",
            !disabled && "hover:-translate-y-1 hover:shadow-lg cursor-pointer active:scale-95",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="text-center text-blue-300">
            <div className="text-2xl sm:text-3xl mb-1">?</div>
            <div className="text-[10px] sm:text-xs">Carta {index + 1}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
