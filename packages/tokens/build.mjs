#!/usr/bin/env node
/**
 * Builds @jkcrespo/fabric-tokens from the DTCG sources in /tokens.
 *
 *   node packages/tokens/build.mjs [--out <dir>]
 *
 * Output (per brand):
 *   dist/<brand>.css          semantic tokens as CSS variables on :root (+ dark mode)
 *   dist/<brand>.scoped.css   same, scoped to [data-fabric-brand="<brand>"] (multi-brand pages)
 *   dist/<brand>.js / .d.ts   resolved values per mode + var() references
 * Shared:
 *   dist/index.js / .d.ts     brand list + types
 *   dist/manifest.json        every semantic token with intent, MUI mapping, CSS var and
 *                             resolved values per brand × mode — the file agents read
 *
 * Only semantic tokens are published. Primitives and brand tokens stay internal,
 * so consumers cannot depend on them.
 */
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODES, loadLayers, themeScope, makeResolver, semanticIds } from '../../scripts/lib/tokens.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const outArg = process.argv.indexOf('--out');
const OUT = outArg > -1 ? resolve(process.argv[outArg + 1]) : join(HERE, 'dist');
const PKG = JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8'));
const PREFIX = 'fabric';
const ROOT_FONT_SIZE = 16;

// ------------------------------------------------------------ naming helpers
export const cssVarName = (id) => `--${PREFIX}-${id.replace(/\./g, '-')}`;
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const jsPath = (id) => id.split('.').map(camel);
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

// ------------------------------------------------------------ value formatting
const GENERIC_FAMILIES = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-monospace', 'ui-sans-serif', 'ui-serif', '-apple-system']);
const fontFamily = (v) =>
  (Array.isArray(v) ? v : [v]).map((f) => (GENERIC_FAMILIES.has(f) || !/[\s\d]/.test(f) ? f : `"${f}"`)).join(', ');
const pxToRem = (v) => {
  const m = /^(-?[\d.]+)px$/.exec(v);
  return m ? `${+(m[1] / ROOT_FONT_SIZE).toFixed(4)}rem` : v;
};
const shadow = (v) =>
  (Array.isArray(v) ? v : [v]).map((s) => `${s.inset ? 'inset ' : ''}${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread} ${s.color}`).join(', ');

/** DTCG value → CSS-ready value (string or number). Typography stays an object. */
function format(type, value) {
  switch (type) {
    case 'fontFamily':
      return fontFamily(value);
    case 'shadow':
      return shadow(value);
    case 'cubicBezier':
      return `cubic-bezier(${value.join(', ')})`;
    case 'typography':
      return {
        fontFamily: fontFamily(value.fontFamily),
        fontWeight: value.fontWeight,
        fontSize: pxToRem(value.fontSize),
        lineHeight: value.lineHeight,
        letterSpacing: value.letterSpacing,
      };
    default:
      return value;
  }
}

// ------------------------------------------------------------ tree helpers
function setPath(obj, path, value) {
  let node = obj;
  path.slice(0, -1).forEach((k) => (node = node[k] ??= {}));
  node[path.at(-1)] = value;
}

/** d.ts type literal from a sample value tree. */
function typeOf(value, indent = '  ') {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  const inner = indent + '  ';
  const key = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));
  return `{\n${Object.entries(value).map(([k, v]) => `${inner}readonly ${key(k)}: ${typeOf(v, inner)};`).join('\n')}\n${indent}}`;
}

// ------------------------------------------------------------ build
const layers = loadLayers((rule, message, where) => {
  throw new Error(`[${rule}] ${message} (${where}) — run npm run validate`);
});
const brandIds = Object.keys(layers.brands);
const ids = semanticIds(layers, 'light');
const breakpoints = Object.fromEntries(
  [...layers.primitive].filter(([id]) => id.startsWith('primitive.breakpoint.')).map(([id, t]) => [id.split('.').at(-1), parseInt(t.value, 10)])
);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const manifestTokens = new Map(
  ids.map((id) => {
    const t = layers.semanticShared.get(id) ?? layers.semanticByMode.light.get(id);
    return [
      id,
      {
        id,
        type: t.type,
        description: t.description,
        mui: t.extensions?.['com.fabric']?.mui ?? null,
        cssVar: t.type === 'typography' ? `${cssVarName(id)}-*` : cssVarName(id),
        js: jsPath(id).join('.'),
        modeDependent: layers.semanticByMode.light.has(id),
        values: {},
      },
    ];
  })
);

