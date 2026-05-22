// Run with: tsx --tsconfig tsconfig.json scripts/generate-importmap.mts
//
// Same @next/env CJS interop patch as generate-types.mts — see that file for
// the explanation. Must run before any payload import.

import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const payloadLoadEnvDir = path.join(root, 'node_modules/payload/dist/bin')
const _requireFromPayload = createRequire(path.join(payloadLoadEnvDir, 'dummy.js'))
const nextEnvExports = _requireFromPayload('@next/env')
if (!nextEnvExports.default) nextEnvExports.default = nextEnvExports

const configMod = await import('../src/payload.config.ts')
const config = await (configMod.default ?? configMod)

const { generateImportMap } = await import('payload')

await generateImportMap(config)

console.log('✓ importMap.js written')
