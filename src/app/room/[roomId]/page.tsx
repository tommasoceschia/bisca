"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useGameRoom } from "@/hooks/useGameRoom";
import { Hand, BlindHand } from "@/components/game/Hand";
import { PlayArea } from "@/components/game/PlayArea";
import { BettingPanel } from "@/components/game/BettingPanel";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { AceChoiceModal } from "@/components/game/AceChoiceModal";
import { GamePhase, Card } from "@/types/game";
import { isAceOfHearts } from "@/lib/game/suit-hierarchy";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const { roomId } = use(params);
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Card waiting for ace choice
  const [pendingAceCard, setPendingAceCard] = useState<Card | null>(null);

  useEffect(() => {
    const savedNickname = localStorage.getItem("bisca_nickname");
    const savedIsHost = localStorage.getItem("bisca_is_host") === "true";

    // playerId unico per sessione/tab (sessionStorage)
    let savedPlayerId = sessionStorage.getItem("bisca_player_id");
    if (!savedPlayerId) {
      // Genera nuovo ID basato su nickname + timestamp
      savedPlayerId = `${savedNickname}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      sessionStorage.setItem("bisca_player_id", savedPlayerId);
    }

    if (!savedNickname) {
      router.push("/");
      return;
    }

    setNickname(savedNickname);
    setPlayerId(savedPlayerId);
    setIsHost(savedIsHost);
    setInitialized(true);
  }, [router]);

  const {
    players,
    gameState,
    myPlayer,
    connected,
    error,
    startGame,
    placeBet,
    playCard,
  } = useGameRoom({
    roomCode: roomId,
    playerId,
    nickname,
  });

  const handleCardClick = (card: Card) => {
    if (!gameState || gameState.currentPlayerId !== playerId) return;
    if (gameState.phase !== GamePhase.PLAYING) return;

    // Se è l'Asso di Cuori, chiedi alto/basso
    if (isAceOfHearts(card)) {
      setPendingAceCard(card);
      return;
    }

    playCard(card);
  };

  const handleAceChoice = (isHigh: boolean) => {
    if (pendingAceCard) {
      playCard(pendingAceCard, isHigh);
      setPendingAceCard(null);
    }
  };

  const handleBlindCardClick = (index: number) => {
    if (!gameState || !myPlayer || gameState.currentPlayerId !== playerId) return;
    if (gameState.phase !== GamePhase.PLAYING) return;

    const card = myPlayer.hand[index];
    if (!card) return;

    // In blind round, non possiamo vedere la carta, ma se è l'asso di cuori
    // il sistema lo gestirà (potremmo non saperlo!)
    // Per semplicità, in blind round l'asso di cuori è sempre alto
    playCard(card, true);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white">Caricamento...</div>
      </div>
    );
  }

  const isMyTurn = gameState?.currentPlayerId === playerId;
  const showBettingPanel = gameState?.phase === GamePhase.BETTING && isMyTurn;

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/lobby")}
            className="text-green-300 hover:text-white text-sm"
          >
            ← Esci
          </button>
          <div className="bg-black/30 px-4 py-2 rounded-lg">
            <span className="text-green-200 text-sm">Codice: </span>
            <span className="text-white font-mono font-bold tracking-widest">{roomId}</span>
          </div>
        </div>

        <div className={cn(
          "px-3 py-1 rounded-full text-sm",
          connected ? "bg-green-500/30 text-green-300" : "bg-red-500/30 text-red-300"
        )}>
          {connected ? "Connesso" : "Disconnesso"}
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Waiting room */}
        {(!gameState || gameState.phase === GamePhase.WAITING) && (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md w-full text-center">
              <h2 className="text-2xl font-bold text-white mb-6">Sala d'attesa</h2>

              <div className="mb-6">
                <div className="text-green-200 mb-2">Giocatori ({players.length}):</div>
                <div className="space-y-2">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center justify-between px-4 py-2 rounded-lg",
                        p.id === playerId ? "bg-green-500/30" : "bg-white/10"
                      )}
                    >
                      <span className="text-white">
                        {p.nickname}
                        {p.isHost && " 👑"}
                      </span>
                      <span className={cn(
                        "text-xs",
                        p.connected ? "text-green-400" : "text-red-400"
                      )}>
                        {p.connected ? "online" : "offline"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {isHost && (
                <button
                  onClick={startGame}
                  disabled={players.length < 2}
                  className="w-full py-3 px-6 bg-green-500 hover:bg-green-400 disabled:bg-green-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {players.length < 2 ? "Servono almeno 2 giocatori" : "Inizia Partita"}
                </button>
              )}

              {!isHost && (
                <p className="text-green-200/70">
                  In attesa che l'host avvii la partita...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Game in progress */}
        {gameState && gameState.phase !== GamePhase.WAITING && (
          <>
            {/* Header row with turn indicator and scoreboard */}
            <div className="flex items-start justify-between px-4 py-2 gap-4">
              {/* Turn indicator */}
              <div className="flex-1">
              {gameState.phase === GamePhase.BETTING && (
                <div className="text-green-200">
                  {isMyTurn ? (
                    <span className="text-yellow-400 font-bold">Tocca a te scommettere!</span>
                  ) : (
                    <span>
                      In attesa di{" "}
                      {gameState.players.find((p) => p.id === gameState.currentPlayerId)?.nickname}
                      ...
                    </span>
                  )}
                </div>
              )}
              {gameState.phase === GamePhase.PLAYING && (
                <div className="text-green-200">
                  {isMyTurn ? (
                    <span className="text-yellow-400 font-bold">Tocca a te giocare!</span>
                  ) : (
                    <span>
                      In attesa di{" "}
                      {gameState.players.find((p) => p.id === gameState.currentPlayerId)?.nickname}
                      ...
                    </span>
                  )}
                </div>
              )}
              {gameState.phase === GamePhase.ROUND_END && (
                <div className="text-yellow-400 font-bold">Round terminato!</div>
              )}
              {gameState.phase === GamePhase.GAME_END && (
                <div className="text-yellow-400 font-bold text-2xl">Partita terminata!</div>
              )}
              </div>

              {/* Scoreboard */}
              <ScoreBoard
                players={gameState.players}
                currentRound={gameState.currentRound}
                showBets={gameState.phase !== GamePhase.BETTING}
              />
            </div>

            {/* Play area */}
            <div className="flex-1 flex items-center justify-center p-4">
              <PlayArea
                playedCards={gameState.currentTrick.cards}
                players={gameState.players}
                winnerId={gameState.currentTrick.winnerId}
              />
            </div>

            {/* Betting panel */}
            {showBettingPanel && (
              <div className="p-4">
                <BettingPanel
                  cardsPerPlayer={gameState.cardsPerPlayer}
                  currentTotalBets={gameState.totalBets}
                  onPlaceBet={placeBet}
                />
              </div>
            )}

            {/* My hand */}
            <div className="p-4 bg-black/20">
              {gameState.isBlindRound ? (
                <BlindHand
                  cardCount={myPlayer?.hand.length || 0}
                  disabled={!isMyTurn || gameState.phase !== GamePhase.PLAYING}
                  onCardClick={handleBlindCardClick}
                />
              ) : (
                <Hand
                  cards={myPlayer?.hand || []}
                  disabled={!isMyTurn || gameState.phase !== GamePhase.PLAYING}
                  onCardClick={handleCardClick}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Ace of Hearts modal */}
      {pendingAceCard && (
        <AceChoiceModal onChoice={handleAceChoice} />
      )}
    </main>
  );
}
