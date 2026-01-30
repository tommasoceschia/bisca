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

const SIZE_CLASSES = {
  sm: "w-12 h-16 text-xs",
  md: "w-16 h-24 text-sm",
  lg: "w-24 h-36 text-base",
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

  if (faceDown) {
    return (
      <div
        className={cn(
          SIZE_CLASSES[size],
          "relative rounded-lg shadow-md border-2 border-blue-800",
          "bg-gradient-to-br from-blue-700 to-blue-900",
          "flex items-center justify-center",
          disabled && "opacity-50"
        )}
      >
        <div className="absolute inset-2 border border-blue-400/30 rounded" />
        <span className="text-blue-300 text-2xl">♠</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        SIZE_CLASSES[size],
        "relative bg-white rounded-lg shadow-md border-2 transition-all duration-200",
        suitColor,
        selected && "ring-2 ring-yellow-400 -translate-y-3 shadow-lg",
        !disabled && !selected && "hover:-translate-y-1 hover:shadow-lg",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer"
      )}
    >
      {/* Top-left corner */}
      <div className="absolute top-1 left-1 flex flex-col items-center leading-tight">
        <span className="font-bold">{rankDisplay}</span>
        <span className="text-lg -mt-1">{suitSymbol}</span>
      </div>

      {/* Center symbol */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-4xl", size === "sm" && "text-2xl", size === "lg" && "text-5xl")}>
          {suitSymbol}
        </span>
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className="absolute bottom-1 right-1 flex flex-col items-center leading-tight rotate-180">
        <span className="font-bold">{rankDisplay}</span>
        <span className="text-lg -mt-1">{suitSymbol}</span>
      </div>

      {/* Asso di Cuori indicator */}
      {card.suit === Suit.HEARTS && card.rank === 1 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-[8px] font-bold text-yellow-900">★</span>
        </div>
      )}
    </button>
  );
}

// Card back component for hidden cards
export function CardBack({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        "relative rounded-lg shadow-md border-2 border-blue-800",
        "bg-gradient-to-br from-blue-700 to-blue-900",
        "flex items-center justify-center"
      )}
    >
      <div className="absolute inset-2 border border-blue-400/30 rounded" />
      <div className="grid grid-cols-3 gap-0.5 opacity-30">
        {[...Array(9)].map((_, i) => (
          <span key={i} className="text-blue-300 text-xs">
            ♠
          </span>
        ))}
      </div>
    </div>
  );
}
