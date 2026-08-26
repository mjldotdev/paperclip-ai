import { describe, it, expect, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { buildOpencodeRequest, delegateToOpencode, mockOpencodeExecutorSuccess } from "../server/src/services/specialist-opencode.js";
import { withRetry, MAX_RETRIES } from "../server/src/services/retry.js";

describe("S-3 opencode delegation + retry", () => {
  it("buildOpencodeRequest validates §22 contract shape (task_id, run_id, workspace, timeout)", () => {
    const req = buildOpencodeRequest("TASK-3", "RUN-3", "/workspaces/demo/worktrees/test-hermes-TASK-3", "task/TASK-3/add-hello", "Implement hello", 1800);
    expect(req.task_id).toBe("TASK-3");
    expect(req.run_id).toBe("RUN-3");
    expect(req.workspace).toBe("/workspaces/demo/worktrees/test-hermes-TASK-3");
    expect(req.branch).toBe("task/TASK-3/add-hello");
    expect(req.specialist).toBe("opencode");
    expect(req.operation).toBe("implement");
    expect(req.timeout_seconds).toBe(1800);
    expect(req.instructions).toBe("Implement hello");
  });

  it("buildOpencodeRequest rejects bad workspace/task_id (correlation §16)", () => {
    expect(() => buildOpencodeRequest("BAD-3", "RUN-3", "/workspaces/a", "b", "i")).toThrow(/TASK-/);
    expect(() => buildOpencodeRequest("TASK-3", "BAD-3", "/workspaces/a", "b", "i")).toThrow(/RUN-/);
    expect(() => buildOpencodeRequest("TASK-3", "RUN-3", "/tmp/a", "b", "i")).toThrow(/\/workspaces\//);
  });

  it("delegateToOpencode succeeds in 1 attempt with files_changed and tests (O-2)", async () => {
    const req = buildOpencodeRequest("TASK-3", "RUN-3", "/workspaces/demo/worktrees/test-hermes-TASK-3", "task/TASK-3/add-hello", "Create src/hello.ts");
    const result = await delegateToOpencode(req, mockOpencodeExecutorSuccess);
    expect(result.status).toBe("completed");
    expect(result.files_changed).toEqual(["src/hello.ts"]);
    expect(result.tests).toEqual({ passed: 1, failed: 0 });
    expect(result.attempts).toBe(1);
    expect(result.finalStatus).toBe("completed");
  });

  it("withRetry retries on failing tests up to MAX_RETRIES then blocked per §33 (O-3)", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls += 1;
      return calls < 3 ? { filesChanged: ["a"], tests: { passed: 0, failed: 1 } } : { filesChanged: ["a"], tests: { passed: 1, failed: 0 } };
    });
    expect(calls).toBe(3);
    expect(result.attempts).toBe(3);
    expect(result.finalStatus).toBe("completed");
    expect(result.tests.failed).toBe(0);

    // all fail -> blocked
    const blocked = await withRetry(async () => ({ filesChanged: [], tests: { passed: 0, failed: 1 } }));
    expect(blocked.attempts).toBe(MAX_RETRIES);
    expect(blocked.finalStatus).toBe("blocked");
    expect(blocked.tests.failed).toBe(1);
  });

  it("delegateToOpencode retries then completes, and blocks after max retries (O-3)", async () => {
    const req = buildOpencodeRequest("TASK-4", "RUN-4", "/workspaces/demo/worktrees/test-hermes-TASK-4", "task/TASK-4/fail", "Failing task");
    let call = 0;
    const failingExecutor = async () => {
      call += 1;
      if (call < 3) return { task_id: "TASK-4", specialist: "opencode" as const, status: "completed" as const, summary: "fail", files_changed: ["x"], tests: { passed: 0, failed: 1 } };
      return { task_id: "TASK-4", specialist: "opencode" as const, status: "completed" as const, summary: "ok", files_changed: ["x"], tests: { passed: 1, failed: 0 } };
    };
    const result = await delegateToOpencode(req, failingExecutor);
    expect(result.attempts).toBe(3);
    expect(result.finalStatus).toBe("completed");

    call = 0;
    const alwaysFail = async () => ({ task_id: "TASK-4", specialist: "opencode" as const, status: "completed" as const, summary: "fail", files_changed: [], tests: { passed: 0, failed: 1 } });
    const blocked = await delegateToOpencode(req, alwaysFail);
    expect(blocked.finalStatus).toBe("blocked");
    expect(blocked.status).toBe("failed");
    expect(blocked.attempts).toBe(3);
  });

  it("docker-compose.yml now defines opencode service sharing /workspaces (D-2 + S-3)", () => {
    const compose = readFileSync("docker-compose.yml", "utf8");
    expect(compose).toContain("opencode:");
    expect(compose).toContain("/workspaces:/workspaces:rw");
    expect(compose).toContain("v2026.824.1");
  });

  it("retry respects maxDepth=2 not infinite", async () => {
    expect(MAX_RETRIES).toBe(3);
    // ensure no unbounded loop: withRetry always terminates within MAX_RETRIES
    const start = Date.now();
    await withRetry(async () => ({ filesChanged: [], tests: { passed: 0, failed: 1 } }));
    expect(Date.now() - start).toBeLessThan(1000); // backoff 10*1 + 10*2 = 30ms, not infinite
  });
});
