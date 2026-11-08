#!/usr/bin/env node
/**
 * Checks that every component's metadata (`*.meta.json`) is valid AND still matches the
 * code — so agents never read a contract that has drifted from the component.
 *
 *   node scripts/validate-components.mjs          human-readable report
 *   node scripts/validate-components.mjs --json   machine-readable report
 *
 * Checks per component:
 *   schema     meta file matches schemas/component.schema.json
 *   files      <Name>/<Name>.tsx and <Name>/<name>.meta.json exist; name matches folder
 *   props      meta props == the props declared in <Name>Props (names, required, literal values)
 *   tokens     every token listed exists as a semantic token
 *   related    related components exist
 *   examples   examples only use known components
 *   mui        muiBase module resolves
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { createRequire } from 'node:module';
import Ajv2020 from 'ajv/dist/2020.js';
import ts from 'typescript';
import { ROOT, loadLayers, semanticIds } from './lib/tokens.mjs';

const SRC = join(ROOT, 'packages/react/src');
const ALLOWED_EXAMPLE_TAGS = new Set(['Typography', 'Stack', 'Box']); // MUI layout primitives
const errors = [];
const error = (component, rule, message) => errors.push({ component, rule, message });

const components = readdirSync(SRC).filter((d) => statSync(join(SRC, d)).isDirectory()).sort();
const metas = {};

// ---------------------------------------------------------------- files + schema
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(JSON.parse(readFileSync(join(ROOT, 'schemas/component.schema.json'), 'utf8')));
for (const name of components) {
  const metaFile = join(SRC, name, `${name.toLowerCase()}.meta.json`);
  if (!existsSync(join(SRC, name, `${name}.tsx`))) error(name, 'files', `missing ${name}/${name}.tsx`);
  if (!existsSync(metaFile)) {
    error(name, 'files', `missing ${name}/${name.toLowerCase()}.meta.json`);
    continue;
  }
  const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
  metas[name] = meta;
  if (!validate(meta)) for (const e of validate.errors) error(name, 'schema', `${e.instancePath || '/'} ${e.message}`);
  if (meta.name !== name) error(name, 'files', `meta name "${meta.name}" must match folder "${name}"`);
}

// ---------------------------------------------------------------- tokens, related, examples, mui
const tokenIds = new Set(semanticIds(loadLayers(), 'light'));
const require = createRequire(join(ROOT, 'packages/react/package.json'));
for (const [name, meta] of Object.entries(metas)) {
  for (const t of meta.tokens ?? []) if (!tokenIds.has(t)) error(name, 'tokens', `unknown token "${t}"`);
  for (const r of meta.usage?.related ?? []) if (!metas[r]) error(name, 'related', `related component "${r}" does not exist`);
  for (const ex of meta.examples ?? []) {
    for (const [, tag] of ex.code.matchAll(/<([A-Z][A-Za-z0-9]*)/g)) {
      if (!metas[tag] && !ALLOWED_EXAMPLE_TAGS.has(tag)) error(name, 'examples', `example "${ex.title}" uses unknown component <${tag}>`);
    }
  }
  if (meta.muiBase) {
    try {
      require.resolve(meta.muiBase);
    } catch {
      error(name, 'mui', `muiBase "${meta.muiBase}" cannot be resolved`);
    }
  }
}

// ---------------------------------------------------------------- props vs TypeScript
const program = ts.createProgram([join(SRC, 'index.ts')], {
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  target: ts.ScriptTarget.ES2022,
  strict: true,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();

function literalValues(type) {
  const t = checker.getNonNullableType(type);
  const parts = t.isUnion() ? t.types : [t];
  if (parts.some((p) => p.flags & ts.TypeFlags.BooleanLiteral)) return null;
  if (!parts.every((p) => p.isStringLiteral() || p.isNumberLiteral())) return null;
  return parts.map((p) => p.value).sort();
}

for (const [name, meta] of Object.entries(metas)) {
  const file = program.getSourceFile(join(SRC, name, `${name}.tsx`));
  const decl = file?.statements.find((s) => ts.isInterfaceDeclaration(s) && s.name.text === `${name}Props`);
  if (!decl) {
    error(name, 'props', `${name}.tsx must export an interface ${name}Props`);
    continue;
  }
  const own = checker
    .getTypeAtLocation(decl.name)
    .getProperties()
    .filter((p) => p.declarations?.some((d) => d.getSourceFile().fileName.includes(`${sep}src${sep}${name}${sep}`) || d.getSourceFile().fileName.includes(`/src/${name}/`)));
  const code = new Map(own.map((p) => [p.name, p]));
  const documented = new Map((meta.props ?? []).map((p) => [p.name, p]));

  for (const p of code.keys()) if (!documented.has(p)) error(name, 'props', `prop "${p}" exists in code but not in metadata`);
  for (const p of documented.keys()) if (!code.has(p)) error(name, 'props', `prop "${p}" is in metadata but not in ${name}Props`);
  for (const [p, sym] of code) {
    const m = documented.get(p);
    if (!m) continue;
    const required = !(sym.flags & ts.SymbolFlags.Optional);
    if (required !== Boolean(m.required)) error(name, 'props', `prop "${p}" is ${required ? 'required' : 'optional'} in code but ${m.required ? 'required' : 'optional'} in metadata`);
    const values = literalValues(checker.getTypeOfSymbolAtLocation(sym, decl));
    if (values) {
      const metaValues = [...(m.values ?? [])].sort();
      if (JSON.stringify(values) !== JSON.stringify(metaValues)) error(name, 'props', `prop "${p}" values are [${values}] in code but [${metaValues}] in metadata`);
    }
  }
}

// ---------------------------------------------------------------- report
const report = { valid: errors.length === 0, components: Object.keys(metas), errors };
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Components: ${report.components.join(', ')}`);
  for (const e of errors) console.log(`  error [${e.rule}] ${e.component}: ${e.message}`);
  console.log(report.valid ? '✔ component metadata valid' : `✖ ${errors.length} error(s)`);
}
process.exit(report.valid ? 0 : 1);
