# ENVO Product Data — Gap Report

**Generated:** 2026-06-04 · **Source:** Payload `products` via local API · **Brand:** envo · **Total:** 224 products

Three-source rule (CLAUDE.md): **Akeneo** owns specs/media/certs · **Payload** owns editorial · **Pipeline** = derived clean images. Fill-rate is per family; `n/a?` = 0% in that family (likely not-applicable, NOT necessarily a gap). `GAP` = applies but <50% filled. `OK` = ≥95%.

## Executive summary

**The catalogue is NOT broadly empty.** Where a spec applies to a family it is mostly present: drivers (cv/cc/controller) carry electrical + physical specs; the 73 LED modules carry LED specs (cct/cri/lumens/beam); dimensions, warranty, datasheet URL and the raw `image` are ~100% across all families. Most low % numbers in the catalogue-wide table are just family-specific fields counted against the whole catalogue (e.g. `cct_k` 32% = the 73 modules only).

**Genuine catalogue-wide gaps (real, not "N/A"), in priority order:**

1. **`standards_met` (certifications) — 0/224.** The sync *maps* it (akeneo-sync.ts L118-125) but emits nothing → either the Akeneo source attribute is empty, or `stdMap` doesn't match the actual Akeneo values. **Highest impact** — certs are a headline trust signal (hero chips, trust strip). → Akeneo/PIM (Alan) or a sync-mapping code fix; diagnose first.
2. **Payload editorial fields — 0/224:** `badge`, `display_order`, `marketing_note`, `applications`, `related_skus`, `faq`. Never authored, by design not synced. **Payload-owned → can be drafted outside Akeneo** (me → Wei review).
3. **`clean_image` — 99 missing (56% filled).** Background-removed images; worst for `led_module` (10/73). → `wf_image_pipeline`.
4. **`short_description` — 120 missing.** Almost none for `led_module` (2/73). Akeneo copy → re-sync or PIM.
5. **`sensor` family specs** (`sensor_type` 0/8, `technology`/`multiway`) — near-empty for the 8 sensors; small but likely a sync-mapping gap for that family.

**Caveats — do NOT treat these as gaps:**
- `hidden`, `switch_back_light`, `multiway` are **booleans**; "0% / ALL-EMPTY" just means all `false` (a valid value), not missing data.
- `price_nzd` is filled for 160/224 — but **brand policy is NO prices on the site** ([[feedback_no-prices-on-brand-site]]). The data is present in Payload; confirm it is never rendered on `/products`. Not a gap; a leak risk.
- `pack_qty` 0/224 may also be genuinely unused rather than missing.

**Routing:** cert + spec + copy gaps → Akeneo re-sync / PIM (Alan), except `standards_met` & sensor specs which may be a *mapping-dict code fix* I can do. Editorial → Payload authoring (I can draft). Images → image pipeline.

## Families

| family | count |
|---|---:|
| psu_led_cv | 105 |
| led_module | 73 |
| psu_led_controller | 27 |
| psu_led_cc | 9 |
| sensor | 8 |
| switch_switch_module | 1 |
| accessory_general | 1 |

## Field fill-rate — catalogue-wide

