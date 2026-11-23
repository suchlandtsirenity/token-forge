# How Token Forge is worked on

The structure a meta layer runs on: **domains** (where work lives) and **levels**
(what must be true before it ships). Modelled on statline's operating model; the
shape is the same, the contents are Token Forge's own.

The meta agent owns this structure. It does not build inside a domain — it
assigns the domain, sets the level, and takes the handover. A lane marked
**proposed** isn't in use until the owner says yes.

## Domains

Six seams, drawn where the code already splits. Each domain owns a set of files
and hands over one thing. **Engine, Quality and Upkeep are fundamental** — every
meta layer declares them. **Contract, Interface and Exports are declared as the
space needs them**; Token Forge needs all three, so all six are in use here.

| Domain | Kind | Owns | Hands over | Never |
|---|---|---|---|---|
| **Engine** | fundamental | `src/color.js`, `src/tokens.js`, `derive()`, presets | A derivation that still passes every preset's contrast checks | Computes a colour outside `derive()` |
| **Quality** | fundamental | `test/`, `.github/workflows/ci.yml` | Green tests and a passing contract check | Loosens a threshold to make a preset pass |
| **Upkeep** | fundamental | GitHub Pages, `docs/build-log.md`, the changelog | A short report on what shipped and what drifted | Rewrites history |
| **Contract** | as needed | `docs/token-set.md`, `docs/roadmap.md`, the version handshake with `suite/modules/tokens` | The format guarantees and the pinned version | Changes a token-set key without a MINOR/MAJOR bump |
| **Interface** | as needed | `src/controls.js`, `src/app.js`, `index.html` | A control tree that nests and pins as the clay principle asks | Touches DOM/storage outside `app.js` |
| **Exports** | as needed | `src/export.js` | CSS, Tailwind, JSON and Markdown from one `derive()` result | Invents a value an export format needs |

The contract is the only domain that crosses the repo boundary. Everything else
stays inside Token Forge; the module is met through the contract domain, never
read from inside.

## Levels

Three checks, each with a trigger. **Fast and Full are fundamental** — every meta
layer declares them. **Contract is declared as the space needs it**, because
Token Forge produces something another repo consumes. The names match statline's
so the ecosystem reads the same, but the contents are what this repo can run.

| Level | Kind | What runs | When | Where |
|---|---|---|---|---|
| **Fast** | fundamental | `npm test` — colour maths, derivation, presets, exports, control tree (44 tests, no DOM) | every commit | the worktree, and GitHub Actions |
| **Full** | fundamental | Fast + a browser pass: page loads, a preset renders, each export format produces output | before merging into `main` | the worktree, via browser QA |
| **Contract** | as needed | The `tokens` module's `validate` over every preset's JSON export | before a release tag, and whenever the token set changes | the worktree, importing `derive()` + `export.js` |

The Contract level is this repo's equivalent of statline's data level: it proves
the thing consumers pin actually holds. Suite meta already ran it by hand over
all nine presets; the level makes it repeatable.

## The meta layer's job

- **Assign, don't build.** A domain gets a lane and a worktree; the meta agent
  writes the structure and takes the handover.
- **Set the level.** A change names the level it must clear before merge. Additive
  work clears Full and merges; anything that changes a token-set key or a
  guaranteed value clears Contract and comes back to the owner first.
- **Gate before anything hard to undo.** Run `loop gate --spec green.toml
  --action <push|merge|apply>` before a push, merge or apply. Exit 0 proceeds;
  exit 2 is **lane 3 — the owner decides**. Since loop 0.2.0 a small push drops to
  lane 1 only when the gate *positively asserts* all five conditions — green, in
  scope, no interface touch, no major version rise, fast-forward. Anything unknown
  keeps it lane 3. **The verdict is about the branch, not the newest commit:** a
  push sends every unpushed commit, so their union is the blast radius.
- **Hold the version.** The Contract domain owns the token-set version; no lane
  bumps it without the meta layer.
- **Batch decisions.** The owner hears decisions in batches, not per commit.

## The green spec

`green.toml` at the repo root is the lane's green condition, run from the lane.
`loop` is the shared module; point `PYTHONPATH` at the suite checkout the registry
(`ecosystem.toml`, `projects.suite`) names — no machine-specific path (C-0003):

```sh
PYTHONPATH="$SUITE/modules/loop" python3 -m loop check --spec green.toml \
    --root . --base main
```

- **`loop = "0.1.0"`** is a pin: a spec naming another version exits 2 before
  anything runs.
- **`checks`** are the levels above, cheapest first — `check` stops at the first
  failure. Fast is `npm test`; Full is `scripts/full-check.mjs` (every preset
  renders in every export format); Contract is `scripts/contract-check.mjs` (the
  `tokens` module validates every preset's export).
- **`interface`** is what consumers get — the export format and vocabulary, the
  font stacks, the published sets. A diff touching one keeps a push at lane 3
  however small, because it changes the token set another repo reads.
- **`scope`** is this repo's own paths. A diff that touches another repo is lane 3
  by construction.
- Standing lessons live in [constraints.md](constraints.md), each with a stable id
  a return packet cites.

## The shared contract

Domains and levels are now a meta-layer contract, not a per-repo invention:
`suite/docs/meta-layers.md`. It is **not a blanket "declare all six"**:

- **Fundamental** — Engine, Quality, Upkeep; and Fast, Full. Every meta layer
  declares these.
- **As the space needs them** — Contract (produces something another repo
  consumes), Interface (has a surface), Exports (emits files); and a third level
  named by what it proves (Contract, or statline's Data). A space may add a
  domain the six don't name when its own seams demand it.

The six names are a **shared toolkit for cross-repo reading**, not a closed
list. Token Forge needs all six domains and all three levels, so its model is
unchanged in practice; the contract just doesn't force them on anyone else.

## Where the Contract level runs

**Locally, before a tag.** The check needs the `suite` repo's `tokens` module
checked out beside this one; GitHub Actions only sees this repo, so it cannot
run there unless `suite` is public or a token is wired up. Run it in the worktree
before tagging a release. Move it into CI only if `suite` becomes reachable from
Actions.
