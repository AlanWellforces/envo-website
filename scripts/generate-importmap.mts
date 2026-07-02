// Run with: tsx --tsconfig tsconfig.json scripts/generate-importmap.mts

import { loadConfig } from './lib/bootstrap.mts'

const config = await loadConfig()
const { generateImportMap } = await import('payload')

await generateImportMap(config)

console.log('✓ importMap.js written')
