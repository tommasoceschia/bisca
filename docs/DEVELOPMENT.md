# Sviluppo Locale

## Prerequisiti

- Node.js 18+
- npm 9+

## Setup

```bash
# Clona il repository
git clone <repo-url>
cd bisca

# Installa dipendenze
npm install
```

## Avvio

### Opzione 1: Tutto insieme (raccomandato)

```bash
npm run dev:all
```

Avvia frontend (porta 3000) e server WebSocket (porta 3001) insieme.

### Opzione 2: Separati

**Terminale 1 - Server WebSocket:**
```bash
npm run dev:server
```

**Terminale 2 - Frontend:**
```bash
npm run dev
```

## Test Multiplayer Locale

1. Apri http://localhost:3000
2. Inserisci un nickname e vai alla lobby
3. Crea una stanza
4. Apri un'altra finestra/tab del browser
5. Inserisci un altro nickname
6. Entra con il codice della stanza
7. L'host può avviare la partita

## Scripts Disponibili

| Script | Descrizione |
|--------|-------------|
| `npm run dev` | Avvia solo frontend Next.js |
| `npm run dev:server` | Avvia solo server WebSocket (watch mode) |
| `npm run dev:all` | Avvia entrambi insieme |
| `npm run build` | Build produzione frontend |
| `npm run start` | Avvia frontend in produzione |
| `npm run start:server` | Avvia server in produzione |
| `npm run lint` | Esegue ESLint |

## Struttura Codice

### Aggiungere un Componente

```bash
# Crea file in src/components/game/
touch src/components/game/NuovoComponente.tsx
```

```tsx
// src/components/game/NuovoComponente.tsx
"use client";

import { cn } from "@/lib/utils";

interface NuovoComponenteProps {
  // props
}

export function NuovoComponente({ }: NuovoComponenteProps) {
  return (
    <div className="...">
      {/* contenuto */}
    </div>
  );
}
```

### Modificare Logica di Gioco

La logica è duplicata tra client e server:

- **Client:** `src/lib/game/*.ts` (per UI/validazione locale)
- **Server:** `server/index.ts` (autoritativo)

Quando modifichi la logica, aggiorna entrambi!

### Aggiungere Evento Socket

**Server (server/index.ts):**
```typescript
socket.on("nuovo_evento", ({ param }) => {
  // gestisci evento
  io.to(roomCode).emit("risposta", { data });
});
```

**Client (src/hooks/useGameRoom.ts):**
```typescript
// Invia
socketRef.current?.emit("nuovo_evento", { param });

// Ricevi
socket.on("risposta", ({ data }) => {
  // aggiorna stato
});
```

## Debug

### Logs Server

Il server logga su console:
- Connessioni/disconnessioni
- Join room
- Start game

### Logs Client

Apri DevTools del browser (F12) → Console per vedere:
- Stato connessione
- Eventi ricevuti

### Problemi Comuni

**"Impossibile connettersi al server"**
- Verifica che il server sia avviato (`npm run dev:server`)
- Controlla che la porta 3001 sia libera

**"Giocatori non si vedono"**
- Assicurati che entrambi usino lo stesso codice stanza (case-insensitive)
- Verifica connessione WebSocket in Network tab

**"Stato non sincronizzato"**
- Ricarica la pagina
- Il server è autoritativo, il client si risincronizza
