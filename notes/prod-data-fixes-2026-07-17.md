# Prod 产品数据修正清单 — 2026-07-17（已对 datasheet 核实）

> **✅ 已执行 2026-07-23**（marketing session，经用户授权直接在 prod 跑）：§1、§2、§3-IP66（含
> `ALTER TYPE ... ADD VALUE 'ip66'` + 代码侧 PR #241）、§3b（MiniLux 按本单值，其余模组÷1000，
> SR-CS×3→0.2）。§3-beads 核实已自愈（名称已是 "Duo LED"）无需修。**§4 仍待供应商确认，勿盲改。**
> 执行前快照与最终 SQL 见 session scratchpad `prod-fixes.sql`；行数全部与本地预演一致，live 已核验。

来源：全站文案审计发现的可疑规格值，逐一下载 live 站 `/datasheets/<SKU>` PDF 核对。
执行人：Alan（SQL）或 Wei（/admin Products）。改完 prod 后需触发相关页面 revalidate。

## 1. 证实错误 — rated_current_a（数值直接改）

| SKU | 现值（site） | 应为 | datasheet 依据 |
|---|---|---|---|
| ENC-12-300 | 300 | 0.3 ⚠️ | PDF 表格写 **350mA** 但栏目标题/SKU 都是 300mA（PDF 自相矛盾）；site 的 40V 与 300mA 自洽（12W÷0.3A=40V）。**建议先按 0.3 改掉单位错误，350 问题问供应商** |
| ENC-16-700 | 700 | 0.7 | PDF: 700mA ✓ |
| ENC-18-500 | 500 | 0.5 | PDF: 500mA ✓ |
| EV-SNP-35-12 | 29 | 2.9 | PDF: Rated current 0–2.9A（丢小数点） |
| EV-SNL-60-12 | 0.5 | 5 | PDF: 0–5A（10× 偏小） |
| EV-SNL-60-24 | 0.25 | 2.5 | PDF: 0–2.5A |
| EV-SNL-150-24 | 8.33 | 6.25 | PDF: 0–6.25A（8.33 是 200W 型号的值） |
| EV-SNR-60-12 | 6.25 | 5 | PDF: 0–5A（现值是 75W 型号的） |
| EV-SNR-60-24 | 3.125 | 2.5 | PDF: 0–2.5A |
| S-EV-SNR-60-24 (NZ plug 版) | 3.125 | 2.5 | 同上（同规格换插头） |
| SRP-2305N-36CC350-1050 | 0.25 | 0.35 | PDF: 350–1050mA，兄弟型号规律=区间下限 |

```sql
-- 核对无误后执行（prod, products 表）：
UPDATE products SET rated_current_a = 0.3  WHERE sku = 'ENC-12-300';
UPDATE products SET rated_current_a = 0.7  WHERE sku = 'ENC-16-700';
UPDATE products SET rated_current_a = 0.5  WHERE sku = 'ENC-18-500';
UPDATE products SET rated_current_a = 2.9  WHERE sku = 'EV-SNP-35-12';
UPDATE products SET rated_current_a = 5    WHERE sku IN ('EV-SNL-60-12','EV-SNR-60-12');
UPDATE products SET rated_current_a = 2.5  WHERE sku IN ('EV-SNL-60-24','EV-SNR-60-24','S-EV-SNR-60-24');
UPDATE products SET rated_current_a = 6.25 WHERE sku = 'EV-SNL-150-24';
UPDATE products SET rated_current_a = 0.35 WHERE sku = 'SRP-2305N-36CC350-1050';
```

## 2. 证实错误 — 产品名错别字（name 字段）

| SKU | 错 | 对 |
|---|---|---|
| ENC-16-700 | Constant **Currnt** | Constant Current |
| SRP-2305N-10/15/25/36/45/65（6 个） | NFC **Contol** | NFC Control |
| EV-ZB9041A-D | **ZigbBee** | ZigBee |
| EV-ZBDA-2421 | **Conveter** | Converter |
| EV-ZB9101SAC-HPS2CH | **2Gang** | 2-Gang |

