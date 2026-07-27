#!/usr/bin/env bash
# Contained acceptance runtime adapter for socmed-test-app.
# Starts a disposable Postgres database + API (serving frontend/dist) on OS-assigned ports.
#
# Usage:
#   scripts/accept-runtime.sh start <worktree-abs-path> [manifest-path]
#   scripts/accept-runtime.sh stop  <manifest-path>
#
# Env (optional):
#   ACCEPT_MAIN_REPO   Absolute path to the primary checkout (node_modules source)
#   ACCEPT_PGHOST      Default 127.0.0.1
#   ACCEPT_PGPORT      Default 55432
#   ACCEPT_PGUSER      App role (default socmed)
#   ACCEPT_PGPASSWORD  App role password (default socmed)
#   ACCEPT_PGADMIN     Role that can CREATE/DROP DATABASE (default: $USER, then postgres)
set -euo pipefail

CMD="${1:-}"
ROOT="${2:-}"
MANIFEST="${3:-}"

die() { echo "accept-runtime: $*" >&2; exit 1; }

free_port() {
  python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
}

resolve_main_repo() {
  local ROOT="$1"
  local MAIN=""

  if [[ -n "${ACCEPT_MAIN_REPO:-}" ]]; then
    MAIN="$ACCEPT_MAIN_REPO"
  fi

  if [[ -z "$MAIN" || ! -d "$MAIN/node_modules" ]]; then
    # Prefer the primary worktree listed by git (first non-linked checkout)
    MAIN="$(git worktree list --porcelain 2>/dev/null | awk '/^worktree /{print $2; exit}')"
  fi

  if [[ -z "$MAIN" || ! -d "$MAIN/node_modules" ]]; then
    local COMMON
    COMMON="$(cd "$ROOT" && git rev-parse --git-common-dir)"
    if [[ "$(basename "$COMMON")" == ".git" ]]; then
      MAIN="$(cd "$COMMON/.." && pwd)"
    elif [[ -d "$COMMON/.." ]]; then
      MAIN="$(cd "$COMMON/.." && pwd)"
    fi
  fi

  if [[ -z "$MAIN" || ! -d "$MAIN/node_modules" ]]; then
    die "could not resolve primary repo with node_modules. Set ACCEPT_MAIN_REPO=/path/to/checkout"
  fi
  echo "$MAIN"
}

link_deps() {
  local ROOT="$1"
  local MAIN
  MAIN="$(resolve_main_repo "$ROOT")"
  if [[ ! -d "$ROOT/node_modules" && -d "$MAIN/node_modules" ]]; then
    ln -sfn "$MAIN/node_modules" "$ROOT/node_modules"
  fi
  if [[ ! -d "$ROOT/frontend/node_modules" && -d "$MAIN/frontend/node_modules" ]]; then
    ln -sfn "$MAIN/frontend/node_modules" "$ROOT/frontend/node_modules"
  fi
}

pg_admin_user() {
  if [[ -n "${ACCEPT_PGADMIN:-}" ]]; then
    echo "$ACCEPT_PGADMIN"
    return
  fi
  if [[ -n "${USER:-}" ]]; then
    echo "$USER"
    return
  fi
  echo "postgres"
}

create_db_docker() {
  local RUN_ID="$1" DB_PORT="$2"
  docker run -d --rm \
    --name "$RUN_ID-db" \
    -e POSTGRES_USER=socmed \
    -e POSTGRES_PASSWORD=socmed_accept \
    -e POSTGRES_DB=socmed_accept \
    -p "127.0.0.1:${DB_PORT}:5432" \
    postgres:16-alpine >/dev/null
  for i in $(seq 1 40); do
    if docker exec "$RUN_ID-db" pg_isready -U socmed -d socmed_accept >/dev/null 2>&1; then
      echo "postgres://socmed:socmed_accept@127.0.0.1:${DB_PORT}/socmed_accept"
      return 0
    fi
    sleep 0.5
  done
  docker rm -f "$RUN_ID-db" >/dev/null 2>&1 || true
  return 1
}

create_db_local() {
  local RUN_ID="$1"
  local DB_NAME="acc_$(echo "$RUN_ID" | tr '-' '_' | tail -c 48)"
  local PGHOST="${ACCEPT_PGHOST:-127.0.0.1}"
  local PGPORT="${ACCEPT_PGPORT:-55432}"
  local APP_USER="${ACCEPT_PGUSER:-socmed}"
  local APP_PASS="${ACCEPT_PGPASSWORD:-socmed}"
  local ADMIN_USER
  ADMIN_USER="$(pg_admin_user)"
  # Admin creates disposable DB owned by app role (socmed typically lacks CREATEDB)
  psql -h "$PGHOST" -p "$PGPORT" -U "$ADMIN_USER" -d postgres -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";" >/dev/null
  psql -h "$PGHOST" -p "$PGPORT" -U "$ADMIN_USER" -d postgres -v ON_ERROR_STOP=1 \
    -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${APP_USER}\";" >/dev/null \
    || return 1
  echo "postgres://${APP_USER}:${APP_PASS}@${PGHOST}:${PGPORT}/${DB_NAME}"
}

