// Seed / reset a LOCAL Payload admin user (local Docker DB only).
//
// Uses Payload's Local API so the password is hashed the same way the admin
// login expects. Idempotent: if the email already exists it resets that user's
// password and promotes them to admin; otherwise it creates a new admin.
//
// Usage:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='secret' ADMIN_NAME='You' \
//     npx tsx --tsconfig tsconfig.json scripts/seed-local-admin.mts
//
// Safety: connects to whatever DATABASE_URL is in .env.local. Keep that pointed
// at the local container (localhost:5433) — do NOT run this against Supabase.
import { initPayload } from './lib/bootstrap.mts'

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
const name = process.env.ADMIN_NAME ?? 'Local Admin'

if (!email || !password) {
  console.error('ERROR: set ADMIN_EMAIL and ADMIN_PASSWORD env vars.')
  process.exit(1)
}

const dbHost = (process.env.DATABASE_URL ?? '').replace(/^.*@/, '').replace(/\/.*$/, '')
if (!/localhost|127\.0\.0\.1/.test(dbHost)) {
  console.error(`REFUSING: DATABASE_URL is not local (host: ${dbHost || 'unknown'}). This script only seeds the local DB.`)
  process.exit(1)
}

const payload = await initPayload()

const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: email } },
  limit: 1,
})

if (existing.docs.length) {
  await payload.update({
    collection: 'users',
    id: existing.docs[0].id,
    data: { password, role: 'admin', name },
  })
  console.log(`✓ Updated existing user ${email} — role=admin, password reset.`)
} else {
  await payload.create({
    collection: 'users',
    data: { email, password, role: 'admin', name },
  })
  console.log(`✓ Created admin user ${email}.`)
}

process.exit(0)
