# Proposal for Lenny: pre-cutover link check in the box deploy

**Goal.** Before the box swaps traffic to a freshly built image, crawl the
**candidate** container with `scripts/check-links.ts` (landed on dev 2026-07-13,
see DEPLOY.md "Pre-release link check"). If the crawl finds broken links, keep
the current live image — same philosophy as the existing build-fail-safe, one
step later in the pipeline. This closes the only non-automated gap in the
broken-link detection setup: CI can't reach the DB, so only the box can check a
candidate build against real data before it goes live.

The checker only issues GETs (bodies of PDFs/media are discarded after
headers), so pointing it at a candidate that shares the prod DB is safe.

## Sketch (adapt names/ports to the real deploy script)

```bash
# after: docker build -t envo:candidate .   (the existing build step)

docker run -d --name envo-candidate \
  --env-file /opt/envo/.env \
  --network <the-app-network> \
  envo:candidate

# wait until it answers
for i in $(seq 1 60); do
  docker exec envo-candidate wget -qO /dev/null http://localhost:3000/ && break
  sleep 2
done

# the gate — run the checker against the candidate
if npx tsx scripts/check-links.ts --base http://<candidate-host>:3000; then
  # …existing swap: stop old container, promote candidate…
  :
else
  echo "link check FAILED — keeping current live image" >> /opt/envo/deploy.log
  docker rm -f envo-candidate
  exit 1
fi
```

Where to run `npx tsx …` from, pick whichever fits the box layout:

1. **Repo checkout on the host** (the checkout the box already builds from),
   if the host has node + `node_modules` — simplest.
2. **A throwaway node container** on the same network:
   `docker run --rm -v /opt/envo/repo:/app -w /app --network <net> node:22 npx tsx scripts/check-links.ts --base http://envo-candidate:3000`
3. Inside the candidate image itself (`docker exec envo-candidate …`) — only
   if the image keeps devDependencies + `scripts/` (a standalone-output image
   usually doesn't).

Notes:

- Expected runtime on a production build ≈ 1–3 min (209 sitemap pages + ~1k
  link probes at concurrency 8). Add `--concurrency 4` if the box is tight.
- The sitemap advertises `NEXT_PUBLIC_SITE_URL`; the checker rewrites origins
  to `--base`, so the candidate's prod-style URLs are handled.
- Failure output lists every broken URL and the page it was found on, in
  deploy.log.
- Exit codes: 0 clean (warnings allowed), 1 failures — safe to `&&`-chain.

## Unrelated discovery, please confirm

Repo-root **`auto-deploy.sh` looks stale**: it tracks `origin/dev` (the box
deploys `main`), starts a bare `node .next/standalone/server.js` (the box swaps
Docker images per DEPLOY.md), and uses `/app/envo-website` + n8n-era paths. If
it's truly dead, delete it from the repo — a future reader could mistake it for
the real deploy pipeline. If some other box still runs it, a comment saying
where would help.
