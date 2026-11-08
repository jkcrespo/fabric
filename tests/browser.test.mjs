// Renders real MUI components with the Fabric theme in Chromium and checks computed styles.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { contrast } from '../scripts/lib/color.mjs';

const dir = mkdtempSync(join(tmpdir(), 'fabric-browser-'));
const SHOTS = process.env.FABRIC_SCREENSHOTS; // optional folder for screenshots
let browser;
const tokens = {
  fabric: (await import('@jkcrespo/fabric-tokens/fabric')).tokens,
  acme: (await import('@jkcrespo/fabric-tokens/acme')).tokens,
};
const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

before(async () => {
  await build({
    entryPoints: ['tests/browser/app.tsx'],
    bundle: true,
    outfile: join(dir, 'app.js'),
    jsx: 'automatic',
    loader: { '.woff2': 'file', '.woff': 'file' },
    define: { 'process.env.NODE_ENV': '"development"' },
    logLevel: 'error',
  });
  writeFileSync(join(dir, 'index.html'), '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="app.css"></head><body><div id="root"></div><script src="app.js"></script></body></html>');
  browser = await chromium.launch();
});
after(() => browser?.close());

async function open(brand, colorScheme = 'light') {
  const page = await browser.newPage({ colorScheme });
  const problems = [];
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && problems.push(m.text()));
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto(`${pathToFileURL(join(dir, 'index.html'))}?brand=${brand}`);
  await page.waitForSelector('#btn');
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
  const style = (sel, prop) => page.$eval(sel, (el, p) => getComputedStyle(el)[p], prop);
  return { page, problems, style };
}

for (const brand of ['fabric', 'acme']) {
  const other = brand === 'acme' ? 'fabric' : 'acme';

  test(`${brand}: MUI components resolve to brand tokens (light)`, async () => {
    const { page, problems, style } = await open(brand);
    const t = tokens[brand].light;
    assert.equal(await style('#btn', 'backgroundColor'), rgb(t.color.primary.background));
    assert.equal(await style('#btn', 'color'), rgb(t.color.primary.foreground));
    assert.equal(await style('#btn', 'borderRadius'), t.radius.button);
    assert.equal(await style('.MuiOutlinedInput-root:has(#field)', 'borderRadius'), t.radius.input);
    assert.equal(await style('#chip', 'backgroundColor'), rgb(t.color.primary.background));
    assert.equal(await style('#card', 'borderRadius'), t.radius.cardMd);
    assert.equal(await style('#dialog-paper', 'borderRadius'), t.radius.cardLg);
    assert.equal(await style('#card', 'backgroundColor'), rgb(t.color.surface.raised));
    assert.equal(await style('body', 'backgroundColor'), rgb(t.color.surface.default));
    assert.equal(await style('#h1', 'fontSize'), '48px');
    assert.ok((await style('#h1', 'fontFamily')).startsWith(t.typography.displayLg.fontFamily.split(',')[0]));
    assert.equal(await style('#btn', 'textTransform'), 'none');
    // Labels sit above the input container, left-aligned, space.label-to-input apart.
    for (const [label, box] of [['label[for="field"]', '.MuiOutlinedInput-root:has(#field)'], ['#select-label', '.MuiOutlinedInput-root:has(#select)']]) {
      const g = await page.evaluate(([l, b]) => {
        const lr = document.querySelector(l).getBoundingClientRect();
        const br = document.querySelector(b).getBoundingClientRect();
        const legend = document.querySelector(`${b} legend`);
        return { gap: br.top - lr.bottom, left: lr.left - br.left, legend: legend ? getComputedStyle(legend).display : 'none' };
      }, [label, box]);
      assert.ok(Math.abs(g.gap - parseFloat(t.space.labelToInput)) < 0.5, `${label}: gap ${g.gap}px, want ${t.space.labelToInput}`);
      assert.ok(Math.abs(g.left) < 0.5, `${label}: left offset ${g.left}px`);
      assert.equal(g.legend, 'none', `${label}: no notch in the border`);
    }
    const helper = await page.evaluate(() => {
      const h = document.querySelector('#field-helper-text').getBoundingClientRect();
      const b = document.querySelector('.MuiOutlinedInput-root:has(#field)').getBoundingClientRect();
      return { left: h.left - b.left, gap: h.top - b.bottom };
    });
    assert.ok(Math.abs(helper.left) < 0.5, `helper text left offset ${helper.left}px`);
    assert.ok(Math.abs(helper.gap - parseFloat(t.space['100'])) < 0.5, `helper text gap ${helper.gap}px`);
    // Noto Sans actually loads (not just named in the font stack)
    await page.evaluate(() => document.fonts.ready);
    assert.ok((await style('#btn', 'fontFamily')).startsWith('"Noto Sans Variable"'));
    assert.ok(await page.evaluate(() => document.fonts.check('600 14px "Noto Sans Variable"')), 'Noto Sans loaded');
    // Alert colors are derived by MUI with color-mix: check they stay readable.
    const alertFg = await style('#alert', 'color');
    const alertBg = await style('#alert', 'backgroundColor');
    const toHex = (s) => '#' + s.match(/\d+/g).slice(0, 3).map((x) => (+x).toString(16).padStart(2, '0')).join('');
    assert.equal(alertBg, rgb(t.color.danger.subtle));
    assert.equal(alertFg, rgb(t.color.danger.text));
    assert.ok(contrast(toHex(alertFg), toHex(alertBg)) >= 4.5, `alert contrast ${alertFg} on ${alertBg}`);
    // A different brand inside FabricBrandScope
    assert.equal(await style('#scoped-btn', 'backgroundColor'), rgb(tokens[other].light.color.primary.background));
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${brand}-light.png`), fullPage: true });
    assert.deepEqual(problems, []);
    await page.close();
  });

  test(`${brand}: switching to dark mode updates without re-creating the theme`, async () => {
    const { page, problems, style } = await open(brand);
    const t = tokens[brand].dark;
    await page.evaluate(() => window.setMode('dark'));
    await page.waitForFunction(() => document.documentElement.getAttribute('data-fabric-mode') === 'dark');
    assert.equal(await style('#btn', 'backgroundColor'), rgb(t.color.primary.background));
    assert.equal(await style('#btn', 'color'), rgb(t.color.primary.foreground));
    assert.equal(await style('body', 'backgroundColor'), rgb(t.color.surface.default));
    assert.equal(await style('#card', 'backgroundColor'), rgb(t.color.surface.raised));
    assert.equal(await style('#dialog-paper', 'backgroundColor'), rgb(t.color.surface.raised));
    assert.equal(await style('#dialog-paper', 'backgroundImage'), 'none');
    assert.equal(await style('#alert', 'backgroundColor'), rgb(t.color.danger.subtle));
    assert.equal(await style('#alert', 'color'), rgb(t.color.danger.text));
    assert.equal(await style('#scoped-btn', 'backgroundColor'), rgb(tokens[other].dark.color.primary.background));
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${brand}-dark.png`), fullPage: true });
    assert.deepEqual(problems, []);
    await page.close();
  });
}

test('system dark preference is respected on first visit', async () => {
  const { page, style } = await open('fabric', 'dark');
  await page.waitForFunction(() => document.documentElement.getAttribute('data-fabric-mode') === 'dark');
  assert.equal(await style('body', 'backgroundColor'), rgb(tokens.fabric.dark.color.surface.default));
  await page.close();
});
