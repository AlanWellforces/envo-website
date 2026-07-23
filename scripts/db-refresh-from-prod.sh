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

# After restore, customer PII and credentials are scrubbed so real leads,
# drawings, session tokens and password hashes never live on a laptop. Every
# team account's password is reset to this shared dev password (login by the
# original email still works locally). Override if you want a different one.
#   NO_SANITIZE=1 ./scripts/db-refresh-from-prod.sh   # opt out (discouraged)
DEV_PASSWORD="${ENVO_DEV_PASSWORD:-envodev}"
NO_SANITIZE="${NO_SANITIZE:-0}"

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

# --- sanitize: strip customer PII + credentials from the local copy ---
# This is prod data on a dev laptop; scrub anything we would not want to leak.
if [ "$NO_SANITIZE" != 1 ]; then
  echo "Sanitizing PII + credentials in the local copy..."

  # Payload hashes passwords with pbkdf2(pw, salt, 25000, 512, 'sha256').
  # Generate a salt+hash for DEV_PASSWORD so every local account shares it.
  DEV_SALT="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"
  DEV_HASH="$(node -e "console.log(require('crypto').pbkdf2Sync(process.argv[1], process.argv[2], 25000, 512, 'sha256').toString('hex'))" "$DEV_PASSWORD" "$DEV_SALT")"

  docker exec -i "$CONTAINER" psql -U envo -d envo_dev -q -v ON_ERROR_STOP=1 \
    -v dev_salt="$DEV_SALT" -v dev_hash="$DEV_HASH" <<'SQL'
BEGIN;
-- Customer enquiries: keep row shape (type/status/timestamps) for dev, drop the PII.
UPDATE submissions SET
  name    = 'Dev Lead ' || id,
  email   = 'lead-' || id || '@example.test',
  phone   = NULL,
  company = 'Example Co',
  message = CASE WHEN message IS NULL THEN NULL ELSE '[scrubbed for dev]' END,
  details = CASE WHEN details IS NULL THEN NULL ELSE '[scrubbed for dev]' END,
  data    = '{}'::jsonb;

-- Customer-uploaded drawings: scrub filenames/URLs/alt (the blobs only arrive with --with-media).
UPDATE lead_files SET
  filename        = 'scrubbed-' || id,
  alt             = NULL,
  url             = NULL,
  thumbnail_u_r_l = NULL;

-- Active admin sessions must never travel to a laptop.
DELETE FROM users_sessions;

-- Team accounts: keep email/name/role so local admin is recognisable, but
-- replace real password hashes with the shared dev credential and clear any
-- pending reset tokens.
UPDATE users SET
  salt = :'dev_salt',
  hash = :'dev_hash',
  reset_password_token = NULL,
  reset_password_expiration = NULL,
  login_attempts = 0,
  lock_until = NULL;
COMMIT;
SQL
  echo "  PII scrubbed; all local logins now use password: ${DEV_PASSWORD}"
fi

# --- optional: copy the media files so images render locally ---
if [ "$WITH_MEDIA" = 1 ]; then
  echo "Copying media files from the box into ./media ..."
  mkdir -p media
  ssh -i "$BOX_KEY" -o BatchMode=yes "$BOX_SSH" "tar -C $BOX_VOL -czf - ." | tar -C media -xzf - 2>/dev/null || true
  echo "  media files now local: $(find media -type f | wc -l | tr -d ' ')"
fi

echo "Done — local DB refreshed from PROD ($([ "$WITH_MEDIA" = 1 ] && echo 'with media' || echo 'DB only'))."
