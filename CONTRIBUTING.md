# Contributing

This is a shared repo. You and at least one other person edit it. To keep things smooth, your Claude does the git — you just tell it what you're doing.

## Maintainer

- **Owner**: Brendan Phillips (@bphilli-gw) — approves merges to the default branch

Slack Brendan with questions; open a GitHub issue for proposed changes.

## What to tell your Claude

| Stage | Say to Claude |
|---|---|
| Starting | "Pull the latest and start a branch for [what I'm doing]." |
| Mid-work | "Commit my changes." |
| Done for the session | "Run `/done`." (Or: "Push the branch and open a PR.") |
| Reviewing | "Summarize the changes in this PR in plain English." |
| Merging (owner only) | "Merge this PR." (Otherwise: "Tag Brendan for review.") |

## Coordinate before big work

For schema changes, new features, or anything that touches a shared interface — open a GitHub issue (or message Brendan) before starting. Saves you from doing work that gets rejected at PR time.

## Don't

- Commit secrets (API keys, tokens). Use `.env` files (gitignored).
- Commit large data files or generated outputs. Add patterns to `.gitignore`.
- *Edit* Excel/Word/PowerPoint in the repo — git can't merge them, so one person's changes disappear. Reference-only copies are fine; collaborative editing is not. Use markdown/CSV/YAML for live work.
- Merge your own PR if you're not the owner.
- Force-push.

## If something looks weird

Ask your Claude to explain before doing anything. Or ping Brendan.
