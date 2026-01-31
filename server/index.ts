import * as http from "http";
import { Server, Socket } from "socket.io";

// Types (duplicated to avoid import issues with tsx)
enum Suit {
  HEARTS = "hearts",
  DIAMONDS = "diamonds",
  CLUBS = "clubs",
  SPADES = "spades",
}

enum GamePhase {
  WAITING = "waiting",
  BETTING = "betting",
  PLAYING = "playing",
  ACE_CHOICE = "ace_choice",
  TRICK_END = "trick_end",
  ROUND_END = "round_end",
  GAME_END = "game_end",
}

interface Card {
  id: string;
  suit: Suit;
  rank: number;
}

interface PlayedCard extends Card {
  playerId: string;
  aceIsHigh?: boolean;
}

interface Player {
  id: string;
  nickname: string;
  seatIndex: number;
  hand: Card[];
  bet: number | null;
  tricksWon: number;
  score: number;
  connected: boolean;
  isHost: boolean;
}

interface Trick {
  cards: PlayedCard[];
  leadSuit: Suit | null;
  winnerId: string | null;
}

interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  currentRound: number;
  cardsPerPlayer: number;
  isBlindRound: boolean;
  currentTrick: Trick;
  currentPlayerId: string | null;
  roundLeaderId: string | null;
  totalBets: number;
  aceOfHeartsPending: boolean;
  aceOfHeartsPlayerId: string | null;
  readyForNextRound: string[];
  lastRoundWinnerId: string | null;
  playOrder: string[]; // Order of play (first player leads)
}

// Game logic imports (will be duplicated for server - in production use shared package)
const ROUND_STRUCTURE = [5, 4, 3, 2, 1, 2, 3, 4, 5] as const;

const SUIT_POWER: Record<string, number> = {
  hearts: 4,
  diamonds: 3,
  clubs: 2,
  spades: 1,
};

// Room storage (in-memory)
interface Room {
  code: string;
  players: Map<string, Player>;
  gameState: GameState | null;
  hostId: string | null;
  processingAction: boolean; // Mutex lock to prevent double plays
}

const rooms = new Map<string, Room>();

const MAX_PLAYERS = 10;

