import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './payload/collections/Users.ts'
import { Products } from './payload/collections/Products.ts'
import { Media } from './payload/collections/Media.ts'
import { Posts } from './payload/collections/Posts.ts'
import { Projects } from './payload/collections/Projects.ts'
import { Submissions } from './payload/collections/Submissions.ts'
import { Events } from './payload/collections/Events.ts'
import { LeadFiles } from './payload/collections/LeadFiles.ts'
import { Faqs } from './payload/collections/Faqs.ts'
import { PageSeo } from './payload/collections/PageSeo.ts'
import { Pages } from './payload/collections/Pages.ts'
import { Solutions } from './payload/collections/Solutions.ts'
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
    // Pin the admin to LIGHT. Payload's default lets the client follow the OS /
    // stored preference and flip <html data-theme> to "dark" — but our custom
    // AdminStyles brand skin is light-designed and overrides only part of the
    // surface, so dark mode rendered a broken mix (black inputs and invisible
    // table text on a white page). One theme, styled end-to-end.
    theme: 'light',
    components: {
      // Injects small global admin CSS (e.g. a taller rich-text editor).
      providers: ['/payload/components/AdminStyles#AdminStyles'],
      beforeNavLinks: ['/payload/components/NavBrand#NavBrand'],
      afterNavLinks: ['/payload/components/PagesNavLink#PagesNavLink'],
      // ENVO branding on the login page + compact header/loading mark.
      graphics: {
        Logo: '/payload/components/BrandLogo#BrandLogo',
        Icon: '/payload/components/BrandIcon#BrandIcon',
      },
      views: {
        dashboard: {
          Component: '/payload/views/Dashboard#Dashboard',
        },
        pagesOverview: {
          Component: '/payload/views/PagesOverview#PagesOverview',
          path: '/pages-overview',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · ENVO Admin',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/assets/images/favicon.svg' }],
    },
  },
  // Order drives the admin nav group order: content first (Products,
  // Editorial), then Website (Page SEO — per-route SEO overrides), then
  // Settings (Users) last — so Users/Settings sits at the bottom.
  collections: [Products, Media, Posts, Projects, Pages, Solutions, Faqs, Submissions, LeadFiles, Events, PageSeo, Users],
  globals: [SiteSettings, HomePage],
  plugins: [
    // File binaries → Supabase Storage when configured; falls back to local disk
    // in dev when S3_BUCKET is unset, so no creds are required to run locally.
    ...(process.env.S3_BUCKET
      ? [
          s3Storage({
            collections: { media: true },
            bucket: process.env.S3_BUCKET,
            config: {
              endpoint: process.env.S3_ENDPOINT,
              region: process.env.S3_REGION || 'us-west-2',
              forcePathStyle: true,
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
            },
          }),
        ]
      : []),
    // Lead attachments go to a separate PRIVATE bucket — they're customer PII
    // and must never be readable via the public object endpoint. Payload still
    // proxies them through /api/lead-files/file/* behind the collection's
    // signed-in-staff read access.
    ...(process.env.S3_LEAD_FILES_BUCKET
      ? [
          s3Storage({
            collections: { 'lead-files': true },
            bucket: process.env.S3_LEAD_FILES_BUCKET,
            config: {
              endpoint: process.env.S3_ENDPOINT,
              region: process.env.S3_REGION || 'us-west-2',
              forcePathStyle: true,
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
            },
          }),
        ]
      : []),
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      // Cap connections PER PROCESS. `next build` prerenders with ~15 worker
      // processes, each holding its own pool — with pg-pool's default of 10+
      // that exceeds Postgres's max_connections (100) and the build dies with
      // "sorry, too many clients already". 5 per process is plenty (queries
      // are short); the single runtime process can override via PG_POOL_MAX.
      max: Number(process.env.PG_POOL_MAX || 5),
    },
    push: process.env.PAYLOAD_DB_PUSH === 'true',
  }),
  sharp,
})
