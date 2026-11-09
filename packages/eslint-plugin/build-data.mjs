#!/usr/bin/env node
/** Bundles the token facts the rules need into dist/tokens.json (from the tokens manifest). */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const manifest = JSON.parse(readFileSync(join(HERE, '../tokens/dist/manifest.json'), 'utf8'));
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const anyValue = (t) => Object.values(Object.values(t.values)[0])[0];

const cssVars = [];
for (const t of manifest.tokens) {
  if (t.type === 'typography') for (const k of Object.keys(anyValue(t))) cssVars.push(`${t.cssVar.replace(/-\*$/, '')}-${kebab(k)}`);
  else cssVars.push(t.cssVar);
}
// The spacing scale: px value → token key (e.g. 16 → "400"), from space.<digits> tokens.
const spaceScale = {};
for (const t of manifest.tokens) {
  const m = /^space\.(\d+)$/.exec(t.id);
  if (m) spaceScale[parseFloat(anyValue(t))] = m[1];
  const n = /^space\.negative\.(\d+)$/.exec(t.id);
  if (n) spaceScale[parseFloat(anyValue(t))] = `negative.${n[1]}`;
}
const data = { version: manifest.version, ids: manifest.tokens.map((t) => t.id), jsPaths: manifest.tokens.map((t) => t.js), cssVars, spaceScale };
mkdirSync(join(HERE, 'dist'), { recursive: true });
writeFileSync(join(HERE, 'dist/tokens.json'), JSON.stringify(data));
console.log(`Bundled ${data.ids.length} tokens, ${cssVars.length} CSS variables → eslint-plugin/dist/tokens.json`);
