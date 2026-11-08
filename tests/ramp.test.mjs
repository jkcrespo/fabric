import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateRamp, STEPS } from '../scripts/lib/ramp.mjs';
import { contrast, luminance, parseHex } from '../scripts/lib/color.mjs';

// Saturated, pastel, dark, near-grey and the classic hard cases (yellow, cyan, lime).
const SEEDS = ['#ffcc00', '#ffff00', '#00ffff', '#84cc16', '#ff0000', '#0000ff', '#ff69b4', '#808080', '#111111', '#f5f5dc', '#6d28d9', '#0f62fe', '#00a86b', '#ff7a00', '#c71585'];

for (const seed of SEEDS) {
  test(`ramp from ${seed} meets the brand contract`, () => {
    const r = generateRamp(seed);
    assert.deepEqual(Object.keys(r), STEPS);
    assert.ok(contrast(r['600'], '#ffffff') >= 4.5, '600 vs white');
    assert.ok(contrast(r['700'], '#ffffff') >= 4.5, '700 vs white');
    assert.ok(contrast(r['300'], '#0f172a') >= 4.5, '300 vs neutral-900');
    assert.ok(contrast(r['200'], '#0f172a') >= 4.5, '200 vs neutral-900');
    assert.ok(contrast(r['700'], r['50']) >= 4.5, '700 on 50');
    assert.ok(contrast(r['300'], r['900']) >= 4.5, '300 on 900');
    const lum = STEPS.map((s) => luminance(parseHex(r[s]).rgb));
    for (let i = 1; i < lum.length; i++) assert.ok(lum[i] < lum[i - 1], `step ${STEPS[i]} darker than ${STEPS[i - 1]}`);
  });
}
