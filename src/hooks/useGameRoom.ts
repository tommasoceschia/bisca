"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { GameState, Player, Card, GamePhase } from "@/types/game";
import { isAceOfHearts } from "@/lib/game/suit-hierarchy";

interface UseGameRoomOptions {
  roomCode: string;
  playerId: string;
  nickname: string;
}

interface RoomState {
  players: Player[];
  gameState: GameState | null;
  isHost: boolean;
  myPlayer: Player | null;
  error: string | null;
  connected: boolean;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export function useGameRoom({ roomCode, playerId, nickname }: UseGameRoomOptions) {
  const [state, setState] = useState<RoomState>({
    players: [],
    gameState: null,
    isHost: false,
    myPlayer: null,
    error: null,
    connected: false,
  });

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to socket server
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server");
      setState((prev) => ({ ...prev, connected: true, error: null }));

      // Register player ID for server lookup
      socket.emit("register_player", { playerId });

      // Join room
      socket.emit("join_room", { roomCode, playerId, nickname });
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setState((prev) => ({
        ...prev,
        connected: false,
        error: "Impossibile connettersi al server",
      }));
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setState((prev) => ({ ...prev, connected: false }));
    });

    // Room state (initial)
    socket.on("room_state", ({ players, gameState, isHost }) => {
      setState((prev) => ({
        ...prev,
        players,
        gameState,
        isHost,
        myPlayer: players.find((p: Player) => p.id === playerId) || null,
      }));
    });

    // Player joined
    socket.on("player_joined", ({ player }) => {
      setState((prev) => ({
        ...prev,
        players: [...prev.players, player],
      }));
    });

    // Player disconnected
    socket.on("player_disconnected", ({ playerId: disconnectedId }) => {
      setState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === disconnectedId ? { ...p, connected: false } : p
        ),
      }));
    });

    // Game state update
    socket.on("game_state", (gameState: GameState) => {
      setState((prev) => ({
        ...prev,
        gameState,
        players: gameState.players,
        myPlayer: gameState.players.find((p) => p.id === playerId) || null,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [roomCode, playerId, nickname]);

  // Game actions
  const startGame = useCallback(() => {
    socketRef.current?.emit("start_game");
  }, []);

  const placeBet = useCallback((bet: number) => {
    socketRef.current?.emit("place_bet", { bet });
  }, []);

  const playCard = useCallback((card: Card, aceIsHigh?: boolean) => {
    socketRef.current?.emit("play_card", {
      cardId: card.id,
      aceIsHigh: isAceOfHearts(card) ? aceIsHigh : undefined,
    });
  }, []);

  return {
    ...state,
    startGame,
    placeBet,
    playCard,
  };
}
