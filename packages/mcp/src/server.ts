import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadData, type ComponentMeta, type FabricData, type TokenEntry } from './data.js';

export { loadData } from './data.js';
export type { FabricData, ComponentMeta, TokenEntry } from './data.js';

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] });
const json = (v: unknown) => text(JSON.stringify(v));
const fail = (message: string) => ({ ...text(message), isError: true });

const CATEGORIES = ['color', 'space', 'radius', 'typography', 'elevation', 'motion'] as const;
const words = (s: string): string[] => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
const STOP = new Set(['a', 'an', 'the', 'to', 'of', 'for', 'and', 'or', 'in', 'on', 'with', 'is', 'it', 'i', 'my', 'me', 'that', 'this', 'be', 'user', 'users', 'need', 'want', 'show', 'use']);

/** Crude English stemmer: "deleting", "deleted", "deletes" → "delet". Enough for keyword matching. */
const stem = (w: string) => w.replace(/(ations?|ings?|ed|es|s|e)$/, '') || w;
/** Task words → the vocabulary used in component contracts. */
const SYNONYMS: Record<string, string[]> = {
  delet: ['destructive'], remov: ['destructive'], eras: ['destructive'], discard: ['destructive'],
  notify: ['message', 'status'], notic: ['message'], error: ['fail'], success: ['confirm'],
  input: ['text'], typ: ['text'], modal: ['dialog'], popup: ['dialog'], banner: ['alert'],
};
const stems = (s: string) => words(s).filter((w) => !STOP.has(w)).map(stem);
const queryStems = (s: string) => [...new Set(stems(s).flatMap((w) => [w, ...(SYNONYMS[w] ?? []).map(stem)]))];

/** Keyword relevance of a component for a task description. */
function scoreComponent(c: ComponentMeta, task: string) {
  const query = queryStems(task);
  const fields = {
    name: stems(c.name),
    when: stems(c.usage.when.join(' ')),
    intent: stems(c.intent),
    extra: stems([...(c.usage.composition ?? []), ...(c.examples ?? []).map((e) => `${e.title} ${e.code}`)].join(' ')),
  };
  const hits = (list: string[], w: string) => list.filter((x) => x === w).length;
  let score = 0;
  for (const w of query) {
    score += hits(fields.name, w) * 10 + hits(fields.when, w) * 3 + hits(fields.intent, w) * 2 + Math.min(hits(fields.extra, w), 2);
  }
  // A whenNot match points away from this component.
  const redirects = c.usage.whenNot.filter((n) => {
    const s = stems(n.situation);
    return query.filter((w) => s.includes(w)).length >= 2;
  });
  return { score, redirects };
}

const summary = (c: ComponentMeta) => ({ name: c.name, category: c.category, status: c.status, intent: c.intent });

/**
 * Create the Fabric MCP server. Tools return compact JSON (contracts) or Markdown
 * (rules and guidelines), following "JSON for MCP, Markdown for LLM".
 */
