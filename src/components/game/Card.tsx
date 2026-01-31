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

  // Mobile-first responsive sizes - larger for better visibility
  const sizeClasses = {
    sm: "w-14 h-20 sm:w-16 sm:h-24",
    md: "w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32",
    lg: "w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-36 lg:w-32 lg:h-44",
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
        <span className="font-bold text-xs sm:text-sm md:text-base">{rankDisplay}</span>
        <span className="text-sm sm:text-base md:text-lg -mt-0.5">{suitSymbol}</span>
      </div>

      {/* Center symbol */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl sm:text-4xl md:text-5xl">{suitSymbol}</span>
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 flex flex-col items-center leading-none rotate-180">
        <span className="font-bold text-xs sm:text-sm md:text-base">{rankDisplay}</span>
        <span className="text-sm sm:text-base md:text-lg -mt-0.5">{suitSymbol}</span>
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
    sm: "w-14 h-20 sm:w-16 sm:h-24",
    md: "w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32",
    lg: "w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-36 lg:w-32 lg:h-44",
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
      <span className="text-blue-300 text-xl sm:text-2xl">♠</span>
    </div>
  );
}
