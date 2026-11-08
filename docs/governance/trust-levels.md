---
title: Agent trust levels
status: stable
applies-to: [agents, ci, governance]
---

# Agent trust levels

Agents earn autonomy like a career: they start as interns. The rule of thumb:
**low risk + high confidence = automatic. Everything else = human review.**

## Levels

| Level | Name | Agent may | Output |
| --- | --- | --- | --- |
| L0 | Observer | Read, run `npm run validate`, report | Logs / reports |
| L1 | Intern *(default)* | Suggest | Issue, PR comment, draft PR |
| L2 | Junior | Make mechanical, verifiable fixes | PR that auto-merges when CI is green |
| L3 | Senior | Propose new system decisions | PR, 1 human approval required |
| — | Human only | — | — |

## Per-action table

| Action | Level needed | Merge |
| --- | --- | --- |
| Fix a broken token reference | L2 | Auto when CI green |
| Fix a naming violation (rename + update refs) | L2 | Auto when CI green |
| Add a missing `$description` | L1 | Human review |
| Add or change a semantic token | L3 | Human review |
| Add a new brand file | L3 | Human review (brand owner) |
| Change a brand's colors to pass contrast | L3 | Human review (brand owner) |
| Add or change component metadata | L3 | Human review |
| Change `brand-contract.json` | Human only | — |
| Lower a contrast threshold / remove a pair | Human only | — |
| Change layer rules in the validator | Human only | — |
| Edit `AGENTS.md` or this file | Human only | — |

Today every agent runs at **L1**. Promotion to L2 for a given action happens once the
validator and CI cover it well enough that a green build means "safe".
