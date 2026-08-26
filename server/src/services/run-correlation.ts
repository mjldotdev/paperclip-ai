/**
 * run-correlation.ts — TASK→RUN→Hermes correlation with run_id idempotency per D-4, S-2 O-2, idea.md:§15-16,§35
 * Paperclip source of truth per §40; run_id uniqueness enforced before invoking Hermes.
 */

export type Task = {
  id: string; // TASK-<num>
  project: string;
  title: string;
  assigned_agent: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "done" | "blocked";
};

export type Run = {
  id: string; // RUN-<num>
  task_id: string;
  agent_id: string;
  started_at: string; // ISO8601
  status: "running" | "completed" | "failed";
  workspace?: string;
  branch?: string;
  session_id?: string; // HERMES-*
};

const runs = new Map<string, Run>();
let runCounter = 0;

export function nextRunId(): string {
  runCounter += 1;
  return `RUN-${runCounter}`;
}

export function createRun(task: Task, workspace: string, branch: string, sessionId?: string): Run | null {
  // Idempotency: if a run already exists for this task with same workspace/branch and is still running, deduplicate
  // In real Paperclip DB, this would be a uniqueness constraint on run_id; here we dedupe by task_id+workspace that is still running
  for (const existing of runs.values()) {
    if (existing.task_id === task.id && existing.workspace === workspace && existing.status === "running") {
      // Deduplicate: return null to indicate caller should not create duplicate specialist execution per §35
      return null;
    }
  }
  const run: Run = {
    id: nextRunId(),
    task_id: task.id,
    agent_id: task.assigned_agent,
    started_at: new Date().toISOString(),
    status: "running",
    workspace,
    branch,
    session_id: sessionId ?? `HERMES-${task.id}-${Date.now()}`
  };
  runs.set(run.id, run);
  return run;
}

export function completeRun(runId: string, status: "completed" | "failed"): void {
  const run = runs.get(runId);
  if (run) run.status = status;
}

export function getRun(runId: string): Run | undefined {
  return runs.get(runId);
}

export function listRuns(): Run[] {
  return [...runs.values()];
}

export function clearRuns(): void {
  runs.clear();
  runCounter = 0;
}

// Structured log helper per §37
export function logRunEvent(run: Run, event: string, component: "paperclip" | "hermes" | "opencode", extra: Record<string, unknown> = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    component,
    agent_id: run.agent_id,
    task_id: run.task_id,
    run_id: run.id,
    event,
    ...extra
  };
  // In production, this JSON goes to stdout for docker logs
  // Here we console.log as JSON string
  console.log(JSON.stringify(entry));
}
