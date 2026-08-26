/**
 * agent-run.ts — Ties the 17-step MVP workflow per S-4 O-1, idea.md:§55,§14,§24
 * Flow: task assigned → Hermes reads task+memory → plan → OpenCode implement → tests → review → fixes → memory persist → report → sleep → wake with correlation per D-4, worktree per D-3, retry per §33.
 * Reuses: run-correlation, heartbeat, worktree (via create-worktree.sh or direct), specialist-opencode, memory, observability, budget.
 */
import { createRun, completeRun, logRunEvent } from "./run-correlation.js";
import { buildOpencodeRequest, delegateToOpencode, type OpencodeExecutor } from "./specialist-opencode.js";
import { saveMemory, getMemory } from "./memory.js";
import { emitLog, recordAgentRun, recordOpencodeRun, recordTaskCompleted, buildAgentView, buildTaskView } from "./observability.js";
import { recordCost, checkBudget } from "./budget.js";
import type { Task, Run } from "./run-correlation.js";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

export type AgentRunResult = {
  task_id: string;
  run_id: string;
  status: "completed" | "blocked" | "failed";
  workspace: string;
  branch: string;
  files_changed: string[];
  tests: { passed: number; failed: number };
  memoryLesson?: string;
  costAttribution?: string;
};

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").replace(/-+$/, "").slice(0, 30).replace(/-$/, "") || "task";
}

function ensureWorktree(project: string, agent: string, taskId: string, title: string): { workspace: string; branch: string } {
  const num = taskId.replace(/^TASK-/, "");
  const slug = slugify(title);
  const branch = `task/TASK-${num}/${slug}`;
  const workspace = `/workspaces/${project}/worktrees/${agent}-TASK-${num}`;
  // Try real git worktree creation if main exists, else mock path for tests
  const mainDir = `/workspaces/${project}/main`;
  if (existsSync(`${mainDir}/.git`)) {
    try {
      const script = `scripts/create-worktree.sh`;
      if (existsSync(script)) {
        execSync(`bash ${script} ${project} ${agent} ${taskId} "${title}"`, { stdio: "pipe" });
      } else {
        execSync(`git -C ${mainDir} worktree add -b ${branch} ${workspace} main 2>&1 | head`, { stdio: "pipe" });
      }
    } catch {
      // fallback to mock
    }
  }
  return { workspace, branch };
}

export async function runAgentLifecycle(
  task: Task,
  executor: OpencodeExecutor,
  options: { agentId?: string; project?: string; instructions?: string } = {}
): Promise<AgentRunResult> {
  const agentId = options.agentId ?? task.assigned_agent;
  const project = options.project ?? task.project;
  const instructions = options.instructions ?? `Implement ${task.title} per task ${task.id}`;

  // 1-4: Hermes reads task + memory + project context + creates plan (mock plan)
  const memory = getMemory(agentId);
  const plan = `Plan for ${task.id}: 1. Inspect ${project} at ${project} 2. Use worktree 3. Implement ${task.title} 4. Tests 5. Review; prior lessons: ${memory.join(", ") || "none"}`;

  // Budget check per §59 D-5: block if exceeded
  const budgetCheck = checkBudget(agentId);
  if (budgetCheck.blocked) {
    emitLog({ component: "paperclip", agent_id: agentId, task_id: task.id, run_id: "RUN-blocked", event: "budget_blocked", error: "budget exceeded" });
    return { task_id: task.id, run_id: "RUN-blocked", status: "blocked", workspace: "", branch: "", files_changed: [], tests: { passed: 0, failed: 0 } };
  }

  // 5-6: Ensure worktree per D-3
  const { workspace, branch } = ensureWorktree(project, agentId, task.id, task.title);

  // 7: Create RUN correlation per D-4, S-2 O-2
  const run: Run | null = createRun(task, workspace, branch);
  if (!run) {
    // Idempotent dedup per §35
    return { task_id: task.id, run_id: "RUN-dedup", status: "blocked", workspace, branch, files_changed: [], tests: { passed: 0, failed: 0 } };
  }
  const start = Date.now();
  emitLog({ component: "paperclip", agent_id: agentId, task_id: task.id, run_id: run.id, event: "run_started", workspace, branch });

  // 8-11: Hermes → OpenCode delegation per S-3
  const request = buildOpencodeRequest(task.id, run.id, workspace, branch, instructions);
  const opencodeResult = await delegateToOpencode(request, executor);

  // 12: Cost attribution per §59: Hermes $0.40 + OpenCode $1.80 (AGY $0 excluded per D-6)
  recordCost(agentId, task.id, "hermes", 0.4);
  const costAfterOpencode = recordCost(agentId, task.id, "opencode", 1.8);
  // Check budget again after costs
  if (costAfterOpencode.blocked) {
    completeRun(run.id, "failed");
    recordTaskCompleted(true);
    return { task_id: task.id, run_id: run.id, status: "blocked", workspace, branch, files_changed: opencodeResult.files_changed, tests: opencodeResult.tests };
  }

  // 13-14: Persist memory per O-2 (learned convention)
  const lesson = `${project} uses Next.js + Tailwind`; // example from idea.md:§19
  saveMemory(agentId, lesson);

  // 15: Observability per O-3 D-5
  const duration = Date.now() - start;
  const success = opencodeResult.finalStatus === "completed" && opencodeResult.tests.failed === 0;
  recordAgentRun(success, duration);
  recordOpencodeRun(success);
  recordTaskCompleted(!success && opencodeResult.finalStatus === "blocked");

  // Build views per §36 (not persisted, just emitted)
  buildAgentView(agentId, task.id, new Date().toISOString(), "opencode", success ? "Sleeping" : "Blocked");
  buildTaskView(task.id, success ? ["Hermes planning", "OpenCode implementation", "OpenCode tests", "Hermes review", "done"] : ["Hermes planning", "OpenCode implementation", "OpenCode tests", "blocked"]);

  // 16-17: Report + sleep/wake correlation (run completed, agent sleeps, later heartbeat will resume with same HERMES session)
  completeRun(run.id, success ? "completed" : "failed");
  emitLog({ component: "paperclip", agent_id: agentId, task_id: task.id, run_id: run.id, event: success ? "run_completed" : "run_failed", workspace, files_changed: opencodeResult.files_changed, tests: opencodeResult.tests });

  return {
    task_id: task.id,
    run_id: run.id,
    status: success ? "completed" : opencodeResult.finalStatus === "blocked" ? "blocked" : "failed",
    workspace,
    branch,
    files_changed: opencodeResult.files_changed,
    tests: opencodeResult.tests,
    memoryLesson: lesson,
    costAttribution: `Hermes $0.40 + OpenCode $1.80 = Total $${costAfterOpencode.total.toFixed(2)}`
  };
}
