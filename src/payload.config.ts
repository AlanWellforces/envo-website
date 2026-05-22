import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Products } from './payload/collections/Products.ts'
import { Media } from './payload/collections/Media.ts'
import { Posts } from './payload/collections/Posts.ts'
import { SiteSettings } from './payload/globals/SiteSettings.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Products, Media, Posts],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    push: process.env.NODE_ENV !== 'production',
  }),
  sharp,
})
