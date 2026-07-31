#!/usr/bin/env bash
#
# Nightly Akeneo → prod sync, run from a dev/office machine on the tailnet.
# (The box has no Akeneo credentials and no node checkout; this machine has
# both, so the nightly job lives here — scheduled via launchd, see
# ~/Library/LaunchAgents/com.envo.akeneo-sync.plist on the marketing Mac.)
#
# Pipeline (each step guarded; any failure alerts via macOS notification +
# Mailgun email and exits non-zero):
#   0. Pre-sync snapshot of the products tables on the box (keeps last 7) —
#      the rollback point if a bad sync ever lands.
#   1. SSH-tunnel prod Postgres (container port isn't published on the box —
#      the tunnel targets the container IP, resolved fresh each run).
#   2. scripts/akeneo-sync.ts in spec-only mode: diff-aware writes, catalogue-
#      size + change-budget guards (abort = exit 2, no writes), post-write
#      read-back verify. sync_locked products skipped; curated text
#      (name/descriptions/seo) never overwritten — see SYNC_PROTECTED_FIELDS.
#   3. POST /api/revalidate (__site-settings = full-tree re-render + CF purge).
#      Runs even after a partial sync failure: whatever DID write is already
#      in the DB and must not go stale on the live pages.
#   4. Live smoke tests — key pages must return 200 and look like themselves.
#
# Requires: Tailscale up, ~/.ssh/envo_deploy_ed25519 authorized on the box,
# Akeneo creds in ~/Desktop/wellforces_automation/_shared/.env, node_modules
# installed in this checkout.
set -uo pipefail
cd "$(dirname "$0")/.."

BOX="root@100.106.130.54"
KEY="${ENVO_BOX_KEY:-$HOME/.ssh/envo_deploy_ed25519}"
SSH="ssh -i $KEY -o ConnectTimeout=15 -o BatchMode=yes"
TUNNEL_PORT=15432
SOCK="/tmp/envo-akeneo-sync-tunnel.sock"
LOCK="/tmp/envo-akeneo-sync.lock"
CREDS="$HOME/Desktop/wellforces_automation/_shared/.env"
SITE="https://envolighting.com"
ALERT_TO="marketing@wellforces.com"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# --- alerting: macOS notification + Mailgun email (both best-effort)
alert() {
  local msg="$1"
  log "ALERT: $msg"
  osascript -e "display notification \"$msg\" with title \"ENVO nightly sync FAILED\"" 2>/dev/null || true
  local mg_key mg_domain
  mg_key=$($SSH "$BOX" "docker exec envo-website printenv MAILGUN_API_KEY" 2>/dev/null)
  mg_domain=$($SSH "$BOX" "docker exec envo-website printenv MAILGUN_DOMAIN" 2>/dev/null)
  if [ -n "${mg_key:-}" ] && [ -n "${mg_domain:-}" ]; then
    curl -s -m 30 --user "api:$mg_key" "https://api.mailgun.net/v3/$mg_domain/messages" \
      -F from="ENVO Nightly Sync <sync@$mg_domain>" \
      -F to="$ALERT_TO" \
      -F subject="ENVO nightly Akeneo sync FAILED" \
      -F text="$msg

Log: ~/Library/Logs/envo-akeneo-sync.log on the marketing Mac.
Pre-sync snapshot on the box: /root/products-presync-*.sql.gz" >/dev/null \
      && log "alert email sent to $ALERT_TO" || log "alert email FAILED to send"
  else
    log "no Mailgun creds reachable — email alert skipped"
  fi
}
fail() { alert "$1"; exit 1; }

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
[ -f "$CREDS" ] || fail "credentials file not found: $CREDS"
set -a; source "$CREDS"; set +a
export AKENEO_URL="${AKENEO_URL:-$AKENEO_BASE_URL}"

# --- step 0: pre-sync snapshot on the box (rollback point), keep last 7
log "snapshotting products tables on the box..."
$SSH "$BOX" 'docker exec envo-postgres sh -c "PGPASSWORD=\$POSTGRES_PASSWORD pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB --data-only -t products -t products_dimming_control -t products_standards_met -t products_categories -t products_applications -t products_related_skus -t products_faq" | gzip > /root/products-presync-$(date +%Y%m%d-%H%M).sql.gz && ls -t /root/products-presync-*.sql.gz | tail -n +8 | xargs -r rm -f' \
  || fail "pre-sync snapshot failed — aborting before any writes"

