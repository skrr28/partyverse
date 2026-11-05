#!/usr/bin/env bash
# Levanta un PostgreSQL temporal, aplica el shim de Supabase + las migraciones
# reales y ejecuta la partida simulada. Requiere los binarios de PostgreSQL
# (initdb, pg_ctl, psql). Uso: npm run test:db
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-$(dirname "$(command -v initdb 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/initdb 2>/dev/null | tail -1)")}"
PORT="${PV_TEST_PG_PORT:-54329}"
DATA="$(mktemp -d)"
LOG="$DATA/pg.log"

# PostgreSQL no arranca como root: usa el usuario «postgres» si hace falta.
RUN=()
if [ "$(id -u)" = "0" ]; then
  chown -R postgres "$DATA"
  RUN=(runuser -u postgres --)
fi

cleanup() { "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DATA/db" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

"${RUN[@]}" "$PG_BIN/initdb" -D "$DATA/db" -U postgres -A trust >/dev/null
"${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DATA/db" -l "$LOG" -o "-p $PORT -k $DATA -c listen_addresses=''" -w start >/dev/null

export PGHOST="$DATA" PGPORT="$PORT" PGUSER=postgres PGDATABASE=postgres
PSQL=(psql -X -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -f "$ROOT/supabase/sql-tests/supabase_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ migración $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done

if [ "${1:-}" = "--keep-for" ]; then
  # Modo usado por el test de paridad TS↔SQL: ejecuta un comando con la BD viva.
  shift
  "$@"
  exit $?
fi

"${PSQL[@]}" -o /dev/null -f "$ROOT/supabase/sql-tests/game_flow.test.sql" 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /'
