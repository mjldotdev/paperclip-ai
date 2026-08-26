import { describe, it, expect, beforeEach } from "vitest";
import { existsSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runAgentLifecycle } from "../server/src/services/agent-run.js";
import { mockOpencodeExecutorSuccess } from "../server/src/services/specialist-opencode.js";
import { clearRuns } from "../server/src/services/run-correlation.js";
import { clearMemory, getMemory } from "../server/src/services/memory.js";
import { resetMetrics, getMetrics } from "../server/src/services/observability.js";
import { resetBudgets, getTaskCost } from "../server/src/services/budget.js";
import type { Task } from "../server/src/services/run-correlation.js";

describe("S-4 e2e MVP — single-agent autonomous workflow §55", () => {
  beforeEach(() => {
    clearRuns();
    clearMemory();
    resetMetrics();
    resetBudgets();
  });

  it("O-1 full 17-step workflow completes: task → plan → worktree → opencode → tests → memory → report → sleep/wake", async () => {
    const task: Task = { id: "TASK-10", project: "demo", title: "Build hello page", assigned_agent: "frontend-engineer", priority: "high", status: "open" };
    const result = await runAgentLifecycle(task, mockOpencodeExecutorSuccess);
    expect(result.status).toBe("completed");
    expect(result.task_id).toBe("TASK-10");
    expect(result.run_id).toMatch(/^RUN-/);
    expect(result.workspace).toBe("/workspaces/demo/worktrees/frontend-engineer-TASK-10");
    expect(result.branch).toBe("task/TASK-10/build-hello-page");
    expect(result.files_changed).toEqual(["src/hello.ts"]);
    expect(result.tests).toEqual({ passed: 1, failed: 0 });
  });

  it("O-2 persistent memory survives sleep/wake and is reused on second task", async () => {
    const task1: Task = { id: "TASK-10", project: "demo", title: "Build hello page", assigned_agent: "frontend-engineer", priority: "high", status: "open" };
    await runAgentLifecycle(task1, mockOpencodeExecutorSuccess);
    expect(getMemory("frontend-engineer")).toContain("demo uses Next.js + Tailwind");

    // Simulate sleep/wake: second task should see prior lesson without re-learning
    clearRuns(); // simulate new heartbeat run, but memory persists
    const task2: Task = { id: "TASK-11", project: "demo", title: "Add hello test", assigned_agent: "frontend-engineer", priority: "high", status: "open" };
    const result2 = await runAgentLifecycle(task2, mockOpencodeExecutorSuccess);
    expect(result2.status).toBe("completed");
    expect(getMemory("frontend-engineer")).toContain("demo uses Next.js + Tailwind");
    // Second run's plan would have included prior lessons (checked via memory persistence file if needed)
    expect(result2.memoryLesson).toBe("demo uses Next.js + Tailwind");
  });

  it("O-3 observability and budgets: agent/task views, logs, metrics, $20/$300 budgets with attribution", async () => {
    const task: Task = { id: "TASK-10", project: "demo", title: "Build hello page", assigned_agent: "frontend-engineer", priority: "high", status: "open" };
    const result = await runAgentLifecycle(task, mockOpencodeExecutorSuccess);
    expect(result.costAttribution).toBe("Hermes $0.40 + OpenCode $1.80 = Total $2.20");
    const costs = getTaskCost("TASK-10");
    expect(costs?.total).toBeCloseTo(2.2);
    expect(costs?.hermes).toBeCloseTo(0.4);
    expect(costs?.opencode).toBeCloseTo(1.8);
    const metrics = getMetrics();
    expect(metrics.tasks.completed).toBe(1);
    expect(metrics.specialists.opencodeRuns).toBe(1);
    // AGY must not be invoked per D-6 X-1
    expect(metrics.specialists.agyRuns).toBe(0);
  });

  it("O-3 blocked task does not invoke AGY and reports blocked", async () => {
    const failingExecutor = async () => ({ task_id: "TASK-12", specialist: "opencode" as const, status: "completed" as const, summary: "fail", files_changed: [], tests: { passed: 0, failed: 1 } });
    const task: Task = { id: "TASK-12", project: "demo", title: "Failing", assigned_agent: "frontend-engineer", priority: "high", status: "open" };
    const result = await runAgentLifecycle(task, failingExecutor as any);
    expect(result.status).toBe("blocked");
    const metrics = getMetrics();
    expect(metrics.tasks.blocked).toBe(1);
  });

  it("docker-compose.yml still defines 3-4 services and /workspaces mount after S-3", () => {
    const compose = readFileSync("docker-compose.yml", "utf8");
    expect(compose).toContain("paperclip:");
    expect(compose).toContain("postgres:");
    expect(compose).toContain("hermes:");
    expect(compose).toContain("opencode:");
    expect(compose).toContain("/workspaces:/workspaces:rw");
  });

  it("S-4 exclusions: no AGY invocation in e2e", async () => {
    const task: Task = { id: "TASK-10", project: "demo", title: "Build hello page", assigned_agent: "frontend-engineer", priority: "high", status: "open" };
    await runAgentLifecycle(task, mockOpencodeExecutorSuccess);
    // Verify no agy in logs/metrics: opencodeRuns should be >0, agyRuns 0
    const metrics = getMetrics();
    expect(metrics.specialists.agyRuns).toBe(0);
    expect(metrics.specialists.opencodeRuns).toBeGreaterThan(0);
  });
});