# --- resolve prod DB coordinates (container IP can change on recreate)
log "resolving prod postgres container..."
PGIP=$($SSH "$BOX" "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' envo-postgres")
PGUSER=$($SSH "$BOX" "docker exec envo-postgres printenv POSTGRES_USER")
PGDB=$($SSH "$BOX" "docker exec envo-postgres printenv POSTGRES_DB")
PGPW_RAW=$($SSH "$BOX" "docker exec envo-postgres printenv POSTGRES_PASSWORD")
PGPW=$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$PGPW_RAW")
[ -n "$PGIP" ] || fail "could not resolve envo-postgres container IP"

# --- tunnel
log "opening tunnel localhost:$TUNNEL_PORT -> $PGIP:5432"
ssh -i "$KEY" -o ExitOnForwardFailure=yes -o BatchMode=yes \
    -M -S "$SOCK" -fN -L "127.0.0.1:$TUNNEL_PORT:$PGIP:5432" "$BOX" \
  || fail "SSH tunnel to prod postgres failed"

# --- step 2: sync (spec-only, guarded, diff-aware, self-verifying).
# PAYLOAD_DB_PUSH MUST be forced off: the local .env.local sets it true for
# dev, and against prod it would drizzle-push this checkout's schema onto the
# production database. REVALIDATE_SECRET is blanked so the per-product
# afterChange hook no-ops; the single full-tree revalidate below covers
# everything in one shot.
log "running spec-only sync against prod..."
SYNC_RC=0
SYNC_OUT="/tmp/envo-sync-out.log"
PAYLOAD_DB_PUSH=false REVALIDATE_SECRET="" \
DATABASE_URL="postgresql://$PGUSER:$PGPW@127.0.0.1:$TUNNEL_PORT/$PGDB" \
  npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts 2>&1 | tee "$SYNC_OUT" || SYNC_RC=$?
CHANGED=$(grep -o '::changed=[0-9]*::' "$SYNC_OUT" | grep -o '[0-9]*' || echo "")

if [ "$SYNC_RC" -eq 2 ]; then
  # Guard abort: the script refused to write anything. Nothing changed, so no
  # revalidate — but a human needs to look at why.
  fail "sync guard aborted the run (exit 2) — catalogue too small or change budget exceeded; NO writes were made"
fi
[ "$SYNC_RC" -eq 0 ] || log "WARNING: sync exited $SYNC_RC (write/verify failures) — revalidating anyway, will alert after"

# --- step 3: re-render + CF purge (route validates x-revalidate-secret; secret
#     lives only in the prod container env, fetched fresh so it never sits on
#     disk). Skipped on clean zero-change nights — a full-tree purge would
#     throw away the whole CF edge cache for nothing. Any sync failure forces
#     the revalidate: partial writes are already in the DB.
if [ "$SYNC_RC" -eq 0 ] && [ "${CHANGED:-}" = "0" ]; then
  log "no products changed — skipping full-tree revalidate/CF purge"
else
  log "revalidating site (changed=${CHANGED:-unknown})..."
  REVAL_SECRET=$($SSH "$BOX" "docker exec envo-website printenv REVALIDATE_SECRET")
  HTTP=$(curl -s -o /tmp/envo-reval-resp.json -w '%{http_code}' -X POST \
    "$SITE/api/revalidate?paths=/__site-settings" \
    -H "x-revalidate-secret: $REVAL_SECRET")
  log "revalidate HTTP $HTTP $(cat /tmp/envo-reval-resp.json 2>/dev/null)"
  [ "$HTTP" = "200" ] || fail "revalidate returned HTTP $HTTP after sync — live pages may be stale"
fi

# --- step 4: live smoke tests (structure markers, not exact copy — these must
#     survive normal content edits)
smoke() {
  local url="$1" marker="$2" body http
  body=$(curl -s -m 20 -w '\n%{http_code}' "$url")
  http=${body##*$'\n'}
  [ "$http" = "200" ] || { alert "smoke test: $url returned HTTP $http"; return 1; }
  echo "$body" | grep -q "$marker" || { alert "smoke test: $url missing expected marker '$marker'"; return 1; }
  log "smoke ok: $url"
}
SMOKE_RC=0
smoke "$SITE/" "ENVO" || SMOKE_RC=1
smoke "$SITE/products/led-signage-modules" "ks-val\|sku" || SMOKE_RC=1
smoke "$SITE/products/led-signage-modules/mini-series" "Warranty" || SMOKE_RC=1
smoke "$SITE/products/led-drivers/ENC-12-300" "Warranty" || SMOKE_RC=1

if [ "$SYNC_RC" -ne 0 ]; then
  fail "nightly sync finished WITH write/verify failures (rc=$SYNC_RC) — see log for the failing SKUs"
fi
[ "$SMOKE_RC" -eq 0 ] || exit 1

log "nightly sync complete"