| field | owner | group | filled | rate |
|---|---|---|---:|---|
| `sku` | Akeneo | core | 224/224 | 100% |
| `name` | Akeneo | core | 224/224 | 100% |
| `family` | Akeneo | core | 224/224 | 100% |
| `series` | Akeneo | core | 216/224 | 96% |
| `brand` | Akeneo | core | 224/224 | 100% |
| `subtitle` | Akeneo | core | 219/224 | 98% |
| `short_description` | Akeneo | copy | 104/224 | 46% |
| `description` | Akeneo | copy | 223/224 | 100% |
| `categories` | Akeneo | core | 224/224 | 100% |
| `enabled` | Akeneo | core | 220/224 | 98% |
| `hidden` | Akeneo | core | 0/224 | 0% ⚠️ALL-EMPTY |
| `image` | Akeneo | media | 224/224 | 100% |
| `image_url_fallback` | Akeneo | media | 224/224 | 100% |
| `spec_sheet_url` | Akeneo | media | 222/224 | 99% |
| `clean_image` | Pipeline | media | 125/224 | 56% |
| `clean_image_url_fallback` | Pipeline | media | 125/224 | 56% |
| `power_w` | Akeneo | spec-electrical | 201/224 | 90% |
| `output_voltage_v` | Akeneo | spec-electrical | 132/224 | 59% |
| `input_voltage_min_v` | Akeneo | spec-electrical | 129/224 | 58% |
| `input_voltage_max_v` | Akeneo | spec-electrical | 130/224 | 58% |
| `rated_current_a` | Akeneo | spec-electrical | 209/224 | 93% |
| `number_of_outputs` | Akeneo | spec-electrical | 135/224 | 60% |
| `operation_mode` | Akeneo | spec-electrical | 133/224 | 59% |
| `dimming_control` | Akeneo | spec-electrical | 62/224 | 28% |
| `cc_region_min` | Akeneo | spec-electrical | 15/224 | 7% |
| `cc_region_max` | Akeneo | spec-electrical | 15/224 | 7% |
| `controller_type` | Akeneo | spec-control | 10/224 | 4% |
| `output_channel` | Akeneo | spec-control | 26/224 | 12% |
| `output_type` | Akeneo | spec-control | 1/224 | 0% |
| `module_size` | Akeneo | spec-mech | 2/224 | 1% |
| `switch_no_module` | Akeneo | spec-control | 5/224 | 2% |
| `switch_operation_method` | Akeneo | spec-control | 5/224 | 2% |
| `switch_back_light` | Akeneo | spec-control | 0/224 | 0% ⚠️ALL-EMPTY |
| `mounting_info` | Akeneo | spec-mech | 6/224 | 3% |
| `finish_colour` | Akeneo | spec-mech | 13/224 | 6% |
| `material` | Akeneo | spec-mech | 5/224 | 2% |
| `brightness_lm` | Akeneo | spec-led | 73/224 | 33% |
| `efficacy_lm_w` | Akeneo | spec-led | 73/224 | 33% |
| `cct_k` | Akeneo | spec-led | 71/224 | 32% |
| `cri` | Akeneo | spec-led | 73/224 | 33% |
| `beam_angle_deg` | Akeneo | spec-led | 73/224 | 33% |
| `lifetime_hrs` | Akeneo | spec-led | 74/224 | 33% |
| `max_in_series` | Akeneo | spec-led | 73/224 | 33% |
| `led_chip_colour` | Akeneo | spec-led | 73/224 | 33% |
| `led_pitch` | Akeneo | spec-led | 47/224 | 21% |
| `led_light_power_input` | Akeneo | spec-led | 74/224 | 33% |
| `sensor_type` | Akeneo | spec-sensor | 0/224 | 0% ⚠️ALL-EMPTY |
| `technology` | Akeneo | spec-sensor | 1/224 | 0% |
| `maximum_detection_range` | Akeneo | spec-sensor | 1/224 | 0% |
| `multiway` | Akeneo | spec-sensor | 0/224 | 0% ⚠️ALL-EMPTY |
| `standards_met` | Akeneo | certs | 0/224 | 0% ⚠️ALL-EMPTY |
| `length_mm` | Akeneo | spec-physical | 224/224 | 100% |
| `width_mm` | Akeneo | spec-physical | 224/224 | 100% |
| `height_mm` | Akeneo | spec-physical | 224/224 | 100% |
| `weight_kg` | Akeneo | spec-physical | 181/224 | 81% |
| `waterproof` | Akeneo | spec-physical | 167/224 | 75% |
| `temp_min_c` | Akeneo | spec-physical | 215/224 | 96% |
| `temp_max_c` | Akeneo | spec-physical | 224/224 | 100% |
| `warranty_years` | Akeneo | spec-physical | 223/224 | 100% |
| `pack_qty` | Akeneo | commercial | 0/224 | 0% ⚠️ALL-EMPTY |
| `shipping_lead_days` | Akeneo | commercial | 76/224 | 34% |
| `manufacturing_lead_days` | Akeneo | commercial | 76/224 | 34% |
| `inventory_type` | Akeneo | commercial | 222/224 | 99% |
| `badge` | Payload | editorial | 0/224 | 0% ⚠️ALL-EMPTY |
| `display_order` | Payload | editorial | 0/224 | 0% ⚠️ALL-EMPTY |
| `marketing_note` | Payload | editorial | 0/224 | 0% ⚠️ALL-EMPTY |
| `applications` | Payload | editorial | 0/224 | 0% ⚠️ALL-EMPTY |
| `related_skus` | Payload | editorial | 0/224 | 0% ⚠️ALL-EMPTY |
| `faq` | Payload | editorial | 0/224 | 0% ⚠️ALL-EMPTY |
| `seo_title` | Payload | editorial-seo | 224/224 | 100% |
| `seo_description` | Payload | editorial-seo | 224/224 | 100% |
| `price_nzd` | Excluded | no-price | 160/224 | 71% |

