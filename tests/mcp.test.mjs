// Talks to the Fabric MCP server the way an agent does: through an MCP client.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createFabricServer } from '@jkcrespo/fabric-mcp';

let client;
const call = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  return { ...r, text: r.content[0].text };
};
const callJson = async (name, args) => JSON.parse((await call(name, args)).text);

before(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createFabricServer().connect(a);
  client = new Client({ name: 'test', version: '0' });
  await client.connect(b);
});
after(() => client?.close());

test('exposes the expected tools, resources and prompt', async () => {
  const tools = (await client.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(tools, ['find_component', 'get_component', 'get_guideline', 'get_rules', 'get_token', 'list_brands', 'list_components', 'list_tokens']);
  const resources = (await client.listResources()).resources.map((r) => r.uri).sort();
  assert.deepEqual(resources, ['fabric://components.json', 'fabric://components.md', 'fabric://rules', 'fabric://tokens.json', 'fabric://tokens.md']);
  assert.ok((await client.listPrompts()).prompts.some((p) => p.name === 'build-with-fabric'));
});

test('get_rules returns the always-on rules from AGENTS.md', async () => {
  const { text } = await call('get_rules');
  assert.match(text, /Always-on rules/);
  assert.match(text, /space\.label-to-input/);
  assert.doesNotMatch(text, /Load on demand/);
});

test('find_component picks the right component and redirects', async () => {
  assert.equal((await callJson('find_component', { task: 'confirm deleting a project' }))[0].name, 'Dialog');
  assert.equal((await callJson('find_component', { task: 'enter an email address in a form' }))[0].name, 'TextField');
  assert.equal((await callJson('find_component', { task: 'tell the user the form failed to submit' }))[0].name, 'Alert');
  assert.equal((await callJson('find_component', { task: 'button that navigates to another page' }))[0].name, 'Button');
  assert.equal((await callJson('find_component', { task: 'remove a teammate' }))[0].name, 'Dialog');
  assert.equal((await callJson('find_component', { task: 'popup asking for a name' }))[0].name, 'Dialog');
  assert.equal((await callJson('find_component', { task: 'group a plan summary with an upgrade button' }))[0].name, 'Card');
  const date = await callJson('find_component', { task: 'pick a date of birth' });
  assert.ok(date.some((r) => r.useInsteadIf?.some((x) => x.useInstead === 'A date picker')), 'redirects to a date picker');
});

test('get_component returns the contract as JSON or Markdown', async () => {
  const button = await callJson('get_component', { name: 'button' });
  assert.equal(button.import, "import { Button } from '@jkcrespo/fabric-react';");
  assert.deepEqual(button.props.find((p) => p.name === 'variant').values, ['solid', 'outline', 'ghost']);
  const md = (await call('get_component', { name: 'Dialog', format: 'markdown' })).text;
  assert.match(md, /^# Dialog/);
  assert.match(md, /\| `title` \(required\)/);
  const missing = await call('get_component', { name: 'Tooltip' });
  assert.equal(missing.isError, true);
  assert.match(missing.text, /Available: .*Button/);
});

test('list_tokens filters by category and keyword, without values', async () => {
  const spacing = await callJson('list_tokens', { category: 'space', query: 'buttons' });
  assert.ok(spacing.some((t) => t.id === 'space.between-buttons'));
  assert.ok(spacing.every((t) => t.id.startsWith('space.') && !('values' in t)));
  const md = (await call('list_tokens', { query: 'label', format: 'markdown' })).text;
  assert.match(md, /space\.label-to-input/);
});

test('get_token returns values per brand and mode; primitives are not exposed', async () => {
  const t = await callJson('get_token', { id: 'color.primary.background', brand: 'acme', mode: 'dark' });
  assert.deepEqual(t.values, { acme: { dark: '#fdba74' } });
  assert.equal(t.mui, 'palette.primary.main');
  const r = await call('get_token', { id: 'primitive.color.red.600' });
  assert.equal(r.isError, true);
  assert.match(r.text, /internal/);
});

test('the published CLI works over stdio', async () => {
  const stdio = new Client({ name: 'stdio-test', version: '0' });
  await stdio.connect(new StdioClientTransport({ command: 'node', args: ['packages/mcp/dist/cli.js'] }));
  const r = await stdio.callTool({ name: 'list_brands', arguments: {} });
  assert.deepEqual(Object.keys(JSON.parse(r.content[0].text).brands).sort(), ['acme', 'fabric']);
  await stdio.close();
});
