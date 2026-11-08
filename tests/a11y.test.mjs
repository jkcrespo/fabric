// Opens every Storybook story in every brand × mode and runs axe-core (WCAG 2.1 A/AA).
// Requires: npm run build-storybook -w @jkcrespo/fabric-react
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import allBrands from '@jkcrespo/fabric-tokens/all';

const STATIC = join(process.cwd(), 'packages/react/storybook-static');
const AXE = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
const SHOTS = process.env.FABRIC_SCREENSHOTS;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

if (!existsSync(join(STATIC, 'index.json'))) throw new Error('Build Storybook first: npm run build-storybook -w @jkcrespo/fabric-react');
const stories = Object.values(JSON.parse(readFileSync(join(STATIC, 'index.json'), 'utf8')).entries).filter((e) => e.type === 'story');

let server, browser, base;
before(async () => {
  server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    const file = join(STATIC, path === '/' ? 'index.html' : path);
    if (!file.startsWith(STATIC) || !existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  server?.close();
});

test('self-check: every story is covered and axe catches a planted contrast failure', async () => {
  assert.ok(stories.length >= 14, `expected at least 14 stories, found ${stories.length}`);
  const page = await browser.newPage();
  await page.goto(`${base}/iframe.html?id=components-button--variants&viewMode=story`);
  await page.waitForSelector('#storybook-root button');
  await page.addScriptTag({ path: AXE });
  const clean = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2aa'] }));
  assert.ok(clean.passes.find((r) => r.id === 'color-contrast')?.nodes.length > 0, 'axe checked text contrast');
  await page.evaluate(() => {
    const p = document.createElement('p');
    p.textContent = 'planted low-contrast text';
    p.style.cssText = 'color:#777;background:#888';
    document.querySelector('#storybook-root').append(p);
  });
  const dirty = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2aa'] }));
  assert.ok(dirty.violations.some((v) => v.id === 'color-contrast'), 'planted failure detected');
  await page.close();
});

for (const brand of Object.keys(allBrands)) {
  for (const mode of ['light', 'dark']) {
    test(`${brand}/${mode}: every story passes axe (WCAG 2.1 AA)`, async () => {
      const page = await browser.newPage();
      const failures = [];
      for (const story of stories) {
        const errors = [];
        const onError = (m) => m.type() === 'error' && errors.push(m.text());
        page.on('console', onError);
        await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=brand:${brand};mode:${mode}`);
        await page.waitForFunction((m) => document.documentElement.getAttribute('data-fabric-mode') === m && document.querySelector('#storybook-root')?.childElementCount, mode);
        await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
        await page.waitForTimeout(50);
        await page.addScriptTag({ path: AXE });
        const result = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }));
        for (const v of result.violations) {
          failures.push(`${story.id} [${v.id}] ${v.help}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`);
        }
        for (const e of errors) failures.push(`${story.id} console error: ${e}`);
        if (SHOTS && /variants|all-severities|form-section|destructive/.test(story.id)) {
          await page.screenshot({ path: join(SHOTS, `${brand}-${mode}-${story.id}.png`) });
        }
        page.off('console', onError);
      }
      await page.close();
      assert.deepEqual(failures, [], `\n${failures.join('\n')}`);
    });
  }
}
