# paperclip-ai — Autonomous AI Engineering Platform

Self-hosted platform: **Paperclip** (control plane) → **Hermes** (agent runtime) → **OpenCode** (coding) / **AGY** (multimodal).

Source spec: `idea.md` (PRD + Technical Architecture v0.1, 2026-08-27) — `idea.md:25-80,230-264,1962-1991` hierarchy `§12` `Paperclip → Hermes → OpenCode/AGY`.

> **Status: Phase 0-1 MVP DONE** — `main` `4b9fc03` `4` slices `S-1..S-4` `MERGED` `25` tests `4` files `CLOSED` discovery [#1](https://github.com/mjldotdev/paperclip-ai/issues/1) `plan sha256:54b6e1` `D-1..D-6` `CLOSED`. Real `Paperclip` `v2026.824.1` `0.3.1` `local_trusted` UI at `http://localhost:3100` via `pnpm dev` in `/tmp/paperclip` `postgres:17-alpine` `Up`.

## Architecture

```
Paperclip (WHAT SHOULD HAPPEN) — orgs, projects, tasks, scheduling, budgets, governance
    │
Hermes (WHAT SHOULD I DO) — reasoning, memory, skills, delegation, MCP
   / \
OpenCode (HOW DO I CODE IT)  AGY (WHAT DO I SEE)  — AGY deferred D-6 to Phase 2 §51
```

Principle `idea.md:3` `P1` `One owner per responsibility` `§5,§40` `§64` — `Paperclip` never does `LLM reasoning`, `Hermes` never owns `global scheduling`, `OpenCode` never owns `org state`. `MCP` preferred `§11`. `§29,§44-45` `workspaces` isolation + `git worktree`.

## Development Phases

- **Phase 0 — Architecture Validation** `§49` `DONE` — `Paperclip→Hermes→OpenCode` pipeline, shared workspace, task/run correlation, logging `S-1`
- **Phase 1 — MVP** `§50,§55` `DONE` — one project, one autonomous agent, heartbeats `15m` `§48`, worktrees `task/TASK-*` `§45`, observability `§37-38` `§36`, budgets `$20/$300` `§59` — `S-2..S-4` `§55` 17 steps `DONE` `§69`
- **Phase 2 — Multimodal** `§51` — `Hermes→AGY` visual review `screenshots` `§23` `§56` — *next discovery*
- **Phase 3 — Multi-Agent** `§52` `§26` — `CEO→CTO→Backend/Frontend/QA` delegation `§27`
- **Phase 4 — Autonomous Organization** `§53` — auto creation, `hiring` `§32`, `budgets` `approvals`
- **Phase 5 — Production Hardening** `§54` — backups, vault `§30`, quotas, alerting

## What Was Built (Phase 0-1 Output)

| Slice | Issue | PR | Delivers | Code Pointers |
|---|---|---|---|---|
| **S-1** `Compose + workspace + gateway + CI` `Needs None` | [#8](https://github.com/mjldotdev/paperclip-ai/issues/8) | [#12](https://github.com/mjldotdev/paperclip-ai/pull/12) `1968855` | `docker-compose.yml` `paperclip v2026.824.1` + `postgres:17-alpine` + `hermes` sharing `/workspaces:rw` `770` `D-2` `§44`, `.env.example`, `package.json` `vitest`, `tests/healthcheck.spec.ts`, `.github/workflows/ci.yml` `docker compose config`+`pnpm test` | `docker-compose.yml:1`, `.env.example:1`, `package.json:1`, `tests/healthcheck.spec.ts:1` |
| **S-2** `Worktree + TASK→RUN + heartbeat` `Needs #8` | [#9](https://github.com/mjldotdev/paperclip-ai/issues/9) | [#13](https://github.com/mjldotdev/paperclip-ai/pull/13) `7737de8` | `worktree` `/workspaces/<project>/worktrees/<agent>-TASK-*` `task/TASK-*/<slug>` `git worktree add -b` `D-3` `§45`, `TASK→RUN→HERMES` `run_id` dedup `§35` `sessionCodec` `D-4` `§16`, `15m` `cron` `§21` `heartbeatTick` `§48` | `scripts/create-worktree.sh:1`, `server/src/services/{run-correlation,heartbeat}.ts:1`, `tests/worktree-correlation.spec.ts:1` |
| **S-3** `Hermes→OpenCode delegation` `Needs #9` | [#10](https://github.com/mjldotdev/paperclip-ai/issues/10) | [#14](https://github.com/mjldotdev/paperclip-ai/pull/14) `72d03c7` | `§22` JSON `{task_id,run_id,workspace,branch,specialist opencode,timeout 1800}` via `MCP`/`exec`, `files_changed[]` `tests {passed,failed}`, `retry 3→blocked` `§33` `maxDepth 2` | `server/src/services/{specialist-opencode,retry}.ts:1`, `docker-compose.yml:58` adds `opencode` `rw` `Z`, `tests/opencode-delegation.spec.ts:1` |
| **S-4** `Single-agent MVP E2E` `Needs #10` | [#11](https://github.com/mjldotdev/paperclip-ai/issues/11) | [#15](https://github.com/mjldotdev/paperclip-ai/pull/15) `4b9fc03` | `§55` 17 steps `task→plan→worktree→opencode→tests→review→memory→report→sleep→wake` `frontend-engineer` `src/pages/hello.tsx` `task/TASK-10/build-hello-page`, memory `demo uses Next.js+Tailwind` `§17.2` survives `§69`, observability `§37,§36,§38` + budgets `$20/$300` `§59` `2.20` no `AGY` `D-6` | `server/src/services/{agent-run,memory,observability,budget}.ts:1`, `tests/e2e-mvp.spec.ts:1` |

All `CLOSED` via `MERGED` `gsd:ready` `→` `gsd/NNN-*` `→` `PR` `→` `ensure-linkage` `→` `MERGED`. `Discovery #1` `CLOSED` `4` slices.

## Quickstart

Pinned `paperclipai/paperclip:v2026.824.1` `8e6edcd` per `D-1` `issue #2` (`gh api repos/paperclipai/paperclip/tags` `v2026.824.1`).

### A) Full MVP without Docker (fast, proves loop)

```bash
git clone https://github.com/mjldotdev/paperclip-ai && cd paperclip-ai
git checkout main # 4b9fc03 25 passed
pnpm install && pnpm test # 25 passed 4 files 506ms (healthcheck 4 + worktree 8 + opencode 7 + e2e 6)
docker compose config > /dev/null && echo "config ok" # validates v2026.824.1 + postgres:17-alpine + hermes + opencode /workspaces:rw,z

bash scripts/create-worktree.sh demo frontend-engineer 12 "My feature"
# → /workspaces/demo/worktrees/frontend-engineer-TASK-12 task/TASK-12/my-feature
# {"task_id":"TASK-12","run_id":"RUN-12","event":"specialist_started","workspace":".../worktrees/...","branch":"task/TASK-12/my-feature"} §37
git -C workspaces/demo/main worktree list # main + TASK-12

pnpm dlx tsx /tmp/demo-e2e.ts # runAgentLifecycle TASK-10 Build hello page via mockOpencodeExecutorSuccess
# RESULT {"task_id":"TASK-10","run_id":"RUN-1","status":"completed","workspace":"/workspaces/demo/worktrees/frontend-engineer-TASK-10","branch":"task/TASK-10/build-hello-page","files_changed":["src/hello.ts"],"tests":{"passed":1,"failed":0},"costAttribution":"Hermes $0.40 + OpenCode $1.80 = Total $2.20"} §59
# MEMORY [ 'demo uses Next.js + Tailwind' ] §17.2 survives clearRuns
# METRICS {"agents":{"runs":1},"specialists":{"opencodeRuns":1,"agyRuns":0},"tasks":{"completed":1}} §38
```

### B) Full stack with Postgres + Paperclip UI at `http://localhost:3100` (real, not mock)

`Paperclip` `0.3.1` `local_trusted` UI needs `postgres:17-alpine` `Up` + `pnpm dev` in `/tmp/paperclip` `v2026.824.1` `198fc8b` (image not on `ghcr`/`hub`, `podman pull` `manifest unknown`/`denied`, so build from source — `1m30s` `pnpm install` + `5-10m` `podman build`):

```bash
# 1) Postgres (podman rootless, as S-1)
podman network create paperclip-ai; podman volume create pgdata; podman volume create paperclip-data
mkdir -p ./workspaces
podman run -d --name paperclip-postgres --network paperclip-ai -e POSTGRES_USER=paperclip -e POSTGRES_PASSWORD=paperclip -e POSTGRES_DB=paperclip -v pgdata:/var/lib/postgresql/data -p 5432:5432 postgres:17-alpine
podman run -d --name hermes --network paperclip-ai -v $(pwd)/workspaces:/workspaces:rw,z docker.io/library/node:20-alpine tail -f /dev/null
podman run -d --name opencode --network paperclip-ai -v $(pwd)/workspaces:/workspaces:rw,z docker.io/library/node:20-alpine tail -f /dev/null
podman ps # 3 Up

# 2) Real Paperclip control plane (we only changed runtimes, Paperclip stays canonical per idea.md:3 §7.1 §67)
git clone --branch v2026.824.1 --depth 1 https://github.com/paperclipai/paperclip /tmp/paperclip
cd /tmp/paperclip && pnpm install # 1m30s 1251 packages, then pnpm --filter @paperclipai/plugin-sdk build && pnpm -r build (cargo needed for runner, skip)
pnpm --filter @paperclipai/db migrate # DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip → 226 migrations

# 3) Run dev server (auto-migrates, builds shared/plugin-sdk, serves UI + API on same 3100 via vite-dev-middleware)
systemd-run --user --unit=paperclip-dev bash -c 'cd /tmp/paperclip && DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip PORT=3100 BETTER_AUTH_SECRET=local-test-secret-please-change PAPERCLIP_PUBLIC_URL=http://localhost:3100 pnpm dev > /tmp/paperclip-dev.log 2>&1'
systemctl --user status paperclip-dev # Active: active (running) 1.2G
ss -tlnp | grep 3100 # 127.0.0.1:3100 + 127.0.0.1:13100 HMR
curl -s http://localhost:3100 | head # <!DOCTYPE html><title>Paperclip</title><div id="root"><script src="/src/main.tsx">
curl -s http://localhost:3100/api/health | python3 -m json.tool # {"status":"ok","version":"0.3.1","deploymentMode":"local_trusted","authReady":true}

# Open http://localhost:3100 in browser → Paperclip React dashboard (orgs, agents hermes_gateway/opencode_local from server/src/adapters/registry.ts:103-105, tasks, AgentView/TaskView §36)
# Create org → agent frontend-engineer (hermes_gateway anthropic/claude-sonnet-4 persistSession true) → task TASK-012 Build hello page for demo assigned → heartbeat 30s → docker logs paperclip | grep TASK-012 | grep RUN- → opencode logs src/hello.ts → git -C workspaces/demo/main worktree list → done + memory

# 4) Or via Docker (alternative to pnpm dev, after building image)
podman build -t paperclipai/paperclip:v2026.824.1 -f /tmp/paperclip/Dockerfile /tmp/paperclip # ~5-10m
# edit paperclip-ai/docker-compose.yml:22 image: paperclipai/paperclip:v2026.824.1 (remove mock node command) then podman compose up -d
```

Mock at `3100` (`node:20-alpine` `h1 Paperclip mock S-1 OK` `docker-compose.yml:22` comment `In production: image: paperclipai/paperclip:v2026.824.1 / For S-1 local verification: node:20-alpine`) was only for `S-1` `O-4` `TASK-001` `RUN-1` wiring `§37`; real `pnpm dev` above now serves the UI at same `3100` (`vite` `injectIntoGlobalHook`) — same `Paperclip` control plane, only `Hermes`/`OpenCode` runtimes are our changed adapters.

## Project Structure (produces output)

```
paperclip-ai/
├── docker-compose.yml # S-1 root Compose v2026.824.1 postgres:17-alpine hermes opencode /workspaces:rw,z 770
├── .env.example # DATABASE_URL BETTER_AUTH_SECRET PAPERCLIP_PUBLIC_URL HERMES_GATEWAY_URL §30
├── package.json # pnpm test vitest --run S-1
├── vitest.config.ts
├── tests/
│   ├── healthcheck.spec.ts # S-1 O-1..O-4 4 tests compose/env/CI
│   ├── worktree-correlation.spec.ts # S-2 O-1..O-3 8 tests worktree git init -b main mount-safe
│   ├── opencode-delegation.spec.ts # S-3 O-1..O-3 7 tests §22 contract retry 3→blocked §33
│   └── e2e-mvp.spec.ts # S-4 O-1..O-3 6 tests 17-step §55 memory §17.2 observability §37-38 budgets §59 2.20
├── scripts/
│   └── create-worktree.sh # D-3 S-2 O-1 git worktree add -b task/TASK-*/<slug> main
├── server/src/services/
│   ├── run-correlation.ts # D-4 S-2 O-2 TASK→RUN run_id dedup §35 logRunEvent §37
│   ├── heartbeat.ts # D-4 S-2 O-3 15m 900000 cron §21 heartbeatTick shouldWake
│   ├── retry.ts # S-3 O-3 MAX_RETRIES 3 withRetry files_changed alias
│   ├── specialist-opencode.ts # S-3 O-1..O-2 §22 buildOpencodeRequest delegateToOpencode specialist_started/completed §37
│   ├── memory.ts # S-4 O-2 Map + .hermes/memory/<agent>.md survives sleep/wake
│   ├── observability.ts # S-4 O-3 emitLog §37 getMetrics §38 buildAgentView/buildTaskView §36
│   ├── budget.ts # S-4 O-3 $20/$300 §59 recordCost warn 80% blocked 100%
│   └── agent-run.ts # S-4 O-1 ties 17 steps ensureWorktree → createRun → delegate → saveMemory → metrics → completeRun
├── .github/workflows/ci.yml # S-1 on push/PR main pnpm install docker compose config pnpm test
├── workspaces/demo/ # created by scripts/create-worktree.sh, git worktrees per S-2, shared via bind mount D-2 §44
├── idea.md # source PRD §1-70
└── README.md # this file
```

## Testing

```bash
pnpm test --reporter=verbose # healthcheck + worktree + opencode + e2e 25 passed Duration 506ms
docker compose config > /dev/null && echo ok # v2026.824.1
bash scripts/create-worktree.sh demo frontend-engineer 10 "Build hello page" && git -C workspaces/demo/main worktree list
pnpm dlx tsx /tmp/demo-e2e.ts # full lifecycle without Docker, 2.20 attribution
```

## Verification (Manual Walkthrough S-4 issue #11)

`S-4` `O-1..O-3` `10` steps `issue #11` `Manual walkthrough` (requires `docker compose up -d` + `pnpm test` + `http://localhost:3100` real):

1. `git clone https://github.com/mjldotdev/paperclip-ai && cd paperclip-ai && git checkout main && docker compose up -d && pnpm install && pnpm test` → `25 passed`
2. `http://localhost:3100` create project `demo`, agent `frontend-engineer` `hermes_gateway` `persistSession true` `daily 20 monthly 300`
3. Create `TASK-010` `Build hello page` `In demo at /workspaces/demo/main (Next.js+Tailwind) create src/pages/hello.tsx` assigned → heartbeat or `Run`
4. `docker logs paperclip -f` `heartbeat_started` `frontend-engineer` `TASK-010` `docker logs hermes -f` `specialist_started opencode` `workspace .../worktrees/frontend-engineer-TASK-10`
5. `docker logs opencode -f` `modify code → run tests → passed 1` `docker logs hermes | grep TASK-010.*specialist_completed` `files_changed ["src/hello.ts"]`
6. `ls workspaces/demo/worktrees/frontend-engineer-TASK-010/src/pages/hello.tsx` + `git -C workspaces/demo/main worktree list` `task/TASK-10/build-hello-page`
7. Paperclip Task `TASK-010` `done` `TaskView` `Hermes planning → OpenCode implementation → OpenCode tests → Hermes review → done` `AgentView` `Sleeping→Working` `Elapsed` `Tokens $0.40`
8. `docker exec hermes cat ~/.hermes/memory/frontend-engineer.md` or `cat .hermes/memory/frontend-engineer.md` → `demo uses Next.js + Tailwind`
9. `TASK-011` `Add hello test` reuse → `hermes` plan references prior lesson without re-injection
10. `docker logs paperclip | grep TASK-010.*cost` `Hermes $0.40 + OpenCode $1.80 = Total $2.20` `§59` `docker logs hermes | grep agy | wc -l` `0` `D-6` `podman ps` `3-4` healthy

## gsd-loop

This repo uses `gsd-loop` for continuous delivery: `gh repo view --json nameWithOwner` `mjldotdev/paperclip-ai` `main` `origin` `ghd`.

- Discovery map [#1](https://github.com/mjldotdev/paperclip-ai/issues/1) `CLOSED` `6` `D` (`#2` `Research` `v2026.824.1` `hermes_gateway` `runId` → `#3` `Discussion` `Compose` `/workspaces` `770` → `#4` `Research` `worktree` `task/TASK-*` → `#5` `Research` `TASK→RUN` `15m` → `#6` `Discussion` `logs/metrics/budgets` → `#7` `Discussion` `AGY` deferred) `Not yet specified: None` `Graduation: Ready for gsd-loop-spec` `plan sha256:54b6e1`
- Queue slices `S-1..S-4` `CLOSED` via `MERGED` `gsd:ready` `→` `gsd/NNN-*` `→` `PR` `→` `LINKAGE_SYNC` `ensure-linkage.mjs` `→` `MERGED` `Closes #N`: `S-1` `#8→#12` `1968855`, `S-2` `#9→#13` `7737de8`, `S-3` `#10→#14` `72d03c7`, `S-4` `#11→#15` `4b9fc03`
- Labels: `gsd:map`, `gsd:ready` (human gate, builder never applies), `gsd:blocked`/`gsd:approved`/`gsd:rework`/`gsd:escalated` (review). `gsd:ready` oldest `S-N` safe (`Needs #N merged` checks `closedByPullRequestsReferences` `MERGED`) → `build` `one` PR per pass, `review` `loop/review.md` never merges.

See `idea.md` `§49-56` `§55` `16` steps success, `§56` `AGY` `PASS`, `§57` security, `§58` `99%`, `§69` `Version 1` `DONE`.

## Real Paperclip UI vs Mock

`S-1` `docker-compose.yml:22` shipped mock `node:20-alpine` `h1 Paperclip mock S-1 OK` to prove wiring `O-4` `TASK-001` without building upstream (`podman build` `~5-10m` `cargo` missing `gyp` `ssh2` `1m30s` `pnpm install` `1251` packages). Real `Paperclip` `0.3.1` `local_trusted` now runs at same `3100` via `systemd-run --user` `paperclip-dev` `Active: active (running)` `1.2G` in `/tmp/paperclip` `external-postgres` `vite-dev-middleware` `Server listening on 127.0.0.1:3100` `UI http://127.0.0.1:3100` `API /api/health` `{"status":"ok","version":"0.3.1"}`. Swap: `podman build -t paperclipai/paperclip:v2026.824.1 -f /tmp/paperclip/Dockerfile /tmp/paperclip` then `image: paperclipai/paperclip:v2026.824.1` in `docker-compose.yml:22` or keep `pnpm dev` in `/tmp/paperclip` — control plane stays canonical, only `Hermes`/`OpenCode` are our changed runtimes per `idea.md:3`.
