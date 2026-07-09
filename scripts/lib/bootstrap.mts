// Shared bootstrap for scripts/*.mts — the env-load + @next/env interop patch
// + Payload init that every script duplicated at its top.
//
// tsx CJS interop bug workaround: tsx transforms `import X from 'cjs-pkg'` to
// `require('cjs-pkg').default`, but payload has a nested @next/env whose
// module.exports has __esModule:true but no .default. We patch the correct
// require-cache entry (resolved from payload's own node_modules) before any
// payload import runs so import_env.default resolves to the exports object.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Payload, SanitizedConfig } from 'payload'

/** Repo root (scripts/lib/ → two levels up). */
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

// Load .env.local BEFORE importing the payload config (buildConfig reads
// PAYLOAD_SECRET / DATABASE_URL at import time). A missing file is fine —
// the generate-* scripts have always run without one.
function loadEnvLocal(): void {
  const file = path.join(root, '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

function patchNextEnv(): void {
  const payloadLoadEnvDir = path.join(root, 'node_modules/payload/dist/bin')
  const requireFromPayload = createRequire(path.join(payloadLoadEnvDir, 'dummy.js'))
  const nextEnvExports = requireFromPayload('@next/env')
  if (!nextEnvExports.default) nextEnvExports.default = nextEnvExports
}

/** Sanitized payload config, with env loaded and the tsx interop patched. */
export async function loadConfig(): Promise<SanitizedConfig> {
  loadEnvLocal()
  patchNextEnv()
  const configMod = await import('../../src/payload.config.ts')
  return await (configMod.default ?? configMod)
}

/** Ready-to-use Local API client (loadConfig + getPayload). */
export async function initPayload(): Promise<Payload> {
  const config = await loadConfig()
  const { getPayload } = await import('payload')
  return getPayload({ config })
}
