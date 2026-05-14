# Drafts

Stage 3 pre-work. These files are ready to use — move them to their final locations
when Mackenzie's Stage 2 scaffold lands.

| File | Final location |
|---|---|
| `schema.ts` | `src/lib/db/schema.ts` |
| `ProductOverrides.collection.ts` | `src/payload/collections/ProductOverrides.ts` |

## schema.ts

Drizzle product schema — all 30+ Akeneo attributes mapped to Postgres columns.
Covers every ENVO product attribute including specs, media, SEO, pricing, and sync metadata.
Also stores raw Akeneo JSON for debugging and future attributes.

## ProductOverrides.collection.ts

Payload CMS collection for editorial product controls.
Akeneo owns specs. This collection owns:
- featured / badge / hidden flags
- display order within category/application pages
- marketing note shown on product page
- which application pages a product appears on (with pinning)
- manually curated related products
