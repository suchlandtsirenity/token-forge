import test from 'node:test';
import assert from 'node:assert/strict';
import { F, GROUPS, FOLDS, keysUnder, pinCount, foldIndex } from '../src/controls.js';
import { BASE, CK, derive } from '../src/tokens.js';

// A tree deeper than the real one, so the rules are proven at any depth.
const deep = F('a', 'A', [
  { k: 'one', t: 'range' },
  F('b', 'B', [
    { t: 'colors', ks: ['bg', 'fg'] },
    F('c', 'C', [F('d', 'D', [{ k: 'two', t: 'range' }])]),
  ]),
]);

test('keysUnder collects pin keys from every depth, including colours', () => {
  assert.deepEqual(keysUnder(deep).sort(), ['c_bg', 'c_fg', 'one', 'two']);
  assert.deepEqual(keysUnder(deep.c[1].c[1]), ['two']);
});

test('keysUnder skips controls that hold no pin', () => {
  assert.deepEqual(keysUnder(F('x', 'X', [{ t: 'contrast' }, { t: 'customfont' }])), []);
});

test('pinCount counts only what is pinned inside that fold', () => {
  const o = { two: 1, c_bg: '#000000', elsewhere: 5 };
  assert.equal(pinCount(deep, o), 2);
  assert.equal(pinCount(deep.c[1].c[1], o), 1, 'a deep fold sees its own pin');
  assert.equal(pinCount(F('e', 'E', [{ k: 'none', t: 'range' }]), o), 0);
});

test('a pin with a falsy value still counts', () => {
  assert.equal(pinCount(F('e', 'E', [{ k: 'grainy', t: 'range' }]), { grainy: 0 }), 1);
});

test('foldIndex gives every fold a path that includes its parents', () => {
  const idx = foldIndex([{ id: 'g', fine: deep.c }]);
  assert.deepEqual(Object.keys(idx).sort(), ['g', 'g.b', 'g.b.c', 'g.b.c.d']);
  assert.deepEqual(keysUnder(idx['g.b.c.d']), ['two']);
});

test('every group has a fold in the index, so unpinning a group works', () => {
  for (const g of GROUPS) assert.ok(FOLDS[g.id], g.id);
});

test('no pin key appears twice, or a pin would be counted in two places', () => {
  const all = GROUPS.flatMap((g) => keysUnder(FOLDS[g.id]));
  assert.equal(new Set(all).size, all.length);
});

test('every colour can be pinned, exactly once', () => {
  const all = GROUPS.flatMap((g) => keysUnder(FOLDS[g.id])).filter((k) => k.startsWith('c_'));
  assert.deepEqual(all.sort(), CK.map(([k]) => 'c_' + k).sort());
});

test('every fine control is a real derived value', () => {
  const E = derive(structuredClone(BASE));
  for (const g of GROUPS) for (const k of keysUnder(FOLDS[g.id])) {
    if (!k.startsWith('c_')) assert.ok(k in E, `${k} is not produced by derive`);
  }
});

test('no value that used to be pinnable was lost in the move', () => {
  const was = ['okH','warnH','badH','a2','fwD','lsD','lhH','dItal','hCase','fwB','fwS','lsB','lhB','labScale','labLs','labW','numF',
    'rCard','rBtn','rInput','rChip','bwCard','bwCtl','bStyle','shX','shY','shBlur','shSpread','shOp','shHi','shTint',
    'pad','gap','ctlPy','ctlPx','rowPy','hover','pressS','focus','led','ledglow','toggle','patSize','patOp','glass','cardA',
    'icCap','icScale','bz1','bz2','bz3','bz4','stepsN','lift','press','pulse'];
  const now = new Set(GROUPS.flatMap((g) => keysUnder(FOLDS[g.id])));
  for (const k of was) assert.ok(now.has(k), `${k} is no longer reachable`);
});

test('simple knobs stay on top: no group needs a fold to reach them', () => {
  for (const g of GROUPS) {
    assert.ok(g.simple.length > 0, g.id);
    assert.ok(g.simple.every((c) => c.t !== 'fold'), g.id);
  }
});

test('fold ids are safe to put in a data attribute', () => {
  for (const path of Object.keys(FOLDS)) assert.match(path, /^[a-z0-9.]+$/);
});
