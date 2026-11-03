import test from 'node:test';
import assert from 'node:assert/strict';
import { lch2rgb, rgb2hex, hex2lch, ratio, cs } from '../src/color.js';

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);

test('hex survives a round trip through OKLCH', () => {
  for (const hex of ['#000000', '#ffffff', '#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#7f7f7f', '#00acc1']) {
    assert.equal(rgb2hex(lch2rgb(hex2lch(hex))), hex);
  }
});

test('known OKLCH values', () => {
  const white = hex2lch('#ffffff');
  near(white.l, 1, 1e-3, 'white lightness');
  assert.equal(white.c, 0, 'white has no chroma');

  assert.equal(hex2lch('#000000').l, 0);

  // sRGB red is oklch(0.628 0.258 29.2) in the CSS Color 4 reference.
  const red = hex2lch('#ff0000');
  near(red.l, 0.628, 1e-3, 'red lightness');
  near(red.c, 0.258, 1e-3, 'red chroma');
  near(red.h, 29.23, 0.05, 'red hue');
});

test('greys come out with no hue', () => {
  const grey = hex2lch('#7f7f7f');
  assert.equal(grey.c, 0);
  assert.equal(grey.h, 0);
});

test('out-of-gamut colours are clamped into sRGB', () => {
  const rgb = lch2rgb({ l: 0.7, c: 0.4, h: 140 });
  for (const v of rgb) assert.ok(v >= 0 && v <= 1, `channel ${v} outside 0..1`);
});

test('WCAG contrast ratio', () => {
  const white = hex2lch('#ffffff'), black = hex2lch('#000000');
  near(ratio(white, black), 21, 1e-6, 'white on black');
  near(ratio(black, white), 21, 1e-6, 'order does not matter');
  near(ratio(white, white), 1, 1e-9, 'same colour');
  // #777777 on white is the classic "just under AA" grey: 4.48:1.
  near(ratio(hex2lch('#777777'), white), 4.48, 0.01, 'grey on white');
});

test('cs formats as oklch() or hex', () => {
  assert.equal(cs({ l: 0.5, c: 0.1, h: 190 }), 'oklch(0.5 0.1 190)');
  assert.equal(cs({ l: 0.5, c: 0.1, h: -10 }), 'oklch(0.5 0.1 350)', 'hue is wrapped into 0..360');
  assert.equal(cs(hex2lch('#e53935'), 'hex'), '#e53935');
});