## Per-family status matrix

| field | owner | psu_led_cv (105) | led_module (73) | psu_led_controller (27) | psu_led_cc (9) | sensor (8) | switch_switch_module (1) | accessory_general (1) |
|---|---|---|---|---|---|---|---|---|
| `sku` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `name` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `family` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `series` | Akeneo | OK | OK | OK | OK | GAP 1/8 | OK | OK |
| `brand` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `subtitle` | Akeneo | OK | OK | OK | 6/9 | OK | OK | OK |
| `short_description` | Akeneo | 64/105 | GAP 2/73 | 24/27 | 6/9 | 7/8 | OK | n/a? |
| `description` | Akeneo | OK | OK | OK | OK | OK | OK | n/a? |
| `categories` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `enabled` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `hidden` | Akeneo | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `image` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `image_url_fallback` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `spec_sheet_url` | Akeneo | OK | OK | OK | OK | OK | OK | n/a? |
| `clean_image` | Pipeline | 88/105 | GAP 10/73 | 18/27 | GAP 2/9 | 7/8 | n/a? | n/a? |
| `clean_image_url_fallback` | Pipeline | 88/105 | GAP 10/73 | 18/27 | GAP 2/9 | 7/8 | n/a? | n/a? |
| `power_w` | Akeneo | OK | OK | GAP 13/27 | OK | GAP 1/8 | n/a? | n/a? |
| `output_voltage_v` | Akeneo | OK | n/a? | 18/27 | OK | n/a? | n/a? | n/a? |
| `input_voltage_min_v` | Akeneo | OK | n/a? | 15/27 | OK | n/a? | n/a? | n/a? |
| `input_voltage_max_v` | Akeneo | OK | n/a? | 16/27 | OK | n/a? | n/a? | n/a? |
| `rated_current_a` | Akeneo | OK | OK | 20/27 | OK | GAP 1/8 | OK | n/a? |
| `number_of_outputs` | Akeneo | OK | n/a? | 21/27 | OK | n/a? | n/a? | n/a? |
| `operation_mode` | Akeneo | OK | n/a? | 19/27 | OK | n/a? | n/a? | n/a? |
| `dimming_control` | Akeneo | GAP 33/105 | n/a? | 22/27 | 6/9 | GAP 1/8 | n/a? | n/a? |
| `cc_region_min` | Akeneo | n/a? | n/a? | GAP 11/27 | GAP 4/9 | n/a? | n/a? | n/a? |
| `cc_region_max` | Akeneo | n/a? | n/a? | GAP 11/27 | GAP 4/9 | n/a? | n/a? | n/a? |
| `controller_type` | Akeneo | n/a? | n/a? | GAP 10/27 | n/a? | n/a? | n/a? | n/a? |
| `output_channel` | Akeneo | n/a? | n/a? | OK | n/a? | n/a? | n/a? | n/a? |
| `output_type` | Akeneo | n/a? | n/a? | GAP 1/27 | n/a? | n/a? | n/a? | n/a? |
| `module_size` | Akeneo | n/a? | n/a? | GAP 1/27 | n/a? | n/a? | OK | n/a? |
| `switch_no_module` | Akeneo | n/a? | n/a? | GAP 4/27 | n/a? | n/a? | OK | n/a? |
| `switch_operation_method` | Akeneo | n/a? | n/a? | GAP 4/27 | n/a? | n/a? | OK | n/a? |
| `switch_back_light` | Akeneo | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `mounting_info` | Akeneo | n/a? | n/a? | GAP 4/27 | n/a? | GAP 1/8 | OK | n/a? |
| `finish_colour` | Akeneo | n/a? | n/a? | GAP 4/27 | n/a? | OK | OK | n/a? |
| `material` | Akeneo | n/a? | n/a? | GAP 4/27 | n/a? | n/a? | OK | n/a? |
| `brightness_lm` | Akeneo | n/a? | OK | n/a? | n/a? | n/a? | n/a? | n/a? |
| `efficacy_lm_w` | Akeneo | n/a? | OK | n/a? | n/a? | n/a? | n/a? | n/a? |
| `cct_k` | Akeneo | n/a? | OK | n/a? | n/a? | n/a? | n/a? | n/a? |
| `cri` | Akeneo | n/a? | OK | n/a? | n/a? | n/a? | n/a? | n/a? |
| `beam_angle_deg` | Akeneo | n/a? | OK | n/a? | n/a? | n/a? | n/a? | n/a? |
| `lifetime_hrs` | Akeneo | n/a? | OK | n/a? | n/a? | GAP 1/8 | n/a? | n/a? |
| `max_in_series` | Akeneo | n/a? | OK | n/a? | n/a? | n/a? | n/a? | n/a? |
| `led_chip_colour` | Akeneo | n/a? | OK | n/a? | n/a? | n/a? | n/a? | n/a? |
| `led_pitch` | Akeneo | n/a? | 47/73 | n/a? | n/a? | n/a? | n/a? | n/a? |
| `led_light_power_input` | Akeneo | n/a? | OK | n/a? | n/a? | GAP 1/8 | n/a? | n/a? |
| `sensor_type` | Akeneo | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `technology` | Akeneo | n/a? | n/a? | n/a? | n/a? | GAP 1/8 | n/a? | n/a? |
| `maximum_detection_range` | Akeneo | n/a? | n/a? | n/a? | n/a? | GAP 1/8 | n/a? | n/a? |
| `multiway` | Akeneo | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `standards_met` | Akeneo | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `length_mm` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `width_mm` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `height_mm` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `weight_kg` | Akeneo | 95/105 | 62/73 | GAP 10/27 | OK | GAP 3/8 | OK | OK |
| `waterproof` | Akeneo | 77/105 | 44/73 | OK | OK | OK | OK | OK |
| `temp_min_c` | Akeneo | OK | OK | 24/27 | OK | GAP 2/8 | OK | OK |
| `temp_max_c` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `warranty_years` | Akeneo | OK | OK | OK | OK | OK | OK | n/a? |
| `pack_qty` | Akeneo | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `shipping_lead_days` | Akeneo | 73/105 | n/a? | n/a? | GAP 3/9 | n/a? | n/a? | n/a? |
| `manufacturing_lead_days` | Akeneo | 73/105 | n/a? | n/a? | GAP 3/9 | n/a? | n/a? | n/a? |
| `inventory_type` | Akeneo | OK | OK | OK | OK | OK | OK | OK |
| `badge` | Payload | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `display_order` | Payload | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `marketing_note` | Payload | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `applications` | Payload | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `related_skus` | Payload | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `faq` | Payload | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? | n/a? |
| `seo_title` | Payload | OK | OK | OK | OK | OK | OK | OK |
| `seo_description` | Payload | OK | OK | OK | OK | OK | OK | OK |
| `price_nzd` | Excluded | 70/105 | 62/73 | 20/27 | n/a? | 7/8 | n/a? | OK |

