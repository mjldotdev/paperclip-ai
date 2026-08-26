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

## Quickstart (S-1)

Pinned to `paperclipai/paperclip:v2026.824.1` per D-1 (`issue #2`).

```bash
git clone https://github.com/mjldotdev/paperclip-ai && cd paperclip-ai
cp .env.example .env
# set BETTER_AUTH_SECRET in .env
sudo mkdir -p /workspaces && sudo chgrp $(id -gn) /workspaces && sudo chmod 770 /workspaces
stat -c %a /workspaces | grep -q 770 && echo "workspace ok"
docker compose config > /dev/null && echo "config ok"
docker compose up -d
sleep 20 && docker compose ps
pnpm install && pnpm test
```

Verify dummy Hermes gateway task (O-4):

1. Open `http://localhost:3100`, create agent `test-hermes` type `hermes_gateway` model `anthropic/claude-sonnet-4`
2. Create task `TASK-001` `S-1 dummy verification` assigned to `test-hermes`, trigger Run/heartbeat
3. `docker logs paperclip 2>&1 | grep -E 'TASK-001.*RUN-' | head` → JSON with `task_id`, `run_id`, `agent_id`, `event` per `idea.md:§37`
4. `docker logs hermes 2>&1 | grep -E 'TASK-001|run_id' | head` → correlation visible

CI: `.github/workflows/ci.yml` validates `docker compose config` + `pnpm test` on `push`/`pull_request` to `main`.

Workspace sharing per D-2 (`issue #3`): `/workspaces` bind-mounted `rw` into `paperclip` and `hermes`, `770` per `idea.md:§44`.

