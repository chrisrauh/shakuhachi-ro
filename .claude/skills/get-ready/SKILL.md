---
name: get-ready
description: Review project guidelines, architecture, and current tasks to prepare for work
---

# Get Ready for Work

This skill prepares you to work on the shakuhachi-ro project by reviewing key documentation in the correct order.

## Review Checklist

Follow this sequence to get context:

### 0. Identify Your Environment

This project is worked on in two environments. Work out which one you are in before anything else — the tooling differs.

| Environment                                                                                                                    | How to tell                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Local terminal** (macOS)                                                                                                     | Platform is `darwin`; `gh` is installed; no injected branch.                                                    |
| **Claude Code cloud** — claude.ai/code on the web, and sessions started from the Claude mobile or desktop app (same container) | Platform is `linux`; the system prompt injects a `Develop on branch \`claude/...\``block;`gh` is not installed. |

In the cloud environment, read [docs/ENVIRONMENT-WEB.md](../../../docs/ENVIRONMENT-WEB.md) now. It lists what is unavailable there (`gh`, the visual regression suite, chrome-devtools-mcp) and what to use instead. Everywhere this skill and `/dev-workflow` say `gh`, use the GitHub MCP tools (`mcp__github__*`).

### 1. Review Guidelines (CLAUDE.md)

Read `./CLAUDE.md` to understand each section.
Pay special attention to the guidelines. Use `/dev-workflow` for the full development workflow and `/eng-principles` for engineering principle details.

### 2. Review Architecture

Read the architecture documents to understand the system:

**Renderer Library**: `./docs/ARCHITECTURE-RENDERER.MD`
**Platform**: `./docs/ARCHITECTURE-PLATFORM.MD`

### 3. Review Current Tasks (GitHub Issues)

Tasks live in GitHub Issues, not in a file. Start with the focus set:

```bash
gh issue list --label focus --state open
```

If that returns nothing, the focus set is empty — fall back to the actionable backlog and say so rather than guessing. List user-facing work first, then the rest:

```bash
gh issue list --state open --label type:ux --search "-label:type:idea"
```

```bash
gh issue list --state open --search "-label:type:idea" --limit 100
```

**Prefer `type:ux` over internal work.** `type:ux` marks issues that change what users see or do. Tech debt and internal architecture (refactors, tests, type tightening) are easier to spec and finish, so without this preference they crowd out user value. Pick internal work when it unblocks a `type:ux` issue or no `type:ux` issue is workable.

**Always exclude `type:idea` from backlog views.** Those issues are speculative — future features that may never be built — and they are a large fraction of the open set, so including them buries the work that is actually queued. They are never candidates to pick up, and none of them carry `autonomy:high`.

Useful filters: `--label type:ux` (user-facing), `--label autonomy:high` (agent-ready), `--label area:renderer` (or any other `area:*`). To look at the ideas deliberately — not to pick work from — use `--label type:idea` on its own.

## After Review

Once you've reviewed these documents:

1. State which environment you are in, and summarize the most important points from the guidelines
2. Ask the user which issue they'd like to work on, quoting issue numbers
3. If unclear, suggest the top `focus` issue — or, if the focus set is empty, the top open `type:ux` issue, then the top open `autonomy:high` issue

**Remember**: This review ensures you have full context before starting work. Take time to understand the project's patterns and principles.
