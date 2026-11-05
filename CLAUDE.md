# Token Forge

Static, dependency-free design-token playground. See README.md for what it does.

## Commands

- `npm test` runs `node --test` over `test/`
- `npm start` serves the repo on :8000; open `/index.html`

## Layout and rules

- `src/color.js`, `src/tokens.js`, `src/export.js`, `src/fonts.js` and
  `src/controls.js` must stay free of DOM and storage access so they run under Node. Anything that touches
  `document`, `window` or `localStorage` goes in `src/app.js`.
- `derive(S)` is the single source of truth for token values. The UI and every
  export format read from its result. Don't compute colours anywhere else.
- State shape: top-level keys are the simple knobs; `S.o` holds pinned
  fine-tune values (`c_<name>` keys are pinned colours as hex). A pin must win
  over the knob it would otherwise follow.
- The JSON export's `$forge` field is the full state and is what import reads
  back. Changing state keys breaks saved exports, so keep old keys working.
- Every preset must pass the in-app readability checks (`test/tokens.test.js`
  mirrors them). If you add or change a preset, run the tests. Don't loosen
  the thresholds to make one pass.
- The design principle is clay: maximum granularity available, never required.
  Every value has a derived default, lives in a fold, pins when touched and can
  return to following its parent. Add controls as folds in `src/controls.js`.
  Folds nest to any depth, and `test/controls.test.js` checks the whole tree.
- Code style is compact (short names, one-line object literals) and inherited
  from the original prototype. Match it in the existing files rather than
  reformatting them.

## Deploy

GitHub Pages serves `main` from the repo root. There is no build: what's
committed is what's live.
