"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function SuitRanking() {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="text-xs">
      {/* Always visible suit ranking */}
      <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg">
        <span className="text-red-500 font-bold">♥</span>
        <span className="text-green-400">&gt;</span>
        <span className="text-red-500 font-bold">♦</span>
        <span className="text-green-400">&gt;</span>
        <span className="text-gray-300 font-bold">♣</span>
        <span className="text-green-400">&gt;</span>
        <span className="text-gray-300 font-bold">♠</span>
        <button
          onClick={() => setShowRules(!showRules)}
          className="ml-2 text-green-300 hover:text-white transition-colors"
          title="Mostra regole"
        >
          {showRules ? "✕" : "?"}
        </button>
      </div>

      {/* Expandable rules */}
      {showRules && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-black/90 backdrop-blur-sm rounded-lg p-3 text-green-200 w-72 shadow-xl border border-green-800/50">
          <h4 className="font-bold text-white mb-2">Regole Rapide</h4>

          <div className="space-y-2 text-[11px]">
            <div>
              <span className="text-green-400">Semi:</span>{" "}
              <span className="text-red-400">♥</span> &gt;{" "}
              <span className="text-red-400">♦</span> &gt;{" "}
              <span className="text-gray-300">♣</span> &gt;{" "}
              <span className="text-gray-300">♠</span>
            </div>

            <div>
              <span className="text-green-400">Carte:</span>{" "}
              A &gt; K &gt; Q &gt; J &gt; 10...2
            </div>

            <div>
              <span className="text-green-400">Asso ♥:</span>{" "}
              Scegli ALTO (batte tutto) o BASSO (perde tutto)
            </div>

            <div>
              <span className="text-green-400">Scommesse:</span>{" "}
              La somma non può mai essere = carte in mano
            </div>

            <div>
              <span className="text-green-400">Punti:</span>{" "}
              Esatto = +bet (0/0 = +1), Sbagliato = -differenza
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
