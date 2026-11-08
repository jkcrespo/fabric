#!/usr/bin/env node
/**
 * Deterministic token validator. Humans run it, CI runs it, agents run it
 * before proposing a change. Zero dependencies on purpose.
 *
 *   node scripts/validate-tokens.mjs          human-readable report
 *   node scripts/validate-tokens.mjs --json   machine-readable report (for agents)
 *
 * Exit code 0 = valid, 1 = errors found.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TOKENS = join(ROOT, 'tokens');
const MODES = ['light', 'dark'];
const SEGMENT = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REF = /^\{([^{}]+)\}$/;
const REF_ANYWHERE = /\{([^{}]+)\}/g;

const errors = [];
const warnings = [];
const error = (rule, message, where) => errors.push({ rule, message, where });
const warn = (rule, message, where) => warnings.push({ rule, message, where });

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const listJson = (dir) =>
  readdirSync(join(TOKENS, dir))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => join(TOKENS, dir, f));

/** Flatten a DTCG tree into Map<path, {value, type, description, file}>. */
function flatten(tree, file, out = new Map(), path = [], inheritedType) {
  const type = tree.$type ?? inheritedType;
  if ('$value' in tree) {
    const id = path.join('.');
    if (out.has(id)) error('unique', `"${id}" is defined twice`, file);
    out.set(id, { value: tree.$value, type, description: tree.$description, file });
    return out;
  }
  for (const [key, child] of Object.entries(tree)) {
    if (key.startsWith('$')) continue;
    if (!SEGMENT.test(key)) error('naming', `segment "${key}" in "${[...path, key].join('.')}" must be lowercase kebab-case or a number`, file);
    if (child && typeof child === 'object') flatten(child, file, out, [...path, key], type);
  }
  return out;
}

/** All {references} found in any string leaf of a value. */
const refsIn = (value) => {
  if (typeof value === 'string') return [...value.matchAll(REF_ANYWHERE)].map((m) => m[1]);
  if (Array.isArray(value)) return value.flatMap(refsIn);
  if (value && typeof value === 'object') return Object.values(value).flatMap(refsIn);
  return [];
};

/** Every string leaf of a value must be a whole reference. */
function allLeavesAreRefs(value) {
  if (typeof value === 'string') return REF.test(value);
  if (Array.isArray(value)) return value.every(allLeavesAreRefs);
  if (value && typeof value === 'object') return Object.values(value).every(allLeavesAreRefs);
  return false; // numbers / booleans are literals
}

function load(files) {
  const map = new Map();
  for (const f of files) {
    for (const [k, v] of flatten(readJson(f), rel(f))) {
      if (map.has(k)) error('unique', `"${k}" is defined in both ${map.get(k).file} and ${v.file}`, v.file);
      map.set(k, v);
    }
  }
  return map;
}
const rel = (f) => relative(ROOT, f);

// ---------------------------------------------------------------- load layers
const primitive = load(listJson('primitive'));
const semanticFiles = listJson('semantic');
const semanticShared = load(semanticFiles.filter((f) => !/^color\.(light|dark)\.json$/.test(basename(f))));
const semanticByMode = Object.fromEntries(MODES.map((m) => [m, load([join(TOKENS, 'semantic', `color.${m}.json`)])]));
const brandFiles = listJson('brands');
const brands = Object.fromEntries(brandFiles.map((f) => [basename(f, '.json'), load([f])]));
const contract = readJson(join(TOKENS, 'brand-contract.json'));
const contrastPairs = readJson(join(TOKENS, 'contrast-pairs.json')).pairs;

// ---------------------------------------------------------------- layer rules
for (const [id, t] of primitive) {
  if (!id.startsWith('primitive.')) error('layer', `primitive files may only define primitive.* tokens (found "${id}")`, t.file);
  if (refsIn(t.value).length) error('layer', `primitive "${id}" must be a literal value, not a reference`, t.file);
}

for (const [name, tokens] of Object.entries(brands)) {
  for (const [id, t] of tokens) {
    if (!id.startsWith('brand.')) error('layer', `brand files may only define brand.* tokens (found "${id}")`, t.file);
    for (const r of refsIn(t.value)) {
      if (!r.startsWith('primitive.')) error('layer', `brand "${id}" may only reference primitive tokens (found {${r}})`, t.file);
    }
  }
  // brand contract
  const expected = new Map();
  for (const [base, spec] of Object.entries(contract.required)) {
    if (spec.steps) spec.steps.forEach((s) => expected.set(`${base}.${s}`, spec.type));
    else expected.set(base, spec.type);
  }
  for (const [id, type] of expected) {
    const t = tokens.get(id);
    if (!t) error('brand-contract', `brand "${name}" is missing "${id}"`, `tokens/brands/${name}.json`);
    else if (t.type !== type) error('brand-contract', `brand "${name}" token "${id}" must be $type ${type} (found ${t.type})`, t.file);
  }
  for (const id of tokens.keys()) {
    if (!expected.has(id)) error('brand-contract', `brand "${name}" defines "${id}", which is not in the brand contract`, `tokens/brands/${name}.json`);
  }
}

