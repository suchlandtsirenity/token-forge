# Token Forge historian

The dated record of what Token Forge shipped, kept next to the code it describes.
The changelog says what each release was; this folder is the archive you can still
read years later, with the pictures it was judged by.

## Rules

- **Append-only.** A past entry is never edited or deleted. A correction is a new
  dated entry that links back to the one it corrects.
- **One folder per day**, named `entries/<YYYY-MM-DD>-<slug>/`, holding that day's
  `entry.md` and its own media beside it.
- **Media-first.** The figures come before the prose, each with a caption. Media
  is copied in, not linked.
- **Plain notes.** What shipped, one line on why it matters, honest limits. No
  marketing, no adjectives, no number that isn't backed by something that ran.

## entry.md

```markdown
---
title: <one line for the day>
date: <YYYY-MM-DD>
parts:
  - <part>: <what that part was>
sources:
  - docs/changelog/CHANGELOG.md — the changelog section for this day
  - docs/changelog/discord/<date>.md — the post that went out
---

![<caption>](<file>.png)

## <part>

What shipped, why it matters, what it still cannot do.
```
