"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalGame } from "@/hooks/useLocalGame";
import { Hand, BlindHand } from "@/components/game/Hand";
import { PlayArea } from "@/components/game/PlayArea";
import { BettingPanel } from "@/components/game/BettingPanel";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { SuitRanking } from "@/components/game/SuitRanking";
import { RoundResultModal } from "@/components/game/RoundResultModal";
import { GamePhase, Card, AIDifficulty } from "@/types/game";
import { isAceOfHearts } from "@/lib/game/suit-hierarchy";
import { cn } from "@/lib/utils";

interface LocalConfig {
  aiCount: number;
  difficulty: AIDifficulty;
}

export default function LocalRoomPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [config, setConfig] = useState<LocalConfig | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Card waiting for ace choice
  const [pendingAceCard, setPendingAceCard] = useState<Card | null>(null);

  // Prevent double card plays
  const [isPlayingCard, setIsPlayingCard] = useState(false);

  useEffect(() => {
    const savedNickname = localStorage.getItem("bisca_nickname");
    if (!savedNickname) {
      router.push("/");
      return;
    }

    let savedPlayerId = localStorage.getItem("bisca_player_id");
    if (!savedPlayerId) {
      savedPlayerId = `${savedNickname}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      localStorage.setItem("bisca_player_id", savedPlayerId);
    }

    // Get config from sessionStorage
    const configStr = sessionStorage.getItem("bisca_local_config");
    if (!configStr) {
      router.push("/local");
      return;
    }

    const parsedConfig = JSON.parse(configStr) as LocalConfig;

    setNickname(savedNickname);
    setPlayerId(savedPlayerId);
    setConfig(parsedConfig);
    setInitialized(true);
  }, [router]);

  const {
    players,
    gameState,
    myPlayer,
    startGame,
    placeBet,
    playCard,
    markReady,
  } = useLocalGame({
    playerId: playerId || "temp",
    nickname: nickname || "Player",
    aiCount: config?.aiCount ?? 2,
    aiDifficulty: config?.difficulty ?? "medium",
  });

  // Start game automatically when initialized
  useEffect(() => {
    if (initialized && !gameStarted && gameState?.phase === GamePhase.WAITING) {
      startGame();
      setGameStarted(true);
    }
  }, [initialized, gameStarted, gameState?.phase, startGame]);

  // Reset isPlayingCard when it becomes my turn or when a new trick starts
  useEffect(() => {
    if (gameState?.currentPlayerId === playerId && gameState?.phase === GamePhase.PLAYING) {
      setIsPlayingCard(false);
    }
  }, [gameState?.currentPlayerId, gameState?.currentTrick?.cards?.length, gameState?.phase, playerId]);

  const handleCardClick = (card: Card) => {
    if (isPlayingCard) return;
    if (!gameState || gameState.currentPlayerId !== playerId) return;
    if (gameState.phase !== GamePhase.PLAYING) return;

    if (isAceOfHearts(card)) {
      setPendingAceCard(card);
      return;
    }

    setIsPlayingCard(true);
    playCard(card);
  };

  const handleAceChoice = (isHigh: boolean) => {
    if (pendingAceCard) {
      setIsPlayingCard(true);
      playCard(pendingAceCard, isHigh);
      setPendingAceCard(null);
    }
  };

  const handleBlindCardClick = (index: number) => {
    if (isPlayingCard) return;
    if (!gameState || !myPlayer || gameState.currentPlayerId !== playerId) return;
    if (gameState.phase !== GamePhase.PLAYING) return;

    const card = myPlayer.hand[index];
    if (!card) return;

    setIsPlayingCard(true);
    playCard(card, true);
  };

  const handleExit = () => {
    sessionStorage.removeItem("bisca_local_config");
    router.push("/lobby");
  };

  if (!initialized || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white">Caricamento...</div>
      </div>
    );
  }

  const isMyTurn = gameState?.currentPlayerId === playerId;
  const showBettingPanel = gameState?.phase === GamePhase.BETTING && isMyTurn;

  // Get current AI player name if it's their turn
  const currentPlayer = gameState?.players.find(
    (p) => p.id === gameState?.currentPlayerId
  );
  const isAITurn = currentPlayer?.isAI;

  return (
    <main className="h-screen bg-gradient-to-b from-green-800 to-green-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-2 sm:p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={handleExit}
            className="text-green-300 hover:text-white text-xs sm:text-sm"
          >
            ← Esci
          </button>
          <div className="bg-purple-500/30 px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
            <span className="text-purple-200 text-xs sm:text-sm">Locale </span>
            <span className="text-white font-semibold text-xs sm:text-sm">
              vs {config.aiCount} AI
            </span>
          </div>
          <div className="relative">
            <SuitRanking />
          </div>
        </div>

        <div className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-green-500/30 text-green-300">
          ●
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
                      <span className="text-yellow-400 font-bold">
                        Tocca a te scommettere!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="animate-pulse">
                          {currentPlayer?.nickname} sta pensando...
                        </span>
                      </span>
                    )}
                  </div>
                )}
                {gameState.phase === GamePhase.PLAYING && (
                  <div className="text-green-200">
                    {isMyTurn ? (
                      <span className="text-yellow-400 font-bold">Tocca a te!</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="animate-pulse">
                          {currentPlayer?.nickname} sta pensando...
                        </span>
                      </span>
                    )}
                  </div>
                )}
                {gameState.phase === GamePhase.ROUND_END && (
                  <div className="text-yellow-400 font-bold">Round terminato!</div>
                )}
                {gameState.phase === GamePhase.GAME_END && (
                  <div className="text-yellow-400 font-bold text-lg sm:text-2xl">
                    Partita terminata!
                  </div>
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
                  disabled={
                    !isMyTurn ||
                    gameState.phase !== GamePhase.PLAYING ||
                    isPlayingCard
                  }
                  onCardClick={handleBlindCardClick}
                />
              ) : (
                <Hand
                  cards={myPlayer?.hand || []}
                  disabled={
                    !isMyTurn ||
                    gameState.phase !== GamePhase.PLAYING ||
                    isPlayingCard
                  }
                  onCardClick={handleCardClick}
                />
              )}
            </div>
          </div>
        )}

        {/* Loading/Starting state */}
        {(!gameState || gameState.phase === GamePhase.WAITING) && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white text-lg animate-pulse">
              Avvio partita...
            </div>
          </div>
        )}
      </div>

      {/* Prominent turn indicator overlay */}
      {isMyTurn &&
        gameState &&
        (gameState.phase === GamePhase.PLAYING ||
          gameState.phase === GamePhase.BETTING) && (
          <div className="fixed inset-x-0 top-1/4 flex justify-center z-50 pointer-events-none">
            <div className="bg-yellow-500 text-yellow-900 px-6 py-3 sm:px-8 sm:py-4 rounded-2xl shadow-2xl animate-pulse">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold">
                {gameState.phase === GamePhase.BETTING
                  ? "SCOMMETTI!"
                  : "TOCCA A TE!"}
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

      {/* Game End - Play Again button */}
      {gameState?.phase === GamePhase.GAME_END && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-green-900/95 backdrop-blur-sm rounded-xl p-8 max-w-md mx-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Partita Terminata!
            </h2>
            <div className="mb-6">
              <div className="text-green-200 mb-2">Classifica finale:</div>
              <div className="space-y-2">
                {[...gameState.players]
                  .sort((a, b) => b.score - a.score)
                  .map((p, i) => (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center justify-between px-4 py-2 rounded-lg",
                        i === 0
                          ? "bg-yellow-500/30 text-yellow-300"
                          : "bg-white/10 text-white"
                      )}
                    >
                      <span>
                        {i + 1}. {p.nickname} {p.isAI && "🤖"}
                      </span>
                      <span className="font-bold">{p.score} punti</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/local")}
                className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-lg transition-colors"
              >
                Nuova Partita
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-3 px-6 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors"
              >
                Esci
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
