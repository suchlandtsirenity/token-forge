import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE, PRESETS, CK, kebab, derive } from '../src/tokens.js';
import { exportTokens, fontImport } from '../src/export.js';

const S = { ...structuredClone(BASE), ...structuredClone(PRESETS.Terminal) };
const E = derive(S);
const out = (fmt, cf = 'oklch') => exportTokens(S, E, fmt, cf);

test('CSS has a custom property for every colour', () => {
  const css = out('css');
  for (const [k] of CK) assert.match(css, new RegExp(`--color-${kebab(k)}: oklch\\(`), k);
  assert.match(css, /color-scheme: dark;/);
  assert.match(css, /--motion-easing: steps\(3, end\);/);
});

test('hex mode writes hex colours', () => {
  const css = out('css', 'hex');
  assert.doesNotMatch(css, /--color-[\w-]+: oklch/);
  assert.match(css, /--color-accent: #[0-9a-f]{6};/);
});

test('Tailwind v4 output is a @theme block', () => {
  const tw = out('tw');
  assert.match(tw, /@import "tailwindcss";/);
  assert.match(tw, /@theme \{[\s\S]*--color-bg:[\s\S]*\}/);
  assert.match(tw, new RegExp(`--spacing: ${S.unit / 2}px;`));
});

test('JSON export uses design-token $type/$value and carries the full state', () => {
  const json = JSON.parse(out('json'));
  assert.equal(json.color.accent.$type, 'color');
  assert.match(json.color.accent.$value, /^oklch\(/);
  assert.equal(Object.keys(json.color).length, CK.length);
  // $forge is what the import box reads back, so it must be the whole state.
  assert.deepEqual(json.$forge, JSON.parse(JSON.stringify(S)));
});

test('JSON export declares token-set v1', () => {
  assert.equal(JSON.parse(out('json')).$version, '1.0');
});

test('every JSON leaf is { $type, $value } with $type first', () => {
  const json = JSON.parse(out('json'));
  const leaves = [];
  for (const ns of ['color', 'font', 'size', 'radius', 'shadow', 'components'])
    for (const k of Object.keys(json[ns])) leaves.push([`${ns}.${k}`, json[ns][k]]);
  for (const k of Object.keys(json.motion)) leaves.push([`motion.${k}`, json.motion[k]]);
  assert.equal(leaves.length, CK.length + 3 + 6 + 4 + 2 + 10 + 2);
  for (const [path, leaf] of leaves) assert.deepEqual(Object.keys(leaf), ['$type', '$value'], path);
});

test('JSON namespaces carry the right $type', () => {
  const json = JSON.parse(out('json'));
  assert.equal(json.color.accent.$type, 'color');
  assert.equal(json.font.display.$type, 'fontFamily');
  assert.equal(json.size['0'].$type, 'dimension');
  assert.equal(json.radius.button.$type, 'dimension');
  assert.equal(json.shadow.card.$type, 'shadow');
  assert.equal(json.motion.duration.$type, 'duration');
  assert.equal(json.motion.easing.$type, 'cubicBezier');
  assert.equal(json.components.button.$type, 'string');
});

test('JSON top-level key order is the v1 contract', () => {
  const json = JSON.parse(out('json'));
  assert.deepEqual(Object.keys(json),
    ['$version', '$description', 'mode', 'color', 'font', 'size', 'radius', 'shadow', 'motion', 'components', '$forge']);
});

test('key order inside each JSON namespace is stable', () => {
  const json = JSON.parse(out('json'));
  assert.deepEqual(Object.keys(json.color), CK.map(([k]) => kebab(k)));
  assert.deepEqual(Object.keys(json.font), ['display', 'body', 'mono']);
  // Integer-like keys ("0".."4") enumerate before "-1" in a JS object; keep that order stable.
  assert.deepEqual(Object.keys(json.size), ['0', '1', '2', '3', '4', '-1']);
  assert.deepEqual(Object.keys(json.radius), ['card', 'button', 'input', 'chip']);
  assert.deepEqual(Object.keys(json.shadow), ['card', 'button']);
  assert.deepEqual(Object.keys(json.motion), ['duration', 'easing']);
  assert.deepEqual(Object.keys(json.components),
    ['button', 'hover', 'press', 'card', 'input', 'chip', 'focus', 'lights', 'lightGlow', 'toggle']);
});

test('a JSON export re-imports to the same tokens', () => {
  const back = JSON.parse(out('json')).$forge;
  const again = exportTokens(back, derive(back), 'css', 'oklch');
  assert.equal(again, out('css'));
});

test('the Claude Code brief names the fonts and accent', () => {
  const md = out('md');
  assert.match(md, /^# Design system/);
  assert.match(md, new RegExp(`Display: ${S.fd}`));
  assert.match(md, /Accent: oklch\(/);
});

test('font import asks for each family once, with the axes it loaded with', () => {
  const url = fontImport({ fd: 'VT323', fb: 'JetBrains Mono', fm: 'JetBrains Mono' }, { 'JetBrains Mono': ':wght@100..900' });
  assert.equal(url, 'https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@100..900&display=swap');
});
