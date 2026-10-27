#!/bin/bash
# Primera instalación de HAVOC Control en Hetzner (una sola vez). Después: ./deploy.sh
# Uso: ./instalar.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SSHC="ssh -i $HOME/.ssh/id_ed25519 -o IdentitiesOnly=yes"
SERVER="root@62.238.3.136"
INST=havoc-control; PBACK=3019; PDB=5448; PWEB=8102; DOMINIO=app.havocdev.mx
DIR="/home/apps/$INST"

$SSHC $SERVER "test ! -e $DIR || { echo '✗ $DIR ya existe'; exit 1; }
  ! sudo -u apps pm2 describe $INST-backend >/dev/null 2>&1 || { echo '✗ PM2 $INST-backend ya existe'; exit 1; }
  ! ss -ltn | grep -qE ':($PBACK|$PDB|$PWEB)\b' || { echo '✗ algún puerto ya está en uso'; exit 1; }
  test ! -e /etc/nginx/sites-available/$INST || { echo '✗ sitio nginx $INST ya existe'; exit 1; }
  ! grep -rqs 'server_name $DOMINIO' /etc/nginx/sites-enabled/ || { echo '✗ $DOMINIO ya está en nginx'; exit 1; }"

echo "→ Construyendo frontend..."
(cd "$ROOT_DIR/frontend" && npm run build)

echo "→ Subiendo archivos..."
$SSHC $SERVER "mkdir -p $DIR/backend $DIR/frontend/dist && chown -R apps:apps $DIR"
rsync -az --chown=apps:apps -e "$SSHC" --exclude node_modules/ --exclude .env --exclude uploads/ \
  "$ROOT_DIR/backend/" $SERVER:$DIR/backend/
rsync -az --chown=apps:apps -e "$SSHC" "$ROOT_DIR/docker-compose.yml" $SERVER:$DIR/
rsync -az --chown=apps:apps -e "$SSHC" "$ROOT_DIR/frontend/dist/" $SERVER:$DIR/frontend/dist/

echo "→ .env con secretos nuevos (solo vive en el servidor)..."
$SSHC $SERVER "umask 077 && cat > $DIR/backend/.env <<ENVFILE
PORT=$PBACK
DB_HOST=localhost
DB_PORT=$PDB
DB_NAME=havoc
DB_USER=havoc_user
DB_PASSWORD=\$(openssl rand -hex 24)
UPLOADS_DIR=./uploads
JWT_SECRET=\$(openssl rand -hex 32)
ENVFILE
chown apps:apps $DIR/backend/.env"

echo "→ Base de datos..."
$SSHC $SERVER "cd $DIR && docker compose -p $INST --env-file backend/.env up -d \
  && for i in \$(seq 30); do docker compose -p $INST --env-file backend/.env exec -T postgres pg_isready -q && break; sleep 1; done"

echo "→ Backend (PM2 como apps)..."
$SSHC $SERVER "cd $DIR/backend && sudo -u apps npm install --omit=dev --silent \
  && sudo -u apps pm2 start src/index.js --name $INST-backend --cwd $DIR/backend && sudo -u apps pm2 save"

echo "→ Nginx :$PWEB y $DOMINIO..."
# \$ llega como $ literal al archivo de nginx
BLOQUE="    client_max_body_size 200M;   # material de marketing (videos)

    root $DIR/frontend/dist;
    index index.html;

    location / {
        try_files \\\$uri \\\$uri/ /index.html;
    }

    location ~ ^/(api|uploads)/ {
        proxy_pass http://127.0.0.1:$PBACK;
        proxy_http_version 1.1;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_read_timeout 120s;
    }"
$SSHC $SERVER "cat > /etc/nginx/sites-available/$INST <<NGINX
server {
    listen $PWEB;
    server_name _;
$BLOQUE
}

server {
    listen 80;
    server_name $DOMINIO;
$BLOQUE
}
NGINX
ln -s /etc/nginx/sites-available/$INST /etc/nginx/sites-enabled/$INST && nginx -t && systemctl reload nginx && ufw allow $PWEB/tcp"

echo "→ Verificando..."
sleep 3
$SSHC $SERVER "sudo -u apps pm2 show $INST-backend | grep -E 'status|uptime|restarts'; curl -s http://localhost:$PWEB/api/health; echo"

echo "→ Admins (contraseñas temporales):"
$SSHC $SERVER "cd $DIR/backend && sudo -u apps node src/scripts/seed_admin.js administracion@havocdev.mx 'Alejandro Ayala' \
  && sudo -u apps node src/scripts/seed_admin.js ventas@havocdev.mx 'Liliana Flores'"
echo "✓ HAVOC Control en http://62.238.3.136:$PWEB — HTTPS: certbot --nginx -d $DOMINIO cuando el DNS resuelva"
