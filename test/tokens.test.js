import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE, PRESETS, derive } from '../src/tokens.js';
import { ratio, lch2rgb, rgb2hex } from '../src/color.js';

// The same state the app builds when a preset button is clicked.
const preset = (name) => {
  const p = structuredClone(PRESETS[name]);
  return { ...structuredClone(BASE), ...p, o: p.o || {} };
};

test('simple knobs drive the fine-tune values until they are pinned', () => {
  const S = { ...structuredClone(BASE), radius: 12 };
  assert.equal(derive(S).rCard, 12);
  assert.equal(derive(S).rBtn, 7, 'buttons follow at 0.6 of the radius');

  S.o.rCard = 3; // pinned in fine-tune
  assert.equal(derive(S).rCard, 3);
  assert.equal(derive(S).rBtn, 7, 'unpinned values keep following');

  S.radius = 20;
  assert.equal(derive(S).rCard, 3, 'a pin survives the simple knob moving');
  assert.equal(derive(S).rBtn, 12);
});

test('a pinned colour replaces the derived one', () => {
  const S = structuredClone(BASE);
  S.o.c_accent = '#e53935';
  assert.equal(rgb2hex(lch2rgb(derive(S).C.accent)), '#e53935');
});

test('type scale follows base size and ratio', () => {
  const E = derive({ ...structuredClone(BASE), base: 16, ratio: 1.25 });
  assert.deepEqual([E.fs[-1], E.fs[0], E.fs[1], E.fs[2], E.fs[4]], [12.8, 16, 20, 25, 39.1]);
});

test('stepped easing becomes steps(), everything else a cubic-bezier', () => {
  assert.equal(derive({ ...structuredClone(BASE), ease: 'steps' }).easing, 'steps(3, end)');
  assert.equal(derive({ ...structuredClone(BASE), ease: 'spring' }).easing, 'cubic-bezier(0.34, 1.56, 0.64, 1)');
});

test('flat shadow exports as none', () => {
  const E = derive({ ...structuredClone(BASE), shadow: 'none' });
  assert.equal(E.shadow, 'none');
  assert.equal(E.shadowBtn, 'none');
});

// The pairs the app's own readability panel checks, with its thresholds.
for (const name of Object.keys(PRESETS)) {
  test(`preset ${name} passes its own readability checks`, () => {
    const C = derive(preset(name)).C;
    const checks = [
      ['text on page', C.fg, C.bg, 4.5],
      ['muted on card', C.muted, C.surface, 4.5],
      ['button label', C.onAccent, C.accent, 4.5],
      ['accent text on tint', C.accentInk, C.accentSoft, 4.5],
      ['border vs card', C.border, C.surface, 1.5],
    ];
    for (const [label, fg, bg, min] of checks) {
      const r = ratio(fg, bg);
      assert.ok(r >= min, `${label}: ${r.toFixed(2)}:1, needs ${min}:1`);
    }
  });
}
