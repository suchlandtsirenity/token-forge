# Roadmap — fleshing Token Forge out

**Status:** 2026-11-21. Each phase is shippable on its own.

## What "fleshing out" means here

Today Token Forge is a **playground**: one live system you tune, then export as
a file. The ecosystem needs it to be a **provider** — a *token set* with a
**version**, published as a module consumers **pin**. The informal bridge that
existed (`statline/web/theme-core.js` sniffing `$forge`) is proof of demand;
the module makes it a contract.

## Phases

**Phase 0 — emit format v1. ✅ done 2026-11-21.**
The JSON export now emits `$version: "1.0"` and types every leaf — 44 tests
green, and the Contract level (the `tokens` module's `validate` over all nine
presets) passes 9/9. An export a consumer can pin. Key order is *not* promised
(suite ruling): consumers read by name. See `docs/token-set.md`.

*Deferred by suite, 2026-11-21:* statline asked for a second border level and a
second muted level (it maps `line`/`line-2` from one `border`, `ink-2`/`ink-3`
from one `muted`). That is new keys → **v1.1** (MINOR). Suite ruled to hold
v1.0.0 stable and not grow the shared vocabulary from one repo's shape; "a
partial set is legal" lets statline keep its own fallbacks today. It becomes
v1.1 when a second consumer (or Token Forge's own UI) needs it.

**Phase 1 — the `tokens` module. ✅ done.**
Shipped by suite meta as `suite/modules/tokens/` (v1.0.0, 12 tests green),
adopting this repo's format text as the module's canonical definition. It
accepts v0-shaped leaves until Phase 0 lands. See its `DESIGN.md`.

**Phase 2 — statline consumes it (statline's repo, not here).**
statline's `fromTokenForge` becomes "read a **pinned** token set, map it to
statline's tokens". The mapping stays in statline (a module holds no project's
data). Its `web/themes/*.json` stop being hand-authored hex and start deriving
from Token Forge — which its own `CLAUDE.md` already asks for.

**Phase 3 — token sets as artifacts.**
Let a built system be saved and named outside the browser: a `sets/` folder,
each entry a token set plus its `$forge`, served from GitHub Pages at a stable
URL. "The visual language" becomes a library you can point at.

**Phase 4 — more exports from one set.**
Figma variables, iOS/Android, plain DTCG — all derived from the one token set
`derive()` already produces, so a new format never invents a value.

## Ownership

Phase 0 is this repo. Phase 1 landed in `suite` (which owns modules). Phase 2 is
statline's work in statline's repo, against a pinned token-set version.
