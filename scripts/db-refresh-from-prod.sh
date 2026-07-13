#!/usr/bin/env bash
#
# Refresh the local Postgres from the PRODUCTION box — the source of truth for
# content now that Supabase and Akeneo are retired. Content is authored in prod
# via /admin; this pulls a fresh copy DOWN to your machine for development.
#
# ONE-WAY ONLY: prod -> local. This NEVER writes to prod. It OVERWRITES your
# LOCAL data with a fresh copy, so any un-pushed local DB changes are lost.
#
# (Replaces the retired scripts/db-refresh-from-supabase.sh.)
#
# Usage:
#   ./scripts/db-refresh-from-prod.sh                # database only
#   ./scripts/db-refresh-from-prod.sh --with-media   # also copy media files into ./media
#
# Requires:
#   - Docker running (hosts your local Postgres container `envo-pg-local`)
#   - Tailscale up — the box is SSH-reachable ONLY over Tailscale since the
#     public-SSH lockdown (100.106.130.54)
#   - An SSH key of YOURS authorized on the box (default path
#     ~/.ssh/envo_deploy_ed25519; override with ENVO_BOX_KEY=~/.ssh/your_key)
set -euo pipefail
cd "$(dirname "$0")/.."

CONTAINER="envo-pg-local"
IMAGE="postgres:17-alpine"
HOST_PORT="5433"
LOCAL_URI="postgresql://envo:envo_dev_password@host.docker.internal:${HOST_PORT}/envo_dev"

# Overridable so a teammate can point at THEIR OWN key without editing this file:
#   ENVO_BOX_KEY=~/.ssh/my_envo_key ./scripts/db-refresh-from-prod.sh
BOX_SSH="${ENVO_BOX_SSH:-root@100.106.130.54}"  # Tailscale IP (public SSH is closed)
BOX_KEY="${ENVO_BOX_KEY:-$HOME/.ssh/envo_deploy_ed25519}"
BOX_VOL="/var/lib/docker/volumes/envo_media/_data"

WITH_MEDIA=0
[ "${1:-}" = "--with-media" ] && WITH_MEDIA=1

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is not running. Start Docker Desktop and retry." >&2
  exit 1
fi

# --- ensure the local Postgres is running (defined ONCE in docker-compose.yml,
#     container `envo-pg-local` on host port 5433) ---
echo "Ensuring local Postgres is up (docker compose up -d postgres)..."
docker compose up -d postgres >/dev/null

echo -n "Waiting for local Postgres to be ready"
for _ in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U envo -d envo_dev >/dev/null 2>&1; then echo " ok"; break; fi
  echo -n "."; sleep 1
done

mkdir -p .local-db

# --- dump the prod DB over Tailscale (uses the container's own creds; never
#     touches prod except a read-only pg_dump) ---
echo "Dumping envo_prod from the box (over Tailscale)..."
REMOTE_DUMP='docker exec envo-postgres sh -c '\''PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -h 127.0.0.1 --schema=public --no-owner --no-privileges -Fc "$POSTGRES_DB"'\'''
ssh -i "$BOX_KEY" -o BatchMode=yes "$BOX_SSH" "$REMOTE_DUMP" > .local-db/prod-public.dump
echo "  dump size: $(du -h .local-db/prod-public.dump | cut -f1)"

echo "Ensuring extensions exist locally..."
docker exec "$CONTAINER" psql -U envo -d envo_dev -q \
  -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'

echo "Restoring into local ($CONTAINER)..."
# --clean --if-exists makes this idempotent. The handful of ignored errors about
# schema "public" (can't drop/recreate because extensions live in it) are harmless.
docker run --rm -v "$PWD/.local-db:/dump" "$IMAGE" \
  pg_restore --no-owner --no-privileges --clean --if-exists --disable-triggers \
  -d "$LOCAL_URI" /dump/prod-public.dump 2>&1 \
  | grep -viE 'does not exist, skipping|cannot drop schema public|schema "public" already exists|errors ignored on restore' || true

# --- optional: copy the media files so images render locally ---
if [ "$WITH_MEDIA" = 1 ]; then
  echo "Copying media files from the box into ./media ..."
  mkdir -p media
  ssh -i "$BOX_KEY" -o BatchMode=yes "$BOX_SSH" "tar -C $BOX_VOL -czf - ." | tar -C media -xzf - 2>/dev/null || true
  echo "  media files now local: $(find media -type f | wc -l | tr -d ' ')"
fi

echo "Done — local DB refreshed from PROD ($([ "$WITH_MEDIA" = 1 ] && echo 'with media' || echo 'DB only'))."