export function createFabricServer(data: FabricData = loadData()): McpServer {
  const server = new McpServer({ name: 'fabric', version: data.version });
  const byName = new Map(data.components.map((c) => [c.name.toLowerCase(), c]));
  const tokenById = new Map(data.tokens.map((t) => [t.id, t]));
  const findComponent = (name: string) => byName.get(name.trim().toLowerCase());

  // ---------------------------------------------------------------- rules & guidelines
  server.registerTool(
    'get_rules',
    {
      title: 'Fabric always-on rules',
      description:
        'Call this FIRST, once per task, before writing any UI with Fabric. Returns the always-on rules for tokens, color, spacing, radius, typography and components. Lookups by other tools only return what you ask for; these rules cover everything else.',
      annotations: { readOnlyHint: true },
    },
    async () => text(data.rules)
  );

  server.registerTool(
    'get_guideline',
    {
      title: 'Foundation guideline',
      description: 'Full guideline for one foundation: spacing (relationships and scale), radius (component mapping), typography (rules and styles), naming, or tokens (layers, brands, MUI mapping).',
      inputSchema: { topic: z.enum(['spacing', 'radius', 'typography', 'naming', 'tokens']) },
      annotations: { readOnlyHint: true },
    },
    async ({ topic }) => text(data.guidelines[topic])
  );

  // ---------------------------------------------------------------- components
  server.registerTool(
    'list_components',
    {
      title: 'List components',
      description: 'All Fabric components with their category and intent. Use find_component when you know the task but not the component.',
      annotations: { readOnlyHint: true },
    },
    async () => json(data.components.map(summary))
  );

  server.registerTool(
    'find_component',
    {
      title: 'Find a component for a task',
      description:
        'Describe what the UI needs to do (e.g. "confirm deleting a project", "tell the user their changes saved"). Returns the best-matching components, plus "useInstead" redirects when the task matches a component\'s when-not-to-use rules.',
      inputSchema: { task: z.string().min(3).describe('What the UI needs to do, in plain words.') },
      annotations: { readOnlyHint: true },
    },
    async ({ task }) => {
      const ranked = data.components
        .map((c) => ({ c, ...scoreComponent(c, task) }))
        .filter((r) => r.score > 0 || r.redirects.length)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ c, score, redirects }) => ({ ...summary(c), score, ...(redirects.length ? { useInsteadIf: redirects } : {}) }));
      return json(ranked.length ? ranked : { matches: [], hint: 'No Fabric component matches. Use the themed MUI component directly (AGENTS.md rule 6).' });
    }
  );

  server.registerTool(
    'get_component',
    {
      title: 'Component contract',
      description:
        'The full contract for one component: import, props with allowed values, variants, sizes, states, when / when not to use, composition rules, tokens, accessibility and examples. Read it before using the component.',
      inputSchema: {
        name: z.string().describe('Component name, e.g. "Button".'),
        format: z.enum(['json', 'markdown']).default('json').describe('json (default) is the compact contract; markdown is the same facts as a document.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ name, format }) => {
      const c = findComponent(name);
      if (!c) return fail(`Unknown component "${name}". Available: ${data.components.map((x) => x.name).join(', ')}.`);
      return format === 'markdown' ? text(data.markdown.components[c.name]) : json(c);
    }
  );

  // ---------------------------------------------------------------- tokens
  server.registerTool(
    'list_tokens',
    {
      title: 'List tokens',
      description:
        'Semantic tokens with their intent, CSS variable, JS path and MUI mapping. Filter by category and/or a keyword (matches id and description, e.g. "button", "error", "card padding"). Values are omitted — use get_token for values.',
      inputSchema: {
        category: z.enum(CATEGORIES).optional(),
        query: z.string().optional().describe('Keyword(s) to match in token id or description.'),
        format: z.enum(['json', 'markdown']).default('json'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ category, query, format }) => {
      const q = query ? words(query) : [];
      const matches = data.tokens.filter(
        (t) =>
          (!category || t.id.startsWith(`${category}.`)) &&
          q.every((w) => t.id.toLowerCase().includes(w) || t.description.toLowerCase().includes(w))
      );
      if (format === 'markdown') return text([data.markdown.tokenTableHeader, ...matches.map((t) => data.markdown.tokenRows[t.id])].join('\n') + '\n');
      return json(matches.map(({ values, modeDependent, ...rest }) => rest));
    }
  );

  server.registerTool(
    'get_token',
    {
      title: 'Token details and values',
      description: 'One semantic token with its resolved value for each brand and mode (or only the brand / mode you pass).',
      inputSchema: {
        id: z.string().describe('Token id, e.g. "color.primary.background" or "space.between-buttons".'),
        brand: z.string().optional(),
        mode: z.enum(['light', 'dark']).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ id, brand, mode }) => {
      const t: TokenEntry | undefined = tokenById.get(id);
      if (!t) {
        const near = data.tokens.filter((x) => x.id.includes(id.split('.').at(-1) ?? id)).slice(0, 8).map((x) => x.id);
        return fail(`Unknown token "${id}".${near.length ? ` Did you mean: ${near.join(', ')}?` : ''} Primitive and brand tokens are internal and not available.`);
      }
      if (brand && !data.brands[brand]) return fail(`Unknown brand "${brand}". Brands: ${Object.keys(data.brands).join(', ')}.`);
      const values = Object.fromEntries(
        Object.entries(t.values)
          .filter(([b]) => !brand || b === brand)
          .map(([b, byMode]) => [b, mode ? { [mode]: byMode[mode] } : byMode])
      );
      return json({ ...t, values });
    }
  );

  server.registerTool(
    'list_brands',
    {
      title: 'List brands',
      description: 'Brands available in this Fabric build. Fabric is white-label: never assume a brand\'s colors, fonts or radius.',
      annotations: { readOnlyHint: true },
    },
    async () => json({ brands: data.brands, modes: data.modes })
  );

  // ---------------------------------------------------------------- resources & prompt
  server.registerResource('rules', 'fabric://rules', { title: 'Always-on rules', mimeType: 'text/markdown' }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'text/markdown', text: data.rules }],
  }));
  server.registerResource('components', 'fabric://components.json', { title: 'All component contracts', mimeType: 'application/json' }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data.components) }],
  }));
  server.registerResource('tokens', 'fabric://tokens.json', { title: 'All semantic tokens', mimeType: 'application/json' }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data.tokens) }],
  }));
  server.registerResource('components-md', 'fabric://components.md', { title: 'All component contracts (Markdown)', mimeType: 'text/markdown' }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'text/markdown', text: data.markdown.allComponents }],
  }));
  server.registerResource('tokens-md', 'fabric://tokens.md', { title: 'All semantic tokens with values (Markdown)', mimeType: 'text/markdown' }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'text/markdown', text: data.markdown.tokens }],
  }));
  server.registerPrompt(
    'build-with-fabric',
    { title: 'Build UI with Fabric', description: 'Starts a UI task with Fabric\'s always-on rules loaded.', argsSchema: { task: z.string() } },
    ({ task }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `${data.rules}\n\n---\nTask: ${task}\n\nUse find_component / get_component before using a component, and list_tokens for any token you are unsure of.`,
          },
        },
      ],
    })
  );

  return server;
}
