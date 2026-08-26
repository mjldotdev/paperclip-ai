/**
 * retry.ts — Retry without infinite loops per S-3 O-3, idea.md:§33
 * Hermes evaluates OpenCode result and retries on tests.failed > 0, max 3 attempts, then marks blocked.
 */

export type RetryResult = {
  attempts: number;
  finalStatus: "completed" | "blocked";
  files_changed: string[];
  filesChanged: string[]; // alias for backward compat with camelCase tests
  tests: { passed: number; failed: number };
};

export const MAX_RETRIES = 3;

export async function withRetry(
  operation: (attempt: number) => Promise<{ files_changed: string[]; tests: { passed: number; failed: number } } | { filesChanged: string[]; tests: { passed: number; failed: number } }>,
  onAttempt?: (attempt: number, result: { files_changed: string[]; tests: { passed: number; failed: number } } | { filesChanged: string[]; tests: { passed: number; failed: number } }) => void
): Promise<RetryResult> {
  const normalize = (r: any) => ({ files_changed: r.files_changed ?? r.filesChanged ?? [], tests: r.tests });
  let lastResult: { files_changed: string[]; tests: { passed: number; failed: number } } | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const raw = await operation(attempt);
    const result = normalize(raw);
    lastResult = result;
    (onAttempt as any)?.(attempt, result);
    if (result.tests.failed === 0) {
      return { attempts: attempt, finalStatus: "completed", files_changed: result.files_changed, filesChanged: result.files_changed, tests: result.tests };
    }
    if (attempt < MAX_RETRIES) {
      // backoff: simple delay 10ms * attempt for test determinism
      await new Promise((res) => setTimeout(res, 10 * attempt));
    }
  }
  // exhausted
  return {
    attempts: MAX_RETRIES,
    finalStatus: "blocked",
    files_changed: lastResult?.files_changed ?? [],
    filesChanged: lastResult?.files_changed ?? [],
    tests: lastResult?.tests ?? { passed: 0, failed: 1 }
  };
}

// Structured log per §37 for retry attempts
export function logRetryAttempt(taskId: string, runId: string, attempt: number, result: { tests: { passed: number; failed: number } }): void {
  const entry = {
    timestamp: new Date().toISOString(),
    component: "hermes",
    task_id: taskId,
    run_id: runId,
    event: "specialist_retry",
    attempt,
    tests: result.tests
  };
  console.log(JSON.stringify(entry));
}
