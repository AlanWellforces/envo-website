# Search Console / Bing 收录接入 runbook（2026-07-13）

背景：站点 2026-07-09 上线。外部实测（2026-07-13）：robots.txt 正常、sitemap
153 条全可访问、页面有 canonical、无任何 noindex/X-Robots-Tag 阻断 —— 技术面
干净，但公开搜索完全没有本站页面。**最可能原因是域名太新且从未向搜索引擎报到**，
不是抓取被阻断。以下按优先级操作（需要 Google/Microsoft 账号 + Cloudflare DNS
权限的人执行；代码侧钩子已就绪）。

## 1. Google Search Console — Domain Property（首选）

1. https://search.google.com/search-console → Add property → **Domain**
   → `envolighting.com`。
2. GSC 给出一条 TXT 记录（`google-site-verification=...`）→ 到 **Cloudflare
   DNS** 加这条 TXT（名称 `@`）→ 回 GSC 点 Verify（DNS 生效可能要几分钟）。
3. 验证通过后：左侧 **Sitemaps** → 提交 `https://envolighting.com/sitemap.xml`。

*没有 Cloudflare 权限的备选*：URL-prefix property (`https://envolighting.com`)
用 "HTML tag" 方法 —— 把 token（content 里那串，不含标签）填进盒子
`/opt/envo/.env` 的 `GOOGLE_SITE_VERIFICATION=`，下次部署自动渲染
`<meta name="google-site-verification">`。Domain property 覆盖面更广，优先。

## 2. Bing Webmaster Tools

1. https://www.bing.com/webmasters → **Import from Google Search Console**
   （GSC 验证完后一键导入，含 sitemap，最省事）。
2. 或手动添加站点 + `BING_SITE_VERIFICATION=`（`msvalidate.01` token，同上
   贴进 `/opt/envo/.env`）。

## 3. 验证通过后，按顺序检查（GSC 左侧菜单）

| 检查项 | 位置 | 看什么 |
|---|---|---|
| Manual Actions | Security & Manual Actions | 必须是 "No issues"（新站被前任域名连累的情况要在这里现形） |
| Page Indexing | Indexing → Pages | Indexed / Not-indexed 分布；新站头几周大量 "Discovered – currently not indexed" 属正常 |
| Crawl Stats | Settings → Crawl stats | Googlebot 是否在来、响应码分布（关注 CF 是否给爬虫返回非 200） |

## 4. URL Inspection + 请求收录（每天限额 ~10 条，分两天做）

对下列代表页逐条 URL Inspection → **Request Indexing**：

```
https://envolighting.com/
https://envolighting.com/products
https://envolighting.com/products/led-signage-modules
https://envolighting.com/products/led-drivers
https://envolighting.com/products/control-gear
https://envolighting.com/solutions
https://envolighting.com/solutions/signage-lighting
https://envolighting.com/products/led-signage-modules/mini-series
https://envolighting.com/products/led-signage-modules/envo-ecoglo
https://envolighting.com/contact
```

## 5. 预期节奏 & 判断标准

- 提交后 **2–7 天**内 Crawl Stats 应出现抓取量；**1–3 周**核心页开始进索引。
- 在 GSC 数据到手前，不下"Google 无法抓取"的结论（外部技术检查已排除了
  常见阻断项）。
- 三周后核心页仍 0 收录才升级排查：CF Bot Fight Mode 是否拦 Googlebot、
  域名历史（spam 记录）、外链为零的问题。

## 代码侧已就绪（本 PR）

- `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` 环境变量 →
  自动渲染验证 meta 标签（`src/app/(frontend)/layout.tsx`），设了才渲染。
- `.env.example` 已列出两个变量。
