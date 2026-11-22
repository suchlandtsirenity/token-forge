# Token sets as artifacts — Phase 3 design

**Status:** design, 2026-11-21. No code yet. This is the proposal to build
against; the owner signs off before anything ships.

## What a set is

A **set** is one built system, published as a file: the full JSON export — the
token set *and* its `$forge` — saved under a name and a version. It is what
"the visual language" means when someone points at it instead of describing it.

A set is **immutable**. Once published at a version, that file never changes.
Changing anything — a colour, a font, a knob — publishes a *new* version. This
is the whole reason a consumer can pin one.

## Identity

```
<name>@<major>.<minor>      e.g.  clay@1.0
```

- `<name>` is a slug: lowercase letters, digits, hyphens. Human-chosen. Unique
  per name, not per version.
- `<major>.<minor>` is the token-set `$version` the file carries. It is not a
  separate counter — a set's version *is* the format version, so "pin `clay@1`"
  and "pin token-set MAJOR 1" mean the same thing.
- The **MAJOR** is what a consumer pins for compatibility; the **MINOR** is the
  exact set. A consumer may pin `clay@1.0` (exact) or `clay@1` (any 1.x).

## URL shape (GitHub Pages, no build)

Pages serves the repo root, so the folder is the URL:

```
https://suchlandtsirenity.github.io/token-forge/sets/index.json        the manifest
https://suchlandtsirenity.github.io/token-forge/sets/clay/1.0.json     a set, versioned
https://suchlandtsirenity.github.io/token-forge/sets/clay/latest.json  convenience only
```

- **Versioned path first.** `sets/<name>/<version>.json` is the stable URL. Old
  links keep working because the file never changes.
- **`latest.json` is a convenience, not a pin.** It is a copy of the newest
  version and may change; nothing should build against it.
- **No server.** Static files only. A set is a file, the manifest is a file.

## The manifest

`sets/index.json` is the one index. Shape:

```json
{
  "format": "token-forge/sets@1",
  "sets": [
    {
      "name": "clay",
      "version": "1.0",
      "mode": "light",
      "description": "Warm neutral studio default",
      "url": "sets/clay/1.0.json",
      "sha256": "<hash of the canonical token set>",
      "published": "2026-11-21"
    }
  ]
}
```

- `sha256` is over a **canonical form**, not the file bytes. `$forge` is
  semantically stable but its key order follows the order the user pinned
  things, so two exports of the same system differ byte-for-byte. Hash the
  **parsed token set** (the module's `parse()` output, keys in vocabulary order)
  instead, so `clay@1` means one thing no matter who exported it. A consumer
  verifies by parsing the fetched file and hashing the same way.
- `url` is relative to the manifest's directory, so the manifest works from a
  fork or a local checkout as well as Pages.
- The manifest lists **every published version**, not only the newest. A
  consumer can enumerate what exists without guessing filenames.

## How the `tokens` module names one

The module stays pure — no network. It gets two helpers and a string format:

- `parseRef("clay@1.0")` → `{ name: "clay", version: "1.0", major: 1 }`.
- `refUrl(ref, base)` → `"<base>/clay/1.0.json"`, or the manifest URL for the
  index.
- The module's `validate()` / `parse()` run on whatever the consumer fetched;
  the module never fetches.

Why a reference string and not a URL in the module: a URL is the consumer's
environment (fork, local, CDN), the reference is the set's identity. The module
owns the identity; the consumer owns the base URL.

## Open questions for the owner

1. **Who publishes?** Hand-run a script and commit the file, or a CI job on tag?
   Hand-run is fine at nine presets; CI is worth it once sets change often.
2. **Do we keep `latest.json`?** It is convenient and easy to get wrong. I lean
   keep it, clearly labelled "not a pin".
3. **Partial sets.** A set is a full export today. Should a set be allowed to be
   a partial (only the colours, say)? The format allows partials; the artifact
   layer could too. I lean no for v1 — a set should be complete.
4. ~~**`$forge` in the published file.**~~ **Resolved 2026-11-21: yes.**
   Token Forge is a public repo and its sets are public. A set carries its
   `$forge` so round-trip import keeps working; nothing in the app state is
   secret. Consumers still must not read inside it — presence only.

## Deliberately not doing

- No server, no database, no generated index at request time.
- No per-consumer sets. One public library; a consumer maps what it needs.
- No mutable "current" set. `latest.json` is a pointer, not a promise.
