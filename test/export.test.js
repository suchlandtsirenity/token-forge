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
