#!/usr/bin/env bash
# Create or reset a PRODUCTION Payload admin on the ENVO box (envolighting.com).
#
# YOU run this — your password is typed at a hidden prompt and never shown to
# Claude or written to the transcript. It uses Payload's own Local API so the
# password is hashed exactly the way the admin login expects.
#
# Idempotent: if the email already exists, it resets that admin's password and
# ensures role=admin; otherwise it creates a new admin. Safe to re-run anytime
# (e.g. to reset a forgotten password).
#
# Usage:  bash scripts/seed-prod-admin.sh
set -euo pipefail

REPO="/Users/lennypeng/Code/envo-website"
KEY="$HOME/.ssh/envo_deploy_ed25519"
BOX="root@2.25.81.127"
LPORT=5459

read -rp "Admin email:  " AE
read -rp "Display name: " AN
read -rsp "Password (min 10 chars, hidden): " AP; echo
read -rsp "Confirm password: " AP2; echo
[ "$AP" = "$AP2" ] || { echo "Passwords do not match."; exit 1; }
[ "${#AP}" -ge 10 ] || { echo "Use at least 10 characters."; exit 1; }

echo "Reading DB creds and opening a temporary tunnel to the box Postgres..."
PGPW=$(ssh -i "$KEY" -o BatchMode=yes "$BOX" 'grep "^POSTGRES_PASSWORD=" /opt/envo/.env | cut -d= -f2-')
PGIP=$(ssh -i "$KEY" -o BatchMode=yes "$BOX" "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' envo-postgres")
ssh -i "$KEY" -o BatchMode=yes -o ExitOnForwardFailure=yes -f -N -L "${LPORT}:${PGIP}:5432" "$BOX"
trap 'pkill -f "${LPORT}:${PGIP}:5432" 2>/dev/null || true' EXIT

cd "$REPO"
# shellcheck disable=SC1090
. "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
nvm use 22 >/dev/null 2>&1

echo "Creating/updating the admin via Payload Local API (box DB, over the tunnel)..."
ADMIN_EMAIL="$AE" ADMIN_PASSWORD="$AP" ADMIN_NAME="$AN" \
DATABASE_URL="postgresql://envo:${PGPW}@localhost:${LPORT}/envo_prod" \
PAYLOAD_DB_PUSH=false \
npx tsx --tsconfig tsconfig.json scripts/seed-local-admin.mts

echo
echo "✓ Done. Log in at https://envolighting.com/admin"
