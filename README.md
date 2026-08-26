# paperclip-ai — Autonomous AI Engineering Platform

Self-hosted platform: **Paperclip** (control plane) → **Hermes** (agent runtime) → **OpenCode** (coding) / **AGY** (multimodal).

Source spec: `idea.md` (PRD + Technical Architecture v0.1, 2026-08-27).

## Architecture (idea.md:25-80, 230-264, 1962-1991)

```
Paperclip (WHAT SHOULD HAPPEN) — orgs, projects, tasks, scheduling, budgets
    │
Hermes (WHAT SHOULD I DO) — reasoning, memory, skills, delegation, MCP
   / \
OpenCode (HOW DO I CODE IT)  AGY (WHAT DO I SEE)
```

## Development Phases

- **Phase 0** — Architecture Validation: Paperclip→Hermes→OpenCode pipeline, shared workspace, task/run correlation, logging
- **Phase 1** — MVP: one project, one autonomous agent, heartbeats, worktrees, observability (§55)
- **Phase 2** — Multimodal: Hermes→AGY visual review
- **Phase 3** — Multi-Agent: CTO/backend/frontend/QA/research delegation
- **Phase 4** — Autonomous Organization: auto task creation, budgets, approvals
- **Phase 5** — Production Hardening

## gsd-loop

This repo uses [gsd-loop](https://github.com/mjldotdev/gsd-loop) for continuous delivery:

- `gsd:map` — discovery maps
- `gsd:ready` — build queue (human gate)
- `gsd:blocked` / `gsd:approved` / `gsd:rework` / `gsd:escalated` — review states

See `idea.md` §49-56 for acceptance criteria.

