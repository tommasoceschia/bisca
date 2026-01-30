# Bisca - Documentazione

Bisca è un gioco di carte multiplayer online giocabile via browser.

## Indice

- [Regole del Gioco](./RULES.md)
- [Architettura](./ARCHITECTURE.md)
- [Sviluppo Locale](./DEVELOPMENT.md)
- [Deploy su VM](./DEPLOYMENT.md)

## Quick Start

```bash
# Installa dipendenze
npm install

# Avvia in sviluppo (frontend + server)
npm run dev:all

# Apri http://localhost:3000
```

## Struttura Progetto

```
bisca/
├── src/                    # Frontend Next.js
│   ├── app/               # Pagine (App Router)
│   ├── components/        # Componenti React
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utility e logica di gioco
│   └── types/             # Tipi TypeScript
├── server/                # Server WebSocket
│   └── index.ts          # Entry point
└── docs/                  # Documentazione
```
