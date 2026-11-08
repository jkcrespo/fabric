#!/usr/bin/env node
/**
 * Create a brand from two seed colors.
 *
 *   npm run create-brand -- <brand-id> --primary "#0f62fe" --secondary "#8a3ffc" \
 *     [--heading sans|serif|mono] [--body sans|serif|mono] \
 *     [--radius-button 000|050|150|200|300|full] [--radius-input …] \
 *     [--radius-card-sm …] [--radius-card-md …] [--radius-card-lg …] \
 *     [--description "Text"] [--force]
 *
 * Writes tokens/brands/<brand-id>.json with full ramps that already pass the
 * contrast rules, then you run `npm run validate`. Seeds are stored in
 * $extensions so the brand can be regenerated later.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TOKENS, SEGMENT } from './lib/tokens.mjs';
import { generateRamp } from './lib/ramp.mjs';

const FONTS = ['sans', 'serif', 'mono'];
const RADII = ['000', '050', '150', '200', '300', 'full'];
/** Defaults follow the Fabric radius logic: pill buttons, 8px inputs, 6/8/12px cards. */
const RADIUS_DEFAULTS = { button: 'full', input: '200', 'card-sm': '150', 'card-md': '200', 'card-lg': '300' };

export function buildBrand({ id, primary, secondary, heading = 'sans', body = 'sans', radius = {}, description }) {
  if (!SEGMENT.test(id)) throw new Error(`brand id "${id}" must be lowercase kebab-case`);
  for (const [name, hex] of [['primary', primary], ['secondary', secondary]]) {
    if (!/^#[0-9a-f]{6}$/i.test(hex ?? '')) throw new Error(`--${name} must be a #rrggbb color`);
  }
  for (const [name, v] of [['heading', heading], ['body', body]]) if (!FONTS.includes(v)) throw new Error(`--${name} must be one of ${FONTS.join(', ')}`);
  const radii = { ...RADIUS_DEFAULTS, ...Object.fromEntries(Object.entries(radius).filter(([, v]) => v !== undefined)) };
  for (const [name, v] of Object.entries(radii)) if (!RADII.includes(v)) throw new Error(`--radius-${name} must be one of ${RADII.join(', ')}`);

  const ramp = (hex) => Object.fromEntries(Object.entries(generateRamp(hex)).map(([step, value]) => [step, { $value: value }]));
  return {
    $description: description ?? `${id} brand.`,
    $extensions: { 'com.fabric': { generator: 'scripts/create-brand.mjs', seed: { primary: primary.toLowerCase(), secondary: secondary.toLowerCase() } } },
    brand: {
      color: {
        $type: 'color',
        primary: { $description: `Generated from ${primary.toLowerCase()}`, ...ramp(primary) },
        secondary: { $description: `Generated from ${secondary.toLowerCase()}`, ...ramp(secondary) },
      },
      'font-family': {
        $type: 'fontFamily',
        heading: { $value: `{primitive.font-family.${heading}}` },
        body: { $value: `{primitive.font-family.${body}}` },
      },
      radius: {
        $type: 'dimension',
        ...Object.fromEntries(Object.entries(radii).map(([k, v]) => [k, { $value: `{primitive.radius.${v}}` }])),
      },
    },
  };
}

/** Same compact layout as the hand-written brand files: one token per line. */
function stringify(brand) {
  const one = (v) => JSON.stringify(v).replace(/":/g, '": ').replace(/,"/g, ', "').replace(/^\{/, '{ ').replace(/\}$/, ' }');
  const fmt = (v, ind) => {
    if ('$value' in v) return one(v);
    const inner = ind + '  ';
    return `{\n${Object.entries(v).map(([k, c]) => `${inner}${JSON.stringify(k)}: ${typeof c === 'object' ? fmt(c, inner) : JSON.stringify(c)}`).join(',\n')}\n${ind}}`;
  };
  return `{\n  "$description": ${JSON.stringify(brand.$description)},\n  "$extensions": ${JSON.stringify(brand.$extensions)},\n  "brand": ${fmt(brand.brand, '  ')}\n}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const id = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  const opt = (name) => {
    const i = args.indexOf(`--${name}`);
    return i > -1 ? args[i + 1] : undefined;
  };
  try {
    if (!id) throw new Error('usage: npm run create-brand -- <brand-id> --primary "#rrggbb" --secondary "#rrggbb"');
    const file = join(TOKENS, 'brands', `${id}.json`);
    if (existsSync(file) && !args.includes('--force')) throw new Error(`${file} exists — pass --force to overwrite`);
    const brand = buildBrand({
      id,
      primary: opt('primary'),
      secondary: opt('secondary'),
      heading: opt('heading'),
      body: opt('body'),
      radius: Object.fromEntries(Object.keys(RADIUS_DEFAULTS).map((k) => [k, opt(`radius-${k}`)])),
      description: opt('description'),
    });
    writeFileSync(file, stringify(brand));
    console.log(`Wrote tokens/brands/${id}.json — now run: npm run validate && npm run build`);
  } catch (e) {
    console.error(`✖ ${e.message}`);
    process.exit(1);
  }
}
