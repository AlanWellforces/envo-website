#!/bin/bash
# /app/envo-website/auto-deploy.sh
# Run via n8n or cron: bash /app/envo-website/auto-deploy.sh

set -euo pipefail

export PATH=/home/deployer/.local/node-v22.21.1-linux-x64/bin:$PATH
REPO=/app/envo-website
LOG=/tmp/envo-deploy.log

echo_log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

cd "$REPO"

# ── 1. Fetch and compare ──────────────────────────────────────────────────────
git fetch origin 2>&1 | tee -a "$LOG"

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/dev)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo_log "No new commits on origin/dev — nothing to do."
  exit 0
fi

echo_log "New commits detected ($LOCAL → $REMOTE), deploying…"
CHANGED=$(git diff --name-only "$LOCAL" "$REMOTE")

# ── 2. Pull ───────────────────────────────────────────────────────────────────
git reset --hard origin/dev 2>&1 | tee -a "$LOG"

# ── 3. Load env ───────────────────────────────────────────────────────────────
set -a && source .env.local && set +a

# ── 4. Install deps (only if package.json changed) ───────────────────────────
if echo "$CHANGED" | grep -q "package.json"; then
  echo_log "package.json changed — running npm install…"
  npm install 2>&1 | tee -a "$LOG"
fi

# ── 5. Regenerate Payload types (only if schema changed) ─────────────────────
if echo "$CHANGED" | grep -qE "payload\.config\.ts|payload/collections"; then
  echo_log "Payload schema changed — regenerating types…"
  npm run generate:types 2>&1 | tee -a "$LOG"
fi

# ── 6. Build ──────────────────────────────────────────────────────────────────
echo_log "Building…"
npm run build 2>&1 | tee -a "$LOG"

# ── 7. Copy static assets into standalone ────────────────────────────────────
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
cp -r public       .next/standalone/public
echo_log "Static assets copied."

# ── 8. Kill whatever is holding port 4105 ────────────────────────────────────
INODE=$(cat /proc/net/tcp | awk 'NR>1 && $2 ~ /:1009$/ && $4 == "0A" {print $10}' | head -1)
if [ -n "$INODE" ]; then
  for pid in $(ls /proc | grep '^[0-9]\+$'); do
    ls -la /proc/$pid/fd 2>/dev/null | grep -q "socket:\[$INODE\]" && kill -9 $pid 2>/dev/null || true
  done
  sleep 1
fi

# ── 9. Start server ───────────────────────────────────────────────────────────
nohup node .next/standalone/server.js >> /tmp/envo-app.log 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > /tmp/envo-app.pid
sleep 5

if kill -0 "$NEW_PID" 2>/dev/null; then
  echo_log "Deploy complete — server running as PID $NEW_PID"
  exit 0
else
  echo_log "ERROR: server failed to start — check /tmp/envo-app.log"
  exit 1
fi
