/**
 * Seed color → 10-step ramp (50…900) that satisfies the brand contract:
 *   600 vs white ≥ 4.5   (light-mode fill)
 *   300 vs neutral-900 ≥ 4.5 (dark-mode fill)
 *   700 on 50 ≥ 4.5, 300 on 900 ≥ 4.5 (role text on subtle backgrounds)
 * Built in OKLCH so steps are perceptually even; hue is kept from the seed.
 */
import { hexToOklch, oklchToHex, contrast } from './color.mjs';

export const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
const LIGHTNESS = [0.975, 0.94, 0.885, 0.81, 0.72, 0.63, 0.54, 0.46, 0.39, 0.3];
const CHROMA = [0.12, 0.25, 0.45, 0.7, 0.9, 1, 1, 0.92, 0.8, 0.62];

const WHITE = '#ffffff';
const NEUTRAL_900 = '#0f172a';
const TARGET = 4.6; // a small margin above AA 4.5 so rounding never fails the validator

/** Rules the ramp must pass. Each returns true when satisfied. */
const RULES = [
  { step: 6, dir: -1, ok: (r) => contrast(r[6], WHITE) >= TARGET },
  { step: 7, dir: -1, ok: (r) => contrast(r[7], WHITE) >= TARGET && contrast(r[7], r[0]) >= TARGET },
  { step: 3, dir: +1, ok: (r) => contrast(r[3], NEUTRAL_900) >= TARGET },
  { step: 2, dir: +1, ok: (r) => contrast(r[2], NEUTRAL_900) >= TARGET },
  { step: 9, dir: -1, ok: (r) => contrast(r[3], r[9]) >= TARGET },
];

export function generateRamp(seedHex) {
  const seed = hexToOklch(seedHex);
  const chroma = Math.max(seed.c, 0.01);
  const L = [...LIGHTNESS];
  const render = () => L.map((l, i) => oklchToHex({ l, c: chroma * CHROMA[i], h: seed.h }));

  let ramp = render();
  for (let guard = 0; guard < 400; guard++) {
    const broken = RULES.find((rule) => !rule.ok(ramp));
    if (!broken) break;
    L[broken.step] = Math.min(0.99, Math.max(0.05, L[broken.step] + broken.dir * 0.005));
    // keep the ramp monotonic: every step darker than the one before
    for (let i = 1; i < L.length; i++) if (L[i] > L[i - 1] - 0.02) L[i] = L[i - 1] - 0.02;
    for (let i = L.length - 2; i >= 0; i--) if (L[i] < L[i + 1] + 0.02) L[i] = L[i + 1] + 0.02;
    ramp = render();
  }
  const failing = RULES.filter((rule) => !rule.ok(ramp));
  if (failing.length) throw new Error(`could not build a contrast-safe ramp from ${seedHex}`);
  return Object.fromEntries(STEPS.map((s, i) => [s, ramp[i]]));
}