// Create HTTP server and Socket.io
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Helper functions
function createDeck(deckCount: number = 1): Card[] {
  const suits: Suit[] = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
  const cards: Card[] = [];

  for (let d = 0; d < deckCount; d++) {
    for (const suit of suits) {
      for (let rank = 1; rank <= 13; rank++) {
        cards.push({
          id: `${suit}-${rank}-${d}`,
          suit,
          rank,
        });
      }
    }
  }

  return shuffle(cards);
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function dealCards(
  deck: Card[],
  playerCount: number,
  cardsPerPlayer: number
): Card[][] {
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  let cardIndex = 0;

  for (let round = 0; round < cardsPerPlayer; round++) {
    for (let player = 0; player < playerCount; player++) {
      if (cardIndex < deck.length) {
        hands[player].push(deck[cardIndex]);
        cardIndex++;
      }
    }
  }

  return hands;
}

function getEffectiveRank(card: PlayedCard): number {
  // Ace of Hearts: can be high (14) or low (0) based on player choice
  if (card.suit === Suit.HEARTS && card.rank === 1) {
    return card.aceIsHigh ? 14 : 0;
  }
  // Regular Aces (non-Hearts): always lowest (rank 1, worse than 2)
  // All other cards keep their rank (2-13)
  return card.rank;
}

function determineTrickWinner(cards: PlayedCard[]): string {
  let winner = cards[0];

  for (let i = 1; i < cards.length; i++) {
    const challenger = cards[i];
    const winnerSuitPower = SUIT_POWER[winner.suit];
    const challengerSuitPower = SUIT_POWER[challenger.suit];

    if (challengerSuitPower > winnerSuitPower) {
      winner = challenger;
    } else if (challengerSuitPower === winnerSuitPower) {
      if (getEffectiveRank(challenger) > getEffectiveRank(winner)) {
        winner = challenger;
      }
    }
  }

  return winner.playerId;
}

function calculateRoundScore(bet: number, tricksWon: number): number {
  if (tricksWon === bet) {
    return bet === 0 ? 1 : bet;
  }
  return -Math.abs(tricksWon - bet);
}

function calculateDeckCount(playerCount: number): number {
  return playerCount > 6 ? 2 : 1;
}

// Socket.io event handlers
io.on("connection", (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  socket.on("join_room", ({ roomCode, playerId, nickname }) => {
    currentRoomCode = roomCode;
    currentPlayerId = playerId;

    // Create room if doesn't exist
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, {
        code: roomCode,
        players: new Map(),
        gameState: null,
        hostId: null,
        processingAction: false,
      });
    }

    const room = rooms.get(roomCode)!;

    // Check if player is reconnecting (already exists in room)
    const existingPlayer = room.players.get(playerId);
    if (existingPlayer) {
      // Player is reconnecting - update their status
      existingPlayer.connected = true;
      existingPlayer.nickname = nickname; // Update nickname in case it changed

      socket.join(roomCode);
      (socket as any).playerId = playerId;

      console.log(`Player ${nickname} reconnected to room ${roomCode}`);

      // Send current game state if game is in progress
      if (room.gameState) {
        // Update connected status in game state
        const gamePlayer = room.gameState.players.find(p => p.id === playerId);
        if (gamePlayer) {
          gamePlayer.connected = true;
        }

        const personalizedState = personalizeGameState(room.gameState, playerId);
        socket.emit("game_state", personalizedState);

        // Also broadcast updated state to others so they see player reconnected
        broadcastGameState(roomCode, room.gameState);
      } else {
        // Game not started yet, send room state
        const playersArray = Array.from(room.players.values());
        socket.emit("room_state", {
          players: playersArray,
          gameState: null,
          isHost: playerId === room.hostId,
        });
      }
      return;
    }

    // New player joining
    // Validate room capacity and game state
    if (room.players.size >= MAX_PLAYERS) {
      socket.emit("join_error", { message: "Stanza piena (max 10 giocatori)" });
      return;
    }
    if (room.gameState && room.gameState.phase !== GamePhase.WAITING) {
      socket.emit("join_error", { message: "Partita già iniziata" });
      return;
    }

    // Add new player
    const isHost = room.players.size === 0;
    const player: Player = {
      id: playerId,
      nickname,
      seatIndex: room.players.size,
      hand: [],
      bet: null,
      tricksWon: 0,
      score: 0,
      connected: true,
      isHost,
    };

    room.players.set(playerId, player);
    if (isHost) {
      room.hostId = playerId;
    }

    socket.join(roomCode);

    // Set playerId on socket for reliable lookup
    (socket as any).playerId = playerId;

    // Send current state to joining player
    const playersArray = Array.from(room.players.values());
    socket.emit("room_state", {
      players: playersArray,
      gameState: room.gameState,
      isHost,
    });

    // Notify others
    socket.to(roomCode).emit("player_joined", { player });

    console.log(`Player ${nickname} joined room ${roomCode}`);
  });

  socket.on("start_game", () => {
    if (!currentRoomCode || !currentPlayerId) return;

    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== currentPlayerId) return;
    if (room.players.size < 2) return;

    const playerCount = room.players.size;
    const deckCount = calculateDeckCount(playerCount);
    const deck = createDeck(deckCount);
    const cardsPerPlayer: number = ROUND_STRUCTURE[0];
    const hands = dealCards(deck, playerCount, cardsPerPlayer);

    const playersArray = Array.from(room.players.values()).sort(
      (a, b) => a.seatIndex - b.seatIndex
    );

    const gameState: GameState = {
      id: currentRoomCode,
      phase: GamePhase.BETTING,
      players: playersArray.map((p, i) => ({
        ...p,
        hand: hands[i],
        bet: null,
        tricksWon: 0,
      })),
      currentRound: 0,
      cardsPerPlayer,
      isBlindRound: cardsPerPlayer === 1,
      currentTrick: { cards: [], leadSuit: null, winnerId: null },
      currentPlayerId: playersArray[0].id,
      roundLeaderId: playersArray[0].id,
      totalBets: 0,
      aceOfHeartsPending: false,
      aceOfHeartsPlayerId: null,
      readyForNextRound: [],
      lastRoundWinnerId: null,
      playOrder: playersArray.map((p) => p.id),
    };

    room.gameState = gameState;

    console.log(`Game started in room ${currentRoomCode} with ${playersArray.length} players`);

    // Broadcast game state to all players in the room
    broadcastGameState(currentRoomCode, gameState);
  });

  socket.on("place_bet", ({ bet }) => {
    if (!currentRoomCode || !currentPlayerId) return;

    const room = rooms.get(currentRoomCode);
    if (!room || !room.gameState) return;

    // Mutex lock to prevent race conditions
    if (room.processingAction) {
      console.log(`[${currentRoomCode}] Action in progress, ignoring place_bet from ${currentPlayerId}`);
      return;
    }
    room.processingAction = true;

    try {
      if (room.gameState.currentPlayerId !== currentPlayerId) return;
      if (room.gameState.phase !== GamePhase.BETTING) return;

      const playerIndex = room.gameState.players.findIndex(
        (p) => p.id === currentPlayerId
      );
      if (playerIndex === -1) return;

      // Update bet
      room.gameState.players[playerIndex].bet = bet;
      room.gameState.totalBets += bet;

      console.log(`[${currentRoomCode}] Bet placed by ${currentPlayerId}: ${bet}, total: ${room.gameState.totalBets}`);

      // Check if all bets placed
      const allBetsPlaced = room.gameState.players.every((p) => p.bet !== null);

      if (allBetsPlaced) {
        console.log(`[${currentRoomCode}] All bets placed, transitioning to PLAYING`);
        room.gameState.phase = GamePhase.PLAYING;
        room.gameState.currentPlayerId = room.gameState.roundLeaderId;
      } else {
        const nextIndex = (playerIndex + 1) % room.gameState.players.length;
        room.gameState.currentPlayerId = room.gameState.players[nextIndex].id;
      }

      // Broadcast to all
      broadcastGameState(currentRoomCode, room.gameState);
    } finally {
      room.processingAction = false;
    }
  });

  socket.on("player_ready", () => {
    if (!currentRoomCode || !currentPlayerId) return;

    const room = rooms.get(currentRoomCode);
    if (!room || !room.gameState) return;
    if (room.gameState.phase !== GamePhase.ROUND_END) return;

    // Add player to ready list if not already there
    if (!room.gameState.readyForNextRound.includes(currentPlayerId)) {
      room.gameState.readyForNextRound.push(currentPlayerId);
    }

    // Check if all players are ready
    const allReady = room.gameState.players.every((p) =>
      room.gameState!.readyForNextRound.includes(p.id)
    );

    if (allReady) {
      // Start the next round
      const winnerId = room.gameState.lastRoundWinnerId!;
      room.gameState.currentRound++;
      const nextCardsPerPlayer: number =
        ROUND_STRUCTURE[room.gameState.currentRound];
      room.gameState.cardsPerPlayer = nextCardsPerPlayer;
      room.gameState.isBlindRound = nextCardsPerPlayer === 1;

      const deckCount = calculateDeckCount(room.gameState.players.length);
      const deck = createDeck(deckCount);
      const hands = dealCards(
        deck,
        room.gameState.players.length,
        nextCardsPerPlayer
      );

      for (let i = 0; i < room.gameState.players.length; i++) {
        room.gameState.players[i].hand = hands[i];
        room.gameState.players[i].bet = null;
        room.gameState.players[i].tricksWon = 0;
      }

      room.gameState.phase = GamePhase.BETTING;
      room.gameState.currentPlayerId = winnerId;
      room.gameState.roundLeaderId = winnerId;
      room.gameState.totalBets = 0;
      room.gameState.readyForNextRound = [];
      room.gameState.lastRoundWinnerId = null;
    }

    broadcastGameState(currentRoomCode, room.gameState);
  });

  socket.on("play_card", ({ cardId, aceIsHigh }) => {
    if (!currentRoomCode || !currentPlayerId) return;

    const room = rooms.get(currentRoomCode);
    if (!room || !room.gameState) return;

    // Mutex lock to prevent double card plays
    if (room.processingAction) {
      console.log(`[${currentRoomCode}] Action in progress, ignoring play_card from ${currentPlayerId}`);
      return;
    }
    room.processingAction = true;

    try {
      if (room.gameState.currentPlayerId !== currentPlayerId) {
        return;
      }
      if (room.gameState.phase !== GamePhase.PLAYING) {
        return;
      }

      const playerIndex = room.gameState.players.findIndex(
        (p) => p.id === currentPlayerId
      );
      if (playerIndex === -1) return;

      const player = room.gameState.players[playerIndex];
      const cardIndex = player.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return;

      const card = player.hand.splice(cardIndex, 1)[0];
      const playedCard: PlayedCard = {
        ...card,
        playerId: currentPlayerId,
        aceIsHigh:
          card.suit === Suit.HEARTS && card.rank === 1 ? aceIsHigh : undefined,
      };

    // Add to trick
    room.gameState.currentTrick.cards.push(playedCard);
    if (!room.gameState.currentTrick.leadSuit) {
      room.gameState.currentTrick.leadSuit = playedCard.suit;
    }

    // Check if trick is complete
    if (
      room.gameState.currentTrick.cards.length === room.gameState.players.length
    ) {
      const winnerId = determineTrickWinner(room.gameState.currentTrick.cards);
      room.gameState.currentTrick.winnerId = winnerId;

      const winnerIndex = room.gameState.players.findIndex(
        (p) => p.id === winnerId
      );
      room.gameState.players[winnerIndex].tricksWon++;

      // Rotate playOrder so winner is first
      const winnerPlayOrderIdx = room.gameState.playOrder.indexOf(winnerId);
      room.gameState.playOrder = [
        ...room.gameState.playOrder.slice(winnerPlayOrderIdx),
        ...room.gameState.playOrder.slice(0, winnerPlayOrderIdx),
      ];

      // Check if round is complete
      if (room.gameState.players[0].hand.length === 0) {
        // Calculate scores
        for (const p of room.gameState.players) {
          p.score += calculateRoundScore(p.bet!, p.tricksWon);
        }

        // Check if game is complete
        if (room.gameState.currentRound >= ROUND_STRUCTURE.length - 1) {
          room.gameState.phase = GamePhase.GAME_END;
        } else {
          // Go to ROUND_END phase - wait for players to click ready
          room.gameState.phase = GamePhase.ROUND_END;
          room.gameState.lastRoundWinnerId = winnerId;
          room.gameState.readyForNextRound = [];
        }

        room.gameState.currentTrick = {
          cards: [],
          leadSuit: null,
          winnerId: null,
        };
      } else {
        // Next trick
        setTimeout(() => {
          if (room.gameState) {
            room.gameState.currentTrick = {
              cards: [],
              leadSuit: null,
              winnerId: null,
            };
            room.gameState.currentPlayerId = winnerId;
            broadcastGameState(currentRoomCode!, room.gameState);
          }
        }, 1500); // Delay to show winning card

        broadcastGameState(currentRoomCode, room.gameState);
        return;
      }
    } else {
      // Next player
      const nextIndex = (playerIndex + 1) % room.gameState.players.length;
      room.gameState.currentPlayerId = room.gameState.players[nextIndex].id;
    }

    broadcastGameState(currentRoomCode, room.gameState);
    } finally {
      room.processingAction = false;
    }
  });

  // Admin skip actions (host only)
  socket.on("admin_skip", ({ action }) => {
    if (!currentRoomCode || !currentPlayerId) return;

    const room = rooms.get(currentRoomCode);
    if (!room || !room.gameState) return;

    // Only host can use admin actions
    if (room.hostId !== currentPlayerId) {
      socket.emit("admin_error", { message: "Solo l'host può usare questa funzione" });
      return;
    }

    console.log(`[${currentRoomCode}] Admin action: ${action} by ${currentPlayerId}`);

    switch (action) {
      case "skip_turn": {
        // Auto-play for current player
        const currentPlayer = room.gameState.players.find(
          (p) => p.id === room.gameState!.currentPlayerId
        );
        if (!currentPlayer) return;

        if (room.gameState.phase === GamePhase.BETTING) {
          // Auto-bet 0
          currentPlayer.bet = 0;
          const allBetsPlaced = room.gameState.players.every((p) => p.bet !== null);
          if (allBetsPlaced) {
            room.gameState.phase = GamePhase.PLAYING;
            room.gameState.currentPlayerId = room.gameState.roundLeaderId;
          } else {
            const playerIndex = room.gameState.players.indexOf(currentPlayer);
            const nextIndex = (playerIndex + 1) % room.gameState.players.length;
            room.gameState.currentPlayerId = room.gameState.players[nextIndex].id;
          }
        } else if (room.gameState.phase === GamePhase.PLAYING && currentPlayer.hand.length > 0) {
          // Auto-play first card
          const card = currentPlayer.hand.shift()!;
          const playedCard: PlayedCard = {
            ...card,
            playerId: currentPlayer.id,
            aceIsHigh: card.suit === Suit.HEARTS && card.rank === 1 ? true : undefined,
          };
          room.gameState.currentTrick.cards.push(playedCard);
          if (!room.gameState.currentTrick.leadSuit) {
            room.gameState.currentTrick.leadSuit = playedCard.suit;
          }

          // Check if trick complete
          if (room.gameState.currentTrick.cards.length === room.gameState.players.length) {
            const winnerId = determineTrickWinner(room.gameState.currentTrick.cards);
            room.gameState.currentTrick.winnerId = winnerId;
            const winnerIndex = room.gameState.players.findIndex((p) => p.id === winnerId);
            room.gameState.players[winnerIndex].tricksWon++;

            // Rotate playOrder
            const winnerPlayOrderIdx = room.gameState.playOrder.indexOf(winnerId);
            room.gameState.playOrder = [
              ...room.gameState.playOrder.slice(winnerPlayOrderIdx),
              ...room.gameState.playOrder.slice(0, winnerPlayOrderIdx),
            ];

            // Check if round complete
            if (room.gameState.players[0].hand.length === 0) {
              for (const p of room.gameState.players) {
                p.score += calculateRoundScore(p.bet!, p.tricksWon);
              }
              if (room.gameState.currentRound >= ROUND_STRUCTURE.length - 1) {
                room.gameState.phase = GamePhase.GAME_END;
              } else {
                room.gameState.phase = GamePhase.ROUND_END;
                room.gameState.lastRoundWinnerId = winnerId;
                room.gameState.readyForNextRound = [];
              }
              room.gameState.currentTrick = { cards: [], leadSuit: null, winnerId: null };
            } else {
              // Next trick after delay
              setTimeout(() => {
                if (room.gameState) {
                  room.gameState.currentTrick = { cards: [], leadSuit: null, winnerId: null };
                  room.gameState.currentPlayerId = winnerId;
                  broadcastGameState(currentRoomCode!, room.gameState);
                }
              }, 500);
              broadcastGameState(currentRoomCode, room.gameState);
              return;
            }
          } else {
            const playerIndex = room.gameState.players.indexOf(currentPlayer);
            const nextIndex = (playerIndex + 1) % room.gameState.players.length;
            room.gameState.currentPlayerId = room.gameState.players[nextIndex].id;
          }
        }
        break;
      }

      case "skip_round": {
        // End the round immediately, calculate scores based on current state
        for (const p of room.gameState.players) {
          if (p.bet !== null) {
            p.score += calculateRoundScore(p.bet, p.tricksWon);
          }
        }

        if (room.gameState.currentRound >= ROUND_STRUCTURE.length - 1) {
          room.gameState.phase = GamePhase.GAME_END;
        } else {
          room.gameState.phase = GamePhase.ROUND_END;
          room.gameState.lastRoundWinnerId = room.gameState.currentPlayerId || room.gameState.players[0].id;
          room.gameState.readyForNextRound = [];
        }
        room.gameState.currentTrick = { cards: [], leadSuit: null, winnerId: null };
        break;
      }

      case "reset_game": {
        // Return to waiting room
        room.gameState = null;
        console.log(`[${currentRoomCode}] Game reset by host`);

        // Notify each player with correct isHost value
        const playersArray = Array.from(room.players.values());
        const socketsInRoom = io.sockets.adapter.rooms.get(currentRoomCode);
        if (socketsInRoom) {
          for (const socketId of socketsInRoom) {
            const s = io.sockets.sockets.get(socketId);
            if (s) {
              const socketPlayerId = (s as any).playerId;
              const isPlayerHost = socketPlayerId === room.hostId;
              s.emit("room_state", {
                players: playersArray,
                gameState: null,
                isHost: isPlayerHost,
              });
            }
          }
        }
        return;
      }
    }

    broadcastGameState(currentRoomCode, room.gameState);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);

    if (currentRoomCode && currentPlayerId) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        const player = room.players.get(currentPlayerId);
        if (player) {
          player.connected = false;

          // Update game state if exists
          if (room.gameState) {
            const gamePlayer = room.gameState.players.find(
              (p) => p.id === currentPlayerId
            );
            if (gamePlayer) {
              gamePlayer.connected = false;
            }
            broadcastGameState(currentRoomCode, room.gameState);
          } else {
            // Notify others
            socket.to(currentRoomCode).emit("player_disconnected", {
              playerId: currentPlayerId,
            });
          }
        }
      }
    }
  });

  // Helper to get socket ID for a player
  function getSocketIdForPlayer(
    roomCode: string,
    playerId: string
  ): string | null {
    const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
    if (!socketsInRoom) return null;

    const socketIds = Array.from(socketsInRoom);
    for (const socketId of socketIds) {
      const s = io.sockets.sockets.get(socketId);
      if (s && (s as any).playerId === playerId) {
        return socketId;
      }
    }
    return null;
  }

  // Store player ID on socket for lookup
  socket.on("register_player", ({ playerId }) => {
    (socket as any).playerId = playerId;
  });
});

