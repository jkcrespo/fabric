/**
 * Color math: WCAG contrast and OKLCH conversion. Zero dependencies.
 */

export function parseHex(hex) {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: m[2] !== undefined };
}

export const toHex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');

const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

/** WCAG 2.x relative luminance of an [r,g,b] 0–255 color. */
export function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => toLinear(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two [r,g,b] colors or #hex strings. */
export function contrast(a, b) {
  const rgb = (c) => (typeof c === 'string' ? parseHex(c).rgb : c);
  const [l1, l2] = [luminance(rgb(a)), luminance(rgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** #hex → { l, c, h } in OKLCH (l 0–1, c ≈ 0–0.4, h degrees). */
export function hexToOklch(hex) {
  const [r, g, b] = parseHex(hex).rgb.map((v) => toLinear(v / 255));
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const h = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h };
}

/** OKLCH → linear-free sRGB [r,g,b] 0–255, or null when outside the sRGB gamut. */
function oklchToRgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  const A = c * Math.cos(hr);
  const B = c * Math.sin(hr);
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  if (lin.some((v) => v < -1e-4 || v > 1 + 1e-4)) return null;
  return lin.map((v) => fromLinear(Math.min(1, Math.max(0, v))) * 255);
}

/** OKLCH → #hex, reducing chroma until the color fits in sRGB. */
export function oklchToHex({ l, c, h }) {
  let lo = 0;
  let hi = c;
  if (oklchToRgb({ l, c, h })) return toHex(oklchToRgb({ l, c, h }));
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (oklchToRgb({ l, c: mid, h })) lo = mid;
    else hi = mid;
  }
  return toHex(oklchToRgb({ l, c: lo, h }));
}