---

## Diagnosis: why `standards_met` (certs) is 0/224 — 2026-06-04

**Conclusion: Akeneo source-data issue (Alan / PIM), NOT a Payload or front-end bug.** The sync write-path and code pattern are proven good.

Evidence:
- `akeneo-sync.ts` L118-125 reads the Akeneo `standards_met` array and maps each value (lowercased) through `stdMap` → Payload enum codes (`c_ce`, `c_ul`, …), dropping unmatched values.
- The Payload field `Products.ts:408` (`standards_met`, select hasMany) **accepts** exactly those codes (`c_ce`/`c_saa`/`c_tuv`/`c_ul`/`c_rcm`/`c_fcc`/`c_rohs`/`c_enec` + `c_bis`/`c_cb`/`c_lm80`). So covered values would write fine — no silent drop.
- `dimming_control` uses the **identical** map-then-filter pattern and lands 62/224. The pattern works. Therefore the 0/224 is specific to the `standards_met` *source*: the Akeneo attribute is either named differently, unpopulated for envo products, or uses a value vocabulary that lowercases to none of `{ce,saa,tuv,ul,rcm,fcc,rohs,enec}`.

**To confirm root cause definitively**, inspect the raw Akeneo response for one envo product's `standards_met` attribute (needs Akeneo creds — Alan, or a read-only probe). Three outcomes: wrong attribute code → fix the `getVal` key; empty in PIM → data entry (Alan); different vocabulary → extend `stdMap`.

**Independent code gap (fixable now, but won't fix 0/224 alone):** `stdMap` is incomplete vs the Payload field and the real cert set — it cannot emit `c_cb`, `c_bis`, or `c_lm80`, and has no entry for CSA / CCC / cUL (see [[reference_cert-logos-library]], [[project_envo-minilux-real-specs]] which lists cUL + CB). Extend `stdMap` so these flow once the source data is present.
