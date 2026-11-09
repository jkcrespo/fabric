import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = mkdtempSync(join(tmpdir(), 'fabric-tokens-'));
before(() => execFileSync('node', ['packages/tokens/build.mjs', '--out', out]));

test('validator passes on the repo tokens', () => {
  execFileSync('node', ['scripts/validate-tokens.mjs']);
});

test('emits css, js, types and manifest for every brand', () => {
  const files = readdirSync(out);
  for (const brand of ['fabric', 'acme']) {
    for (const ext of ['.css', '.scoped.css', '.js', '.d.ts']) assert.ok(files.includes(brand + ext), brand + ext);
  }
  assert.ok(files.includes('manifest.json'));
});

test('css exposes semantic tokens only, with a dark block', () => {
  const css = readFileSync(join(out, 'fabric.css'), 'utf8');
  assert.match(css, /--fabric-color-primary-background: #4f46e5;/);
  assert.match(css, /\[data-fabric-mode="dark"\] \{[^}]*--fabric-color-primary-background: #a5b4fc;/s);
  assert.match(css, /--fabric-typography-body-md-font-size: 1rem;/);
  assert.match(css, /--fabric-space-400: 16px;/);
  assert.match(css, /--fabric-space-between-buttons: 12px;/);
  assert.match(css, /--fabric-space-negative-600: -24px;/);
  assert.match(css, /--fabric-radius-button: 10000px;/);
  assert.match(css, /--fabric-radius-card-lg: 12px;/);
  assert.doesNotMatch(css, /--fabric-primitive-|--fabric-brand-/);
});

test('js exports resolved values and var() references', async () => {
  const acme = await import(pathToFileURL(join(out, 'acme.js')));
  assert.equal(acme.tokens.light.color.primary.background, '#c2410c');
  assert.equal(acme.tokens.dark.color.surface.default, '#0f172a');
  assert.equal(acme.tokens.light.radius.button, '2px');
  assert.equal(acme.tokens.light.space.betweenInputs, '16px');
  assert.equal(acme.tokens.light.space['3200'], '128px');
  assert.match(acme.tokens.light.typography.headingLg.fontFamily, /^Georgia/);
  assert.equal(acme.vars.color.primary.backgroundHover, 'var(--fabric-color-primary-background-hover)');
  assert.equal(acme.vars.typography.bodyMd.fontSize, 'var(--fabric-typography-body-md-font-size)');
  assert.equal(acme.breakpoints.md, 900);
});

test('manifest describes every token for agents', async () => {
  const m = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));
  const { loadLayers, semanticIds } = await import('../scripts/lib/tokens.mjs');
  assert.equal(m.tokens.length, semanticIds(loadLayers(), 'light').length);
  const t = m.tokens.find((x) => x.id === 'color.danger.background');
  assert.equal(t.mui, 'palette.error.main');
  assert.equal(t.cssVar, '--fabric-color-danger-background');
  assert.equal(t.js, 'color.danger.background');
  assert.ok(t.description.length > 10);
  assert.equal(t.values.fabric.light, '#dc2626');
  assert.ok(m.tokens.every((x) => x.description));
});

test('markdown and JSON state the same tokens and components', async () => {
  const m = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));
  const md = readFileSync(join(out, 'tokens.md'), 'utf8');
  for (const t of m.tokens) assert.ok(md.includes(`\`${t.id}\``), `tokens.md lists ${t.id}`);
  assert.match(md, /\| `color\.primary\.background` \| `--fabric-color-primary-background` \| `palette\.primary\.main` \|.*\| `#c2410c` \|/);
  const react = 'packages/react/dist';
  const comps = JSON.parse(readFileSync(join(react, 'components.json'), 'utf8')).components;
  const all = readFileSync(join(react, 'components.md'), 'utf8');
  for (const c of comps) {
    const doc = readFileSync(join(react, 'docs', `${c.name}.md`), 'utf8');
    assert.ok(all.includes(`## ${c.name}`), `components.md has ${c.name}`);
    for (const p of c.props) assert.ok(doc.includes(`\`${p.name}\``), `${c.name}.md documents prop ${p.name}`);
  }
});

