"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AIDifficulty } from "@/types/game";
import { cn } from "@/lib/utils";

const AI_NAMES = [
  "Marco", "Giulia", "Alessandro", "Francesca",
  "Luca", "Elena", "Andrea", "Chiara",
];

const DIFFICULTY_INFO: Record<AIDifficulty, { label: string; description: string }> = {
  easy: {
    label: "Facile",
    description: "Decisioni casuali, ideale per principianti",
  },
  medium: {
    label: "Medio",
    description: "Strategia base, gioco ragionato",
  },
  hard: {
    label: "Difficile",
    description: "Gioco ottimale, conta le carte",
  },
};

export default function LocalSetupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [aiCount, setAiCount] = useState(2);
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");

  useEffect(() => {
    const savedNickname = localStorage.getItem("bisca_nickname");
    if (!savedNickname) {
      router.push("/");
      return;
    }
    setNickname(savedNickname);

    let id = localStorage.getItem("bisca_player_id");
    if (!id) {
      id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("bisca_player_id", id);
    }
    setPlayerId(id);
  }, [router]);

  const handleStartGame = () => {
    // Store config in sessionStorage for the local-room page
    sessionStorage.setItem(
      "bisca_local_config",
      JSON.stringify({ aiCount, difficulty })
    );
    router.push("/local-room");
  };

  const previewNames = AI_NAMES.slice(0, aiCount);

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 pt-[calc(var(--sai-top)_+_1rem)] pb-[calc(var(--sai-bottom)_+_1rem)] pl-[calc(var(--sai-left)_+_1rem)] pr-[calc(var(--sai-right)_+_1rem)]">
      <div className="max-w-2xl mx-auto pt-8 sm:pt-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Partita Locale
          </h1>
          <p className="text-green-200">
            Gioca contro l'intelligenza artificiale
          </p>
        </div>

        {/* AI Count */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Numero avversari AI
          </h2>
          <div className="flex gap-3 justify-center">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => setAiCount(count)}
                className={cn(
                  "w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-xl sm:text-2xl font-bold transition-all",
                  aiCount === count
                    ? "bg-green-500 text-white shadow-lg scale-110"
                    : "bg-white/20 text-green-200 hover:bg-white/30"
                )}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="text-green-200/70 text-sm text-center mt-3">
            {aiCount + 1} giocatori totali (tu + {aiCount} AI)
          </p>
        </div>

        {/* Difficulty */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Difficoltà
          </h2>
          <div className="space-y-3">
            {(Object.keys(DIFFICULTY_INFO) as AIDifficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={cn(
                  "w-full p-4 rounded-xl text-left transition-all",
                  difficulty === level
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-white/10 text-green-200 hover:bg-white/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      difficulty === level
                        ? "border-white"
                        : "border-green-400"
                    )}
                  >
                    {difficulty === level && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {DIFFICULTY_INFO[level].label}
                    </div>
                    <div
                      className={cn(
                        "text-sm",
                        difficulty === level
                          ? "text-green-100"
                          : "text-green-300/70"
                      )}
                    >
                      {DIFFICULTY_INFO[level].description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Player Preview */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Giocatori
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-green-500/30">
              <span className="text-white font-medium">
                {nickname} (Tu) 👑
              </span>
            </div>
            {previewNames.map((name, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/10"
              >
                <span className="text-green-200">
                  {name} 🤖
                </span>
                <span className="text-green-300/70 text-sm">
                  {DIFFICULTY_INFO[difficulty].label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartGame}
          className="w-full py-4 px-6 bg-green-500 hover:bg-green-400 text-white text-xl font-bold rounded-xl transition-colors shadow-lg"
        >
          Inizia Partita
        </button>

        {/* Back */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/lobby")}
            className="text-green-300/70 hover:text-green-200 text-sm"
          >
            ← Torna alla lobby
          </button>
        </div>
      </div>
    </main>
  );
}
