#!/usr/bin/env bash
set -euo pipefail

: "${APP_ROOT:?APP_ROOT is required}"
: "${RELEASE:?RELEASE is required}"
: "${DEPLOY_PORT:?DEPLOY_PORT is required}"

CURRENT_DIR="$APP_ROOT/current"
API_CONTAINER="palmital-api-1"
WEB_CONTAINER="palmital-web-1"

container_state() {
  docker inspect --format '{{.State.Status}}' "$1" 2>/dev/null || echo "not_found"
}

container_health() {
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no_healthcheck{{end}}' "$1" 2>/dev/null || echo "not_found"
}

container_image() {
  docker inspect --format '{{.Config.Image}}' "$1" 2>/dev/null || echo ""
}

dump_logs() {
  local container_name="$1"
  echo "--- logs: $container_name ---" >&2
  docker logs --tail=80 "$container_name" >&2 || true
}

echo "Running post-deploy health check..."
echo "Expected release: $RELEASE"
echo "Current symlink: $(readlink -f "$CURRENT_DIR" 2>/dev/null || echo missing)"
docker ps -a --filter "name=^palmital-" || true

for i in $(seq 1 30); do
  API_STATE="$(container_state "$API_CONTAINER")"
  API_HEALTH="$(container_health "$API_CONTAINER")"
  WEB_STATE="$(container_state "$WEB_CONTAINER")"
  WEB_HEALTH="$(container_health "$WEB_CONTAINER")"
  API_IMAGE="$(container_image "$API_CONTAINER")"
  WEB_IMAGE="$(container_image "$WEB_CONTAINER")"
  API_VERSION="$(docker exec "$API_CONTAINER" cat /app/.release-version 2>/dev/null || true)"
  WEB_VERSION="$(docker exec "$WEB_CONTAINER" cat /usr/share/nginx/html/release.txt 2>/dev/null || true)"
  WEB_HTTP="$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:${DEPLOY_PORT}/health" 2>/dev/null || true)"
  CURRENT_TARGET="$(readlink -f "$CURRENT_DIR" 2>/dev/null || true)"
  WEB_HTTP="${WEB_HTTP:-000}"

  if [ "$API_STATE" = "running" ] && [ "$API_HEALTH" = "healthy" ] && \
     [ "$WEB_STATE" = "running" ] && [ "$WEB_HEALTH" = "healthy" ] && \
     [ "$WEB_HTTP" = "200" ] && \
     [ "$API_IMAGE" = "palmital-api:$RELEASE" ] && \
     [ "$WEB_IMAGE" = "palmital-web:$RELEASE" ] && \
     [ "$API_VERSION" = "$RELEASE" ] && \
     [ "$WEB_VERSION" = "$RELEASE" ] && \
     [ "$CURRENT_TARGET" = "$APP_ROOT/releases/$RELEASE" ]; then
    echo "Health check passed: api=$API_IMAGE web=$WEB_IMAGE current=$CURRENT_TARGET"
    exit 0
  fi

  if [ "$API_STATE" = "exited" ] || [ "$API_STATE" = "dead" ] || [ "$API_STATE" = "not_found" ]; then
    dump_logs "$API_CONTAINER"
    exit 1
  fi

  if [ "$WEB_STATE" = "exited" ] || [ "$WEB_STATE" = "dead" ] || [ "$WEB_STATE" = "not_found" ]; then
    dump_logs "$WEB_CONTAINER"
    exit 1
  fi

  echo "Attempt $i/30: api_state=$API_STATE api_health=$API_HEALTH api_image=$API_IMAGE api_version=$API_VERSION web_state=$WEB_STATE web_health=$WEB_HEALTH web_image=$WEB_IMAGE web_version=$WEB_VERSION current=$CURRENT_TARGET web_http=$WEB_HTTP"
  sleep 5
done

echo "Health check failed after 150s" >&2
docker ps -a --filter "name=^palmital-" >&2 || true
dump_logs "$API_CONTAINER"
dump_logs "$WEB_CONTAINER"
exit 1
