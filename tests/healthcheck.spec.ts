import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";

describe("S-1 healthcheck — compose stack, shared workspace, gateway wiring with CI", () => {
  it("docker-compose.yml exists and defines paperclip, postgres, hermes with /workspaces mount and v2026.824.1 pin", () => {
    const path = "docker-compose.yml";
    expect(existsSync(path)).toBe(true);
    const compose = readFileSync(path, "utf8");
    expect(compose).toContain("paperclip:");
    expect(compose).toContain("postgres:");
    expect(compose).toContain("hermes:");
    expect(compose).toContain("/workspaces:/workspaces:rw");
    expect(compose).toContain("v2026.824.1");
    expect(compose).toContain("postgres:17-alpine");
    expect(compose).toContain("pg_isready");
  });

  it(".env.example contains required vars per D-2", () => {
    const env = readFileSync(".env.example", "utf8");
    expect(env).toContain("DATABASE_URL=");
    expect(env).toContain("BETTER_AUTH_SECRET");
    expect(env).toContain("PAPERCLIP_PUBLIC_URL");
    expect(env).toContain("HERMES_GATEWAY_URL");
  });

  it("CI workflow exists with docker compose config + pnpm test", () => {
    const ci = readFileSync(".github/workflows/ci.yml", "utf8");
    expect(ci).toContain("docker compose config");
    expect(ci).toContain("pnpm test");
    expect(ci).toContain("push");
  });

  it("dummy truth", () => {
    expect(true).toBe(true);
  });
});
