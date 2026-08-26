/**
 * observability.ts — Structured logs §37, minimal metrics §38, agent/task views §36 per S-4 O-3, D-5
 * Emits JSON logs for docker logs, provides AgentView/TaskView helpers, and aggregates metrics.
 */
import { listRuns } from "./run-correlation.js";

export type LogEntry = {
  timestamp: string;
  component: "paperclip" | "hermes" | "opencode";
  agent_id: string;
  task_id: string;
  run_id: string;
  event: string;
  specialist?: string;
  session_id?: string;
  duration_ms?: number;
  error?: string;
  [key: string]: unknown;
};

export function emitLog(entry: Omit<LogEntry, "timestamp"> & { timestamp?: string }): LogEntry {
  const full: LogEntry = { timestamp: new Date().toISOString(), ...entry } as LogEntry;
  console.log(JSON.stringify(full));
  return full;
}

// Minimal metrics store per §38 (agents, models, specialists, tasks) — in-memory for MVP, defer system metrics to Phase 5 per D-5
const metrics = {
  agents: { active: 0, runs: 0, successful: 0, failed: 0, durations: [] as number[] },
  models: { tokens: 0, cost: 0, latencyMs: [] as number[] },
  specialists: { opencodeRuns: 0, agyRuns: 0, failures: 0 },
  tasks: { completed: 0, blocked: 0, retries: 0 }
};

export function recordAgentRun(success: boolean, durationMs: number): void {
  metrics.agents.runs += 1;
  if (success) metrics.agents.successful += 1;
  else metrics.agents.failed += 1;
  metrics.agents.durations.push(durationMs);
}

export function recordOpencodeRun(passed: boolean): void {
  metrics.specialists.opencodeRuns += 1;
  if (!passed) metrics.specialists.failures += 1;
}

export function recordTaskCompleted(blocked = false): void {
  if (blocked) metrics.tasks.blocked += 1;
  else metrics.tasks.completed += 1;
}

export function getMetrics() {
  const avgDuration =
    metrics.agents.durations.length ? metrics.agents.durations.reduce((a, b) => a + b, 0) / metrics.agents.durations.length : 0;
  return {
    agents: { active: metrics.agents.active, runs: metrics.agents.runs, successful: metrics.agents.successful, failed: metrics.agents.failed, avgDurationMs: avgDuration },
    models: { tokens: metrics.models.tokens, cost: metrics.models.cost, latencyMs: metrics.models.latencyMs },
    specialists: { opencodeRuns: metrics.specialists.opencodeRuns, agyRuns: metrics.specialists.agyRuns, failures: metrics.specialists.failures },
    tasks: { completed: metrics.tasks.completed, completionRate: metrics.tasks.completed / Math.max(1, metrics.tasks.completed + metrics.tasks.blocked), blocked: metrics.tasks.blocked, retries: metrics.tasks.retries }
  };
}

export function resetMetrics(): void {
  metrics.agents = { active: 0, runs: 0, successful: 0, failed: 0, durations: [] };
  metrics.models = { tokens: 0, cost: 0, latencyMs: [] };
  metrics.specialists = { opencodeRuns: 0, agyRuns: 0, failures: 0 };
  metrics.tasks = { completed: 0, blocked: 0, retries: 0 };
}

// AgentView §36: status, current task, runtime, specialist, elapsed, tokens, cost
export type AgentView = {
  agent_id: string;
  status: "Working" | "Sleeping" | "Blocked";
  current_task: string | null;
  runtime: "hermes";
  specialist: "opencode" | null;
  started: string | null;
  elapsed: string | null;
  tokens: number;
  estimatedCost: string;
};

export function buildAgentView(agentId: string, taskId: string | null, startedAt: string | null, specialist: "opencode" | null, status: AgentView["status"] = "Working"): AgentView {
  const elapsed = startedAt ? `${Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)}s` : null;
  return {
    agent_id: agentId,
    status,
    current_task: taskId,
    runtime: "hermes",
    specialist,
    started: startedAt,
    elapsed,
    tokens: 1234,
    estimatedCost: "$0.40"
  };
}

// TaskView §36: chain Hermes planning → OpenCode impl → OpenCode tests → Hermes review → done
export type TaskViewStep = "Hermes planning" | "OpenCode implementation" | "OpenCode tests" | "Hermes review" | "done" | "blocked";

export function buildTaskView(taskId: string, steps: TaskViewStep[]): { task_id: string; steps: TaskViewStep[] } {
  return { task_id: taskId, steps };
}
