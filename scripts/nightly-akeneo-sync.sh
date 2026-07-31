#!/usr/bin/env bash
#
# Nightly Akeneo → prod sync, run from a dev/office machine on the tailnet.
# (The box has no Akeneo credentials and no node checkout; this machine has
# both, so the nightly job lives here — scheduled via launchd, see
# ~/Library/LaunchAgents/com.envo.akeneo-sync.plist on the marketing Mac.)
#
# What it does:
#   1. SSH-tunnels prod Postgres (container port isn't published on the box —
#      the tunnel targets the container IP, resolved fresh each run).
#   2. Runs scripts/akeneo-sync.ts in spec-only mode against prod:
#      spec/asset fields only, sync_locked products skipped, curated text
#      (name/descriptions/seo) never overwritten — see SYNC_PROTECTED_FIELDS.
#   3. POSTs /api/revalidate (__site-settings = full-tree re-render + CF purge)
#      so both the public pages and anything cached pick up the new data.
#
# Requires: Tailscale up, ~/.ssh/envo_deploy_ed25519 authorized on the box,
# Akeneo creds in ~/Desktop/wellforces_automation/_shared/.env, node_modules
# installed in this checkout.
set -euo pipefail
cd "$(dirname "$0")/.."

BOX="root@100.106.130.54"
KEY="${ENVO_BOX_KEY:-$HOME/.ssh/envo_deploy_ed25519}"
SSH="ssh -i $KEY -o ConnectTimeout=15 -o BatchMode=yes"
TUNNEL_PORT=15432
SOCK="/tmp/envo-akeneo-sync-tunnel.sock"
LOCK="/tmp/envo-akeneo-sync.lock"
CREDS="$HOME/Desktop/wellforces_automation/_shared/.env"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# --- no concurrent runs
if ! mkdir "$LOCK" 2>/dev/null; then
  log "another sync appears to be running ($LOCK exists) — exiting"
  exit 0
fi
cleanup() {
  [ -S "$SOCK" ] && ssh -S "$SOCK" -O exit "$BOX" 2>/dev/null || true
  rmdir "$LOCK" 2>/dev/null || true
}
trap cleanup EXIT

# --- Akeneo creds (the repo's .env.local has none; the real ones live in the
#     automation share, with the URL under a different var name)
if [ ! -f "$CREDS" ]; then log "ERROR: $CREDS not found"; exit 1; fi
set -a; source "$CREDS"; set +a
export AKENEO_URL="${AKENEO_URL:-$AKENEO_BASE_URL}"

# --- resolve prod DB coordinates (container IP can change on recreate)
log "resolving prod postgres container..."
PGIP=$($SSH "$BOX" "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' envo-postgres")
PGUSER=$($SSH "$BOX" "docker exec envo-postgres printenv POSTGRES_USER")
PGDB=$($SSH "$BOX" "docker exec envo-postgres printenv POSTGRES_DB")
PGPW_RAW=$($SSH "$BOX" "docker exec envo-postgres printenv POSTGRES_PASSWORD")
PGPW=$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$PGPW_RAW")
[ -n "$PGIP" ] || { log "ERROR: could not resolve envo-postgres IP"; exit 1; }

# --- tunnel
log "opening tunnel localhost:$TUNNEL_PORT -> $PGIP:5432"
ssh -i "$KEY" -o ExitOnForwardFailure=yes -o BatchMode=yes \
    -M -S "$SOCK" -fN -L "127.0.0.1:$TUNNEL_PORT:$PGIP:5432" "$BOX"

# --- sync (spec-only; DATABASE_URL set here wins over .env.local — dotenv
#     never overrides pre-set vars). PAYLOAD_DB_PUSH MUST be forced off: the
#     local .env.local sets it true for dev, and against prod it would drizzle-
#     push this checkout's schema onto the production database.
log "running spec-only sync against prod..."
# REVALIDATE_SECRET is blanked so the per-product afterChange hook no-ops
# (it would ECONNREFUSED against the local dev URL from .env.local anyway);
# the single full-tree revalidate below covers everything in one shot.
PAYLOAD_DB_PUSH=false REVALIDATE_SECRET="" \
DATABASE_URL="postgresql://$PGUSER:$PGPW@127.0.0.1:$TUNNEL_PORT/$PGDB" \
  npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts

# --- re-render + CF purge (route validates x-revalidate-secret; secret lives
#     only in the prod container env, fetched fresh so it never sits on disk)
log "revalidating site..."
REVAL_SECRET=$($SSH "$BOX" "docker exec envo-website printenv REVALIDATE_SECRET")
HTTP=$(curl -s -o /tmp/envo-reval-resp.json -w '%{http_code}' -X POST \
  "https://envolighting.com/api/revalidate?paths=/__site-settings" \
  -H "x-revalidate-secret: $REVAL_SECRET")
log "revalidate HTTP $HTTP $(cat /tmp/envo-reval-resp.json 2>/dev/null)"
[ "$HTTP" = "200" ] || { log "ERROR: revalidate failed"; exit 1; }

log "nightly sync complete"
