#!/usr/bin/env bash
set -euo pipefail

: "${APP_ROOT:?APP_ROOT is required}"
: "${RELEASE:?RELEASE is required}"
: "${DEPLOY_PORT:?DEPLOY_PORT is required}"

RELEASE_DIR="$APP_ROOT/releases/$RELEASE"
CURRENT_DIR="$APP_ROOT/current"
ROOT_ENV_FILE="$APP_ROOT/.env"
ENV_FILE="$RELEASE_DIR/.env"
COMPOSE_FILE="$RELEASE_DIR/docker-compose.production.yml"
LOCK_FILE="$APP_ROOT/deploy.lock"
STATE_DIR="$APP_ROOT/.deploy-state"
POSTGRES_CONTAINER="palmital-postgres-1"
API_CONTAINER="palmital-api-1"
WEB_CONTAINER="palmital-web-1"
DEPLOY_SUCCEEDED=0
PREVIOUS_RELEASE_DIR="$(readlink -f "$CURRENT_DIR" 2>/dev/null || true)"

mkdir -p "$STATE_DIR"
exec 9>"$LOCK_FILE"
flock 9

echo "$RELEASE" > "$STATE_DIR/in-progress"

compose_release() {
  local release_dir="$1"
  local release_env="$release_dir/.env"
  local release_compose="$release_dir/docker-compose.production.yml"
  docker compose -p palmital -f "$release_compose" --env-file "$release_env" "${@:2}"
}

compose() {
  compose_release "$RELEASE_DIR" "$@"
}

container_state() {
  docker inspect --format '{{.State.Status}}' "$1" 2>/dev/null || echo "not_found"
}

container_health() {
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no_healthcheck{{end}}' "$1" 2>/dev/null || echo "not_found"
}

container_image() {
  docker inspect --format '{{.Config.Image}}' "$1" 2>/dev/null || echo ""
}

dump_service_logs() {
  local container_name="$1"
  echo "--- logs: $container_name ---" >&2
  docker logs --tail=100 "$container_name" >&2 || true
}

sync_release_env() {
  cp "$ROOT_ENV_FILE" "$ENV_FILE"
  if grep -q '^RELEASE_VERSION=' "$ENV_FILE"; then
    sed -i "s/^RELEASE_VERSION=.*/RELEASE_VERSION=$RELEASE/" "$ENV_FILE"
  else
    printf 'RELEASE_VERSION=%s\n' "$RELEASE" >> "$ENV_FILE"
  fi
  chmod 600 "$ENV_FILE"
}

wait_for_container_state() {
  local container_name="$1"
  local desired_state="$2"
  local attempts="$3"
  local delay_seconds="$4"
  local i
  local state

  for i in $(seq 1 "$attempts"); do
    state="$(container_state "$container_name")"
    echo "  $container_name[$i/$attempts]: state=$state"
    if [ "$state" = "$desired_state" ]; then
      return 0
    fi
    if [ "$state" = "exited" ] || [ "$state" = "dead" ]; then
      dump_service_logs "$container_name"
      return 1
    fi
    sleep "$delay_seconds"
  done

  dump_service_logs "$container_name"
  return 1
}

wait_for_container_health() {
  local container_name="$1"
  local attempts="$2"
  local delay_seconds="$3"
  local i
  local state
  local health

  for i in $(seq 1 "$attempts"); do
    state="$(container_state "$container_name")"
    health="$(container_health "$container_name")"
    echo "  $container_name[$i/$attempts]: state=$state health=$health"

    if [ "$state" = "exited" ] || [ "$state" = "dead" ]; then
      dump_service_logs "$container_name"
      return 1
    fi

    if [ "$health" = "healthy" ] || [ "$health" = "no_healthcheck" ]; then
      return 0
    fi

    sleep "$delay_seconds"
  done

  dump_service_logs "$container_name"
  return 1
}

verify_release_runtime() {
  local api_image
  local api_version
  local web_image
  local web_version

  api_image="$(container_image "$API_CONTAINER")"
  api_version="$(docker exec "$API_CONTAINER" cat /app/.release-version 2>/dev/null || true)"
  if [ "$api_image" != "palmital-api:$RELEASE" ] || [ "$api_version" != "$RELEASE" ]; then
    echo "API release mismatch: expected_image=palmital-api:$RELEASE got_image=$api_image expected_version=$RELEASE got_version=$api_version" >&2
    dump_service_logs "$API_CONTAINER"
    return 1
  fi

  web_image="$(container_image "$WEB_CONTAINER")"
  web_version="$(docker exec "$WEB_CONTAINER" cat /usr/share/nginx/html/release.txt 2>/dev/null || true)"
  if [ "$web_image" != "palmital-web:$RELEASE" ] || [ "$web_version" != "$RELEASE" ]; then
    echo "Web release mismatch: expected_image=palmital-web:$RELEASE got_image=$web_image expected_version=$RELEASE got_version=$web_version" >&2
    dump_service_logs "$WEB_CONTAINER"
    return 1
  fi
}

