FROM node:20-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci --only=production

# Copia codice
COPY . .

# Build frontend
RUN npm run build

# Esponi porte
EXPOSE 3000 3001

# Script di avvio
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
