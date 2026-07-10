// One-off operational tool (untracked): download every object from the Supabase
// Storage buckets referenced in .env.local (media + lead-files) into a local
// staging dir, so the binaries can be moved onto the self-hosted box's local
// volumes and the site can stop depending on Supabase Storage.
//
// Usage (node 22 via nvm; run from the repo so @aws-sdk/client-s3 resolves):
//   OUT=/abs/staging/dir node scripts/pull-supabase-media.mjs
//
// Resume-friendly: skips files already present in OUT. Reads creds from
// .env.local — never writes them anywhere, never sends them to the box.
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync, mkdirSync, createWriteStream, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'

const env = {}
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const OUT = process.env.OUT
if (!OUT) { console.error('set OUT=<staging dir>'); process.exit(1) }
const region = env.S3_REGION || 'us-west-2'
const buckets = [env.S3_BUCKET, env.S3_LEAD_FILES_BUCKET].filter(Boolean)
if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID || !buckets.length) {
  console.error('missing S3_ENDPOINT / S3_ACCESS_KEY_ID / bucket in .env.local'); process.exit(1)
}

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region,
  credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
  forcePathStyle: true,
})

async function listAll(bucket) {
  const keys = []
  let token
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }))
    for (const o of res.Contents ?? []) keys.push({ Key: o.Key, Size: o.Size ?? 0 })
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return keys
}

async function pool(items, n, worker) {
  let i = 0
  const runners = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const idx = i++; await worker(items[idx]) }
  })
  await Promise.all(runners)
}

for (const bucket of buckets) {
  const keys = await listAll(bucket)
  let done = 0, downloaded = 0, bytes = 0
  console.log(`${bucket}: ${keys.length} objects listed`)
  await pool(keys, 8, async ({ Key, Size }) => {
    const dest = join(OUT, bucket, Key)
    if (existsSync(dest) && statSync(dest).size === Size) { done++; return }
    mkdirSync(dirname(dest), { recursive: true })
    const got = await s3.send(new GetObjectCommand({ Bucket: bucket, Key }))
    await pipeline(got.Body, createWriteStream(dest))
    done++; downloaded++; bytes += Size
    if (done % 50 === 0) console.log(`  ${bucket}: ${done}/${keys.length}`)
  })
  console.log(`✓ ${bucket}: ${done} objects on disk (${downloaded} newly downloaded, ${(bytes / 1e6).toFixed(1)} MB)`)
}
console.log('done.')
