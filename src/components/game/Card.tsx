"use client";

import { cn } from "@/lib/utils";
import { Card as CardType, Suit, SUIT_SYMBOLS } from "@/types/game";

interface CardProps {
  card: CardType;
  selected?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const SUIT_COLORS: Record<Suit, string> = {
  [Suit.HEARTS]: "text-red-500",
  [Suit.DIAMONDS]: "text-red-500",
  [Suit.CLUBS]: "text-gray-900",
  [Suit.SPADES]: "text-gray-900",
};

function getRankDisplay(rank: number): string {
  switch (rank) {
    case 1:
      return "A";
    case 11:
      return "J";
    case 12:
      return "Q";
    case 13:
      return "K";
    default:
      return rank.toString();
  }
}

export function Card({
  card,
  selected = false,
  disabled = false,
  faceDown = false,
  size = "md",
  onClick,
}: CardProps) {
  const rankDisplay = getRankDisplay(card.rank);
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const suitColor = SUIT_COLORS[card.suit];

  // Mobile-first responsive sizes - more compact for mobile
  const sizeClasses = {
    sm: "w-8 h-11 sm:w-10 sm:h-14",
    md: "w-10 h-14 sm:w-12 sm:h-[4.5rem] md:w-14 md:h-20",
    lg: "w-12 h-[4.5rem] sm:w-14 sm:h-20 md:w-16 md:h-24",
  };

  if (faceDown) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          "relative rounded-lg shadow-md border-2 border-blue-800",
          "bg-gradient-to-br from-blue-700 to-blue-900",
          "flex items-center justify-center",
          disabled && "opacity-50"
        )}
      >
        <div className="absolute inset-1 sm:inset-2 border border-blue-400/30 rounded" />
        <span className="text-blue-300 text-xl sm:text-2xl">♠</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        sizeClasses[size],
        "relative bg-white rounded-lg shadow-md border-2 transition-all duration-200",
        suitColor,
        selected && "ring-2 ring-yellow-400 -translate-y-2 sm:-translate-y-3 shadow-lg",
        !disabled && !selected && "hover:-translate-y-1 hover:shadow-lg active:scale-95",
        disabled && "opacity-60 cursor-not-allowed",
        !disabled && "cursor-pointer"
      )}
    >
      {/* Top-left corner */}
      <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 flex flex-col items-center leading-none">
        <span className="font-bold text-[10px] sm:text-xs md:text-sm">{rankDisplay}</span>
        <span className="text-xs sm:text-sm md:text-base -mt-0.5">{suitSymbol}</span>
      </div>

      {/* Center symbol */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl sm:text-3xl md:text-4xl">{suitSymbol}</span>
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 flex flex-col items-center leading-none rotate-180">
        <span className="font-bold text-[10px] sm:text-xs md:text-sm">{rankDisplay}</span>
        <span className="text-xs sm:text-sm md:text-base -mt-0.5">{suitSymbol}</span>
      </div>

      {/* Asso di Cuori indicator */}
      {card.suit === Suit.HEARTS && card.rank === 1 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-[6px] sm:text-[8px] font-bold text-yellow-900">★</span>
        </div>
      )}
    </button>
  );
}

// Card back component for hidden cards
export function CardBack({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-11 sm:w-10 sm:h-14",
    md: "w-10 h-14 sm:w-12 sm:h-[4.5rem] md:w-14 md:h-20",
    lg: "w-12 h-[4.5rem] sm:w-14 sm:h-20 md:w-16 md:h-24",
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        "relative rounded-lg shadow-md border-2 border-blue-800",
        "bg-gradient-to-br from-blue-700 to-blue-900",
        "flex items-center justify-center"
      )}
    >
      <div className="absolute inset-1 sm:inset-2 border border-blue-400/30 rounded" />
      <span className="text-blue-300 text-lg sm:text-xl">♠</span>
    </div>
  );
}
