// Run with: tsx --tsconfig tsconfig.json scripts/fix-solution-channel-copy.mts
//
// One-off content fix: replace "your distributor" wording in Solutions kit
// item descriptions with the authorised-purchasing-channel wording, to match
// the global-channel-copy system. Editorial content lives in Payload, so this
// updates the DB via the Payload API (keeps main + version tables consistent
// and preserves published status). Idempotent — safe to re-run.
import { initPayload } from './lib/bootstrap.mts'

const FIND = /your distributor/gi
const REPLACE = 'an authorised purchasing channel'

const payload = await initPayload()

const res = await payload.find({
  collection: 'solutions',
  where: {},
  limit: 100,
  depth: 0,
  draft: false,
})

let changed = 0
for (const doc of res.docs) {
  const kit = doc.kit ?? []
  if (!kit.some((k) => k.desc && /your distributor/i.test(k.desc))) continue
  const newKit = kit.map((k) => ({
    ...k,
    desc: k.desc ? k.desc.replace(FIND, REPLACE) : k.desc,
  }))
  await payload.update({
    collection: 'solutions',
    id: doc.id,
    data: { kit: newKit },
  })
  changed++
  console.log(`updated solution "${doc.slug}" (${doc.id}) — ${kit.length} kit items`)
}

console.log(`\nDone. Updated ${changed} solution doc(s).`)
process.exit(0)
