# Benchmark: JSON vs Markdown vs prose

"Benchmark before committing to a format" (Diana Wolosin, Indeed). The same Fabric
knowledge is given to a model three ways, and the same questions are asked of each:

| Format | What the model gets |
| --- | --- |
| `json` | The MCP contracts: `get_component` + `list_tokens` as JSON |
| `markdown` | The same facts as Markdown (`get_component format=markdown`) |
| `prose` | The human docs: package READMEs + foundation guidelines |

```bash
npm run benchmark       # size only — estimated tokens per format, free
npm run benchmark:run   # accuracy + exact tokens + cost — calls Claude, costs money
```

`benchmark:run` needs Claude credentials (`ANTHROPIC_API_KEY` or `ant auth login`).
It uses Claude Opus 5.5 at low effort with prompt caching; with 22 questions × 3 formats
expect well under $1 per run (each question re-reads the cached context).

Results go to `results/latest.md` and `latest.json`. Add real questions from agent
sessions to `questions.json` over time — the benchmark is only as good as its questions.
