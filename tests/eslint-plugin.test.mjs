// Rule tests for @jkcrespo/eslint-plugin-fabric (valid + invalid + autofix output).
import { describe, it } from 'node:test';
import { RuleTester } from 'eslint';
import plugin from '@jkcrespo/eslint-plugin-fabric';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
});
const r = (name) => plugin.rules[name];

tester.run('no-hardcoded-colors', r('no-hardcoded-colors'), {
  valid: [
    `<Box sx={{ color: 'text.secondary', bgcolor: 'background.paper' }} />`,
    `<Box sx={(t) => ({ color: t.fabric.color.danger.text })} />`,
    `<div style={{ color: 'var(--fabric-color-text-default)', background: 'transparent' }} />`,
    `const label = '#1 seller';`, // not a style context
  ],
  invalid: [
    { code: `<Box sx={{ color: '#dc2626' }} />`, errors: [{ messageId: 'hardcoded' }] },
    { code: `<div style={{ backgroundColor: 'rgb(0, 0, 0)' }} />`, errors: [{ messageId: 'hardcoded' }] },
    { code: `<Box sx={{ '&:hover': { borderColor: 'red' } }} />`, errors: [{ messageId: 'hardcoded' }] },
    { code: 'const A = styled.div`color: #fff;`;', errors: [{ messageId: 'hardcoded' }] },
    { code: `const A = styled(Box)({ boxShadow: '0 1px 2px #0003' });`, errors: [{ messageId: 'hardcoded' }] },
  ],
});

tester.run('no-raw-spacing', r('no-raw-spacing'), {
  valid: [
    `<Box sx={{ p: 4, gap: 3, mt: 0 }} />`, // theme units
    `<Box sx={(t) => ({ gap: t.fabric.space.betweenButtons })} />`,
    `<div style={{ padding: 'var(--fabric-space-card-padding)', margin: '0 auto' }} />`,
  ],
  invalid: [
    { code: `<Box sx={{ p: '16px' }} />`, output: `<Box sx={{ p: 4 }} />`, errors: [{ messageId: 'onScale' }] },
    { code: `<Box sx={{ mt: '-8px' }} />`, output: `<Box sx={{ mt: -2 }} />`, errors: [{ messageId: 'onScale' }] },
    { code: `<div style={{ gap: 12 }} />`, output: `<div style={{ gap: 'var(--fabric-space-300)' }} />`, errors: [{ messageId: 'onScale' }] },
    { code: `<div style={{ padding: '8px 16px' }} />`, output: `<div style={{ padding: 'var(--fabric-space-200) var(--fabric-space-400)' }} />`, errors: [{ messageId: 'onScale' }] },
    { code: `<Box sx={{ padding: '15px' }} />`, errors: [{ messageId: 'offScale' }] },
    { code: `<Box sx={{ m: '1rem' }} />`, errors: [{ messageId: 'offScale' }] },
  ],
});

tester.run('no-raw-radius', r('no-raw-radius'), {
  valid: [`<Box sx={(t) => ({ borderRadius: t.fabric.radius.cardMd })} />`, `<div style={{ borderRadius: 0 }} />`],
  invalid: [
    { code: `<Box sx={{ borderRadius: '8px' }} />`, errors: [{ messageId: 'raw' }] },
    { code: `<div style={{ borderTopLeftRadius: 4 }} />`, errors: [{ messageId: 'raw' }] },
  ],
});

tester.run('no-raw-typography', r('no-raw-typography'), {
  valid: [`<Typography variant="body2" />`, `<Box sx={{ textTransform: 'none', fontSize: 'inherit' }} />`],
  invalid: [
    { code: `<Box sx={{ fontSize: 14 }} />`, errors: [{ messageId: 'raw' }] },
    { code: `<span style={{ fontWeight: 700, fontFamily: 'Arial' }} />`, errors: [{ messageId: 'raw' }, { messageId: 'raw' }] },
    { code: `<Box sx={{ textTransform: 'uppercase' }} />`, errors: [{ messageId: 'textCase' }] },
    { code: `<Box sx={{ fontStyle: 'italic' }} />`, errors: [{ messageId: 'italic' }] },
  ],
});

tester.run('no-unknown-tokens', r('no-unknown-tokens'), {
  valid: [
    `const a = 'var(--fabric-color-primary-background)';`,
    `const b = 'var(--fabric-typography-body-md-font-size)';`,
    `const c = theme.fabric.space.betweenButtons;`,
    `const d = theme.fabric.typography.bodyMd.fontSize;`,
    `const e = theme.fabric.space[key];`, // dynamic: not checked
  ],
  invalid: [
    { code: `const a = 'var(--fabric-color-primary-bg)';`, errors: [{ message: "Unknown Fabric CSS variable '--fabric-color-primary-bg'. Did you mean '--fabric-color-primary-background'?" }] },
    { code: `const a = 'var(--fabric-primitive-color-red-600)';`, errors: [{ messageId: 'internal' }] },
    { code: `const t = 'primitive.color.red.600';`, errors: [{ messageId: 'internal' }] },
    { code: `const c = theme.fabric.color.danger.bg;`, errors: [{ message: "theme.fabric.color.danger.bg does not exist. Did you mean 'color.danger.background'?" }] },
    { code: `const c = t.fabric.space.md;`, errors: [{ messageId: 'unknownPath' }] },
  ],
});

tester.run('no-floating-labels', r('no-floating-labels'), {
  valid: [`<TextField label="Email" placeholder="name@company.com" />`, `<TextField label="Search" slotProps={{ inputLabel: { shrink: true } }} />`],
  invalid: [
    { code: `<TextField label="Email" InputLabelProps={{ shrink: false }} />`, errors: [{ messageId: 'floating' }] },
    { code: `<TextField label="Email" slotProps={{ inputLabel: { shrink: false } }} />`, errors: [{ messageId: 'floating' }] },
    { code: `<TextField placeholder="Email" />`, errors: [{ messageId: 'placeholderOnly' }] },
  ],
});

tester.run('prefer-fabric-components', r('prefer-fabric-components'), {
  valid: [`import { Button } from '@jkcrespo/fabric-react';`, `import { Tooltip, Stack } from '@mui/material';`],
  invalid: [
    { code: `import { Button, Stack } from '@mui/material';`, errors: [{ messageId: 'prefer' }] },
    { code: `import Dialog from '@mui/material/Dialog';`, errors: [{ messageId: 'prefer' }] },
  ],
});

describe('fabric-drift', () => {
  it('scores a drifting screen and lists issues by rule', async () => {
    const { measureDrift } = await import('@jkcrespo/eslint-plugin-fabric/drift');
    const r = await measureDrift(['tests/fixtures/drift-app.tsx']);
    // style values: p, display, flexDirection, gap, textTransform, color, mb, padding, borderRadius,
    // fontSize, color, bgcolor, borderRadius, mt, background = 15; off-system: gap, textTransform,
    // color #334155, padding, borderRadius 6, fontSize = 6 (background var is an unknown-token issue)
    const assert = (await import('node:assert/strict')).default;
    assert.equal(r.styleValues, 15);
    assert.equal(r.styleViolations, 6);
    assert.equal(r.score, 60);
    assert.equal(r.byRule['fabric/no-floating-labels'], 1);
    assert.equal(r.byRule['fabric/no-unknown-tokens'], 1);
    assert.equal(r.byRule['fabric/prefer-fabric-components'], 2);
    assert.ok(r.issues.some((i) => i.rule === 'fabric/no-raw-spacing' && i.fixable), 'gap: 16px is auto-fixable');
    assert.deepEqual(r.parseErrors, []);
  });
});
