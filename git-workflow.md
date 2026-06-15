# Git workflow — ENVO Website

Team reference for how Alan, Mackenzie, and Wei collaborate via git on this repo. This is the canonical detailed reference; `CLAUDE.md` has a short overview.

## TL;DR

```txt
1. git fetch origin && git checkout dev && git pull origin dev
2. git checkout -b feature/your-slug
3. ... do work, commit often, small commits ...
4. git fetch origin && git rebase origin/dev      ← always rebase before pushing
5. git push -u origin feature/your-slug           ← first push
   git push --force-with-lease                    ← subsequent pushes after rebase
6. Open PR feature/... → dev. Tag reviewers. Don't merge without approval.
7. After merge: git checkout dev && git pull && git branch -d feature/your-slug
```

Branches:
- **`main`** — production, protected, **never commit directly**
- **`dev`** — integration, **never commit directly**
- **`feature/*`** — your working branch, branched from `dev`, merged back into `dev` via PR

---

## 1. Starting work

```bash
git fetch origin
git checkout dev
git pull origin dev
git checkout -b feature/short-description
```

Branch naming: short kebab-case description. Examples: `feature/homepage-hero-copy`, `feature/drizzle-product-schema`, `feature/akeneo-sync-prototype`. Doc-only branches can use a different prefix like `notes/2026-05-21-collection-fields`.

---

## 2. During work — commit often

Small commits with clear, present-tense messages. Easier to review, easier to revert.

```bash
git add <files>          # stage by name; avoid `git add .`
git commit -m "Add X to Y"
```

For longer messages, use a HEREDOC:
```bash
git commit -m "$(cat <<'EOF'
Short subject (< 70 chars)

Optional body explaining *why*, not *what*.
EOF
)"
```

---

## 3. Before pushing — rebase on latest `dev`

Always rebase on `origin/dev` before pushing. Catches updates from other team members and keeps history linear.

```bash
git fetch origin
git rebase origin/dev
```

### If conflicts

```bash
git status                     # see which files conflict
# edit each conflicting file, remove <<< === >>> markers
git add <fixed-file>
git rebase --continue
```

If a conflict is unclear and you're guessing which version is correct, **stop and ask** — don't commit a guess.

### To bail out of a rebase

```bash
git rebase --abort
```

This returns you to the state before the rebase started.

### Blocked by uncommitted changes

If `git pull` or `git rebase` refuses to run because of uncommitted local changes:

```bash
git add .
git commit -m "WIP"
# then proceed with rebase
```

**Prefer committing over stashing.** Committed work is recoverable via `git reflog`; stashed work is easier to lose.

---

## 4. Pushing

First push of a branch:
```bash
git push -u origin feature/branch-name
```

Subsequent pushes **after a rebase** (rebase rewrites history, so plain `push` will be rejected):
```bash
git push --force-with-lease
```

**Never use plain `git push --force`.** Always `--force-with-lease` — it refuses to overwrite remote changes you haven't seen yet, protecting against accidentally clobbering a teammate's commits.

**Never force-push to `main` or `dev`.** Force-push is only for your own `feature/*` branches.

---

## 5. Opening a PR

After your final push, open the PR on GitHub:

```bash
gh pr create --base dev --title "..." --body "..."
```

Or use the GitHub URL printed by `git push`. PR target is `dev`, **not** `main`.

Tag reviewers (Alan for backend, Mackenzie for frontend, Wei for content). **Don't merge to `dev` without approval.**

---

## 6. Reviewer flow — Alan reviewing and merging

```bash
gh pr view <number> --web        # opens in browser
gh pr checkout <number>          # OR pull it down locally to test

# After approval:
gh pr merge <number> --squash --delete-branch
#   --squash         collapses the PR into one commit on dev (recommended)
#   --merge          alternative: keeps PR history, creates a merge commit
#   --delete-branch  removes the feature branch on origin after merge
```

Merge strategy is **Alan's call to pick once and stick with**. Recommendation for a 3-person team: `--squash` (cleaner history, easier reverts).

---

## 7. After merge — cleanup

```bash
git checkout dev
git pull origin dev
git branch -d feature/your-branch       # local cleanup
# (-D to force-delete if -d refuses after a squash merge)
```

**Golden rule:** never start a new feature branch from a stale `dev`. Always `git pull origin dev` first.

---

## 8. Promoting `dev` to `main`

Periodically (weekly or at stage milestones), Alan opens a PR `dev → main` to promote integrated changes to production-ready.

```bash
gh pr create --base main --head dev --title "Promote dev to main (<date or stage>)"
```

Merge with `--merge` (not `--squash`) so the release boundary stays visible in `main`'s history.

---

## 9. When unsure — stop and ask

If git state looks tangled (detached HEAD, lost commits, weird merge state, mysterious "diverged" warnings), **stop and ask the user before running destructive commands**.

Useful safety checks:
- `git reflog` — shows recent HEAD history; lost commits are recoverable for ~30 days
- `git status` — explicit about the current state
- `git log --oneline -10` — recent commits visible locally
- `gh api repos/AlanWellforces/envo-website/branches/dev` — verify a branch exists on origin

A 30-second pause to ask is always cheaper than a force-push that destroys someone's work.

---

## First-time setup on a new machine

Once per machine, for each contributor:

```bash
# (1) Git identity — use the email tied to your GitHub account
git config --global user.name "Your Name"
git config --global user.email "your-github-email@example.com"

# (2) GitHub CLI (optional but recommended)
brew install gh
gh auth login                  # interactive; pick HTTPS, login via browser
```

The `gh`-stored token also acts as your `git push` credential over HTTPS, so this one step covers both.

> **2026-06-15 — Token updated.** If you get `Authentication failed` when pushing or pulling, the shared PAT expired. Ask Alan for the new token and update your remote URL:
> ```bash
> git remote set-url origin https://<your-github-username>:<NEW_TOKEN>@github.com/AlanWellforces/envo-website.git
> ```
> Alternatively, use your own personal PAT (recommended — GitHub Settings → Developer settings → Personal access tokens → Tokens (classic), scopes: `repo`).

---

## Never do

- Commit directly to `main` or `dev` — always through a `feature/*` PR
- Use `git push --force` without `--force-with-lease`
- Force-push to `main` or `dev` (never, under any circumstance)
- Rebase a branch other people have based work on (only rebase branches that are yours alone)
- Commit `.env`, `.env.local`, or any secrets — `.gitignore` excludes them, but always glance at `git status` before committing
- Resolve a conflict by guessing — if it's unclear which version is correct, ask
- Skip git hooks (`--no-verify`) unless explicitly approved
- Use `git rebase -i` or `git add -i` in non-interactive contexts (the `-i` flag requires a terminal)

---

## Cheat sheet

| Situation | Command |
|---|---|
| Start new work | `git fetch origin && git checkout dev && git pull && git checkout -b feature/...` |
| See what changed | `git status` and `git diff` |
| Stage + commit | `git add <files> && git commit -m "..."` |
| Sync before push | `git fetch origin && git rebase origin/dev` |
| Push first time | `git push -u origin <branch>` |
| Push after rebase | `git push --force-with-lease` |
| Open PR | `gh pr create --base dev --title "..."` |
| See PR | `gh pr view <n> --web` |
| Merge PR | `gh pr merge <n> --squash --delete-branch` |
| After merge | `git checkout dev && git pull && git branch -d feature/...` |
| Abort a rebase | `git rebase --abort` |
| Find a lost commit | `git reflog` |
| Promote to prod | `gh pr create --base main --head dev` |
