/**
 * memory.ts — Persistent Hermes memory per S-4 O-2, idea.md:§17.2,§19
 * Hermes native persistence survives sleep/wake and is reused across tasks.
 * In production, Hermes stores at ~/.hermes/memory or external provider; here we simulate with in-memory Map + file fallback at ./.hermes/memory/<agentId>.md for test verifiability.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const memoryStore = new Map<string, string[]>();

function memoryFilePath(agentId: string): string {
  // Allow override via HERMES_HOME or fallback to ./.hermes
  const base = process.env.HERMES_HOME ?? join(process.cwd(), ".hermes", "memory");
  return join(base, `${agentId}.md`);
}

export function saveMemory(agentId: string, lesson: string): void {
  const lessons = memoryStore.get(agentId) ?? [];
  if (!lessons.includes(lesson)) lessons.push(lesson);
  memoryStore.set(agentId, lessons);
  // Persist to file for sleep/wake survival and manual verification via `cat ~/.hermes/memory/*.md` or `docker exec hermes cat ...`
  try {
    const file = memoryFilePath(agentId);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, lessons.join("\n") + "\n", "utf8");
  } catch {
    // file persistence is best-effort; in-memory still survives within process for tests
  }
  logMemory(agentId, "memory_saved", lesson);
}

export function getMemory(agentId: string): string[] {
  if (memoryStore.has(agentId)) return [...memoryStore.get(agentId)!];
  // Try file fallback (simulates Hermes resume after container restart)
  try {
    const file = memoryFilePath(agentId);
    if (existsSync(file)) {
      const content = readFileSync(file, "utf8").split("\n").filter(Boolean);
      memoryStore.set(agentId, content);
      return [...content];
    }
  } catch {}
  return [];
}

export function hasMemory(agentId: string, lesson: string): boolean {
  return getMemory(agentId).includes(lesson);
}

export function clearMemory(agentId?: string): void {
  if (agentId) {
    memoryStore.delete(agentId);
    try {
      const file = memoryFilePath(agentId);
      if (existsSync(file)) writeFileSync(file, "", "utf8");
    } catch {}
  } else {
    memoryStore.clear();
  }
}

function logMemory(agentId: string, event: string, lesson: string): void {
  const entry = {
    timestamp: new Date().toISOString(),
    component: "hermes",
    agent_id: agentId,
    event,
    lesson
  };
  console.log(JSON.stringify(entry));
}
