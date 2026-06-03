import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './payload/collections/Users.ts'
import { Products } from './payload/collections/Products.ts'
import { Media } from './payload/collections/Media.ts'
import { Posts } from './payload/collections/Posts.ts'
import { Projects } from './payload/collections/Projects.ts'
import { Faqs } from './payload/collections/Faqs.ts'
import { SiteSettings } from './payload/globals/SiteSettings.ts'
import { HomePage } from './payload/globals/HomePage.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // PAYLOAD_SERVER_URL drives CSRF allowlist. Leave unset in dev/NAS so the
  // list stays empty and cookie auth works in all browsers (no Origin/Sec-Fetch-Site required).
  // Set PAYLOAD_SERVER_URL=https://yourdomain.com on production (Vercel).
  serverURL: process.env.PAYLOAD_SERVER_URL ?? '',
  admin: {
    components: {
      // Injects small global admin CSS (e.g. a taller rich-text editor).
      providers: ['/payload/components/AdminStyles#AdminStyles'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Order drives the admin nav group order: content first (Products,
  // Editorial), then Settings (Users) last — so Users/Settings sits at the bottom.
  collections: [Products, Media, Posts, Projects, Faqs, Users],
  globals: [SiteSettings, HomePage],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    push: process.env.PAYLOAD_DB_PUSH === 'true',
  }),
  sharp,
})