let sampleTree;
for (const brand of brandIds) {
  const trees = {};
  const cssBlocks = {};
  for (const mode of MODES) {
    const resolve = makeResolver(themeScope(layers, brand, mode));
    const tree = {};
    const decls = [];
    for (const id of semanticIds(layers, mode)) {
      const entry = manifestTokens.get(id);
      const value = format(entry.type, resolve(id));
      setPath(tree, jsPath(id), value);
      (entry.values[brand] ??= {})[mode] = value;
      // Shared (mode-independent) tokens are only declared once, in the light block.
      if (mode === 'dark' && !entry.modeDependent) continue;
      if (entry.type === 'typography') {
        for (const [k, v] of Object.entries(value)) decls.push(`  ${cssVarName(id)}-${kebab(k)}: ${v};`);
      } else decls.push(`  ${cssVarName(id)}: ${value};`);
    }
    trees[mode] = tree;
    cssBlocks[mode] = decls.join('\n');
  }
  sampleTree ??= trees.light;

  // var() references, same shape as the value trees
  const vars = {};
  for (const id of ids) {
    const entry = manifestTokens.get(id);
    const ref =
      entry.type === 'typography'
        ? Object.fromEntries(Object.keys(trees.light.typography[camel(id.split('.')[1])]).map((k) => [k, `var(${cssVarName(id)}-${kebab(k)})`]))
        : `var(${cssVarName(id)})`;
    setPath(vars, jsPath(id), ref);
  }

  const header = `/* @jkcrespo/fabric-tokens v${PKG.version} · brand: ${brand} · generated — do not edit */\n`;
  const css = (sel, darkSel) =>
    `${header}${sel} {\n  color-scheme: light;\n${cssBlocks.light}\n}\n\n${darkSel} {\n  color-scheme: dark;\n${cssBlocks.dark}\n}\n`;
  writeFileSync(join(OUT, `${brand}.css`), css(':root,\n[data-fabric-mode="light"]', '[data-fabric-mode="dark"]'));
  writeFileSync(
    join(OUT, `${brand}.scoped.css`),
    css(`[data-fabric-brand="${brand}"],\n[data-fabric-brand="${brand}"] [data-fabric-mode="light"]`, `[data-fabric-brand="${brand}"][data-fabric-mode="dark"],\n[data-fabric-brand="${brand}"] [data-fabric-mode="dark"]`)
  );

  const meta = layers.brandMeta[brand];
  writeFileSync(
    join(OUT, `${brand}.js`),
    `${header}export const brand = ${JSON.stringify(brand)};\nexport const description = ${JSON.stringify(meta.$description ?? '')};\nexport const breakpoints = ${JSON.stringify(breakpoints)};\nexport const tokens = ${JSON.stringify(trees, null, 2)};\nexport const vars = ${JSON.stringify(vars, null, 2)};\nexport default { brand, description, breakpoints, tokens, vars };\n`
  );
  writeFileSync(
    join(OUT, `${brand}.d.ts`),
    `import type { FabricBrand } from './index.js';\ndeclare const theme: FabricBrand;\nexport declare const brand: FabricBrand['brand'];\nexport declare const description: string;\nexport declare const breakpoints: FabricBrand['breakpoints'];\nexport declare const tokens: FabricBrand['tokens'];\nexport declare const vars: FabricBrand['vars'];\nexport default theme;\n`
  );
}

// ------------------------------------------------------------ shared files
writeFileSync(
  join(OUT, 'index.js'),
  `export const brands = ${JSON.stringify(brandIds)};\nexport const modes = ${JSON.stringify(MODES)};\nexport const cssVarPrefix = ${JSON.stringify(PREFIX)};\n`
);
const varsType = (v) => (typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, varsType(x)])) : '');
writeFileSync(
  join(OUT, 'index.d.ts'),
  `/** Semantic token values for one mode. Keys are camelCase versions of the token path. */\nexport interface FabricTokens ${typeOf(sampleTree, '')}\n\n` +
    `/** Same shape as FabricTokens, but every leaf is a CSS var() reference. */\nexport interface FabricVars ${typeOf(varsType(sampleTree), '')}\n\n` +
    `export type FabricBrandId = ${brandIds.map((b) => JSON.stringify(b)).join(' | ')};\nexport type FabricMode = ${MODES.map((m) => JSON.stringify(m)).join(' | ')};\n\n` +
    `export interface FabricBrand {\n  readonly brand: FabricBrandId;\n  readonly description: string;\n  readonly breakpoints: { readonly [K in ${Object.keys(breakpoints).map((k) => JSON.stringify(k)).join(' | ')}]: number };\n  readonly tokens: { readonly [M in FabricMode]: FabricTokens };\n  readonly vars: FabricVars;\n}\n\n` +
    `export declare const brands: readonly FabricBrandId[];\nexport declare const modes: readonly FabricMode[];\nexport declare const cssVarPrefix: string;\n`
);
writeFileSync(
  join(OUT, 'manifest.json'),
  JSON.stringify(
    {
      $description: 'Machine-readable index of every public Fabric token. Generated by packages/tokens/build.mjs.',
      package: PKG.name,
      version: PKG.version,
      brands: brandIds,
      modes: MODES,
      tokens: [...manifestTokens.values()],
    },
    null,
    2
  ) + '\n'
);

console.log(`Built ${ids.length} semantic tokens × ${brandIds.length} brands × ${MODES.length} modes → ${OUT}`);
