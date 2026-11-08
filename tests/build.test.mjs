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
  assert.doesNotMatch(css, /--fabric-primitive-|--fabric-brand-/);
});

test('js exports resolved values and var() references', async () => {
  const acme = await import(pathToFileURL(join(out, 'acme.js')));
  assert.equal(acme.tokens.light.color.primary.background, '#c2410c');
  assert.equal(acme.tokens.dark.color.surface.default, '#0f172a');
  assert.equal(acme.tokens.light.radius.control, '4px');
  assert.match(acme.tokens.light.typography.headingLg.fontFamily, /^Georgia/);
  assert.equal(acme.vars.color.primary.backgroundHover, 'var(--fabric-color-primary-background-hover)');
  assert.equal(acme.vars.typography.bodyMd.fontSize, 'var(--fabric-typography-body-md-font-size)');
  assert.equal(acme.breakpoints.md, 900);
});

test('manifest describes every token for agents', () => {
  const m = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));
  assert.equal(m.tokens.length, 75);
  const t = m.tokens.find((x) => x.id === 'color.danger.background');
  assert.equal(t.mui, 'palette.error.main');
  assert.equal(t.cssVar, '--fabric-color-danger-background');
  assert.equal(t.js, 'color.danger.background');
  assert.ok(t.description.length > 10);
  assert.equal(t.values.fabric.light, '#dc2626');
  assert.ok(m.tokens.every((x) => x.description));
});