drop_db_local_by_name() {
  local DB_NAME="$1"
  local PGHOST="${ACCEPT_PGHOST:-127.0.0.1}"
  local PGPORT="${ACCEPT_PGPORT:-55432}"
  local ADMIN_USER
  ADMIN_USER="$(pg_admin_user)"
  psql -h "$PGHOST" -p "$PGPORT" -U "$ADMIN_USER" -d postgres -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS \"${DB_NAME}\" WITH (FORCE);" >/dev/null
}

start() {
  [[ -n "$ROOT" && -d "$ROOT" ]] || die "worktree path required"
  MANIFEST="${MANIFEST:-$ROOT/.accept-runtime.json}"
  RUN_ID="socmed-accept-$(date +%s)-$$"
  API_PORT="$(free_port)"
  UPLOAD_DIR="$ROOT/.accept-uploads"
  mkdir -p "$UPLOAD_DIR"
  link_deps "$ROOT"

  DB_MODE=""
  DATABASE_URL=""
  DB_CONTAINER=""
  DB_PORT=0
  DB_NAME=""
  SHARED_PG_SERVER=false

  if command -v docker >/dev/null 2>&1; then
    DB_PORT="$(free_port)"
    if DATABASE_URL="$(create_db_docker "$RUN_ID" "$DB_PORT")"; then
      DB_MODE="docker"
      DB_CONTAINER="$RUN_ID-db"
      DB_NAME="socmed_accept"
    fi
  fi

  if [[ -z "$DATABASE_URL" ]]; then
    DATABASE_URL="$(create_db_local "$RUN_ID")" || die "could not create disposable database (docker missing and local psql failed)"
    DB_MODE="local-disposable-db"
    SHARED_PG_SERVER=true
    DB_PORT="${ACCEPT_PGPORT:-55432}"
    DB_NAME="$(python3 - <<PY
from urllib.parse import urlparse
print(urlparse("$DATABASE_URL").path.lstrip("/"))
PY
)"
  fi

  export DATABASE_URL
  export NODE_ENV=development
  export PORT="$API_PORT"
  export SESSION_SECRET="accept-runtime-secret-${RUN_ID}"
  export CORS_ORIGIN="http://127.0.0.1:${API_PORT}"
  export UPLOAD_DIR
  export COOKIE_SECURE=false
  export LOG_LEVEL=warn

  (cd "$ROOT" && npm run migrate) >/tmp/"$RUN_ID-migrate.log" 2>&1 || {
    cat /tmp/"$RUN_ID-migrate.log" >&2
    [[ "$DB_MODE" == "docker" ]] && docker rm -f "$DB_CONTAINER" >/dev/null 2>&1 || true
    [[ "$DB_MODE" == "local-disposable-db" && -n "$DB_NAME" ]] && drop_db_local_by_name "$DB_NAME" || true
    die "migrate failed"
  }

  (cd "$ROOT/frontend" && npm run build) >/tmp/"$RUN_ID-build.log" 2>&1 || {
    cat /tmp/"$RUN_ID-build.log" >&2
    [[ "$DB_MODE" == "docker" ]] && docker rm -f "$DB_CONTAINER" >/dev/null 2>&1 || true
    [[ "$DB_MODE" == "local-disposable-db" && -n "$DB_NAME" ]] && drop_db_local_by_name "$DB_NAME" || true
    die "frontend build failed"
  }

  # Detach so the API survives the parent shell exiting.
  # Prefer setsid (Linux); fall back to nohup (macOS has no setsid).
  if command -v setsid >/dev/null 2>&1; then
    _detach() { setsid "$@"; }
  else
    _detach() { nohup "$@"; }
  fi
  _detach env \
    DATABASE_URL="$DATABASE_URL" \
    NODE_ENV="$NODE_ENV" \
    PORT="$PORT" \
    SESSION_SECRET="$SESSION_SECRET" \
    CORS_ORIGIN="$CORS_ORIGIN" \
    UPLOAD_DIR="$UPLOAD_DIR" \
    COOKIE_SECURE="$COOKIE_SECURE" \
    LOG_LEVEL="$LOG_LEVEL" \
    npx --yes tsx "$ROOT/src/index.ts" \
    >/tmp/"$RUN_ID-api.log" 2>&1 &
  API_PID=$!

  READY=0
  for i in $(seq 1 60); do
    if curl -sf "http://127.0.0.1:${API_PORT}/" >/dev/null 2>&1; then
      READY=1
      break
    fi
    if ! kill -0 "$API_PID" 2>/dev/null; then
      cat /tmp/"$RUN_ID-api.log" >&2 || true
      [[ "$DB_MODE" == "docker" ]] && docker rm -f "$DB_CONTAINER" >/dev/null 2>&1 || true
      [[ "$DB_MODE" == "local-disposable-db" && -n "$DB_NAME" ]] && drop_db_local_by_name "$DB_NAME" || true
      die "api process exited"
    fi
    sleep 0.25
  done
  if [[ "$READY" -ne 1 ]]; then
    kill "$API_PID" 2>/dev/null || true
    cat /tmp/"$RUN_ID-api.log" >&2 || true
    [[ "$DB_MODE" == "docker" ]] && docker rm -f "$DB_CONTAINER" >/dev/null 2>&1 || true
    [[ "$DB_MODE" == "local-disposable-db" && -n "$DB_NAME" ]] && drop_db_local_by_name "$DB_NAME" || true
    die "api not ready"
  fi

  NOT_SHARED_APP_PORTS=True
  if [[ "$API_PORT" == "3210" || "$API_PORT" == "5180" ]]; then
    NOT_SHARED_APP_PORTS=False
  fi

  SHARED_PG_PY=False
  if [[ "$SHARED_PG_SERVER" == "true" ]]; then
    SHARED_PG_PY=True
  fi

  python3 - <<PY
