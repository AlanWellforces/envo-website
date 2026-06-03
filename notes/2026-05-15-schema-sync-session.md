# Schema & Sync Session — 2026-05-15

## What was done

### 1. Family-specific fields added to Products collection

New collapsible sections added to the Specs tab in `src/payload/collections/Products.ts`:

**Driver / Controller** (psu_led_cc, psu_led_controller, switch_switch_module):
- `cc_region_min` / `cc_region_max` — Min/Max Output Voltage (V) — maps from Akeneo `cc_region_min` / `cc_region_max`
- `controller_type` — JSON array (raw from Akeneo)
- `output_channel` — text
- `output_type` — text
- `module_size`, `switch_no_module` — number
- `switch_operation_method` — text
- `switch_back_light` — checkbox
- `mounting_info`, `finish_colour`, `material` — text

**Sensor**:
- `sensor_type` — select (pir, microwave, daylight, dual)
- `technology`, `maximum_detection_range` — text
- `multiway` — checkbox

**LED / Light Output** (extended):
- `led_pitch` — number (mm)
- `led_light_power_input` — JSON array (raw from Akeneo)

### 2. Sync route updated (`src/app/api/sync-akeneo/route.ts`)
- All new family-specific fields mapped from Akeneo
- Products with **no family** are now **skipped** (not synced)
- Response now includes `skipped` count alongside `ok` and `failed`

### 3. No-family products cleaned up
- New `DELETE /api/cleanup-no-family` route created
- 90 unassigned (no-family) products deleted from Supabase
- 223 products re-synced with new fields populated

### 4. CC driver voltage range clarified
- `cc_region_min` / `cc_region_max` in Akeneo = "Minimum/Maximum Output Voltage"
- These attributes exist in the `psu_led_cc` family but are **not yet populated** for most CC products — data entry in Akeneo still needed
- Labels updated in Products.ts to match Akeneo naming

## Current product counts (post-cleanup)
- Total in Payload: **223 products** (all with a valid ENVO family)
- Families: led_module, psu_led_cv, psu_led_cc, psu_led_controller, sensor, switch_switch_module, accessory_general

## Pending data tasks (Akeneo)
- Populate `cc_region_min` and `cc_region_max` for all `psu_led_cc` products
- Once filled → re-run `GET /api/sync-akeneo` to pull through

## PRs merged to dev today
- `feature/family-specific-fields` — all new schema + sync changes
- `feature/fix-cc-voltage-labels` — label rename to match Akeneo
- `feature/ui-home-polish` — Mackenzie's dead href=# fix (merged by team)

## Next session starting points
- Frontend: individual product detail page (per SKU) — not yet built
- Data: CC driver min/max voltage population in Akeneo
- Any new Mackenzie / Wei branches to review
