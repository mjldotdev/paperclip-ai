/**
 * budget.ts — Per-agent budgets $20/$300 per S-4 O-3, idea.md:§59, D-5
 * Paperclip owns budget accounting; Hermes exposes model/token usage where available; specialist executions attributed to parent task.
 * Enforced as soft warning at 80% and hard block at 100% (agent sleeps, task marked blocked per §31).
 */

export type Budget = {
  daily_usd: number;
  monthly_usd: number;
  daily_spent: number;
  monthly_spent: number;
};

const DEFAULT_BUDGET: Omit<Budget, "daily_spent" | "monthly_spent"> = { daily_usd: 20, monthly_usd: 300 };

const budgets = new Map<string, Budget>();
const taskCosts = new Map<string, { hermes: number; opencode: number; agy: number; total: number }>();

export function getOrCreateBudget(agentId: string): Budget {
  if (!budgets.has(agentId)) {
    budgets.set(agentId, { ...DEFAULT_BUDGET, daily_spent: 0, monthly_spent: 0 });
  }
  return budgets.get(agentId)!;
}

export function recordCost(agentId: string, taskId: string, specialist: "hermes" | "opencode" | "agy", cost: number): { warned: boolean; blocked: boolean; total: number } {
  const budget = getOrCreateBudget(agentId);
  budget.daily_spent += cost;
  budget.monthly_spent += cost;

  const costs = taskCosts.get(taskId) ?? { hermes: 0, opencode: 0, agy: 0, total: 0 };
  costs[specialist] += cost;
  costs.total += cost;
  taskCosts.set(taskId, costs);

  const dailyRatio = budget.daily_spent / budget.daily_usd;
  const monthlyRatio = budget.monthly_spent / budget.monthly_usd;
  const warned = dailyRatio >= 0.8 || monthlyRatio >= 0.8;
  const blocked = dailyRatio >= 1 || monthlyRatio >= 1;

  if (warned) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), component: "paperclip", agent_id: agentId, task_id: taskId, event: "budget_warning", daily_spent: budget.daily_spent, daily_usd: budget.daily_usd }));
  }
  if (blocked) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), component: "paperclip", agent_id: agentId, task_id: taskId, event: "budget_blocked", reason: "budget exceeded" }));
  }

  return { warned, blocked, total: costs.total };
}

export function getTaskCost(taskId: string): { hermes: number; opencode: number; agy: number; total: number } | undefined {
  return taskCosts.get(taskId);
}

export function checkBudget(agentId: string): { blocked: boolean; warned: boolean; budget: Budget } {
  const budget = getOrCreateBudget(agentId);
  const blocked = budget.daily_spent >= budget.daily_usd || budget.monthly_spent >= budget.monthly_usd;
  const warned = budget.daily_spent >= budget.daily_usd * 0.8 || budget.monthly_spent >= budget.monthly_usd * 0.8;
  return { blocked, warned, budget };
}

export function resetBudgets(): void {
  budgets.clear();
  taskCosts.clear();
}

// Format cost attribution example per §59: Hermes $0.40 + OpenCode $1.80 + AGY $0.20 = Total $2.40 (or $2.20 without AGY per S-4)
export function formatAttribution(taskId: string): string {
  const costs = getTaskCost(taskId);
  if (!costs) return `No costs for ${taskId}`;
  return `Hermes $${costs.hermes.toFixed(2)} + OpenCode $${costs.opencode.toFixed(2)}${costs.agy ? ` + AGY $${costs.agy.toFixed(2)}` : ""} = Total $${costs.total.toFixed(2)}`;
}
