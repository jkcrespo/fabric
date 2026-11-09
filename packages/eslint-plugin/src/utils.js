import { readFileSync } from 'node:fs';

/** Token facts bundled at build time (build-data.mjs). */
export const tokens = JSON.parse(readFileSync(new URL('../dist/tokens.json', import.meta.url), 'utf8'));
export const cssVarSet = new Set(tokens.cssVars);

/** Tree of public JS paths (theme.fabric.*, tokens.light.*, vars.*) for prefix checks. */
export const jsTree = {};
for (const p of tokens.jsPaths) {
  let node = jsTree;
  for (const seg of p.split('.')) node = node[seg] ??= {};
  // typography leaves have sub-properties
  if (p.startsWith('typography.')) for (const k of ['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing']) node[k] = {};
}

const STYLE_ATTRS = new Set(['sx', 'style']);

/** Name of an object property key (identifier or string literal). */
export const keyName = (prop) =>
  prop.key?.type === 'Identifier' ? prop.key.name : prop.key?.type === 'Literal' ? String(prop.key.value) : null;

/** Static string/number value of a node, or undefined. */
export function staticValue(node) {
  if (!node) return undefined;
  if (node.type === 'Literal' && (typeof node.value === 'string' || typeof node.value === 'number')) return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  if (node.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'Literal' && typeof node.argument.value === 'number') return -node.argument.value;
  return undefined;
}

const isStyledCallee = (callee) => {
  // styled(Comp)(...), styled.div(...), styled('div')(...), css(...)
  if (callee.type === 'Identifier') return callee.name === 'css' || callee.name === 'keyframes';
  if (callee.type === 'MemberExpression') return callee.object.type === 'Identifier' && callee.object.name === 'styled';
  if (callee.type === 'CallExpression') return callee.callee.type === 'Identifier' && callee.callee.name === 'styled';
  return false;
};

/**
 * Where a property sits: 'sx' (MUI sx: numbers are theme units), 'style' (React style:
 * numbers are px), 'styled' (styled()/css() objects), or null when not a style object.
 */
export function styleContext(context, node) {
  const ancestors = context.sourceCode.getAncestors(node);
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (a.type === 'JSXAttribute') return STYLE_ATTRS.has(a.name.name) ? a.name.name : null;
    if (a.type === 'CallExpression' && isStyledCallee(a.callee)) return 'styled';
    if (a.type === 'JSXElement' || a.type === 'Program') return null;
  }
  return null;
}

/** Visit every key/value property inside a style object. */
export function onStyleProperty(context, fn) {
  return {
    Property(node) {
      if (node.value.type === 'ObjectExpression') return; // nested selector block
      const where = styleContext(context, node);
      if (!where) return;
      const name = keyName(node);
      if (name) fn(node, name, where);
    },
  };
}

/** Levenshtein distance, for "did you mean" suggestions. */
export function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** True when every character of `short` appears in `long`, in order ("bg" → "background"). */
const isAbbreviation = (short, long) => {
  let i = 0;
  for (const ch of long) if (ch === short[i]) i++;
  return i === short.length;
};

/** Closest candidate: abbreviations of the typed last segment first, then edit distance. */
export const closest = (value, list) => {
  const tail = value.split(/[.-]/).pop();
  const rank = (x) => [isAbbreviation(tail, x.slice(value.length - tail.length)) && x.startsWith(value.slice(0, value.length - tail.length)) ? 0 : 1, distance(value, x)];
  return list.reduce((best, x) => {
    const [a, b] = [rank(x), rank(best)];
    return a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? x : best;
  }, list[0]);
};

export const docs = (rule) => `https://github.com/jkcrespo/fabric/blob/main/packages/eslint-plugin/README.md#${rule}`;
