"use client";

import { useState } from "react";

export function SuitRanking() {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="text-sm">
      {/* Always visible suit ranking */}
      <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg">
        <span className="text-red-500 font-bold text-base">♥</span>
        <span className="text-green-400">&gt;</span>
        <span className="text-red-500 font-bold text-base">♦</span>
        <span className="text-green-400">&gt;</span>
        <span className="text-gray-300 font-bold text-base">♣</span>
        <span className="text-green-400">&gt;</span>
        <span className="text-gray-300 font-bold text-base">♠</span>
        <button
          onClick={() => setShowRules(!showRules)}
          className="ml-2 w-6 h-6 bg-green-700 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors font-bold text-xs"
          title="Mostra regole"
        >
          {showRules ? "✕" : "?"}
        </button>
      </div>

      {/* Expandable rules - positioned to stay on screen */}
      {showRules && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-black/95 backdrop-blur-sm rounded-lg p-4 text-green-200 w-72 max-w-[90vw] shadow-xl border border-green-700/50">
          <h4 className="font-bold text-white mb-3 text-base">Regole Rapide</h4>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-green-400 font-semibold">Semi:</span>{" "}
              <span className="text-red-400">♥</span> &gt;{" "}
              <span className="text-red-400">♦</span> &gt;{" "}
              <span className="text-gray-300">♣</span> &gt;{" "}
              <span className="text-gray-300">♠</span>
            </div>

            <div>
              <span className="text-green-400 font-semibold">Carte:</span>{" "}
              A &gt; K &gt; Q &gt; J &gt; 10...2
            </div>

            <div>
              <span className="text-green-400 font-semibold">Asso ♥:</span>{" "}
              Scegli ALTO (batte tutto) o BASSO (perde tutto)
            </div>

            <div>
              <span className="text-green-400 font-semibold">Scommesse:</span>{" "}
              La somma non può mai essere = carte in mano
            </div>

            <div>
              <span className="text-green-400 font-semibold">Punti:</span>{" "}
              Esatto = +bet (0/0 = +1), Sbagliato = -differenza
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
