/**
 * Shared token loading + reference resolution.
 * Used by the validator, the build and the brand generator so all three read
 * tokens the same way. Zero dependencies.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const TOKENS = join(ROOT, 'tokens');
export const MODES = ['light', 'dark'];
export const SEGMENT = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const REF = /^\{([^{}]+)\}$/;
const REF_ANYWHERE = /\{([^{}]+)\}/g;

export const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
export const rel = (f) => relative(ROOT, f);
const listJson = (dir) =>
  readdirSync(join(TOKENS, dir))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => join(TOKENS, dir, f));

/**
 * Flatten a DTCG tree into Map<path, {value, type, description, extensions, file}>.
 * `issue(rule, message, where)` is called for naming/duplicate problems.
 */
export function flatten(tree, file, issue = () => {}, out = new Map(), path = [], inheritedType) {
  const type = tree.$type ?? inheritedType;
  if ('$value' in tree) {
    const id = path.join('.');
    if (out.has(id)) issue('unique', `"${id}" is defined twice`, file);
    out.set(id, { value: tree.$value, type, description: tree.$description, extensions: tree.$extensions, file });
    return out;
  }
  for (const [key, child] of Object.entries(tree)) {
    if (key.startsWith('$')) continue;
    if (!SEGMENT.test(key)) issue('naming', `segment "${key}" in "${[...path, key].join('.')}" must be lowercase kebab-case or a number`, file);
    if (child && typeof child === 'object') flatten(child, file, issue, out, [...path, key], type);
  }
  return out;
}

/** All {references} found in any string leaf of a value. */
export const refsIn = (value) => {
  if (typeof value === 'string') return [...value.matchAll(REF_ANYWHERE)].map((m) => m[1]);
  if (Array.isArray(value)) return value.flatMap(refsIn);
  if (value && typeof value === 'object') return Object.values(value).flatMap(refsIn);
  return [];
};

/** True when every string leaf of a value is a whole reference (no literals). */
export function allLeavesAreRefs(value) {
  if (typeof value === 'string') return REF.test(value);
  if (Array.isArray(value)) return value.every(allLeavesAreRefs);
  if (value && typeof value === 'object') return Object.values(value).every(allLeavesAreRefs);
  return false;
}

function loadFiles(files, issue) {
  const map = new Map();
  for (const f of files) {
    for (const [k, v] of flatten(readJson(f), rel(f), issue)) {
      if (map.has(k)) issue('unique', `"${k}" is defined in both ${map.get(k).file} and ${v.file}`, v.file);
      map.set(k, v);
    }
  }
  return map;
}

/** Load every layer from tokens/. */
export function loadLayers(issue = () => {}) {
  const semanticFiles = listJson('semantic');
  const isModeFile = (f) => /^color\.(light|dark)\.json$/.test(basename(f));
  return {
    primitive: loadFiles(listJson('primitive'), issue),
    semanticShared: loadFiles(semanticFiles.filter((f) => !isModeFile(f)), issue),
    semanticByMode: Object.fromEntries(MODES.map((m) => [m, loadFiles([join(TOKENS, 'semantic', `color.${m}.json`)], issue)])),
    brands: Object.fromEntries(listJson('brands').map((f) => [basename(f, '.json'), loadFiles([f], issue)])),
    brandMeta: Object.fromEntries(listJson('brands').map((f) => [basename(f, '.json'), readJson(f)])),
    contract: readJson(join(TOKENS, 'brand-contract.json')),
    contrastPairs: readJson(join(TOKENS, 'contrast-pairs.json')).pairs,
  };
}

/** All tokens visible in one theme (brand × mode). */
export const themeScope = (layers, brand, mode) =>
  new Map([...layers.primitive, ...layers.brands[brand], ...layers.semanticShared, ...layers.semanticByMode[mode]]);

/** Ids of the semantic tokens in a theme (what consumers may use). */
export const semanticIds = (layers, mode) => [...layers.semanticShared.keys(), ...layers.semanticByMode[mode].keys()];

/** Returns resolve(id) → fully resolved value. Throws on missing or circular refs. */
export function makeResolver(scope) {
  const cache = new Map();
  const resolveValue = (value, stack) => {
    if (typeof value === 'string') {
      const m = value.match(REF);
      return m ? resolveId(m[1], stack) : value;
    }
    if (Array.isArray(value)) return value.map((v) => resolveValue(v, stack));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveValue(v, stack)]));
    return value;
  };
  const resolveId = (id, stack = []) => {
    if (cache.has(id)) return cache.get(id);
    if (stack.includes(id)) throw new Error(`circular reference: ${[...stack, id].join(' → ')}`);
    const t = scope.get(id);
    if (!t) throw new Error(`unresolved reference {${id}}`);
    const v = resolveValue(t.value, [...stack, id]);
    cache.set(id, v);
    return v;
  };
  return resolveId;
}
