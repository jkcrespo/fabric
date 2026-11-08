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
import { MODES, refsIn, allLeavesAreRefs, loadLayers, themeScope, makeResolver } from './lib/tokens.mjs';
import { parseHex, contrast } from './lib/color.mjs';

const errors = [];
const warnings = [];
const error = (rule, message, where) => errors.push({ rule, message, where });
const warn = (rule, message, where) => warnings.push({ rule, message, where });

const layers = loadLayers(error);
const { primitive, semanticShared, semanticByMode, brands, contract, contrastPairs } = layers;

// ---------------------------------------------------------------- layer rules
for (const [id, t] of primitive) {
  if (!id.startsWith('primitive.')) error('layer', `primitive files may only define primitive.* tokens (found "${id}")`, t.file);
  if (refsIn(t.value).length) error('layer', `primitive "${id}" must be a literal value, not a reference`, t.file);
  if (!t.type) error('type', `"${id}" has no $type`, t.file);
}

const expected = new Map();
for (const [base, spec] of Object.entries(contract.required)) {
  if (spec.steps) spec.steps.forEach((s) => expected.set(`${base}.${s}`, spec.type));
  else expected.set(base, spec.type);
}
for (const [name, tokens] of Object.entries(brands)) {
  const file = `tokens/brands/${name}.json`;
  for (const [id, t] of tokens) {
    if (!id.startsWith('brand.')) error('layer', `brand files may only define brand.* tokens (found "${id}")`, t.file);
    for (const r of refsIn(t.value)) {
      if (!r.startsWith('primitive.')) error('layer', `brand "${id}" may only reference primitive tokens (found {${r}})`, t.file);
    }
  }
  for (const [id, type] of expected) {
    const t = tokens.get(id);
    if (!t) error('brand-contract', `brand "${name}" is missing "${id}"`, file);
    else if (t.type !== type) error('brand-contract', `brand "${name}" token "${id}" must be $type ${type} (found ${t.type})`, t.file);
  }
  for (const id of tokens.keys()) {
    if (!expected.has(id)) error('brand-contract', `brand "${name}" defines "${id}", which is not in the brand contract`, file);
  }
}

for (const map of [semanticShared, ...Object.values(semanticByMode)]) {
  for (const [id, t] of map) {
    if (/^(primitive|brand|component)\./.test(id)) error('layer', `semantic files may not define "${id}"`, t.file);
    if (!t.type) error('type', `"${id}" has no $type (set it on the token or a parent group)`, t.file);
    if (!allLeavesAreRefs(t.value)) error('layer', `semantic "${id}" must only reference other tokens — no raw values`, t.file);
    if (!t.description) error('intent', `semantic "${id}" needs a $description saying when to use it`, t.file);
  }
}

// color modes must match
const [a, b] = MODES.map((m) => new Set(semanticByMode[m].keys()));
for (const id of a) if (!b.has(id)) error('modes', `"${id}" exists in light but not dark`, 'tokens/semantic/color.dark.json');
for (const id of b) if (!a.has(id)) error('modes', `"${id}" exists in dark but not light`, 'tokens/semantic/color.light.json');

// ---------------------------------------------------------------- resolution
const themes = [];
for (const brand of Object.keys(brands)) {
  for (const mode of MODES) {
    const scope = themeScope(layers, brand, mode);
    const resolve = makeResolver(scope);
    for (const [id, t] of scope) {
      try {
        resolve(id);
      } catch (e) {
        error('reference', `"${id}": ${e.message}`, `${t.file} (${brand}/${mode})`);
      }
    }
    themes.push({ brand, mode, resolve });
  }
}

// ---------------------------------------------------------------- contrast
const contrastReport = [];
for (const { brand, mode, resolve } of themes) {
  const where = `${brand}/${mode}`;
  for (const { foreground, background, min } of contrastPairs) {
    let fg, bg;
    try {
      fg = parseHex(resolve(foreground));
      bg = parseHex(resolve(background));
    } catch (e) {
      error('contrast', `pair ${foreground} on ${background}: ${e.message}`, where);
      continue;
    }
    if (!fg || !bg) {
      error('contrast', `pair ${foreground} on ${background} must resolve to #rrggbb colors`, where);
      continue;
    }
    if (fg.alpha || bg.alpha) warn('contrast', `pair ${foreground} on ${background} uses alpha; ratio ignores transparency`, where);
    const r = Math.round(contrast(fg.rgb, bg.rgb) * 100) / 100;
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
