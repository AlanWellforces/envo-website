# Git workflow — ENVO Website

Team reference for how Alan, Mackenzie, and Wei collaborate via git on this repo.

## TL;DR

```txt
1. git checkout dev && git pull origin dev
2. git checkout -b feature/your-slug
3. ... do work, commit ...
4. git push -u origin feature/your-slug
5. gh pr create --base dev --title "..." --body "..."
6. Ping Alan to review
7. After merge: git checkout dev && git pull origin dev && git branch -d feature/your-slug
```

Branches: `main` is production. `dev` is the integration branch. All feature work goes through `dev` first.

---

## 1. Contributor flow — opening a change

Run from inside the repo.

```bash
# (a) Make sure your local dev is current
git checkout dev
git pull origin dev

# (b) Branch off dev with a descriptive name
git checkout -b feature/short-descriptive-slug
#   examples:
#     feature/homepage-hero-copy
#     feature/nextjs-scaffold
#     feature/drizzle-product-schema
#   For doc-only branches it's fine to use a different prefix, e.g.
#     notes/2026-05-21-collection-fields

# (c) Do the work — edit files, save them

# (d) See what changed, then stage specific files (avoid `git add .`)
git status
git add path/to/file1 path/to/file2

# (e) Commit with a short imperative subject and optional body
git commit -m "Short imperative subject"
#   For multi-line messages use a HEREDOC:
#     git commit -m "$(cat <<'EOF'
#     Subject line under ~70 chars
#
#     Optional body explaining why, not what.
#     EOF
#     )"

# (f) Push the new branch and set tracking
git push -u origin feature/short-descriptive-slug

# (g) Open the PR against dev (not main)
gh pr create --base dev --title "..." --body "..."
#   If gh isn't on your PATH or you'd rather click, GitHub prints a
#   "Create a pull request" link in the push output — open it in browser.

# (h) Ping Alan in Slack with the PR link
```

### While the PR is open

- If Alan asks for changes: edit → `git add` → `git commit` → `git push` (no `-u` needed after the first push). New commits show up in the PR automatically.
- Don't pile unrelated work onto the same branch — open a new feature branch from updated `dev` for the next thing.

---

## 2. Reviewer flow — Alan reviewing and merging

```bash
# (a) See the PR
gh pr view <number> --web        # opens in browser
gh pr checkout <number>          # OR pull it down locally to test

# (b) Comment, request changes, or approve via the GitHub UI

# (c) Merge once approved
gh pr merge <number> --squash --delete-branch
#   --squash      collapses the PR into one commit on dev (recommended)
#   --merge       alternative: creates a merge commit, preserves PR history
#   --delete-branch removes the feature branch on origin after merge
```

**Merge strategy is Alan's call to pick once and stick with.** Recommendation for a 3-person team: `--squash` (cleaner history, easier reverts). If you prefer to see PR boundaries in history, use `--merge`. Just don't mix the two.

---

## 3. After merge — everyone updates and moves on

The contributor whose PR just merged, AND anyone starting their next piece of work:

```bash
# (a) Go back to dev
git checkout dev

# (b) Pull the merged change down
git pull origin dev

# (c) Delete your local feature branch (remote is already gone)
git branch -d feature/short-descriptive-slug
#   If git refuses with "not fully merged", that's normal after a squash.
#   Use -D to force-delete in that case:
#     git branch -D feature/short-descriptive-slug

# (d) Start the next feature branch from this updated dev
git checkout -b feature/next-thing
```

**Golden rule:** never start a new feature branch from a stale `dev`. Always `git pull origin dev` first. This avoids almost all merge conflicts in a small team.

---

## 4. Promoting `dev` to `main`

Periodically (e.g. weekly or at stage milestones), Alan opens a PR from `dev → main` to promote integrated changes to production-ready.

```bash
gh pr create --base main --head dev --title "Promote dev to main (<date or stage>)"
```

That PR is reviewed differently — it's a release boundary, not a feature. Merge with `--merge` (not `--squash`) so the boundary stays visible in `main`'s history.

---

## First-time setup on a new machine

Once per machine, for each contributor:

```bash
# (1) Git identity — use the email associated with your GitHub account
git config --global user.name "Your Name"
git config --global user.email "your-github-email@example.com"

# (2) GitHub CLI (optional but recommended for PR work)
brew install gh
gh auth login           # interactive; pick HTTPS and login via browser
#   The gh-stored token also acts as your `git push` credential over HTTPS,
#   so this one step covers both.
```

If your `gh` binary is installed somewhere not on `$PATH` (e.g. `~/bin/gh`), either add it to your PATH in `~/.zshrc` or invoke by absolute path.

---

## Common gotchas

- **Never commit secrets.** `.env.local`, API keys, the Akeneo token, etc. The `.gitignore` already excludes `.env*`, but always glance at `git status` before committing.
- **Never `git push --force` to `main` or `dev`.** Ever. Only to your own feature branches, and only if you know why.
- **Never amend a pushed commit.** Add a new commit instead.
- **Don't use `git add .`** unless you've just looked at `git status` and know exactly what's there — it's the easiest way to accidentally commit a stray file.
- **Branch from `dev`, PR to `dev`.** `main` is read-only for everyone except via the dev → main promotion PR.

---

## Cheat sheet

| Situation | Command |
|---|---|
| Start new work | `git checkout dev && git pull && git checkout -b feature/...` |
| See what changed | `git status` and `git diff` |
| Stage and commit | `git add <files> && git commit -m "..."` |
| Push first time | `git push -u origin <branch>` |
| Push subsequent | `git push` |
| Open PR | `gh pr create --base dev --title "..." --body "..."` |
| See PR | `gh pr view <n> --web` |
| Merge PR | `gh pr merge <n> --squash --delete-branch` |
| Sync after merge | `git checkout dev && git pull && git branch -d feature/...` |
| Promote to prod | `gh pr create --base main --head dev --title "..."` |