import json
from pathlib import Path
manifest = {
  "runId": "$RUN_ID",
  "startedAt": __import__("datetime").datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
  "worktree": "$ROOT",
  "hostname": "127.0.0.1",
  "apiPort": int("$API_PORT"),
  "dbPort": int("$DB_PORT"),
  "dbName": "$DB_NAME",
  "baseUrl": "http://127.0.0.1:${API_PORT}",
  "databaseUrl": "postgres://***:***@127.0.0.1:${DB_PORT}/$DB_NAME",
  "uploadDir": "$UPLOAD_DIR",
  "apiPid": int("$API_PID"),
  "dbContainer": "$DB_CONTAINER",
  "dbMode": "$DB_MODE",
  "workers": "off",
  "mail": "disabled",
  "externalWrites": "disabled",
  "status": "running",
  "invariants": {
    "isolatedWorktree": True,
    "disposableDb": True,
    "sharedPostgresServer": $SHARED_PG_PY,
    "hostBoundPortsOnly": True,
    "osAssignedPorts": True,
    "uploadsNamespaced": True,
    "workersOff": True,
    "mailDisabled": True,
    "externalWritesDisabled": True,
    "notUsingSharedAppPorts": $NOT_SHARED_APP_PORTS,
  }
}
Path("$MANIFEST").write_text(json.dumps(manifest, indent=2) + "\n")
print("$MANIFEST")
PY
}

stop() {
  MANIFEST="${ROOT:-}"
  [[ -f "$MANIFEST" ]] || die "manifest path required"
  export MANIFEST_PATH="$MANIFEST"
  export ACCEPT_PGADMIN="$(pg_admin_user)"
  export ACCEPT_PGHOST="${ACCEPT_PGHOST:-127.0.0.1}"
  export ACCEPT_PGPORT="${ACCEPT_PGPORT:-55432}"
  python3 - <<'PY'
import json, os, signal, subprocess, time
from pathlib import Path

manifest_path = Path(os.environ["MANIFEST_PATH"])
data = json.loads(manifest_path.read_text())
pid = data.get("apiPid")
if pid:
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    for _ in range(20):
        try:
            os.kill(pid, 0)
            time.sleep(0.1)
        except ProcessLookupError:
            break
    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass

db_mode = data.get("dbMode")
if db_mode == "docker" and data.get("dbContainer"):
    subprocess.run(["docker", "rm", "-f", data["dbContainer"]], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
elif db_mode == "local-disposable-db":
    db_name = data.get("dbName") or ""
    if db_name:
        admin = os.environ.get("ACCEPT_PGADMIN") or os.environ.get("USER") or "postgres"
        host = os.environ.get("ACCEPT_PGHOST", "127.0.0.1")
        port = os.environ.get("ACCEPT_PGPORT", "55432")
        subprocess.run([
            "psql", "-h", host, "-p", str(port),
            "-U", admin, "-d", "postgres", "-v", "ON_ERROR_STOP=1",
            "-c", f'DROP DATABASE IF EXISTS "{db_name}" WITH (FORCE);'
        ], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

upload = data.get("uploadDir")
if upload:
    subprocess.run(["rm", "-rf", upload], check=False)

data["stoppedAt"] = __import__("datetime").datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
data["status"] = "stopped"
manifest_path.write_text(json.dumps(data, indent=2) + "\n")
print(f"stopped {manifest_path}")
PY
}

case "$CMD" in
  start) start ;;
  stop)
    stop
    ;;
  *) die "usage: $0 start <worktree> [manifest] | stop <manifest>" ;;
esac
