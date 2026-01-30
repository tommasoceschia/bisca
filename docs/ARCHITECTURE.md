# Architettura

## Overview

Bisca utilizza un'architettura client-server con WebSocket per la comunicazione real-time.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser 1     │     │   Browser 2     │     │   Browser N     │
│   (Next.js)     │     │   (Next.js)     │     │   (Next.js)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │      WebSocket        │      WebSocket        │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   Server WebSocket      │
                    │   (Socket.io + Node.js) │
                    │                         │
                    │   - Game State          │
                    │   - Room Management     │
                    │   - Card Logic          │
                    └─────────────────────────┘
```

## Stack Tecnologico

| Componente | Tecnologia | Descrizione |
|------------|------------|-------------|
| Frontend | Next.js 15 | React con App Router |
| UI | Tailwind CSS | Styling utility-first |
| Real-time | Socket.io | WebSocket bidirezionale |
| Server | Node.js + tsx | TypeScript runtime |

## Frontend (Next.js)

### Struttura Pagine

```
src/app/
├── page.tsx              # Landing - inserimento nickname
├── lobby/page.tsx        # Lobby - crea/entra stanza
└── room/[roomId]/page.tsx # Stanza di gioco
```

### Componenti Principali

```
src/components/game/
├── Card.tsx           # Singola carta (fronte/retro)
├── Hand.tsx           # Mano del giocatore
├── BlindHand.tsx      # Mano cieca (round da 1 carta)
├── PlayArea.tsx       # Area carte giocate
├── BettingPanel.tsx   # Pannello scommesse
├── ScoreBoard.tsx     # Tabellone punteggi
└── AceChoiceModal.tsx # Modal scelta Asso di Cuori
```

### Hooks

```
src/hooks/
└── useGameRoom.ts     # Gestione connessione Socket.io e stato gioco
```

### Logica di Gioco (Client)

```
src/lib/game/
├── suit-hierarchy.ts  # Confronto semi e carte
├── betting.ts         # Validazione scommesse
├── scoring.ts         # Calcolo punteggi
└── deck.ts           # Gestione mazzo
```

## Server WebSocket

### File Principale

```
server/index.ts
```

### Responsabilità

1. **Room Management**
   - Creazione/eliminazione stanze
   - Join/leave giocatori
   - Gestione host

2. **Game State**
   - Stato autoritativo del gioco
   - Distribuzione carte
   - Turni e fasi

3. **Event Broadcasting**
   - Sincronizzazione stato
   - Personalizzazione per giocatore (nascondi carte altrui)

### Eventi Socket.io

#### Client → Server

| Evento | Payload | Descrizione |
|--------|---------|-------------|
| `join_room` | `{roomCode, playerId, nickname}` | Entra in stanza |
| `start_game` | - | Host avvia partita |
| `place_bet` | `{bet: number}` | Piazza scommessa |
| `play_card` | `{cardId, aceIsHigh?}` | Gioca carta |
| `register_player` | `{playerId}` | Registra ID per lookup |

#### Server → Client

| Evento | Payload | Descrizione |
|--------|---------|-------------|
| `room_state` | `{players, gameState, isHost}` | Stato iniziale stanza |
| `player_joined` | `{player}` | Nuovo giocatore entrato |
| `player_disconnected` | `{playerId}` | Giocatore disconnesso |
| `game_state` | `GameState` | Aggiornamento stato (personalizzato) |

## Flusso di Gioco

```
1. Giocatore entra in /
   └─> Inserisce nickname
   └─> Salvato in localStorage

2. Giocatore va in /lobby
   ├─> "Crea Stanza" → genera codice 6 caratteri
   └─> "Entra" → inserisce codice esistente

3. Giocatore in /room/[roomId]
   └─> WebSocket connesso
   └─> Attende altri giocatori

4. Host clicca "Inizia Partita"
   └─> Server distribuisce carte
   └─> Fase BETTING

5. Ogni giocatore scommette (a turno)
   └─> Validazione somma ≠ carte
   └─> Quando tutti hanno scommesso → Fase PLAYING

6. Giocatori giocano carte (a turno)
   └─> Se Asso di Cuori → modal scelta alto/basso
   └─> Quando tutti hanno giocato → determina vincitore
   └─> Vincitore inizia prossima mano

7. Fine round
   └─> Calcolo punteggi
   └─> Se round < 9 → prossimo round
   └─> Se round = 9 → GAME_END

8. Fine partita
   └─> Mostra classifica finale
```

## Sicurezza

### Stato Autoritativo

Il server mantiene lo stato autoritativo del gioco. I client inviano solo azioni, mai lo stato.

### Personalizzazione Stato

Prima di inviare lo stato a un client, il server nasconde le informazioni riservate:

```typescript
// Round normale: nascondi mani altrui
if (p.id !== playerId) {
  return { ...p, hand: [hidden, hidden, ...] };
}

// Round cieco: nascondi propria mano, mostra altrui
if (state.isBlindRound && p.id === playerId) {
  return { ...p, hand: [hidden] };
}
```

### Validazione Server-Side

- Verifica turno corretto
- Verifica carta in mano
- Verifica scommessa valida
- Verifica fase gioco corretta
