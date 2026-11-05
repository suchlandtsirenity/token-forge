# Build log

How Token Forge got from a chat prototype to this repo.

## 1. Prototype (Claude chat, artifact)

The first version was built in a conversation with Claude as a single-file
HTML artifact: about 670 lines of markup, CSS and script with no build step.
The design goals set there, which the code still follows:

- **Two levels of control.** Broad knobs for each group, plus a fine-tune
  drawer of exact values. Fine-tune values are stored separately in `S.o` as
  *pins*, so moving a broad knob never wipes out something you set by hand.
- **OKLCH everywhere.** Neutrals, accent and status colours are generated
  from lightness, chroma and hue rather than picked as hex, so presets stay
  coherent when one knob moves.
- **A preview that looks like a real app**, not a swatch grid: a dashboard
  with lists, controls, a chart, form fields and status chips. Token problems
  show up the way they would in production.
- **Exports that round-trip.** The JSON export embeds the full state as
  `$forge`, and the import box reads it back.

That chat isn't included here. It was a claude.ai conversation, not a Claude
Code session, so there's no transcript file to publish.

## 2. Into a repo (Claude Code)

The artifact was split by responsibility, with no behaviour change:

| Module | From the artifact |
|---|---|
| `src/color.js` | The colour maths |
| `src/tokens.js` | Defaults, presets, and `derive()`. It previously read a global `S` and now takes the state as an argument |
| `src/export.js` | `renderExport()`, rewritten to return the string instead of writing to the DOM |
| `src/fonts.js` | The font catalogue |
| `src/app.js` | Everything else (DOM, events, `localStorage`) |

The point of the split was testability: once `derive()` was a pure function of
state, the colour and token logic could run under `node --test` with no browser.

The module version was then checked by hand in a browser against the prototype:
every preset, shuffle, pinning and unpinning, all four export formats, the
hex/OKLCH toggle, and JSON import.

## 3. Tests, and the bugs they found

The test plan mirrored what the app already promises: the readability panel
shows five contrast checks with pass/fail thresholds, so the tests apply
the same checks to every built-in preset.

Six of the nine presets failed their own checks.

**Button labels (5 presets).** The label colour on accent buttons was chosen as:

```js
A.l > 0.68 ? darkLabel : whiteLabel
```

That uses OKLCH lightness as a stand-in for contrast. WCAG contrast is
based on relative luminance, and at the same OKLCH lightness a saturated cyan
or orange is much brighter than a blue. So mid-lightness accents got a white
label that didn't read:

| Preset | Before | After |
|---|---|---|
| Graphite | 4.37 | 4.55 |
| Hardware panel | 3.53 | 5.22 |
| Cozy desk | 4.06 | 4.54 |
| Glassy | 3.18 | 5.63 |
| Zine | 4.19 | 4.55 |

The fix: build both candidate labels and keep whichever has the higher
contrast with the accent, measured with the same `ratio()` the panel uses.
That fixed Hardware panel, Cozy desk and Glassy outright. For Graphite and
Zine, *neither* label reached 4.5 on their accent, so their accent lightness
was nudged down (0.55 → 0.54 and 0.60 → 0.58). Those were the smallest changes
that pass, and the accents look the same.

**Borders (4 presets).** Borders are offset from the page lightness by a
fixed step. In dark mode the step (0.13) was too small to reach the panel's
1.5:1 border check for Terminal (1.19), Mission control (1.25) and Flames
(1.21). Cozy desk's light-mode border was 1.49. The steps are now 0.22
(dark) and 0.12 (light), the smallest values that pass for every preset.

One test was wrong rather than the code: the first draft guessed the OKLCH
value of `#e53935` for the pinned-colour test. It now checks that the
pinned hex comes back out unchanged, which is the actual promise.

## 4. Publishing

- `CLAUDE.md` records the rules the code relies on, so later sessions keep
  them: `derive()` is the only place colours are computed, the core modules
  stay DOM-free, and presets must pass the readability tests rather than
  having the thresholds loosened.
- CI runs the tests on Node 22 and 24.
- GitHub Pages serves `main` directly, since there is nothing to build.

## Recursive folds

The rail had two levels: simple knobs and one Fine-tune drawer. The design is
meant to work like clay, rough shapes first and detail only where you want it,
so depth needs to be available without being imposed.

The control schema moved out of `app.js` into `src/controls.js`, because a schema
inside the DOM code couldn't be tested. It's now a tree with one repeating unit,
the fold, so pin counts and Unpin work the same at every level. Pin keys didn't
change, so saved systems and old exports load as they did, with their pins
showing up in the new folds.

Checked in a real browser: pinning three levels down raises the count on every
fold above it, unpinning an inner fold leaves its siblings alone, and pins
survive a reload. `offsetParent` reports rows in closed `<details>` as visible,
so a check built on it gave a false alarm. `checkVisibility()` gave the real
answer: no fine rows showing at the start.
