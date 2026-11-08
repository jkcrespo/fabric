import type { ComponentMeta, TokenEntry } from './data.js';

/** Renders a component contract as Markdown — the same facts as the JSON, for LLM prompts. */
export function componentToMarkdown(c: ComponentMeta): string {
  const lines: string[] = [`# ${c.name}`, '', c.intent, '', `\`${c.import}\` · ${c.category} · ${c.status}`, ''];
  lines.push('## Props', '', '| Prop | Type | Default | Description |', '| --- | --- | --- | --- |');
  for (const p of c.props) {
    const dflt = p.default === undefined ? '' : `\`${JSON.stringify(p.default)}\``;
    lines.push(`| \`${p.name}\`${p.required ? ' (required)' : ''} | \`${p.type.replace(/\|/g, '\\|')}\` | ${dflt} | ${p.description} |`);
  }
  for (const [title, list] of [['Variants', c.variants], ['Sizes', c.sizes]] as const) {
    if (list?.length) lines.push('', `## ${title}`, '', ...list.map((v) => `- **${v.name}** — ${v.intent}`));
  }
  if (c.states?.length) lines.push('', `**States:** ${c.states.join(', ')}`);
  lines.push('', '## When to use', '', ...c.usage.when.map((w) => `- ${w}`));
  lines.push('', '## When not to use', '', ...c.usage.whenNot.map((w) => `- ${w.situation} → use ${w.useInstead}`));
  if (c.usage.composition?.length) lines.push('', '## Composition', '', ...c.usage.composition.map((r) => `- ${r}`));
  if (c.usage.related?.length) lines.push('', `**Related:** ${c.usage.related.join(', ')}`);
  lines.push('', '## Tokens', '', c.tokens.map((t) => `\`${t}\``).join(', '));
  lines.push('', '## Accessibility', '', `Role: ${c.accessibility.role}`, ...c.accessibility.keyboard.map((k) => `- ${k}`), ...(c.accessibility.notes ?? []).map((n) => `- ${n}`));
  if (c.examples?.length) {
    lines.push('', '## Examples');
    for (const e of c.examples) lines.push('', `### ${e.title}`, '', '```tsx', e.code, '```');
  }
  return lines.join('\n') + '\n';
}

/** Renders a list of tokens as a Markdown table. */
export function tokensToMarkdown(tokens: TokenEntry[]): string {
  const rows = tokens.map((t) => `| \`${t.id}\` | \`${t.cssVar}\` | ${t.mui ? `\`${t.mui}\`` : ''} | ${t.description} |`);
  return ['| Token | CSS variable | MUI | When to use |', '| --- | --- | --- | --- |', ...rows].join('\n') + '\n';
}
