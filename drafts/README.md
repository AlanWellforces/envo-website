# Drafts

Stage 3 pre-work. Move files to their final locations when Mackenzie's scaffold lands.

| File | Final location | Purpose |
|---|---|---|
| `Products.collection.ts` | `src/payload/collections/Products.ts` | Full product admin (replaces schema.ts) |
| `Media.collection.ts` | `src/payload/collections/Media.ts` | Image uploads |

## Architecture (Option B — Payload as product database)

```
Akeneo sync → writes into Payload Products collection
Payload Admin → editors edit name, description, images, spec sheet link, pricing, marketing
Next.js frontend → reads from Payload API only (one source)
```

No separate Drizzle products table. Payload manages its own Postgres tables internally.

## Products.collection.ts

Full product admin with 7 tabs:

| Tab | What's in it |
|---|---|
| Overview | Name, subtitle, description, enabled/hidden |
| Media | Upload product image, clean image, spec sheet URL |
| Specs | Electrical (power, voltage, current, dimming), physical (dimensions, IP, temp), compliance |
| Pricing | Price NZD, availability, pack qty, lead times |
| Marketing | Featured, badge, display order, marketing note, application pages, related products |
| SEO & FAQ | SEO title, meta description, FAQ editor |
| Sync | SKU, family, series, sync_locked flag, last synced timestamp |

**sync_locked:** when checked, Akeneo sync skips this product. Use when you've
heavily customised a product and don't want it overwritten.

## Media.collection.ts

Upload images directly from Payload admin. Auto-resizes to:
- `thumbnail` 200×200 (admin preview)
- `card` 480×480 (category page cards)
- `detail` 900×900 (product detail page)

Accepts JPEG, PNG, WebP, GIF.

## Superseded files

`schema.ts` and `ProductOverrides.collection.ts` are superseded by this approach.
They can be deleted once the scaffold lands and Products.collection.ts is in place.
