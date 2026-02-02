"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useGameRoom } from "@/hooks/useGameRoom";
import { Hand, BlindHand } from "@/components/game/Hand";
import { PlayArea } from "@/components/game/PlayArea";
import { BettingPanel } from "@/components/game/BettingPanel";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { SuitRanking } from "@/components/game/SuitRanking";
import { RoundResultModal } from "@/components/game/RoundResultModal";
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
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Card waiting for ace choice
  const [pendingAceCard, setPendingAceCard] = useState<Card | null>(null);

  // Prevent double card plays - cards disabled immediately on click
  const [isPlayingCard, setIsPlayingCard] = useState(false);

  useEffect(() => {
    const savedNickname = localStorage.getItem("bisca_nickname");
    const savedIsHost = localStorage.getItem("bisca_is_host") === "true";

    // Fix 8: Use localStorage for playerId to enable reconnection across tabs/refreshes
    let savedPlayerId = localStorage.getItem("bisca_player_id");
    if (!savedPlayerId) {
      // Generate new ID based on nickname + timestamp
      savedPlayerId = `${savedNickname}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      localStorage.setItem("bisca_player_id", savedPlayerId);
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
    markReady,
    adminSkip,
  } = useGameRoom({
    roomCode: roomId,
    playerId,
    nickname,
  });

  // Fix 5: Reset isPlayingCard only when it becomes MY turn (not when any player plays)
  useEffect(() => {
    if (gameState?.currentPlayerId === playerId) {
      setIsPlayingCard(false);
    }
  }, [gameState?.currentPlayerId, playerId]);

  const handleCardClick = (card: Card) => {
    // Prevent any interaction if already playing a card
    if (isPlayingCard) return;
    if (!gameState || gameState.currentPlayerId !== playerId) return;
    if (gameState.phase !== GamePhase.PLAYING) return;

    // Se è l'Asso di Cuori, chiedi alto/basso
    if (isAceOfHearts(card)) {
      setPendingAceCard(card);
      return;
    }

    // Immediately disable all cards
    setIsPlayingCard(true);
    playCard(card);
  };

  const handleAceChoice = (isHigh: boolean) => {
    if (pendingAceCard) {
      // Immediately disable all cards
      setIsPlayingCard(true);
      playCard(pendingAceCard, isHigh);
      setPendingAceCard(null);
    }
  };

  const handleBlindCardClick = (index: number) => {
    // Prevent any interaction if already playing a card
    if (isPlayingCard) return;
    if (!gameState || !myPlayer || gameState.currentPlayerId !== playerId) return;
    if (gameState.phase !== GamePhase.PLAYING) return;

    const card = myPlayer.hand[index];
    if (!card) return;

    // Immediately disable all cards
    setIsPlayingCard(true);

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
    <main className="h-screen bg-gradient-to-b from-green-800 to-green-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-2 sm:p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => router.push("/lobby")}
            className="text-green-300 hover:text-white text-xs sm:text-sm"
          >
            ← Esci
          </button>
          <div className="bg-black/30 px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
            <span className="text-green-200 text-xs sm:text-sm">Codice: </span>
            <span className="text-white font-mono font-bold tracking-widest text-xs sm:text-sm">{roomId}</span>
          </div>
          {/* Suit ranking - always visible */}
          <div className="relative">
            <SuitRanking />
          </div>
        </div>

        <div className={cn(
          "px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm",
          connected ? "bg-green-500/30 text-green-300" : "bg-red-500/30 text-red-300"
        )}>
          {connected ? "●" : "○"}
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200">
          {error}
        </div>
      )}

      {/* Fix 10: Reconnection overlay */}
      {!connected && !error && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-green-900/90 border border-green-500/50 rounded-xl p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white text-lg">Riconnessione in corso...</p>
            <p className="text-green-300 text-sm mt-2">Attendere prego</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Waiting room */}
        {(!gameState || gameState.phase === GamePhase.WAITING) && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-8 max-w-md w-full text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Sala d'attesa</h2>

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
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header row with turn indicator and scoreboard */}
            <div className="flex items-start justify-between px-2 sm:px-4 py-1 sm:py-2 gap-2 sm:gap-4 shrink-0">
              {/* Turn indicator */}
              <div className="flex-1 text-xs sm:text-sm">
              {gameState.phase === GamePhase.BETTING && (
                <div className="text-green-200">
                  {isMyTurn ? (
                    <span className="text-yellow-400 font-bold">Tocca a te scommettere!</span>
                  ) : (
                    <span>
                      Attesa:{" "}
                      {gameState.players.find((p) => p.id === gameState.currentPlayerId)?.nickname}
                    </span>
                  )}
                </div>
              )}
              {gameState.phase === GamePhase.PLAYING && (
                <div className="text-green-200">
                  {isMyTurn ? (
                    <span className="text-yellow-400 font-bold">Tocca a te!</span>
                  ) : (
                    <span>
                      Attesa:{" "}
                      {gameState.players.find((p) => p.id === gameState.currentPlayerId)?.nickname}
                    </span>
                  )}
                </div>
              )}
              {gameState.phase === GamePhase.ROUND_END && (
                <div className="text-yellow-400 font-bold">Round terminato!</div>
              )}
              {gameState.phase === GamePhase.GAME_END && (
                <div className="text-yellow-400 font-bold text-lg sm:text-2xl">Partita terminata!</div>
              )}
              </div>

              {/* Scoreboard */}
              <ScoreBoard
                players={gameState.players}
                currentRound={gameState.currentRound}
                isBettingPhase={gameState.phase === GamePhase.BETTING}
                playOrder={gameState.playOrder}
              />
            </div>

            {/* Play area */}
            <div className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0">
              <PlayArea
                playedCards={gameState.currentTrick.cards}
                players={gameState.players}
                winnerId={gameState.currentTrick.winnerId}
              />
            </div>

            {/* Betting panel */}
            {showBettingPanel && (
              <div className="p-2 sm:p-4 shrink-0">
                <BettingPanel
                  cardsPerPlayer={gameState.cardsPerPlayer}
                  currentTotalBets={gameState.totalBets}
                  onPlaceBet={placeBet}
                />
              </div>
            )}

            {/* My hand */}
            <div className="p-2 sm:p-4 bg-black/20 shrink-0">
              {gameState.isBlindRound ? (
                <BlindHand
                  cardCount={myPlayer?.hand.length || 0}
                  disabled={!isMyTurn || gameState.phase !== GamePhase.PLAYING || isPlayingCard}
                  onCardClick={handleBlindCardClick}
                />
              ) : (
                <Hand
                  cards={myPlayer?.hand || []}
                  disabled={!isMyTurn || gameState.phase !== GamePhase.PLAYING || isPlayingCard}
                  onCardClick={handleCardClick}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin panel toggle button (host only, during game) */}
      {isHost && gameState && gameState.phase !== GamePhase.WAITING && (
        <div className="fixed top-16 right-4 z-30">
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shadow-lg",
              showAdminPanel
                ? "bg-red-600 text-white"
                : "bg-red-900/80 text-red-200 hover:bg-red-800"
            )}
            title="Pannello Admin"
          >
            ⚙
          </button>

          {/* Admin panel dropdown */}
          {showAdminPanel && (
            <div className="absolute top-12 right-0 bg-red-900/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-red-700/50 min-w-[140px]">
              <div className="text-red-200 text-xs mb-2 font-semibold">Admin</div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { adminSkip("skip_turn"); setShowAdminPanel(false); }}
                  className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors text-left"
                >
                  Salta Turno
                </button>
                <button
                  onClick={() => { adminSkip("skip_round"); setShowAdminPanel(false); }}
                  className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors text-left"
                >
                  Salta Round
                </button>
                <button
                  onClick={() => { adminSkip("reset_game"); setShowAdminPanel(false); }}
                  className="px-3 py-2 bg-red-800 hover:bg-red-700 text-white text-sm rounded transition-colors text-left"
                >
                  Reset Partita
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prominent turn indicator overlay */}
      {isMyTurn && gameState && (gameState.phase === GamePhase.PLAYING || gameState.phase === GamePhase.BETTING) && (
        <div className="fixed inset-x-0 top-1/4 flex justify-center z-50 pointer-events-none">
          <div className="bg-yellow-500 text-yellow-900 px-6 py-3 sm:px-8 sm:py-4 rounded-2xl shadow-2xl animate-pulse">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold">
              {gameState.phase === GamePhase.BETTING ? "SCOMMETTI!" : "TOCCA A TE!"}
            </span>
          </div>
        </div>
      )}

      {/* Ace of Hearts choice modal */}
      {pendingAceCard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm mx-4 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Asso di Cuori</h2>
            <p className="text-gray-300 mb-4">Come vuoi giocare l&apos;Asso?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleAceChoice(true)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
              >
                Alto (14)
              </button>
              <button
                onClick={() => handleAceChoice(false)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors"
              >
                Basso (0)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round Result modal */}
      {gameState?.phase === GamePhase.ROUND_END && (
        <RoundResultModal
          players={gameState.players}
          currentRound={gameState.currentRound}
          readyPlayers={gameState.readyForNextRound || []}
          currentPlayerId={playerId}
          onReady={markReady}
        />
      )}
    </main>
  );
}
