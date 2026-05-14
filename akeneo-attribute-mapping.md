# Akeneo Attribute Mapping — ENVO Website

## How to identify ENVO products

Filter by category: `envo_nz_driver`

```
GET /api/rest/v1/products
  ?search={"categories":[{"operator":"IN","value":["envo_nz_driver"]}]}
```

Returns ~70 SKUs. This is the correct filter for the sync script.
Do NOT filter by `brand=envo` — that returns 0 results (locale quirk).

---

## Scoping rules

Several attributes are channel-scoped. Always use these scopes for the ENVO website:

| Attribute       | Locale  | Scope            |
|-----------------|---------|------------------|
| product_name    | en_US   | envo_nz          |
| subtitle        | en_US   | envo_nz          |
| price_retail    | en_US   | envo_nz          |
| shipping_lead_time | null | wf_b2b           |
| manufacturing_lead_time | null | wf_b2b      |

All other attributes: locale=null, scope=null (global).

---

## Attribute → Drizzle column mapping

### Identity

| Akeneo field    | Drizzle column   | Type        | Notes                        |
|-----------------|------------------|-------------|------------------------------|
| identifier      | sku              | varchar(50) | Primary key                  |
| family          | family           | varchar(50) | e.g. psu_led_cv, psu_led_cc  |
| enabled         | enabled          | boolean     | Filter to enabled=true only  |
| categories      | categories       | text[]      | Array of category codes      |
| series          | series           | varchar(50) | e.g. sc_envo                 |

### Display

| Akeneo field    | Drizzle column   | Type        | Scope / Notes                |
|-----------------|------------------|-------------|------------------------------|
| product_name    | name             | text        | scope: envo_nz               |
| subtitle        | subtitle         | text        | scope: envo_nz               |
| description     | description      | text        | HTML, no scope               |
| short_description | short_description | text      | no scope                     |

### Electrical specs

| Akeneo field       | Drizzle column      | Type    | Unit  |
|--------------------|---------------------|---------|-------|
| power_rating       | power_w             | numeric | W     |
| output_voltage     | output_voltage_v    | numeric | V     |
| input_voltage_min  | input_voltage_min_v | numeric | V     |
| input_voltage_max  | input_voltage_max_v | numeric | V     |
| rated_current      | rated_current_a     | numeric | A     |
| operation_mode     | operation_mode      | varchar | cv/cc/cv_cc |
| dimming_control    | dimming_control     | text[]  | array e.g. [none], [dali], [0_10v] |
| number_of_output   | number_of_outputs   | integer |       |

### Physical specs

| Akeneo field  | Drizzle column | Type    | Unit |
|---------------|----------------|---------|------|
| width         | width_mm       | numeric | mm   |
| height        | height_mm      | numeric | mm   |
| length        | length_mm      | numeric | mm   |
| weight        | weight_kg      | numeric | kg   |
| waterproof    | waterproof     | varchar | non_waterproof / ip20 / ip65 / ip67 / ip68 |
| temp_min      | temp_min_c     | numeric | °C   |
| temp_max      | temp_max_c     | numeric | °C   |

### Compliance & warranty

| Akeneo field   | Drizzle column  | Type    | Notes                         |
|----------------|-----------------|---------|-------------------------------|
| standards_met  | standards_met   | text[]  | e.g. [c_ce, c_saa, c_tuv]     |
| warranty_period | warranty_years | numeric | stored in years               |

### Pricing & logistics

| Akeneo field            | Drizzle column          | Type    | Notes             |
|-------------------------|-------------------------|---------|-------------------|
| price_retail (envo_nz)  | price_nzd               | numeric | NZD retail price  |
| inventory_type          | inventory_type          | varchar | stocked / on_demand |
| packaging_size          | pack_qty                | integer | units per carton  |
| shipping_lead_time      | shipping_lead_days      | integer | scope: wf_b2b     |
| manufacturing_lead_time | manufacturing_lead_days | integer | scope: wf_b2b     |

### Media & documents

| Akeneo field  | Drizzle column    | Type | Notes                            |
|---------------|-------------------|------|----------------------------------|
| product_image | image_url         | text | Use .aws S3 URL directly         |
| clean_image   | clean_image_url   | text | Use .aws S3 URL directly         |
| spec_sheet    | spec_sheet_url    | text | Use .aws S3 URL directly         |

Images have two URL forms:
- `.data` = Akeneo internal path (requires auth to download)
- `._links.download.href` = Akeneo proxied download (requires auth)
- `.aws` = Direct S3 URL (public, no auth needed) ← USE THIS

### SEO

| Akeneo field           | Drizzle column      | Type |
|------------------------|---------------------|------|
| seo_title              | seo_title           | text |
| seo_meta_description   | seo_description     | text |
| faq_json               | faq_json            | text | Raw JSON string, parse on read |

---

## Value extraction patterns

Akeneo wraps all attribute values in arrays with locale/scope. Extract like this:

```typescript
// Global attribute (no locale, no scope)
const powerW = values.power_rating?.[0]?.data?.amount

// Scoped attribute
const nameEnvoNz = values.product_name
  ?.find(v => v.scope === 'envo_nz' && v.locale === 'en_US')?.data

// Price (scoped)
const priceNzd = values.price_retail
  ?.find(v => v.scope === 'envo_nz')?.data?.[0]?.amount

// Array attribute (standards, dimming)
const standards = values.standards_met?.[0]?.data ?? []

// Measurement with unit
const widthMm = values.width?.[0]?.data?.amount

// Media — use AWS URL
const imageUrl = values.product_image?.[0]?.aws
  ?? values.product_image?.[0]?._links?.download?.href
```

---

## Pagination

The API paginates at 100 per page. For ~70 ENVO products, one page is enough.
If the catalogue grows, paginate using `?page=2`, `?page=3` etc.

---

## Sync strategy for Stage 3

```typescript
// Idempotent upsert — safe to run multiple times
async function syncEnvoProducts(token: string) {
  const products = await fetchAllEnvoProducts(token)  // category: envo_nz_driver
  for (const p of products) {
    await db.insert(products)
      .values(normalise(p))
      .onConflictDoUpdate({
        target: products.sku,
        set: normalise(p)
      })
  }
}
```

---

## Known issues / edge cases

| Issue | Notes |
|-------|-------|
| `brand=envo` search returns 0 | Use category filter instead |
| `envo_nz_driver` not in /categories API | Exists on products, works as search filter |
| Some products have `scope: "ENVO"` (uppercase) not `envo_nz` | Fall back: try ENVO → envo_nz → master_catalogue |
| bc_width/bc_height/bc_length are often "0mm" | Use width/height/length instead (measurement type) |
| vendor_name is OEM supplier, not the brand | Ignore vendor_name for display |
