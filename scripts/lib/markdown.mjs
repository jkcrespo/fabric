/**
 * The one Markdown renderer for Fabric's machine-readable data. Used by the tokens
 * build (tokens.md), the react build (components.md, docs/<Name>.md) and the MCP data
 * bundle, so every Markdown copy states exactly the same facts as its JSON source.
 * Zero dependencies.
 */

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const code = (s) => `\`${cell(s)}\``;

/** One component contract (from <name>.meta.json / components.json) as a Markdown document. */
export function componentToMarkdown(c) {
  const lines = [`# ${c.name}`, '', c.intent, '', `${code(c.import)} · ${c.category} · ${c.status}${c.muiBase ? ` · built on ${code(c.muiBase)}` : ''}`, ''];
  lines.push('## Props', '', '| Prop | Type | Default | Description |', '| --- | --- | --- | --- |');
  for (const p of c.props) {
    const dflt = p.default === undefined ? '' : code(JSON.stringify(p.default));
    lines.push(`| ${code(p.name)}${p.required ? ' (required)' : ''} | ${code(p.type)} | ${dflt} | ${cell(p.description)} |`);
  }
  for (const [title, list] of [['Variants', c.variants], ['Sizes', c.sizes]]) {
    if (list?.length) lines.push('', `## ${title}`, '', ...list.map((v) => `- **${v.name}** — ${v.intent}`));
  }
  if (c.states?.length) lines.push('', `**States:** ${c.states.join(', ')}`);
  lines.push('', '## When to use', '', ...c.usage.when.map((w) => `- ${w}`));
  lines.push('', '## When not to use', '', ...c.usage.whenNot.map((w) => `- ${w.situation} → use ${w.useInstead}`));
  if (c.usage.composition?.length) lines.push('', '## Composition', '', ...c.usage.composition.map((r) => `- ${r}`));
  if (c.usage.related?.length) lines.push('', `**Related:** ${c.usage.related.join(', ')}`);
  lines.push('', '## Tokens', '', c.tokens.map(code).join(', '));
  lines.push('', '## Accessibility', '', `Role: ${c.accessibility.role}`, '', ...c.accessibility.keyboard.map((k) => `- ${k}`), ...(c.accessibility.notes ?? []).map((n) => `- ${n}`));
  if (c.examples?.length) {
    lines.push('', '## Examples');
    for (const e of c.examples) lines.push('', `### ${e.title}`, '', '```tsx', e.code, '```');
  }
  return lines.join('\n') + '\n';
}

/** All component contracts as one document. */
export function componentsToMarkdown(components, { title = 'Fabric components' } = {}) {
  const index = components.map((c) => `- [${c.name}](#${c.name.toLowerCase()}) — ${c.intent.split('. ')[0]}.`);
  const body = components.map((c) => componentToMarkdown(c).replace(/^# /, '## ').replace(/\n## /g, '\n### ').replace(/\n### (?=[^\n]*\n\n```)/g, '\n#### '));
  return [`# ${title}`, '', ...index, '', ...body].join('\n');
}

const valueText = (v) =>
  v && typeof v === 'object' ? `${v.fontSize} / ${v.lineHeight} · ${v.fontWeight}` : String(v);

/** Token table. With `values: true`, adds one column per brand × mode. */
export function tokensToMarkdown(tokens, { values = false } = {}) {
  const combos = values && tokens[0] ? Object.entries(tokens[0].values).flatMap(([b, modes]) => Object.keys(modes).map((m) => [b, m])) : [];
  const head = ['Token', 'CSS variable', 'MUI', 'When to use', ...combos.map(([b, m]) => `${b} ${m}`)];
  const rows = tokens.map((t) => [code(t.id), code(t.cssVar), t.mui ? code(t.mui) : '', cell(t.description), ...combos.map(([b, m]) => code(valueText(t.values[b][m])))]);
  return [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n') + '\n';
}

/** The full token reference, grouped by category. */
export function tokenReferenceToMarkdown(manifest) {
  const groups = new Map();
  for (const t of manifest.tokens) {
    const cat = t.id.split('.')[0];
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(t);
  }
  const out = [`# Fabric tokens`, '', `${manifest.package} v${manifest.version} · brands: ${manifest.brands.join(', ')} · modes: ${manifest.modes.join(', ')}`, ''];
  for (const [cat, list] of groups) out.push(`## ${cat}`, '', tokensToMarkdown(list, { values: true }));
  return out.join('\n');
}
