#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/opt/palmital"
REPO_DIR="$APP_ROOT/repo"
LOG="$APP_ROOT/webhook-deploy.log"
DEPLOY_PORT="7000"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG"; }

log "=== DEPLOY STARTED ==="

# Clone ou atualiza o repositorio
if [ ! -d "$REPO_DIR/.git" ]; then
  log "Cloning repository..."
  git clone https://github.com/fernandinhomartins40/Palmitaldigital.git "$REPO_DIR" >> "$LOG" 2>&1
fi

cd "$REPO_DIR"
git fetch origin main >> "$LOG" 2>&1
git reset --hard origin/main >> "$LOG" 2>&1
COMMIT=$(git rev-parse --short HEAD)
log "Code updated to $COMMIT"

# Criar diretorio de release
RELEASE="${COMMIT}-$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="$APP_ROOT/releases/$RELEASE"
mkdir -p "$RELEASE_DIR"
rsync -a --exclude=.git . "$RELEASE_DIR/" >> "$LOG" 2>&1
log "Release dir: $RELEASE_DIR"

# Pre-build cleanup para liberar memoria
log "Pre-build cleanup..."
docker compose -p palmital ps -aq --filter status=exited 2>/dev/null \
  | xargs -r docker rm -f 2>/dev/null || true
docker image prune -f >/dev/null 2>&1 || true
docker builder prune -af >/dev/null 2>&1 || true
sync && echo 1 > /proc/sys/vm/drop_caches
log "Cleanup done. RAM: $(free -h | awk 'NR==2{print $4}') free"

# Executar deploy
export APP_ROOT RELEASE DEPLOY_PORT
log "Running remote-deploy.sh..."
bash "$RELEASE_DIR/.github/scripts/remote-deploy.sh" >> "$LOG" 2>&1

log "=== DEPLOY COMPLETED: $RELEASE ==="
