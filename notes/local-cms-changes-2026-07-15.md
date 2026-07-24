# 本地 CMS 修改清单

> 用途：prod /admin 修复期间，所有在 **localhost:3000/admin** 做的内容修改都记录在此。
> live 后台恢复后，按此清单在 https://envolighting.com/admin 逐项重新录入并核对。
> 本文件不提交 git（仅本地留存）。**绝不把本地数据库上传/覆盖生产。**

## 状态

- [ ] 生产数据已拉到本地（db-refresh --with-media）— ⏳ 等 Lenny 开 SSH（Issue #222）
- [ ] 本地后台可登录
- 记录规则：每条修改一节，字段照抄下方模板。

## 本地种子数据（非修改，勿录入生产）

- 2026-07-16：为让本地 footer 渲染与 live 一致，跑了 `seed-solutions.mts`（2 条 Solutions）和 `seed-cms-pages.mts`（4 个法律页面）。内容与 prod 现状相同，源自仓库 canonical 数据 — **不需要**搬去生产；db-refresh 拉真数据后会被覆盖。

## 修改记录

<!-- 模板：复制下面一节，填完实情后把"已重新录入生产"留空，录入后打钩并填日期 -->

### #1 （示例，未使用）

| 项 | 内容 |
|---|---|
| Collection/Global | |
| 文档标题 | |
| 文档 ID | |
| 修改的字段 | |
| 修改前内容 | |
| 修改后内容 | |
| 新上传媒体文件名 | （无则填"无"） |
| 修改时间 | |
| 已重新录入生产 | ☐ 未录入 / ☑ 已录入（日期＋核对人） |


## 2026-07-22 — Blog guide expansion #1: channel letter modules

- **Post:** `choosing-the-right-led-module-for-channel-letters` (local id 3, **prod id 4**)
- **Change:** body replaced with full technical guide (~1,480 words, 8 H2, selection
  table as raw-HTML block, FAQ, /free-layout-design CTA). Title/slug/meta unchanged.
- **Source:** Lexical JSON generated from draft; files in session scratchpad
  (`draft-channel-letter-modules.md`, `body-channel-letters.json`, `md-to-lexical.py`,
  `update-post-body.ts`).
- **Prod replay:** PATCH `/api/posts/4` with the same body JSON (login → payload-token),
  **after** the guide-table CSS (dev @ ae36ce0) ships to main — tables are unstyled
  without it.
- Applied locally via Payload local API on 2026-07-22. ✅ verified at 1440px + 375px.
