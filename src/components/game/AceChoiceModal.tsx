"use client";

import { cn } from "@/lib/utils";

interface AceChoiceModalProps {
  onChoice: (isHigh: boolean) => void;
}

export function AceChoiceModal({ onChoice }: AceChoiceModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-700">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">♥</div>
          <h2 className="text-2xl font-bold text-white mb-2">Asso di Cuori!</h2>
          <p className="text-gray-300">
            Scegli come usare questa carta speciale
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onChoice(true)}
            className={cn(
              "flex flex-col items-center gap-2 p-6 rounded-xl",
              "bg-gradient-to-br from-red-600 to-red-800",
              "hover:from-red-500 hover:to-red-700",
              "text-white transition-all hover:scale-105",
              "border-2 border-red-400/50"
            )}
          >
            <span className="text-3xl">👑</span>
            <span className="font-bold text-lg">ALTO</span>
            <span className="text-sm text-red-200">Batte tutto</span>
          </button>

          <button
            onClick={() => onChoice(false)}
            className={cn(
              "flex flex-col items-center gap-2 p-6 rounded-xl",
              "bg-gradient-to-br from-blue-600 to-blue-800",
              "hover:from-blue-500 hover:to-blue-700",
              "text-white transition-all hover:scale-105",
              "border-2 border-blue-400/50"
            )}
          >
            <span className="text-3xl">🐭</span>
            <span className="font-bold text-lg">BASSO</span>
            <span className="text-sm text-blue-200">Perde contro tutti</span>
          </button>
        </div>

        <p className="text-gray-500 text-xs text-center mt-6">
          Alto: batte Re di Cuori | Basso: perde contro Asso di Picche
        </p>
      </div>
    </div>
  );
}
