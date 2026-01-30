# Deploy su VM

Questa guida spiega come deployare Bisca su una VM Linux.

## Prerequisiti VM

- Ubuntu 20.04+ / Debian 11+ (o altra distro Linux)
- Node.js 18+ installato
- Accesso SSH
- Porta 3000 e 3001 aperte (o configurazione reverse proxy)

## Metodo 1: Deploy Diretto

### 1. Trasferisci il Codice

```bash
# Dal tuo computer locale
scp -r bisca/ user@tua-vm:/home/user/
```

Oppure clona da git:
```bash
ssh user@tua-vm
git clone <repo-url> bisca
cd bisca
```

### 2. Installa Dipendenze

```bash
cd /home/user/bisca
npm install
```

### 3. Build Produzione

```bash
npm run build
```

### 4. Configura Variabili d'Ambiente

```bash
# Crea file .env
cat > .env << 'EOF'
PORT=3001
CLIENT_URL=http://tua-vm:3000
EOF

# Per il client (se il server è su IP/dominio diverso)
cat > .env.local << 'EOF'
NEXT_PUBLIC_SOCKET_URL=http://tua-vm:3001
EOF
```

### 5. Avvia con PM2 (Raccomandato)

```bash
# Installa PM2 globalmente
npm install -g pm2

# Avvia server WebSocket
pm2 start npm --name "bisca-server" -- run start:server

# Avvia frontend
pm2 start npm --name "bisca-web" -- run start

# Salva configurazione per riavvio automatico
pm2 save
pm2 startup
```

### 6. Verifica

```bash
# Controlla status
pm2 status

# Vedi logs
pm2 logs bisca-server
pm2 logs bisca-web
```

## Metodo 2: Docker

### Dockerfile

Crea `Dockerfile` nella root del progetto:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci

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
```

Crea `docker-entrypoint.sh`:

```bash
#!/bin/sh
# Avvia server WebSocket in background
npm run start:server &

# Avvia frontend
npm run start
```

### Build e Run

```bash
# Build immagine
docker build -t bisca .

# Avvia container
docker run -d \
  --name bisca \
  -p 3000:3000 \
  -p 3001:3001 \
  -e CLIENT_URL=http://tuo-dominio:3000 \
  bisca
```

### Docker Compose

Crea `docker-compose.yml`:

```yaml
version: '3.8'

services:
  bisca:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - CLIENT_URL=http://tuo-dominio:3000
    restart: unless-stopped
```

```bash
# Avvia
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

## Configurazione Nginx (Reverse Proxy)

Se vuoi usare Nginx come reverse proxy:

```nginx
# /etc/nginx/sites-available/bisca
server {
    listen 80;
    server_name bisca.tuodominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Abilita sito
sudo ln -s /etc/nginx/sites-available/bisca /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Con Nginx, aggiorna la variabile:
```bash
NEXT_PUBLIC_SOCKET_URL=http://bisca.tuodominio.com
```

## SSL con Certbot

```bash
# Installa certbot
sudo apt install certbot python3-certbot-nginx

# Ottieni certificato
sudo certbot --nginx -d bisca.tuodominio.com

# Aggiorna URL per HTTPS
NEXT_PUBLIC_SOCKET_URL=https://bisca.tuodominio.com
```

## Variabili d'Ambiente

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `PORT` | 3001 | Porta server WebSocket |
| `CLIENT_URL` | http://localhost:3000 | URL frontend (per CORS) |
| `NEXT_PUBLIC_SOCKET_URL` | http://localhost:3001 | URL server WebSocket (lato client) |

## Troubleshooting

### Connessione WebSocket Fallisce

1. Verifica che la porta 3001 sia aperta:
   ```bash
   sudo ufw allow 3001
   ```

2. Controlla che il server sia in ascolto:
   ```bash
   netstat -tlnp | grep 3001
   ```

3. Verifica CORS in `server/index.ts`:
   ```typescript
   cors: {
     origin: process.env.CLIENT_URL || "*",
   }
   ```

### Frontend Non Carica

1. Controlla logs:
   ```bash
   pm2 logs bisca-web
   ```

2. Verifica build:
   ```bash
   npm run build
   ```

### Memoria Insufficiente

Per VM con poca RAM, usa swap:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Monitoraggio

### Con PM2

```bash
# Dashboard
pm2 monit

# Metriche
pm2 show bisca-server
pm2 show bisca-web
```

### Logs

```bash
# Tutti i logs
pm2 logs

# Solo errori
pm2 logs --err
```

## Aggiornamenti

```bash
# Pull nuova versione
git pull

# Reinstalla dipendenze se necessario
npm install

# Rebuild
npm run build

# Riavvia
pm2 restart all
```
