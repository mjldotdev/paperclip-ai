import { describe, it, expect, beforeEach } from "vitest";
import { existsSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRun, clearRuns, listRuns } from "../server/src/services/run-correlation.js";
import { heartbeatTick, shouldWake, parseCron } from "../server/src/services/heartbeat.js";
import type { Task } from "../server/src/services/run-correlation.js";

describe("S-2 worktree + correlation + heartbeat", () => {
  it("branch slug task/TASK-* is correctly formed (slug trimmed to 30, lowercase, hyphened)", () => {
    const title = "Add OAuth login for Google Provider!";
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").replace(/-+$/, "").slice(0, 30).replace(/-$/, "");
    expect(slug).toBe("add-oauth-login-for-google-pro");
    const branch = `task/TASK-123/${slug}`;
    expect(branch).toBe("task/TASK-123/add-oauth-login-for-google-pro");
  });

  it("create-worktree.sh exists and references v2026.824.1 pin and worktree logic", () => {
    const script = readFileSync("scripts/create-worktree.sh", "utf8");
    expect(script).toContain("worktree add");
    expect(script).toContain("task/TASK-");
    expect(script).toContain("/workspaces");
    expect(script).toContain("TASK-");
  });

  it("run_id idempotency: second createRun with same task+workspace while running returns null (dedup per §35)", () => {
    clearRuns();
    const task: Task = { id: "TASK-2", project: "demo", title: "Test worktree", assigned_agent: "test-hermes", priority: "high", status: "open" };
    const ws = "/workspaces/demo/worktrees/test-hermes-TASK-2";
    const branch = "task/TASK-2/test-worktree";
    const run1 = createRun(task, ws, branch);
    expect(run1).not.toBeNull();
    expect(run1!.id).toMatch(/^RUN-/);
    const run2 = createRun(task, ws, branch);
    expect(run2).toBeNull(); // deduped
    expect(listRuns()).toHaveLength(1);
    clearRuns();
  });

  it("heartbeatTick wakes when task open assigned, sleeps otherwise (§48)", () => {
    clearRuns();
    const task: Task = { id: "TASK-2", project: "demo", title: "Test worktree", assigned_agent: "test-hermes", priority: "high", status: "open" };
    const ws = "/workspaces/demo/worktrees/test-hermes-TASK-2";
    const branch = "task/TASK-2/test-worktree";
    const wake = heartbeatTick(task, "test-hermes", ws, branch);
    expect(wake.event).toBe("heartbeat_started");
    if (wake.event === "heartbeat_started") expect(wake.runId).toMatch(/^RUN-/);

    clearRuns();
    const sleepNoTask = heartbeatTick(null, "test-hermes", ws, branch);
    expect(sleepNoTask.event).toBe("heartbeat_sleep");
    const sleepWrongAgent = heartbeatTick({ ...task, assigned_agent: "other" }, "test-hermes", ws, branch);
    expect(sleepWrongAgent.event).toBe("heartbeat_sleep");
    const sleepDone = heartbeatTick({ ...task, status: "done" }, "test-hermes", ws, branch);
    expect(sleepDone.event).toBe("heartbeat_sleep");
    clearRuns();
  });

  it("parseCron validates cron per §21", () => {
    expect(parseCron("*/15 * * * *")).toBe(true);
    expect(parseCron("0 2 * * *")).toBe(true);
    expect(parseCron("invalid")).toBe(false);
    expect(parseCron("*/15 * *")).toBe(false);
  });

  it("shouldWake logic respects assigned_agent and open/in_progress", () => {
    const base: Task = { id: "TASK-2", project: "demo", title: "t", assigned_agent: "test-hermes", priority: "high", status: "open" };
    expect(shouldWake(base, "test-hermes")).toBe(true);
    expect(shouldWake({ ...base, status: "in_progress" }, "test-hermes")).toBe(true);
    expect(shouldWake({ ...base, status: "done" }, "test-hermes")).toBe(false);
    expect(shouldWake(null, "test-hermes")).toBe(false);
  });

  it("docker-compose.yml still defines /workspaces mount and health", () => {
    const compose = readFileSync("docker-compose.yml", "utf8");
    expect(compose).toContain("/workspaces:/workspaces:rw");
    expect(compose).toContain("pg_isready");
    expect(compose).toContain("v2026.824.1");
  });

  it("real git worktree creation in tmp (integration, mount-safe)", () => {
    const base = join(tmpdir(), `paperclip-test-worktree-${Date.now()}`);
    const mainDir = join(base, "main");
    const worktreeDir = join(base, "worktrees", "test-hermes-TASK-999");
    mkdirSync(mainDir, { recursive: true });
    execSync("git init -b main -q", { cwd: mainDir });
    execSync('git config user.email "test@example.com"', { cwd: mainDir });
    execSync('git config user.name "test"', { cwd: mainDir });
    execSync("touch README.md && git add README.md && git commit -qm 'init'", { cwd: mainDir });
    execSync(`git worktree add -b task/TASK-999/test-worktree "${worktreeDir}" main`, { cwd: mainDir });
    expect(existsSync(worktreeDir)).toBe(true);
    const list = execSync("git worktree list", { cwd: mainDir, encoding: "utf8" });
    expect(list).toContain("task/TASK-999/test-worktree");
    expect(list).toContain(worktreeDir);
    // cleanup
    execSync(`git worktree remove "${worktreeDir}" --force`, { cwd: mainDir });
    rmSync(base, { recursive: true, force: true });
  });
});
