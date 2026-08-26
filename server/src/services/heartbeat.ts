/**
 * heartbeat.ts — Paperclip heartbeat scheduler per D-4, S-2 O-3, idea.md:§20,§21,§48
 * Manages 15m global heartbeat (heartbeatIntervalMs: 900000 or cron every-15m) and per-agent cron e.g. 0 2 * * *
 * Wakes Hermes with task+memory+workspace context when TASK is open assigned to agent, else sleeps.
 */
import { createRun, logRunEvent, type Task } from "./run-correlation.js";

export type HeartbeatConfig = {
  intervalMs?: number; // default 900000 = 15m per §48
  cron?: string; // alternative cron per §21, e.g. "0 2 * * *" or "*/15 * * * *"
};

export type HeartbeatResult =
  | { event: "heartbeat_started"; task: Task; runId: string; workspace: string; branch: string }
  | { event: "heartbeat_sleep"; agent_id: string };

const DEFAULT_INTERVAL_MS = 900_000; // 15m

export function shouldWake(task: Task | null, agentId: string): boolean {
  if (!task) return false;
  return task.assigned_agent === agentId && (task.status === "open" || task.status === "in_progress");
}

export function heartbeatTick(task: Task | null, agentId: string, workspace: string, branch: string): HeartbeatResult {
  if (!shouldWake(task, agentId)) {
    const runLike = { id: `RUN-0`, task_id: task?.id ?? "NONE", agent_id: agentId, started_at: new Date().toISOString(), status: "running" as const };
    logRunEvent(runLike as any, "heartbeat_sleep", "paperclip", { agent_id: agentId });
    return { event: "heartbeat_sleep", agent_id: agentId };
  }

  // Deduplication via run-correlation: createRun returns null if same task+workspace already running
  const run = createRun(task!, workspace, branch);
  if (!run) {
    // Idempotency: same RUN deduped per §35, treat as sleep to avoid duplicate specialist execution
    logRunEvent(
      { id: `RUN-dedup`, task_id: task!.id, agent_id: agentId, started_at: new Date().toISOString(), status: "running", workspace, branch } as any,
      "heartbeat_sleep",
      "paperclip",
      { reason: "run_id deduped", task_id: task!.id }
    );
    return { event: "heartbeat_sleep", agent_id: agentId };
  }

  logRunEvent(run, "heartbeat_started", "paperclip", { workspace, branch, cron: "every-15m" });
  // Simulate Hermes wake: log specialist_started with same run_id per §37
  logRunEvent(run, "specialist_started", "hermes", { specialist: "hermes", workspace });
  return { event: "heartbeat_started", task, runId: run.id, workspace, branch };
}

export function parseCron(cron: string): boolean {
  // Minimal validation for cron like "*/15 * * * *" or "0 2 * * *"
  const parts = cron.trim().split(/\s+/);
  return parts.length === 5 && parts.every((p) => /^[\d*/,\-]+$/.test(p));
}

export class HeartbeatScheduler {
  private timer: NodeJS.Timeout | null = null;
  constructor(
    private readonly agentId: string,
    private readonly config: HeartbeatConfig = {},
    private readonly taskProvider: () => Task | null,
    private readonly workspaceProvider: () => { workspace: string; branch: string }
  ) {}

  start(): void {
    const interval = this.config.intervalMs ?? DEFAULT_INTERVAL_MS;
    if (this.config.cron && !parseCron(this.config.cron)) throw new Error(`invalid cron: ${this.config.cron}`);
    this.timer = setInterval(() => {
      const task = this.taskProvider();
      const { workspace, branch } = this.workspaceProvider();
      heartbeatTick(task, this.agentId, workspace, branch);
    }, interval);
    // Do not keep process alive just for heartbeat in tests
    if (this.timer && typeof (this.timer as any).unref === "function") (this.timer as any).unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