verify_port_health() {
  local i

  echo "Verifying external port health..."
  for i in $(seq 1 18); do
    if curl -fsS --max-time 5 "http://127.0.0.1:${DEPLOY_PORT}/health" | grep -q '"status":"ok"'; then
      echo "Port ${DEPLOY_PORT} verified"
      return 0
    fi

    echo "  port[$i/18]: waiting for http://127.0.0.1:${DEPLOY_PORT}/health"

    if [ "$i" -eq 18 ]; then
      dump_service_logs "$API_CONTAINER"
      dump_service_logs "$WEB_CONTAINER"
      echo "--- port bindings ---" >&2
      ss -tlnp 2>/dev/null | grep -E "${DEPLOY_PORT}|3000|3001" >&2 || true
      return 1
    fi

    sleep 5
  done
}

promote_release() {
  ln -sfn "$RELEASE_DIR" "$CURRENT_DIR"

  local current_target
  current_target="$(readlink -f "$CURRENT_DIR" 2>/dev/null || true)"
  if [ "$current_target" != "$RELEASE_DIR" ]; then
    echo "Failed to promote release: current=$current_target expected=$RELEASE_DIR" >&2
    return 1
  fi

  echo "$RELEASE" > "$STATE_DIR/last-successful-release"
  rm -f "$STATE_DIR/in-progress"
  echo "Current release promoted to $current_target"
}

cleanup_old_releases() {
  mapfile -t releases < <(find "$APP_ROOT/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | awk '{print $2}')
  if [ "${#releases[@]}" -le 5 ]; then
    return 0
  fi

  for release_path in "${releases[@]:5}"; do
    if [ "$(readlink -f "$release_path")" = "$RELEASE_DIR" ]; then
      continue
    fi
    rm -rf -- "$release_path"
  done
}

rollback() {
  local exit_code="$1"
  trap - ERR

  if [ "$DEPLOY_SUCCEEDED" -eq 1 ]; then
    exit "$exit_code"
  fi

  echo "Deploy failed for $RELEASE. Attempting rollback..." >&2
  if [ -n "$PREVIOUS_RELEASE_DIR" ] && [ -f "$PREVIOUS_RELEASE_DIR/docker-compose.production.yml" ] && [ -f "$PREVIOUS_RELEASE_DIR/.env" ]; then
    compose_release "$PREVIOUS_RELEASE_DIR" up -d --remove-orphans --no-build postgres api web || true
    ln -sfn "$PREVIOUS_RELEASE_DIR" "$CURRENT_DIR" || true
    echo "Rollback attempted to $PREVIOUS_RELEASE_DIR" >&2
  else
    echo "No previous release available for rollback" >&2
  fi

  rm -f "$STATE_DIR/in-progress"
  exit "$exit_code"
}

trap 'rollback $?' ERR
trap 'rollback 1' HUP INT TERM

if [ ! -d "$RELEASE_DIR" ]; then
  echo "Release directory not found: $RELEASE_DIR" >&2
  exit 1
fi

if [ ! -f "$ROOT_ENV_FILE" ]; then
  echo "Root env file not found: $ROOT_ENV_FILE" >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

docker volume create palmital-postgres-data >/dev/null
docker volume create palmital-uploads >/dev/null
docker volume create palmital-logs >/dev/null
docker volume inspect palmital-postgres-data palmital-uploads palmital-logs >/dev/null
echo "Persistent volumes ready: postgres=palmital-postgres-data uploads=palmital-uploads logs=palmital-logs"

# Pre-build cleanup: remove stopped containers and dangling images to free RAM/disk
# Scoped to palmital project only — never touches other projects on this host
echo "Pre-build cleanup..."
docker compose -p palmital ps -aq --filter status=exited 2>/dev/null \
  | xargs -r docker rm -f 2>/dev/null || true
docker builder prune -af --filter 'until=1h' >/dev/null 2>&1 || true
echo "Pre-build cleanup done"

sync_release_env

cd "$RELEASE_DIR"
compose build --pull migrator api web

echo "Starting postgres..."
compose up -d postgres
wait_for_container_state "$POSTGRES_CONTAINER" running 24 5
wait_for_container_health "$POSTGRES_CONTAINER" 36 5

echo "Running migrations..."
compose run --rm migrator

echo "Starting application services..."
compose rm -sf api web || true
docker rm -f "$API_CONTAINER" "$WEB_CONTAINER" >/dev/null 2>&1 || true
compose up -d --remove-orphans --no-build api web

wait_for_container_state "$API_CONTAINER" running 24 5
wait_for_container_health "$API_CONTAINER" 36 5
wait_for_container_state "$WEB_CONTAINER" running 24 5
wait_for_container_health "$WEB_CONTAINER" 30 5

verify_release_runtime
verify_port_health
promote_release

DEPLOY_SUCCEEDED=1
trap - ERR
trap - HUP INT TERM

cleanup_old_releases || true

# Post-deploy cleanup: remove only OLD palmital images (api/web/migrator) not tagged with current release.
# Volumes and images from other projects on this host are never touched.
echo "Post-deploy image cleanup (palmital only)..."
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' \
  | grep -E '^palmital-(api|web|migrator):' \
  | grep -v ":${RELEASE}" \
  | awk '{print $2}' \
  | xargs -r docker rmi -f 2>/dev/null || true

# Remove stopped containers scoped to palmital project
docker compose -p palmital ps -aq --filter status=exited 2>/dev/null \
  | xargs -r docker rm -f 2>/dev/null || true

# Remove dangling images (no tag, no reference) — safe on any host
docker image prune -f >/dev/null 2>&1 || true

# Remove build cache older than 1 hour
docker builder prune -af --filter 'until=1h' >/dev/null 2>&1 || true

echo "Deploy completed successfully for $RELEASE"
