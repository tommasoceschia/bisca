# Bisca

A real-time multiplayer card game built with Next.js and Socket.io.

Bisca is a traditional Italian trick-taking card game where players bet on how many tricks they'll win each round. This project aims to become a platform for multiple classic card games.

## Features

- Real-time multiplayer gameplay via WebSocket
- Room-based matchmaking with join codes
- Responsive design for desktop and mobile
- Round structure: 5-4-3-2-1-2-3-4-5 cards per player
- Special Ace of Hearts mechanic (can be played high or low)

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Socket.io
- **Deployment**: PM2, Nginx

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/tommasoceschia/bisca
cd bisca

# Install dependencies
pnpm install

# Start development servers (frontend + websocket)
pnpm dev:all
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
bisca/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   │   ├── game/      # Game UI components
│   │   ├── lobby/     # Lobby components
│   │   └── ui/        # Shared UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Game logic and utilities
│   └── types/         # TypeScript type definitions
├── server/            # WebSocket server
├── public/            # Static assets
└── docs/              # Detailed documentation (Italian)
```

## Documentation

For detailed documentation including game rules, architecture, and deployment guides, see the [docs](./docs/) folder.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
