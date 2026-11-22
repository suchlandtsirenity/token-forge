# More exports from one set — Phase 4 design

**Status:** design, 2026-11-21. No code yet. Every format here reads the same
`derive()` result; none may invent a value. A format that cannot carry a token
says so and omits it — it does not approximate it.

## The base: token-set JSON (DTCG-compatible)

The JSON export is already DTCG-shaped, but it carries two things DTCG does not
define (`$description`, `$forge`) and two value shapes DTCG does not use
(`"16px"` strings, `oklch()` strings). **The base export is "token-set JSON
(DTCG-compatible)"** — the format is ours (token-set v1), DTCG is the
compatibility target. It is the interchange file:

- drop `$description` and `$forge`;
- keep `$version`, `mode`, and every namespace;
- convert values to DTCG-native shapes (below).

Everything else in this document is a projection of that file. Build the base
first; the platform formats are constraints on top of it.

### Value conversion (one place, not per format)

| Token | Token Forge value | DTCG value |
|---|---|---|
| `color.*` | `oklch(…)` string | sRGB hex `"#rrggbb"` (or `{colorSpace,components,alpha}`); OKLCH → sRGB in `color.js` |
| `size.*`, `radius.*` | `"16px"` | `{ "value": 16, "unit": "px" }` |
| `font.*` | full CSS stack | `"Inter"` — a single family name, first in the stack, quotes stripped |
| `motion.duration` | `"180ms"` | `{ "value": 0.18, "unit": "s" }` |
| `motion.easing` | `cubic-bezier(…)` | `cubicBezier` array of four numbers |
| `shadow.*` | CSS shadow string | `shadow` object (offsetX/Y, blur, spread, colour) |
| `components.*` | style string | `string` |

This conversion lives in one function so CSS/Tailwind/Markdown keep the CSS
strings and the DTCG family gets the native shapes. Two value encodings, one
`derive()`.

## Figma variables

Figma imports DTCG JSON directly — no custom Figma format is needed. Its import
rules are the constraint ([Figma: Modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383),
[DTCG 2025.10](https://www.designtokens.org/TR/2025.10/format/)):

| DTCG type | Figma variable | Constraint |
|---|---|---|
| `color` | Color | sRGB or HSL only |
| `dimension` | Number | unit must be `px` |
| `fontFamily` | String | **one font name**, not an array |
| `duration` | Number | unit must be `s` |
| `number` | Number or boolean | boolean via `$extensions: { "com.figma.type": "boolean" }` |
| `string` | String | accepted, though not an official DTCG type |

What Figma **cannot** import as a variable: `shadow`, `cubicBezier`, and any
composite type. So the Figma projection **omits** `shadow.*` and
`motion.easing`; it keeps `motion.duration`. Nested names normalise to slashes
(`color.accent` → `color/accent`), and duplicate names keep the first.

**Verdict:** "Figma export" is the base token-set JSON + these five constraints.
It is a filter, not a converter. The honest limit: a Figma user gets colours,
sizes, radii, fonts, durations and string enums — not shadows or easing curves.

## iOS

Two destinations, chosen by what the token is:

| Token | Destination | Shape |
|---|---|---|
| `color.*` | Asset catalog `.colorset/Contents.json` | sRGB components, `universal` idiom, optional `dark` appearance |
| `size.*`, `radius.*` | Swift source constants | `CGFloat` in a `Tokens.Dimension` enum |
| `font.*` | Swift source | `Font.custom("Inter", size:)` names; family name only |
| `motion.duration` | Swift source | `TimeInterval` seconds |
| `shadow.*` | Swift source | `Color` + radius/offset struct |
| `motion.easing` | Swift source | `Animation.timingCurve` four control points |

Asset-catalog colours are the native dark-mode mechanism; a Swift `Color(hex:)`
extension is simpler but loses the appearance switch. Recommend the catalog for
colours, Swift for the rest.

**One set is one mode; the exporter takes one or two.** A token set carries
`mode: "light"` or `"dark"`, not both. The iOS exporter accepts either:

- **one set** → both light and dark appearances use it (a single-mode app);
- **a pair** (`clay-light@1.0` + `clay-dark@1.0`) → light and dark split by
  token name into one artifact.

A pair is the unit a mobile app actually needs, so it is the recommended input;
one set stays legal so a single-mode app isn't forced to publish a second one.
Either way the exporter does the merge — the consumer never glues two files.

## Android

Same split, Android's names:

| Token | Destination |
|---|---|
| `color.*` | `res/values/colors.xml` (and `values-night/` for the dark set) |
| `size.*`, `radius.*` | `res/values/dimens.xml` (`dp`) |
| `font.*` | `res/font/` family names, or Compose `FontFamily` |
| `motion.duration` | `res/values/integers.xml` or Compose constant |
| `shadow.*` | Compose `elevation`/`shadow` — partial, document the loss |

Compose is the better target (`Color.kt`, `Dimens.kt`, `Type.kt`); XML is the
legacy path. Same input rule as iOS: one set or a pair, the exporter merges.

## Order of work

1. **The base (token-set JSON, DTCG-compatible)** — also the Figma file.
2. **Figma** — a constrained projection of #1; cheapest real consumer.
3. **iOS** — asset catalog + Swift; needs the light/dark pair decision.
4. **Android** — Compose first, XML second.

## Open questions for the owner

1. ~~**Light/dark pairs.**~~ **Decided 2026-11-21: either.** The mobile
   exporter takes one set or a pair. One set means both appearances use it; a
   pair means light and dark split by token name. The exporter merges; the
   consumer never glues two files.
2. ~~**Figma's gaps.**~~ **Decided 2026-11-21: omit and document.** The Figma
   projection drops `shadow.*` and `motion.easing` rather than carrying them as
   strings — a string shadow is not a shadow, and a silent approximation is
   worse than a stated omission. The export's own README names what it omits.
3. ~~**Plain DTCG name.**~~ **Decided 2026-11-21: "token-set JSON
   (DTCG-compatible)".** The format is ours (token-set v1); DTCG is a
   compatibility target, not our identity. Calling it "DTCG" would make every
   difference (`$forge`, `$version`, our key names) read as a defect;
   "compatible" claims exactly what is true — the leaves read as DTCG.

## Deliberately not doing

- No per-format hand-tuning of values. One conversion, every format.
- No format that invents a token to fill a gap. A missing type is an omission,
  stated in the export's own README.
- No Flutter/Web/React-Native in this pass. They are the same projection pattern
  and can wait for demand.