```sql
UPDATE products SET name = REPLACE(name, 'Currnt', 'Current')   WHERE name LIKE '%Currnt%';
UPDATE products SET name = REPLACE(name, 'Contol', 'Control')   WHERE name LIKE '%Contol%';
UPDATE products SET name = REPLACE(name, 'ZigbBee', 'ZigBee')   WHERE name LIKE '%ZigbBee%';
UPDATE products SET name = REPLACE(name, 'Conveter', 'Converter') WHERE name LIKE '%Conveter%';
UPDATE products SET name = REPLACE(name, '2Gang', '2-Gang')     WHERE name LIKE '%2Gang%';
```

## 3. 需补数据

- **LED beads**：EV-BLML02LBY（MiniLux Duo）和 EV-BLPG02LBY（ProGlo Duo）系列表显示 "—"。datasheet 照片证实均为 **2 颗**。⚠️ 注意排查根因：beads 由 led_config 文案解析（catalogue-data.ts 的 BEAD 映射只认 single/duo/triple/quad/penta，**不认 "Double"**）——若字段值写的是 "Double LED" 需改成 "Duo" 或加映射（后者是代码改动，找 marketing session）。
- **模组 IP 等级**：ProGlo 全系 + MiniLux 全系 datasheet 均为 **IP66**，选型表却是空 "—"（已知 sync 掉 IP 数据的历史问题）。补上后 solutions/博客的 IP66 故事线就与数据一致了。

## 3b. 证实错误 — weight_kg 单位（2026-07-21 外部审计发现）

MiniLux 结构化数据显示 Weight = **2 kg**（14×9×8.8 mm 模组）。datasheet 装箱表
反推单颗净重：01 ≈ 8.2 kg÷4800 = **1.7 g**、02 ≈ 8.16÷3000 = **2.7 g**、03 ≈ 9.53÷2400 = **4.0 g**。
根因：Akeneo weight 属性单位是**克**，sync 的 getAmount() 丢单位、把 2 (g) 存成 2 (kg)。
sync 代码已修（getWeightKg 单位换算，feature/external-audit-fixes-2026-07-21）；存量数据需清：

```sql
-- 先审计：所有非空 weight，模组类 >0.1 kg 基本都是克值
SELECT sku, name, weight_kg FROM products WHERE weight_kg IS NOT NULL ORDER BY weight_kg DESC;

-- MiniLux 按 datasheet 装箱净重反推（±10% 标称）：
UPDATE products SET weight_kg = 0.0017 WHERE sku LIKE 'EV-BLML01%';
UPDATE products SET weight_kg = 0.0027 WHERE sku LIKE 'EV-BLML02%';
UPDATE products SET weight_kg = 0.004  WHERE sku LIKE 'EV-BLML03%';
-- 其余 SKU 按审计结果同理除以 1000（若源值确是克）；拿不准的置 NULL，
-- JSON-LD 对 NULL 会自动省略该行，比错值安全。
```

## 4. 需供应商/内部确认（勿盲改）

- **ENC 系列 output_voltage_v**：site 显示 40V / 16V / 18V。ENC-16-700 实物标签是 SEC:12–24V（16 疑似误填了瓦数）；按功率÷电流推算 ENC-16-700 max≈23V、ENC-18-500 max≈36V。单值字段建议统一存最大电压：40 / 24 / 36 —— 请对供应商规格确认。
- **ENC-12-300 电流**：PDF 表格 350mA vs SKU/标题 300mA，PDF 自相矛盾，问供应商。
- **EV-BLPG01 尺寸**：site "17.4×17.42×9.6"（取自图纸的两个边）vs PDF 参数表 "17.4×23×9.6"（23 含安装耳）。建议统一按参数表口径。

## 5. 核实为正确 — 不要"修"

- **EV-SL-150-12 / EV-SNL-150-12 的 "11A"**：datasheet 明确 0–11A、rated power 132W —— 是真实降额规格，150W@12V 不输出 12.5A。保持现状。