// Personalize game state (hide other players' hands, except in blind round)
function personalizeGameState(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.map((p) => {
      if (state.isBlindRound) {
        // In blind round: hide own hand, show others
        if (p.id === playerId) {
          return { ...p, hand: p.hand.map(() => ({ id: "hidden", suit: Suit.SPADES, rank: 0 })) };
        }
        return p;
      } else {
        // Normal round: show own hand, hide others
        if (p.id !== playerId) {
          return { ...p, hand: p.hand.map(() => ({ id: "hidden", suit: Suit.SPADES, rank: 0 })) };
        }
        return p;
      }
    }),
  };
}

// Broadcast personalized state to all players in room
function broadcastGameState(roomCode: string, state: GameState) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
  if (!socketsInRoom) {
    console.log(`[${roomCode}] No sockets in room for broadcast`);
    return;
  }

  const socketIds = Array.from(socketsInRoom);
  let sentCount = 0;

  // Send to all connected sockets in the room
  for (const socketId of socketIds) {
    const s = io.sockets.sockets.get(socketId);
    if (s) {
      const socketPlayerId = (s as any).playerId;
      // Find this player in the game state
      const player = state.players.find(p => p.id === socketPlayerId);
      if (player) {
        const personalizedState = personalizeGameState(state, socketPlayerId);
        s.emit("game_state", personalizedState);
        sentCount++;
      } else {
        console.log(`[${roomCode}] Socket ${socketId} has playerId ${socketPlayerId} not in game players`);
      }
    }
  }

  if (sentCount !== state.players.length) {
    console.log(`[${roomCode}] Broadcast: sent to ${sentCount}/${state.players.length} players`);
  }
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
