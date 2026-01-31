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
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

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
  const playingRef = useRef(false); // Debounce for card plays
  const bettingRef = useRef(false); // Debounce for bets

  useEffect(() => {
    // Connect to socket server with custom path for basePath support
    const socketPath = BASE_PATH ? `${BASE_PATH}/socket.io/` : "/socket.io/";
    const socket = io(SOCKET_URL, {
      path: socketPath,
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

    // Join error handler (room full or game already started)
    socket.on("join_error", ({ message }) => {
      console.error("Join error:", message);
      setState((prev) => ({ ...prev, error: message }));
    });

    // Game reset (admin action)
    socket.on("game_reset", () => {
      console.log("Game reset by admin");
      setState((prev) => ({ ...prev, gameState: null }));
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
      setState((prev) => {
        // Evita duplicati
        if (prev.players.some((p) => p.id === player.id)) {
          return prev;
        }
        return {
          ...prev,
          players: [...prev.players, player],
        };
      });
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
      // Reset debounce refs when phase changes
      playingRef.current = false;
      bettingRef.current = false;

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
    // Debounce: prevent double bet placement
    if (bettingRef.current) return;
    bettingRef.current = true;

    socketRef.current?.emit("place_bet", { bet });

    // Reset after 1 second
    setTimeout(() => {
      bettingRef.current = false;
    }, 1000);
  }, []);

  const playCard = useCallback((card: Card, aceIsHigh?: boolean) => {
    // Debounce: prevent double card plays
    if (playingRef.current) return;
    playingRef.current = true;

    socketRef.current?.emit("play_card", {
      cardId: card.id,
      aceIsHigh: isAceOfHearts(card) ? aceIsHigh : undefined,
    });

    // Reset after 1 second (server will process and change turn)
    setTimeout(() => {
      playingRef.current = false;
    }, 1000);
  }, []);

  const markReady = useCallback(() => {
    socketRef.current?.emit("player_ready");
  }, []);

  const adminSkip = useCallback((action: "skip_turn" | "skip_round" | "reset_game") => {
    socketRef.current?.emit("admin_skip", { action });
  }, []);

  return {
    ...state,
    startGame,
    placeBet,
    playCard,
    markReady,
    adminSkip,
  };
}
