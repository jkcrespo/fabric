#!/usr/bin/env node
/**
 * JSON vs Markdown vs prose benchmark (Diana Wolosin's method, scaled down).
 *
 * The same Fabric knowledge is given to a model in three formats:
 *   json      the MCP contracts (get_component + list_tokens, JSON)
 *   markdown  the same facts rendered as Markdown (get_component format=markdown)
 *   prose     the human docs (package READMEs + foundation guidelines)
 * and each question in benchmark/questions.json is asked against each format.
 *
 *   node benchmark/run.mjs          size only: estimated tokens per format, no API calls
 *   node benchmark/run.mjs --run    also asks the model — costs money, needs Claude credentials
 *
 * Writes benchmark/results/latest.json and latest.md.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadData, componentToMarkdown, tokensToMarkdown } from '@jkcrespo/fabric-mcp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RUN = process.argv.includes('--run');
const MODEL = 'claude-opus-5-5';
const PRICE = { input: 4, cacheWrite: 5, cacheRead: 0.2, output: 20 }; // $ per 1M tokens (Claude Opus 5.5)
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// ---------------------------------------------------------------- the three formats
const data = loadData();
const tokenRows = data.tokens.map(({ values, modeDependent, ...rest }) => rest);
const FORMATS = {
  json: `# Components (JSON)\n${JSON.stringify(data.components)}\n\n# Tokens (JSON)\n${JSON.stringify(tokenRows)}`,
  markdown: `${data.components.map(componentToMarkdown).join('\n')}\n# Tokens\n\n${tokensToMarkdown(data.tokens)}`,
  prose: ['packages/react/README.md', 'packages/theme/README.md', 'packages/tokens/README.md', ...['spacing', 'radius', 'typography', 'naming', 'tokens'].map((t) => `docs/foundations/${t}.md`)]
    .map(read)
    .join('\n\n'),
};
const { questions } = JSON.parse(read('benchmark/questions.json'));
const estimate = (s) => Math.round(s.length / 4); // rough: ~4 characters per token

const SYSTEM = (context) =>
  `You answer questions about the Fabric design system using ONLY the reference below. Reply with the answer only, in one short line. If the reference does not contain the answer, reply "unknown".\n\n<reference>\n${context}\n</reference>`;
const grade = (answer, expect) => expect.some((re) => new RegExp(re, 'i').test(answer));

// ---------------------------------------------------------------- run
const report = { date: new Date().toISOString(), model: RUN ? MODEL : null, questions: questions.length, formats: {} };
for (const [name, context] of Object.entries(FORMATS)) {
  report.formats[name] = { characters: context.length, estimatedTokens: estimate(context) };
}

if (RUN) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic();
  for (const [name, context] of Object.entries(FORMATS)) {
    const system = [{ type: 'text', text: SYSTEM(context), cache_control: { type: 'ephemeral' } }];
    const counted = await client.messages.countTokens({ model: MODEL, system, messages: [{ role: 'user', content: 'x' }] });
    const f = report.formats[name];
    Object.assign(f, { contextTokens: counted.input_tokens, correct: 0, refusals: 0, usage: { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 }, answers: [] });
    for (const { id, q, expect } of questions) {
      let answer = '';
      try {
        const res = await client.beta.messages.create({
          model: MODEL,
          max_tokens: 1024,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: 'low' }, // short factual lookups: low effort is enough
          system,
          messages: [{ role: 'user', content: q }],
        });
        if (res.stop_reason === 'refusal') f.refusals++;
        else answer = res.content.filter((b) => b.type === 'text').map((b) => b.text).join(' ').trim();
        const u = res.usage;
        f.usage.input += u.input_tokens ?? 0;
        f.usage.cacheWrite += u.cache_creation_input_tokens ?? 0;
        f.usage.cacheRead += u.cache_read_input_tokens ?? 0;
        f.usage.output += u.output_tokens ?? 0;
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError) throw new Error('No valid Claude credentials. Set ANTHROPIC_API_KEY or run `ant auth login`.');
        if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.APIConnectionError) throw err;
        if (err instanceof Anthropic.APIError) answer = `ERROR ${err.status}: ${err.message}`;
        else throw err;
      }
      const ok = grade(answer, expect);
      if (ok) f.correct++;
      f.answers.push({ id, answer, correct: ok });
      process.stdout.write(ok ? '.' : 'x');
    }
    const u = f.usage;
    f.accuracy = f.correct / questions.length;
    f.costUsd = +((u.input * PRICE.input + u.cacheWrite * PRICE.cacheWrite + u.cacheRead * PRICE.cacheRead + u.output * PRICE.output) / 1e6).toFixed(4);
    console.log(` ${name}: ${f.correct}/${questions.length}`);
  }
}

// ---------------------------------------------------------------- write
const dir = join(ROOT, 'benchmark/results');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'latest.json'), JSON.stringify(report, null, 2) + '\n');
const base = report.formats.json.estimatedTokens;
const rows = Object.entries(report.formats).map(([name, f]) => {
  const tokens = f.contextTokens ?? f.estimatedTokens;
  const cells = [name, `${tokens.toLocaleString('en-US')}${f.contextTokens ? '' : ' (est.)'}`, `${(f.estimatedTokens / base).toFixed(2)}×`];
  if (RUN) cells.push(`${f.correct}/${questions.length} (${Math.round(f.accuracy * 100)}%)`, `$${f.costUsd}`);
  return `| ${cells.join(' | ')} |`;
});
const header = RUN ? '| Format | Context tokens | Size vs JSON | Accuracy | Cost |\n| --- | --- | --- | --- | --- |' : '| Format | Context tokens | Size vs JSON |\n| --- | --- | --- |';
const md = `# Benchmark: JSON vs Markdown vs prose\n\nRun ${report.date.slice(0, 10)} · ${questions.length} questions · ${RUN ? `model \`${MODEL}\`` : 'size only (no model calls; run with --run for accuracy)'}\n\n${header}\n${rows.join('\n')}\n`;
writeFileSync(join(dir, 'latest.md'), md);
console.log(md);
