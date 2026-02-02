"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { GameState, Player, Card, GamePhase, AIDifficulty } from "@/types/game";
import { LocalGameEngine, LocalGameConfig } from "@/lib/local-game/LocalGameEngine";
import { isAceOfHearts } from "@/lib/game/suit-hierarchy";

interface UseLocalGameOptions {
  playerId: string;
  nickname: string;
  aiCount: number;
  aiDifficulty: AIDifficulty;
}

interface LocalGameState {
  players: Player[];
  gameState: GameState | null;
  isHost: boolean;
  myPlayer: Player | null;
  error: string | null;
  connected: boolean;
}

export function useLocalGame({
  playerId,
  nickname,
  aiCount,
  aiDifficulty,
}: UseLocalGameOptions) {
  const [state, setState] = useState<LocalGameState>({
    players: [],
    gameState: null,
    isHost: true,
    myPlayer: null,
    error: null,
    connected: true, // Always "connected" in local mode
  });

  const engineRef = useRef<LocalGameEngine | null>(null);
  const playingRef = useRef(false);
  const bettingRef = useRef(false);

  useEffect(() => {
    // Create game engine
    const config: LocalGameConfig = {
      humanPlayerId: playerId,
      humanNickname: nickname,
      aiCount,
      aiDifficulty,
    };

    const engine = new LocalGameEngine(config);
    engineRef.current = engine;

    // Get initial state
    const initialState = engine.getState();
    setState({
      players: initialState.players,
      gameState: initialState,
      isHost: true,
      myPlayer: initialState.players.find((p) => p.id === playerId) || null,
      error: null,
      connected: true,
    });

    // Subscribe to state changes
    const unsubscribe = engine.subscribe((gameState) => {
      // Reset debounce refs when state changes
      playingRef.current = false;
      bettingRef.current = false;

      setState({
        players: gameState.players,
        gameState,
        isHost: true,
        myPlayer: gameState.players.find((p) => p.id === playerId) || null,
        error: null,
        connected: true,
      });
    });

    return () => {
      unsubscribe();
      engine.destroy();
    };
  }, [playerId, nickname, aiCount, aiDifficulty]);

  const startGame = useCallback(() => {
    engineRef.current?.startGame();
  }, []);

  const placeBet = useCallback(
    (bet: number) => {
      if (bettingRef.current) return;
      bettingRef.current = true;

      engineRef.current?.placeBet(playerId, bet);

      setTimeout(() => {
        bettingRef.current = false;
      }, 500);
    },
    [playerId]
  );

  const playCard = useCallback(
    (card: Card, aceIsHigh?: boolean) => {
      if (playingRef.current) return;
      playingRef.current = true;

      engineRef.current?.playCard(
        playerId,
        card.id,
        isAceOfHearts(card) ? aceIsHigh : undefined
      );

      setTimeout(() => {
        playingRef.current = false;
      }, 500);
    },
    [playerId]
  );

  const markReady = useCallback(() => {
    engineRef.current?.markReady(playerId);
  }, [playerId]);

  return {
    ...state,
    startGame,
    placeBet,
    playCard,
    markReady,
  };
}
