"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default function LobbyPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [playerId, setPlayerId] = useState("");

  useEffect(() => {
    // Recupera nickname da localStorage
    const savedNickname = localStorage.getItem("bisca_nickname");
    if (!savedNickname) {
      router.push("/");
      return;
    }
    setNickname(savedNickname);

    // Fix 8: Use localStorage for playerId to enable reconnection across tabs/refreshes
    let id = localStorage.getItem("bisca_player_id");
    if (!id) {
      id = generatePlayerId();
      localStorage.setItem("bisca_player_id", id);
    }
    setPlayerId(id);
  }, [router]);

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    // Salva che siamo l'host
    localStorage.setItem("bisca_is_host", "true");
    router.push(`/room/${code}`);
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) {
      setError("Inserisci un codice stanza");
      return;
    }

    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError("Il codice deve essere di 6 caratteri");
      return;
    }

    localStorage.setItem("bisca_is_host", "false");
    router.push(`/room/${code}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 pt-[calc(var(--sai-top)_+_1rem)] pb-[calc(var(--sai-bottom)_+_1rem)] pl-[calc(var(--sai-left)_+_1rem)] pr-[calc(var(--sai-right)_+_1rem)]">
      <div className="max-w-2xl mx-auto pt-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Bisca</h1>
          <p className="text-green-200">
            Benvenuto, <span className="font-semibold">{nickname}</span>!
          </p>
        </div>

        {/* Create Room */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Crea una nuova stanza</h2>
          <p className="text-green-200/80 text-sm mb-4">
            Crea una stanza e condividi il codice con i tuoi amici per giocare insieme.
          </p>
          <button
            onClick={handleCreateRoom}
            className="w-full py-3 px-6 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-lg transition-colors"
          >
            Crea Stanza
          </button>
        </div>

        {/* Local Game */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Gioca in locale</h2>
          <p className="text-green-200/80 text-sm mb-4">
            Gioca offline contro l'intelligenza artificiale. Scegli difficoltà e numero di avversari.
          </p>
          <button
            onClick={() => router.push("/local")}
            className="w-full py-3 px-6 bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-lg transition-colors"
          >
            Modalità Locale
          </button>
        </div>

        {/* Join Room */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Entra in una stanza</h2>
          <p className="text-green-200/80 text-sm mb-4">
            Hai ricevuto un codice? Inseriscilo qui sotto per entrare nella partita.
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              placeholder="CODICE"
              maxLength={6}
              className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white placeholder-green-200/50 border border-green-400/30 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 uppercase tracking-widest text-center text-xl font-mono"
            />
            <button
              onClick={handleJoinRoom}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
            >
              Entra
            </button>
          </div>
        </div>

        {/* Back */}
        <div className="text-center mt-8">
          <button
            onClick={() => {
              localStorage.removeItem("bisca_nickname");
              router.push("/");
            }}
            className="text-green-300/70 hover:text-green-200 text-sm"
          >
            ← Cambia nickname
          </button>
        </div>
      </div>
    </main>
  );
}