const allSemantic = [semanticShared, ...Object.values(semanticByMode)];
for (const map of allSemantic) {
  for (const [id, t] of map) {
    if (/^(primitive|brand|component)\./.test(id)) error('layer', `semantic files may not define "${id}"`, t.file);
    if (!t.type) error('type', `"${id}" has no $type (set it on the token or a parent group)`, t.file);
    if (!allLeavesAreRefs(t.value)) error('layer', `semantic "${id}" must only reference other tokens — no raw values`, t.file);
    if (!t.description) error('intent', `semantic "${id}" needs a $description saying when to use it`, t.file);
  }
}
for (const [id, t] of primitive) if (!t.type) error('type', `"${id}" has no $type`, t.file);

// color modes must match
const [a, b] = MODES.map((m) => new Set(semanticByMode[m].keys()));
for (const id of a) if (!b.has(id)) error('modes', `"${id}" exists in light but not dark`, 'tokens/semantic/color.dark.json');
for (const id of b) if (!a.has(id)) error('modes', `"${id}" exists in dark but not light`, 'tokens/semantic/color.light.json');

// ---------------------------------------------------------------- resolution
function resolver(scope) {
  const cache = new Map();
  const resolve = (value, stack) => {
    if (typeof value === 'string') {
      const m = value.match(REF);
      if (m) return resolveId(m[1], stack);
      return value;
    }
    if (Array.isArray(value)) return value.map((v) => resolve(v, stack));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, stack)]));
    return value;
  };
  const resolveId = (id, stack = []) => {
    if (cache.has(id)) return cache.get(id);
    if (stack.includes(id)) throw new Error(`circular reference: ${[...stack, id].join(' → ')}`);
    const t = scope.get(id);
    if (!t) throw new Error(`unresolved reference {${id}}`);
    const v = resolve(t.value, [...stack, id]);
    cache.set(id, v);
    return v;
  };
  return resolveId;
}

const themes = [];
for (const [brand, brandTokens] of Object.entries(brands)) {
  for (const mode of MODES) {
    const scope = new Map([...primitive, ...brandTokens, ...semanticShared, ...semanticByMode[mode]]);
    const resolve = resolver(scope);
    const where = `${brand}/${mode}`;
    for (const [id, t] of scope) {
      try {
        resolve(id);
      } catch (e) {
        error('reference', `"${id}": ${e.message}`, `${t.file} (${where})`);
      }
    }
    themes.push({ brand, mode, resolve });
  }
}

// ---------------------------------------------------------------- contrast
function hexToRgb(hex) {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: m[2] !== undefined };
}
const luminance = ([r, g, b]) => {
  const c = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (x, y) => {
  const [l1, l2] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (l1 + 0.05) / (l2 + 0.05);
};

const contrastReport = [];
for (const { brand, mode, resolve } of themes) {
  for (const { foreground, background, min } of contrastPairs) {
    const where = `${brand}/${mode}`;
    let fg, bg;
    try {
      fg = hexToRgb(resolve(foreground));
      bg = hexToRgb(resolve(background));
    } catch (e) {
      error('contrast', `pair ${foreground} on ${background}: ${e.message}`, where);
      continue;
    }
    if (!fg || !bg) {
      error('contrast', `pair ${foreground} on ${background} must resolve to #rrggbb colors`, where);
      continue;
    }
    if (fg.alpha || bg.alpha) warn('contrast', `pair ${foreground} on ${background} uses alpha; ratio ignores transparency`, where);
    const r = Math.round(ratio(fg.rgb, bg.rgb) * 100) / 100;
    contrastReport.push({ brand, mode, foreground, background, ratio: r, min, pass: r >= min });
    if (r < min) error('contrast', `${foreground} on ${background} is ${r}:1, needs ${min}:1`, where);
  }
}

// ---------------------------------------------------------------- report
const summary = {
  valid: errors.length === 0,
  counts: {
    primitive: primitive.size,
    semantic: semanticShared.size + semanticByMode.light.size,
    brands: Object.keys(brands),
    themes: themes.length,
    contrastChecks: contrastReport.length,
  },
  errors,
  warnings,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ ...summary, contrast: contrastReport }, null, 2));
} else {
  const c = summary.counts;
  console.log(`Tokens: ${c.primitive} primitive, ${c.semantic} semantic · Brands: ${c.brands.join(', ')} · Themes: ${c.themes}`);
  console.log(`Contrast: ${contrastReport.filter((r) => r.pass).length}/${c.contrastChecks} pairs pass`);
  for (const w of warnings) console.log(`  warn  [${w.rule}] ${w.message}  (${w.where})`);
  for (const e of errors) console.log(`  error [${e.rule}] ${e.message}  (${e.where})`);
  console.log(summary.valid ? '✔ tokens valid' : `✖ ${errors.length} error(s)`);
}
process.exit(summary.valid ? 0 : 1);
