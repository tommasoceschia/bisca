#!/bin/sh
set -e

echo "Starting Bisca..."

# Avvia server WebSocket in background
echo "Starting WebSocket server on port ${PORT:-3001}..."
npm run start:server &

# Attendi che il server sia pronto
sleep 2

# Avvia frontend
echo "Starting Next.js frontend on port 3000..."
exec npm run start
