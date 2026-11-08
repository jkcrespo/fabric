# @jkcrespo/fabric-mcp

An [MCP](https://modelcontextprotocol.io) server for [Fabric](https://github.com/jkcrespo/fabric).
AI agents (Claude Code, Cursor, Copilot…) look up Fabric's rules, tokens and component
contracts on demand instead of guessing.

## Set up

**Claude Code** (from your project):

```bash
claude mcp add fabric -- npx -y @jkcrespo/fabric-mcp
```

**Cursor / other clients** — add to the client's MCP config:

```json
{ "mcpServers": { "fabric": { "command": "npx", "args": ["-y", "@jkcrespo/fabric-mcp"] } } }
```

Inside the Fabric repo, `.mcp.json` already points Claude Code at the local build.

## Tools

| Tool | Returns |
| --- | --- |
| `get_rules` | The always-on rules (call first, once per task) |
| `get_guideline` | Spacing, radius, typography, naming or token guideline |
| `list_components` | Components with category and intent |
| `find_component` | Best components for a task, with "use instead" redirects |
| `get_component` | Full contract: props, variants, when / when not, composition, tokens, a11y, examples (`json` or `markdown`) |
| `list_tokens` | Semantic tokens filtered by category / keyword, with intent, CSS var, JS path, MUI mapping |
| `get_token` | One token's value per brand and mode |
| `list_brands` | Available brands and modes |

Also exposed as resources (`fabric://rules`, `fabric://components.json`,
`fabric://tokens.json`) and a prompt, `build-with-fabric`.

## Why rules *and* lookups

On-demand lookups only return what a prompt asks for: "build a card" fetches Card, not
spacing or typography. So foundations come from always-on rules (`get_rules`, or
`AGENTS.md` in the repo), and the tools answer everything else — progressive disclosure.

Everything is read-only. Data is bundled at build time from the token manifest,
component metadata and docs, so the server always matches the published version.
