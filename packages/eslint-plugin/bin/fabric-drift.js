#!/usr/bin/env node
/**
 * fabric-drift — how much of your UI code follows Fabric.
 *
 *   npx fabric-drift [paths…] [--json] [--out report.md] [--min-score 95]
 *
 * Exit code 1 when --min-score is set and the score is below it.
 */
import { writeFileSync } from 'node:fs';
import { measureDrift, driftToMarkdown } from '../src/drift.js';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i > -1 ? args.splice(i, 2)[1] : undefined;
};
const out = opt('--out');
const min = opt('--min-score');
const asJson = args.includes('--json');
const patterns = args.filter((a) => !a.startsWith('--'));

const report = await measureDrift(patterns.length ? patterns : ['src']);
const text = asJson ? JSON.stringify(report, null, 2) : driftToMarkdown(report);
if (out) writeFileSync(out, text + '\n');
console.log(out ? `Drift score ${report.score}% — report written to ${out}` : text);
if (min !== undefined && report.score < Number(min)) {
  console.error(`Drift score ${report.score}% is below the minimum ${min}%.`);
  process.exit(1);
}
