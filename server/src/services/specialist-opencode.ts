/**
 * specialist-opencode.ts — Hermes→OpenCode delegation per S-3 O-1..O-2, idea.md:§9,§22, D-4
 * Builds §22 JSON payload from run_id/task_id/workspace/branch plus instructions, invokes via MCP or docker exec fallback.
 */
import { logRunEvent } from "./run-correlation.js";
import { withRetry, logRetryAttempt } from "./retry.js";

export type OpencodeRequest = {
  task_id: string;
  run_id: string;
  workspace: string;
  branch: string;
  specialist: "opencode";
  operation: "implement";
  instructions: string;
  timeout_seconds: number;
};

export type OpencodeResult = {
  task_id: string;
  specialist: "opencode";
  status: "completed" | "failed";
  summary: string;
  files_changed: string[];
  tests: { passed: number; failed: number };
};

export function buildOpencodeRequest(
  taskId: string,
  runId: string,
  workspace: string,
  branch: string,
  instructions: string,
  timeoutSeconds = 1800
): OpencodeRequest {
  if (!taskId.startsWith("TASK-")) throw new Error(`task_id must start with TASK- got ${taskId}`);
  if (!runId.startsWith("RUN-")) throw new Error(`run_id must start with RUN- got ${runId}`);
  if (!workspace.startsWith("/workspaces/")) throw new Error(`workspace must be under /workspaces/ got ${workspace}`);
  return {
    task_id: taskId,
    run_id: runId,
    workspace,
    branch,
    specialist: "opencode",
    operation: "implement",
    instructions,
    timeout_seconds: timeoutSeconds
  };
}

// Mockable executor: in production this would call MCP tool `opencode` or `docker exec opencode`
export type OpencodeExecutor = (req: OpencodeRequest) => Promise<OpencodeResult>;

export async function delegateToOpencode(
  request: OpencodeRequest,
  executor: OpencodeExecutor
): Promise<OpencodeResult & { attempts: number; finalStatus: "completed" | "blocked" }> {
  // Log specialist_started per §37 with correlation
  logRunEvent(
    { id: request.run_id, task_id: request.task_id, agent_id: "hermes", started_at: new Date().toISOString(), status: "running", workspace: request.workspace, branch: request.branch } as any,
    "specialist_started",
    "hermes",
    { specialist: "opencode", workspace: request.workspace, instructions: request.instructions.slice(0, 80) }
  );

  const result = await withRetry(
    async (attempt) => {
      const r = await executor(request);
      logRetryAttempt(request.task_id, request.run_id, attempt, r.tests);
      return r;
    },
    () => {}
  );

  const status = result.finalStatus === "completed" ? "completed" : "failed";
  const summary = status === "completed" ? `Implemented ${request.task_id} in ${result.attempts} attempt(s)` : `Blocked after ${result.attempts} attempts with failing tests`;

  // Log specialist_completed per §37
  logRunEvent(
    { id: request.run_id, task_id: request.task_id, agent_id: "hermes", started_at: new Date().toISOString(), status: "running", workspace: request.workspace, branch: request.branch } as any,
    "specialist_completed",
    "hermes",
    { specialist: "opencode", files_changed: result.files_changed, tests: result.tests, attempts: result.attempts, finalStatus: result.finalStatus }
  );

  if (result.finalStatus === "blocked") {
    logRunEvent(
      { id: request.run_id, task_id: request.task_id, agent_id: "hermes", started_at: new Date().toISOString(), status: "running", workspace: request.workspace, branch: request.branch } as any,
      "run_failed",
      "paperclip",
      { reason: "blocked", maxDepth: 2 }
    );
  }

  return {
    task_id: request.task_id,
    specialist: "opencode",
    status,
    summary,
    files_changed: result.files_changed,
    tests: result.tests,
    attempts: result.attempts,
    finalStatus: result.finalStatus
  };
}

// Default mock executor for S-3 tests and S-1 placeholder: pretends to modify src/hello.ts and pass tests
export async function mockOpencodeExecutorSuccess(req: OpencodeRequest): Promise<OpencodeResult> {
  // Simulate file creation in worktree - in real would use OpenCode terminal
  // Here we just return success
  return {
    task_id: req.task_id,
    specialist: "opencode",
    status: "completed",
    summary: `Mocked implementation for ${req.task_id}`,
    files_changed: ["src/hello.ts"],
    tests: { passed: 1, failed: 0 }
  };
}

export async function mockOpencodeExecutorFailThenSuccess(req: OpencodeRequest): Promise<OpencodeResult> {
  // Used to test retry: fail first 2 attempts, succeed on 3rd
  let callCount = (mockOpencodeExecutorFailThenSuccess as any)._count ?? 0;
  (mockOpencodeExecutorFailThenSuccess as any)._count = callCount + 1;
  if (callCount < 2) {
    return { task_id: req.task_id, specialist: "opencode", status: "completed", summary: "fail", files_changed: ["src/hello.ts"], tests: { passed: 0, failed: 1 } };
  }
  return { task_id: req.task_id, specialist: "opencode", status: "completed", summary: "ok", files_changed: ["src/hello.ts"], tests: { passed: 1, failed: 0 } };
}
