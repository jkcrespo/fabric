import { relative } from 'node:path';
import { ESLint } from 'eslint';
import plugin, { STYLE_RULES } from './index.js';
import { onStyleProperty } from './utils.js';

/** Counts every key/value in a style object: the denominator of the drift score. */
const styleValues = {
  meta: { type: 'suggestion', schema: [], messages: { value: 'style value' } },
  create: (context) => onStyleProperty(context, (node) => context.report({ node, messageId: 'value' })),
};

async function loadParser() {
  try {
    return (await import('@typescript-eslint/parser')).default;
  } catch {
    return undefined; // espree: JS/JSX only
  }
}

/**
 * Lint `patterns` with every Fabric rule and compute the drift score:
 * the share of style values (sx, style, styled, css) that follow Fabric.
 */
export async function measureDrift(patterns, { cwd = process.cwd() } = {}) {
  const parser = await loadParser();
  const eslint = new ESLint({
    cwd,
    overrideConfigFile: true,
    errorOnUnmatchedPattern: false,
    overrideConfig: [
      { ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/storybook-static/**', '**/*.d.ts'] },
      {
        files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
        languageOptions: { ...(parser ? { parser } : {}), parserOptions: { ecmaFeatures: { jsx: true } } },
        plugins: { fabric: plugin, 'fabric-drift': { rules: { 'style-values': styleValues } } },
        rules: { ...Object.fromEntries(Object.keys(plugin.rules).map((r) => [`fabric/${r}`, 'warn'])), 'fabric-drift/style-values': 'warn' },
      },
    ],
  });
  const results = await eslint.lintFiles(patterns);
  const styleRuleIds = new Set(STYLE_RULES.map((r) => `fabric/${r}`));
  const report = { files: results.length, styleValues: 0, styleViolations: 0, byRule: {}, parseErrors: [], byFile: [], issues: [] };
  for (const r of results) {
    const file = relative(cwd, r.filePath);
    let values = 0;
    const flagged = new Set(); // one style value can break several rules: count it once
    let other = 0;
    for (const m of r.messages) {
      if (!m.ruleId) {
        report.parseErrors.push(`${file}: ${m.message}`);
        continue;
      }
      if (m.ruleId === 'fabric-drift/style-values') {
        values++;
        continue;
      }
      report.byRule[m.ruleId] = (report.byRule[m.ruleId] ?? 0) + 1;
      if (styleRuleIds.has(m.ruleId)) flagged.add(`${m.line}:${m.column}`);
      else other++;
      report.issues.push({ file, line: m.line, rule: m.ruleId, message: m.message, fixable: Boolean(m.fix) });
    }
    report.styleValues += values;
    report.styleViolations += flagged.size;
    if (flagged.size || other) report.byFile.push({ file, styleValues: values, styleViolations: flagged.size, otherIssues: other });
  }
  report.byFile.sort((a, b) => b.styleViolations + b.otherIssues - (a.styleViolations + a.otherIssues));
  report.score = report.styleValues ? Math.round((1000 * (report.styleValues - report.styleViolations)) / report.styleValues) / 10 : 100;
  return report;
}

export function driftToMarkdown(report, { title = 'Fabric drift report', maxIssues = 40 } = {}) {
  const lines = [
    `# ${title}`,
    '',
    `**Drift score: ${report.score}%** — ${report.styleValues - report.styleViolations} of ${report.styleValues} style values follow Fabric (${report.files} files checked).`,
    '',
  ];
  const rules = Object.entries(report.byRule).sort((a, b) => b[1] - a[1]);
  if (rules.length) lines.push('| Rule | Issues |', '| --- | --- |', ...rules.map(([r, n]) => `| \`${r}\` | ${n} |`), '');
  else lines.push('No issues found.', '');
  if (report.byFile.length) {
    lines.push('## Files with the most issues', '', '| File | Style values | Off-system | Other issues |', '| --- | --- | --- | --- |');
    for (const f of report.byFile.slice(0, 10)) lines.push(`| \`${f.file}\` | ${f.styleValues} | ${f.styleViolations} | ${f.otherIssues} |`);
    lines.push('');
  }
  if (report.issues.length) {
    lines.push('## Issues', '');
    for (const i of report.issues.slice(0, maxIssues)) lines.push(`- \`${i.file}:${i.line}\` ${i.message} (\`${i.rule}\`${i.fixable ? ', auto-fixable' : ''})`);
    if (report.issues.length > maxIssues) lines.push(`- … and ${report.issues.length - maxIssues} more`);
    const fixable = report.issues.filter((i) => i.fixable).length;
    lines.push('', fixable ? `${fixable} issue(s) have a safe, value-preserving auto-fix: \`npx eslint --fix\`.` : '', '');
  }
  if (report.parseErrors.length) lines.push('## Files that could not be parsed', '', ...report.parseErrors.map((e) => `- ${e}`), '');
  return lines.join('\n');
}
