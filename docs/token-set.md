# The token set — Token Forge's producer note

**Status:** 2026-11-21. Token Forge **produces** the export; the `tokens` module
**defines** the contract. This note is Token Forge's side of it.

## Where the contract lives

The canonical definition of the token set — vocabulary, version, checks — is the
`tokens` module:

- `../../suite/modules/tokens/DESIGN.md` (the reasoning)
- `../../suite/modules/tokens/README.md` (the interface)

Token Forge does **not** restate the format. A consumer meets Token Forge
**through the module** — the ecosystem rule is that no project is read from
inside another. This file exists so the producer's obligations are written down
here and so the repo points at the one definition.

The format text was authored here on 2026-11-21 and adopted by the module, which
is now its home (the meta layer's ruling; see the collaboration brief,
`../../suite/docs/token-forge.md`).

## What Token Forge guarantees

Token Forge's JSON export **is** a token set. From the producer side it
guarantees:

- the export carries `$forge` — the full private state, which is the import
  round-trip — and `$description: "Made in Token Forge"`; a consumer may test
  these are present but must never read inside `$forge`;
- the vocabulary and value encodings in the module's DESIGN.md, for the
  token-set MAJOR the export declares;
- `$forge` round-trips exactly (`test/export.test.js`).

## What statline confirmed it needs (answered 2026-11-21)

statline's meta answered from its own bridge code (`web/theme-core.js`), not
from memory:

- **Guaranteed keys it maps:** `color` — bg, surface, surface-2, border, fg,
  muted, accent, accent-soft, on-accent, ok, warn; plus `font.display`,
  `font.body`, and `mode`. It does not read `bad`, `accent-ink`, `accent-2`
  (guaranteeing them is harmless).
- **`components.*`:** noise for a theme layer; statline styles its own
  components. Keep it out of the guaranteed surface — advisory only.
- **`$forge`:** only tested for presence; nothing reads inside. Private is safe.
- **Two asks, both lossy today:** `line` and `line-2` both come from `border`;
  `ink-2` and `ink-3` both come from `muted`. A **second border level** and a
  **second muted level** would let statline map them distinctly. This is a
  candidate **v1.1** (MINOR: new keys) and needs a `derive()` change, so it is
  not part of Phase 0. Open question to suite: hold v1.0.0 stable and ship the
  two extra colours as v1.1, or defer.
- **statline's own tokens:** `rink-*` and `series-1/2/3` stay statline's —
  domain/chart-level, not theme tokens. Confirmed.

## Format v1 — shipped 2026-11-21

The JSON export now declares token-set **v1** (`$version: "1.0"`), so it is
pinnable. `test/export.test.js` holds the guarantees:

- [x] emit `$version` (`"<major>.<minor>"`) — the field a consumer pins
- [x] type every leaf — `$type` first, then `$value`; `color`, `fontFamily`,
      `dimension`, `shadow`, `duration`, `cubicBezier`, `string`
- [x] promise key order — top level `$version, $description, mode, color, font,
      size, radius, shadow, motion, components, $forge`; each namespace in its
      vocabulary order. One quirk: JS enumerates integer-like keys first, so
      `size` comes out `0,1,2,3,4,-1`; that order is what the test pins.

The Contract level (the `tokens` module's `validate` over all nine presets)
passes 9/9. See [roadmap.md](roadmap.md), Phase 0.
