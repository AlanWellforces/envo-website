# Prod 产品数据修正清单 — 2026-07-22（产品标题词典统一）

> **✅ 已执行 2026-07-23**（marketing session，经用户授权直接在 prod 跑）：§1–§5 全部 + 追加
> media.alt 同套词典清理（132 Envo/23 ZigBee/10 错别字/3 Color/65 空白）+ name/short_description
> 全量空白清理。执行后 `validate:products` 的 spelling/style 组已 clean（剩 current 19 =
> CC/多通道语义误报、efficacy 6 = 标称圆整值，均判定不修）。live 已核验。

来源：117 个 live 产品标题全量审计（JSON-LD name 逐页核对，2026-07-22）。
执行人：Alan（SQL）或 Wei（/admin Products）。改完 prod 后触发相关页面 revalidate。
是 `notes/prod-data-fixes-2026-07-17.md` 的续篇 —— **§2 的错别字 SQL 仍未在 prod 执行**（live 还能看到 Contol/Currnt/Conveter），本单不重复那 5 条，只补词典统一类。

校验已代码化：`npm run validate:products` 现在会按 `scripts/lib/product-lexicon.ts`
的词典检查品牌大小写 / 术语写法 / 多余空白（`style` 检查组）。本单全部执行后，
在 box 上跑一遍应为 clean（§2 也执行完的前提下）。

## 1. 品牌大小写 — "Envo" → "ENVO"（27 行，全部是 EV-SN*/S-EV-SN* LED Driver）

```sql
-- 预期 27 行
UPDATE products SET name = regexp_replace(name, '\mEnvo\M', 'ENVO', 'g')
WHERE name ~ '\mEnvo\M';
```

## 2. Zigbee 写法 — "ZigBee"×21 + "ZigbBee"×1 → "Zigbee"（22 行）

CSA 2021 改名后官方写法是 **Zigbee**（不再是 ZigBee）。
⚠️ 本条**取代** 07-17 单 §2 里 "ZigbBee → ZigBee" 那一行：目标统一为 Zigbee。
两单执行顺序无所谓，正则两种旧写法都兜住。

```sql
-- 预期 22 行
UPDATE products SET name = regexp_replace(name, 'Zigb?Bee', 'Zigbee', 'g')
WHERE name ~ 'Zigb?Bee';
```

## 3. 英式拼写 — "Color" → "Colour"（2 行）

| SKU | 现名片段 |
|---|---|
| EV-ZB2868K7-5C | RGB+CCT **Color** Remote |
| EV-ZB2868K7-DIM | Single **Color** Remote |

```sql
-- 预期 2 行
UPDATE products SET name = regexp_replace(name, '\mColor\M', 'Colour', 'g')
WHERE name ~ '\mColor\M';
```

## 4. In-Wall 统一 — "In-wall"×2 + "In Wall"×1 → "In-Wall"（3 行）

EV-ZB9101SAC-HPS2CH、EV-ZB9101SAC-HPB（In-wall）、EV-ZB9041A-D（In Wall）。

```sql
-- 预期 3 行
UPDATE products SET name = REPLACE(REPLACE(name, 'In-wall', 'In-Wall'), 'In Wall', 'In-Wall')
WHERE name LIKE '%In-wall%' OR name LIKE '%In Wall%';
```

## 5. 收尾清理

```sql
-- 标题首尾空格（至少 ENC-16-700 尾部有一个空格）
UPDATE products SET name = btrim(name) WHERE name <> btrim(name);

-- short_description 同样的词典问题（从站外无法核实具体行数，有 WHERE 兜底，干净则 0 行）
UPDATE products SET short_description = regexp_replace(short_description, '\mEnvo\M', 'ENVO', 'g')
WHERE short_description ~ '\mEnvo\M';
UPDATE products SET short_description = regexp_replace(short_description, 'Zigb?Bee', 'Zigbee', 'g')
WHERE short_description ~ 'Zigb?Bee';
UPDATE products SET short_description = regexp_replace(short_description, '\mColor\M', 'Colour', 'g')
WHERE short_description ~ '\mColor\M';
```

## 6. 执行后

1. 在 box 上跑 `npm run validate:products`（连 prod DATABASE_URL）→ 应无 `spelling` / `style` 组问题。
2. 触发 revalidate（产品页 + 系列页 + sitemap 相关）。
