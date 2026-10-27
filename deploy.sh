#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER="root@62.238.3.136"
SSHC="ssh -i $HOME/.ssh/id_ed25519 -o IdentitiesOnly=yes"

echo "→ Construyendo frontend..."
cd "$ROOT_DIR/frontend"
npm run build

echo "→ Sincronizando backend (sin tocar uploads)..."
rsync -az --delete --chown=apps:apps -e "$SSHC" \
  --exclude='uploads/' \
  --exclude='node_modules/' \
  --exclude='.env' \
  "$ROOT_DIR/backend/" $SERVER:/home/apps/havoc-control/backend/

echo "→ Sincronizando frontend dist..."
rsync -az --delete --chown=apps:apps -e "$SSHC" \
  "$ROOT_DIR/frontend/dist/" $SERVER:/home/apps/havoc-control/frontend/dist/

echo "→ Instalando dependencias y reiniciando..."
$SSHC $SERVER "cd /home/apps/havoc-control/backend && sudo -u apps npm install --omit=dev --silent && sudo -u apps pm2 restart havoc-control-backend"

echo "→ Verificando..."
sleep 2
$SSHC $SERVER "sudo -u apps pm2 show havoc-control-backend | grep -E 'status|restarts'"

echo "✓ Deploy HAVOC Control completado"
