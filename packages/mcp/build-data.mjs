#!/usr/bin/env node
/**
 * Bundles everything the MCP server serves into dist/data/fabric.json, so the published
 * package works on its own: token manifest, component contracts, always-on rules and
 * foundation guidelines. Run after the tokens and react packages are built.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokensToMarkdown } from '../../scripts/lib/markdown.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(HERE, '../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const agents = read('AGENTS.md');
const rules = agents.slice(agents.indexOf('## 1. Always-on rules'), agents.indexOf('## 2. Load on demand')).trim();
const stripFrontMatter = (md) => md.replace(/^---[\s\S]*?---\s*/, '');
const guidelines = Object.fromEntries(
  ['spacing', 'radius', 'typography', 'naming', 'tokens'].map((t) => [t, stripFrontMatter(read(`docs/foundations/${t}.md`))])
);
const tokens = json('packages/tokens/dist/manifest.json');
const components = json('packages/react/dist/components.json');
const brands = Object.fromEntries(
  tokens.brands.map((b) => [b, json(`tokens/brands/${b}.json`).$description ?? ''])
);

const data = {
  version: JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8')).version,
  rules,
  guidelines,
  brands,
  modes: tokens.modes,
  tokens: tokens.tokens,
  components: components.components,
  // Markdown, rendered by the shared renderer (scripts/lib/markdown.mjs) so it always
  // matches the JSON: one document per component, the full references, and one table
  // row per token so filtered lists render identically.
  markdown: {
    components: Object.fromEntries(components.components.map((c) => [c.name, read(`packages/react/dist/docs/${c.name}.md`)])),
    allComponents: read('packages/react/dist/components.md'),
    tokens: read('packages/tokens/dist/tokens.md'),
    tokenTableHeader: tokensToMarkdown([]).trim(),
    tokenRows: Object.fromEntries(tokens.tokens.map((t) => [t.id, tokensToMarkdown([t]).trim().split('\n')[2]])),
  },
};
mkdirSync(join(HERE, 'dist/data'), { recursive: true });
writeFileSync(join(HERE, 'dist/data/fabric.json'), JSON.stringify(data));
console.log(`Bundled ${data.tokens.length} tokens, ${data.components.length} components, ${Object.keys(guidelines).length} guidelines → dist/data/fabric.json`);
