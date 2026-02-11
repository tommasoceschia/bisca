"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [nickname, setNickname] = useState("");
  const router = useRouter();

  const handleJoinLobby = () => {
    if (nickname.trim()) {
      localStorage.setItem("bisca_nickname", nickname.trim());
      router.push("/lobby");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 flex flex-col items-center justify-center pt-[calc(var(--sai-top)_+_1rem)] pb-[calc(var(--sai-bottom)_+_1rem)] pl-[calc(var(--sai-left)_+_1rem)] pr-[calc(var(--sai-right)_+_1rem)]">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white mb-4">Bisca</h1>
        <p className="text-green-200 text-xl">Gioco di Carte Online</p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 w-full max-w-md">
        <div className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-green-100 mb-2">
              Il tuo nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinLobby()}
              placeholder="Inserisci il tuo nome..."
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-green-200/50 border border-green-400/30 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
              maxLength={20}
            />
          </div>

          <button
            onClick={handleJoinLobby}
            disabled={!nickname.trim()}
            className="w-full py-3 px-6 bg-green-500 hover:bg-green-400 disabled:bg-green-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            Entra nella Lobby
          </button>
        </div>
      </div>

      <div className="mt-12 text-green-300/70 text-sm max-w-md text-center">
        <p>
          Bisca si gioca con carte da ramino. I cuori battono sempre, poi quadri,
          fiori e infine picche.
        </p>
      </div>
    </main>
  );
}
