Absolutely. I’d make the first version a PRD + technical architecture spec, with one important principle baked in:

Paperclip owns orchestration; Hermes owns agent intelligence/memory; OpenCode owns software engineering execution; AGY owns multimodal specialization.

I’ve also written it so that the implementation can start with a relatively small MVP and evolve into the full system.

# Autonomous AI Engineering Platform
## PRD & Technical Architecture Specification

**Status:** Draft  
**Version:** 0.1  
**Date:** 2026-08-27

---

# 1. Executive Summary

This project will build a self-hosted autonomous AI engineering platform composed of four primary systems:

- **Paperclip AI** — orchestration and control plane
- **Hermes Agent** — primary agent runtime, reasoning, memory, skills, and delegation
- **OpenCode** — specialized software-engineering/coding runtime
- **AGY CLI** — specialized multimodal/vision/research runtime

The intended architecture is:

```text
                         ┌──────────────────────────┐
                         │        PAPERCLIP         │
                         │                          │
                         │    CONTROL PLANE         │
                         │                          │
                         │ • Organizations          │
                         │ • Agents                 │
                         │ • Projects               │
                         │ • Issues / Tasks         │
                         │ • Assignments            │
                         │ • Scheduling             │
                         │ • Budgets                │
                         │ • Approvals              │
                         │ • Run tracking            │
                         │ • Governance              │
                         └────────────┬─────────────┘
                                      │
                                      │ runs / heartbeats
                                      ▼
                         ┌──────────────────────────┐
                         │         HERMES           │
                         │                          │
                         │     AGENT RUNTIME        │
                         │                          │
                         │ • Reasoning              │
                         │ • Persistent memory      │
                         │ • Session management     │
                         │ • Skills                 │
                         │ • MCP                    │
                         │ • Delegation             │
                         │ • Agent behavior         │
                         └───────────┬──────────────┘
                                     │
                         ┌───────────┴───────────┐
                         │                       │
                         ▼                       ▼
                ┌─────────────────┐      ┌─────────────────┐
                │    OPENCODE     │      │      AGY        │
                │                 │      │                 │
                │ Coding runtime  │      │ Multimodal      │
                │                 │      │ specialist      │
                │ • Code          │      │ • Vision        │
                │ • Terminal      │      │ • Images        │
                │ • Tests         │      │ • Research      │
                │ • Git           │      │ • Visual QA     │
                │ • MCP           │      │ • Analysis      │
                └─────────────────┘      └─────────────────┘


The goal is not to create a single giant AI agent.

The goal is to create a hierarchical autonomous engineering organization in which different runtimes have clearly defined responsibilities.

2. Problem Statement

Current AI coding agents are highly capable but are generally optimized for an individual developer interacting with one agent.

They are less optimized for running a persistent autonomous software organization consisting of multiple specialized agents.

The desired system should be able to:

Maintain multiple software projects.
Maintain persistent autonomous agents.
Assign work to agents.
Wake agents on schedules or events.
Allow agents to work for extended periods.
Preserve agent memory across sessions.
Give coding agents access to real repositories and development environments.
Give agents multimodal capabilities.
Allow agents to delegate specialized work.
Recover from failures and restarts.
Track what every agent is doing.
Control costs and permissions.
Operate continuously on a self-hosted server.
Scale from one agent to many agents.

The platform should therefore separate:

orchestration
agent intelligence
coding execution
multimodal execution
persistent memory
project/task state

rather than forcing one runtime to perform all of these functions.

3. Goals
3.1 Primary Goals
G1 — Autonomous software engineering

Agents must be capable of independently executing software-development tasks from issue assignment through implementation, testing, review, and completion.

G2 — Persistent agents

Agents should maintain identity, configuration, memory, skills, and project context across multiple executions.

G3 — Multi-agent organization

The system should support organizations such as:

CEO
│
├── CTO
│   │
│   ├── Backend Engineer
│   ├── Frontend Engineer
│   ├── QA Engineer
│   └── DevOps Engineer
│
├── Product Manager
├── Research Agent
└── Design Agent

G4 — Specialized runtimes

The system should allow Hermes to delegate specialized work to:

OpenCode for software engineering
AGY for multimodal tasks
future specialist runtimes
G5 — Persistent memory

Agents should retain useful knowledge across sessions without relying exclusively on conversation context.

G6 — Scheduling

Agents should support:

periodic execution
event-triggered execution
task-triggered execution
manual execution
dependency-triggered execution
G7 — Observability

Every meaningful agent action should be traceable to:

organization
    ↓
agent
    ↓
task
    ↓
run
    ↓
runtime
    ↓
tool calls
    ↓
result

G8 — Self-hosting

The complete platform should be deployable on infrastructure controlled by the operator.

4. Non-Goals

The first version will NOT attempt to:

build a new LLM
build a new coding agent
replace OpenCode
replace Hermes
replace Paperclip
create a new multimodal model
create a general-purpose vector database
automatically grant unrestricted shell/root access
allow arbitrary recursive agent spawning
make every runtime aware of every other runtime

The system should integrate existing runtimes rather than reinvent them.

5. Architectural Principles
P1 — One owner per responsibility

Every major concern should have a canonical owner.

Concern	Owner
Organization	Paperclip
Projects	Paperclip
Tasks/issues	Paperclip
Assignment	Paperclip
Scheduling	Paperclip
Budgets	Paperclip
Governance	Paperclip
Agent reasoning	Hermes
Agent memory	Hermes
Agent sessions	Hermes
Skills	Hermes
Delegation	Hermes
Coding	OpenCode
Repository manipulation	OpenCode
Tests	OpenCode
Git operations	OpenCode
Multimodal analysis	AGY
Visual QA	AGY
Image-related tasks	AGY

This prevents state duplication.

6. High-Level Architecture
                         ┌──────────────────────────┐
                         │                          │
                         │       PAPERCLIP         │
                         │                          │
                         │   CONTROL PLANE         │
                         │                          │
                         └────────────┬─────────────┘
                                      │
                                      │ HTTP/API
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │                          │
                         │    HERMES GATEWAY       │
                         │                          │
                         │   AGENT RUNTIME          │
                         │                          │
                         └───────┬────────┬─────────┘
                                 │        │
                           tools │        │ tools
                                 │        │
                    ┌────────────┘        └────────────┐
                    ▼                                  ▼
          ┌──────────────────┐               ┌──────────────────┐
          │                  │               │                  │
          │     OPENCODE     │               │       AGY        │
          │                  │               │                  │
          │ coding runtime   │               │ multimodal       │
          │                  │               │ runtime          │
          └────────┬─────────┘               └────────┬─────────┘
                   │                                  │
                   ▼                                  ▼
             Repositories                       Images / Web /
             Terminal                           Video / Research

7. Component Responsibilities
7.1 Paperclip

Paperclip is the control plane.

Paperclip currently provides adapters for OpenCode and Hermes, including opencode_local, hermes_local, and hermes_gateway. The OpenCode adapter supports provider/model routing and session resume, while the Hermes gateway adapter communicates with an independently running Hermes API server.

Paperclip adapter architecture should therefore be treated as the integration boundary rather than attempting to directly modify Paperclip's internal agent loop.

Paperclip responsibilities
organization management
agent registration
agent roles
project management
issue/task management
task assignment
scheduling
heartbeats
run lifecycle
budgets
approvals
permissions
audit trail
agent status
orchestration
high-level failure recovery
Paperclip should NOT own
LLM reasoning
coding loops
long-term semantic memory
detailed agent personality
coding tool execution
multimodal reasoning
8. Hermes

Hermes is the primary agent runtime.

Hermes should represent the intelligence and persistent identity of an autonomous worker.

Hermes provides persistent memory, skills, tools, MCP, sessions, delegation, and multi-provider model support.

Hermes should be treated as the layer that answers:

"Given the current task, context, memory, and available tools, what should this agent do next?"

Hermes responsibilities
reasoning
agent loop
persistent memory
session management
skills
tool selection
delegation
specialist invocation
context management
model/provider selection
agent identity
agent-specific instructions
Hermes should NOT own
company-wide task state
organization hierarchy
authoritative task assignment
global scheduling
project status
budget accounting

Those remain Paperclip responsibilities.

9. OpenCode

OpenCode is the software engineering execution runtime.

Hermes should delegate coding work to OpenCode rather than attempting to replicate OpenCode's coding workflow.

OpenCode responsibilities
repository inspection
source-code analysis
code modification
terminal commands
package management
compilation
tests
linting
formatting
Git operations
code-specific MCP tools
coding model selection
Example

Hermes:

Task:
Implement OAuth login.

Plan:
1. Inspect authentication architecture.
2. Ask OpenCode to implement the feature.
3. Ask OpenCode to run tests.
4. Review results.
5. Ask OpenCode to fix failures.
6. Ask AGY for UI review if needed.
7. Mark task complete.


OpenCode:

Inspect repository
→ modify code
→ run tests
→ report result

10. AGY

AGY is a specialized multimodal worker.

It should not become the primary orchestrator.

AGY responsibilities
screenshot analysis
UI analysis
image understanding
visual comparison
image generation
video analysis
visual QA
multimodal research
tasks where a specialized multimodal model is advantageous
Example

Hermes:

The dashboard implementation is complete.

Use AGY to:
- inspect the generated UI screenshot
- compare it to the design reference
- identify visual problems
- report actionable fixes


AGY:

Visual analysis
→ findings
→ structured result


Hermes:

Review findings
→ send fixes to OpenCode

11. Communication Architecture

MCP should be the preferred mechanism for exposing specialist capabilities to Hermes where practical.

Conceptually:

Hermes
  │
  ├── MCP → OpenCode bridge
  │
  ├── MCP → AGY bridge
  │
  ├── MCP → GitHub
  │
  ├── MCP → browser
  │
  └── MCP → internal services


MCP provides a standardized tool boundary and avoids hard-coding every specialist into Hermes.

Hermes itself supports MCP servers and can expose Hermes as an MCP server.

12. Critical Design Decision: Runtime Hierarchy

The platform MUST NOT become:

Paperclip
   ↓
Hermes
   ↓
OpenCode
   ↓
AGY


unless a specific workflow requires that chain.

The preferred model is:

                    Paperclip
                       │
                     Hermes
                    /      \
             OpenCode      AGY


Hermes may invoke either specialist independently.

13. Agent Lifecycle

An agent lifecycle should look like:

CREATED
   ↓
CONFIGURED
   ↓
READY
   ↓
SCHEDULED
   ↓
AWAKENED
   ↓
RUNNING
   ↓
DELEGATING
   ↓
EXECUTING
   ↓
REPORTING
   ↓
SLEEPING
   ↓
AWAKENED


Failure path:

RUNNING
   ↓
FAILED
   ↓
RECOVERABLE?
   ├── YES → RETRY
   └── NO → BLOCKED / HUMAN REVIEW

14. Heartbeat Model

Paperclip owns the heartbeat.

Example:

09:00
Paperclip wakes Backend Engineer.

09:00
Hermes receives:
- agent identity
- task
- project context
- relevant state
- available tools

09:01
Hermes decides to use OpenCode.

09:01
OpenCode begins implementation.

09:18
OpenCode finishes.

09:19
Hermes reviews result.

09:20
Hermes asks OpenCode to run final tests.

09:25
Tests pass.

09:25
Hermes reports completion.

09:26
Paperclip records run.

09:26
Agent sleeps.


Paperclip remains the authority for whether the agent should wake again.

15. Task Model

Every autonomous unit of work should have a Paperclip task/issue ID.

Example:

task:
  id: TASK-123
  project: ecommerce
  title: Add OAuth login
  assigned_agent: backend-engineer
  priority: high
  status: in_progress


Hermes should receive the task ID and preserve it throughout the execution.

Every specialist call should be traceable to the same task.

16. Run Correlation

Every run must have a unique ID.

Example:

Paperclip:
  task_id = TASK-123
  run_id = RUN-456

Hermes:
  session_id = HERMES-789

OpenCode:
  session_id = OPCODE-abc

AGY:
  session_id = AGY-def


The system should maintain correlation:

TASK-123
   │
   └── RUN-456
          │
          ├── Hermes HERMES-789
          │
          ├── OpenCode OPCODE-abc
          │
          └── AGY AGY-def


This is essential for observability and debugging.

17. Memory Architecture

Memory is divided into three layers.

17.1 Organizational state

Owner:

Paperclip

Examples:

project status
task status
assignments
priorities
deadlines
approvals

This is authoritative operational state.

17.2 Agent memory

Owner:

Hermes

Examples:

learned project conventions
recurring patterns
agent preferences
previous discoveries
useful procedures
lessons learned

Hermes already provides persistent memory and supports external memory providers.

17.3 Repository knowledge

Owner:

Repository + project context

Examples:

README.md
AGENTS.md
CONTRIBUTING.md
architecture.md
docs/


The coding runtime should treat these as authoritative project context.

18. Memory Rules

The system MUST avoid blindly copying all task history into every LLM context.

Instead:

Paperclip state
      ↓
relevant task context
      ↓
Hermes memory retrieval
      ↓
repository context
      ↓
specialist result
      ↓
LLM context


Only relevant information should be injected.

19. Memory Hierarchy

Recommended:

Global
│
├── Organization memory
│
├── Agent memory
│
├── Project memory
│
├── Repository memory
│
├── Task memory
│
└── Run/session context


Example:

Organization:
  "All production changes require review."

Agent:
  "Backend agent prefers PostgreSQL migrations through Prisma."

Project:
  "This project uses Next.js and FastAPI."

Repository:
  "Do not modify generated files."

Task:
  "OAuth implementation must support Google."

Run:
  "Current implementation failed test X."

20. Scheduling

Paperclip owns global scheduling.

Supported triggers:

timer
cron
assignment
manual
event
dependency
retry


Hermes may have its own scheduling capability, but it should NOT become the authoritative scheduler for Paperclip-managed work.

If Hermes schedules an internal personal routine, that is acceptable.

If the routine modifies a Paperclip task, the result must flow back through the Paperclip task/run model.

21. Scheduling Example
agent:
  name: nightly-maintainer
  schedule:
    type: cron
    expression: "0 2 * * *"


At 02:00:

Paperclip
   ↓
wake Hermes
   ↓
check assigned maintenance tasks
   ↓
Hermes
   ↓
OpenCode
   ↓
run tests
   ↓
AGY if visual validation required
   ↓
Hermes
   ↓
Paperclip

22. Specialist Invocation Contract

Hermes should invoke specialists through a structured interface.

Example:

{
  "task_id": "TASK-123",
  "specialist": "opencode",
  "operation": "implement",
  "workspace": "/workspace/project",
  "instructions": "Implement OAuth login according to the task.",
  "timeout_seconds": 1800
}


Result:

{
  "task_id": "TASK-123",
  "specialist": "opencode",
  "status": "completed",
  "summary": "Implemented OAuth login.",
  "files_changed": [
    "src/auth/oauth.ts",
    "src/routes/login.ts"
  ],
  "tests": {
    "passed": 42,
    "failed": 0
  }
}

23. Multimodal Invocation Contract

Example:

{
  "task_id": "TASK-123",
  "specialist": "agy",
  "operation": "visual_review",
  "inputs": [
    "/workspace/screenshots/dashboard.png"
  ],
  "instructions": "Compare the implementation against the design reference."
}


Result:

{
  "task_id": "TASK-123",
  "specialist": "agy",
  "status": "completed",
  "findings": [
    {
      "severity": "medium",
      "area": "spacing",
      "description": "The sidebar is approximately 12px wider than the reference."
    }
  ]
}

24. Coding Workflow

The standard coding workflow should be:

Task assigned
      ↓
Hermes reads task
      ↓
Hermes retrieves memory
      ↓
Hermes inspects project context
      ↓
Hermes creates plan
      ↓
OpenCode implementation
      ↓
OpenCode tests
      ↓
Hermes reviews result
      ↓
AGY visual review if required
      ↓
OpenCode fixes issues
      ↓
OpenCode final tests
      ↓
Hermes reports completion
      ↓
Paperclip updates task

25. Example End-to-End Workflow
User request
Build a responsive dashboard for the analytics project.

Step 1 — Paperclip

Creates:

PROJECT: Analytics
TASK: Build responsive dashboard


Assigns task to:

Frontend Engineer

Step 2 — Hermes

Reads:

task
project context
memory
repository documentation

Produces:

Plan:
1. Inspect current frontend architecture.
2. Identify dashboard components.
3. Implement desktop layout.
4. Implement responsive layout.
5. Run tests.
6. Generate screenshots.
7. Perform visual review.
8. Fix visual issues.

Step 3 — OpenCode

Implements the dashboard.

Step 4 — AGY

Reviews screenshots.

Finds:

Mobile navigation overlaps dashboard content.

Step 5 — Hermes

Sends finding to OpenCode.

Step 6 — OpenCode

Fixes issue.

Step 7 — Final validation
tests: PASS
lint: PASS
visual review: PASS

Step 8 — Paperclip

Task becomes:

DONE

26. Multi-Agent Example

A larger project:

                         CTO
                          │
             ┌────────────┼────────────┐
             │            │            │
          Backend       Frontend       QA
             │            │            │
          Hermes        Hermes        Hermes
             │            │            │
          OpenCode      OpenCode      OpenCode
                          │
                         AGY
                          │
                    visual testing


Paperclip manages the organization.

Hermes instances manage individual agents.

OpenCode executes coding.

AGY performs specialized multimodal work.

27. Agent Roles

Initial roles:

CEO

Responsibilities:

strategic planning
project prioritization
delegation

Runtime:

Hermes

CTO

Responsibilities:

architecture
technical planning
engineering delegation

Runtime:

Hermes


Specialists:

OpenCode
AGY

Backend Engineer

Runtime:

Hermes → OpenCode

Frontend Engineer

Runtime:

Hermes → OpenCode


May additionally use:

Hermes → AGY


for visual validation.

QA Engineer

Runtime:

Hermes → OpenCode


and optionally:

Hermes → AGY

Researcher

Runtime:

Hermes


with web/MCP tools.

AGY may be used for multimodal research.

28. Security Model

Security is critical because the system is autonomous.

Default principle:

Least privilege.

Each agent should receive only the permissions necessary for its role.

29. Workspace Isolation

Each agent/project should have an isolated workspace.

Example:

/workspaces/
    analytics/
        frontend-agent/
        backend-agent/
        qa-agent/

    ecommerce/
        frontend-agent/
        backend-agent/


Prefer Git worktrees or isolated repositories where practical.

30. Credential Isolation

Credentials MUST NOT be globally available to every agent.

Example:

Backend Agent
  ├── GitHub
  ├── package registry
  └── database development credentials

Research Agent
  └── web/search credentials

Production Agent
  └── restricted deployment credentials


Secrets should be injected at runtime.

31. Approval Model

High-risk operations require approval.

Examples:

production deployment
database deletion
credential modification
billing changes
destructive infrastructure commands
publishing externally


Workflow:

Agent
 ↓
requests approval
 ↓
Paperclip
 ↓
human approval
 ↓
agent continues

32. Agent Spawn Policy

Agents MUST NOT recursively create unlimited agents.

Default:

max_depth = 2
max_children_per_agent = 5
max_total_active_agents = configurable


Example:

CEO
 ├── CTO
 │    ├── Backend
 │    ├── Frontend
 │    └── QA
 └── Research


But:

Backend
 └── Agent
      └── Agent
           └── Agent


should be blocked by default.

33. Failure Handling

Every execution must have:

timeout
retry policy
failure state
diagnostic output


Example:

OpenCode fails
     ↓
Hermes analyzes failure
     ↓
retry?
 ┌───┴────┐
YES      NO
 │        │
retry    report


If repeated failures occur:

FAILED
  ↓
BLOCKED
  ↓
HUMAN REVIEW

34. Crash Recovery

The system must tolerate:

Paperclip restart
Hermes restart
OpenCode crash
AGY crash
network interruption
model API failure
server reboot

Important state must not exist only in process memory.

Paperclip remains authoritative for task/run state.

Hermes remains authoritative for agent memory/session state.

Repository state remains authoritative for code.

35. Idempotency

Specialist calls must be correlated to Paperclip runs.

Example:

Paperclip RUN-456
       ↓
Hermes request
       ↓
OpenCode execution


If Paperclip retries because of a network failure, the system should detect that RUN-456 already exists and avoid unintentionally starting duplicate destructive work.

36. Observability

The system should provide:

Agent view
Agent:
  Backend Engineer

Status:
  Working

Current task:
  TASK-123

Runtime:
  Hermes

Specialist:
  OpenCode

Started:
  10:32

Elapsed:
  18m

Tokens:
  ...

Estimated cost:
  ...

Task view
TASK-123
│
├── Hermes planning
├── OpenCode implementation
├── OpenCode tests
├── AGY visual review
└── OpenCode fixes

37. Logging

Every component should emit structured logs.

Example:

{
  "timestamp": "2026-08-27T10:32:00Z",
  "component": "hermes",
  "agent_id": "frontend-engineer",
  "task_id": "TASK-123",
  "run_id": "RUN-456",
  "event": "specialist_started",
  "specialist": "opencode"
}

38. Metrics

Minimum metrics:

System
CPU
RAM
disk
network
Agents
active agents
agent runs
successful runs
failed runs
average run duration
Models
token usage
estimated cost
latency
failures
Specialists
OpenCode runs
AGY runs
specialist failures
specialist latency
Tasks
completion rate
average completion time
blocked tasks
retry rate
39. Database Strategy

Paperclip's existing database should remain the source of truth for Paperclip-owned state.

Do not create a second competing task database.

Hermes should retain its own native persistence for:

sessions
memory
skills
agent-specific state

Specialist runtimes retain their native session state where required.

The architecture therefore intentionally uses multiple persistence systems, but each has a clearly defined owner.

40. Source-of-Truth Matrix
Data	Source of Truth
Agent existence	Paperclip
Agent role	Paperclip
Assignment	Paperclip
Task status	Paperclip
Project status	Paperclip
Schedule	Paperclip
Budget	Paperclip
Run record	Paperclip
Agent memory	Hermes
Agent session	Hermes
Agent skills	Hermes
Repository	Git
Code state	Git
OpenCode session	OpenCode
Multimodal session	AGY
Specialist output	Specialist + Paperclip run record
41. Deployment Architecture

Initial deployment:

                    Internet
                       │
                       ▼
                ┌─────────────┐
                │ Reverse     │
                │ Proxy       │
                └──────┬──────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   ┌──────────────┐          ┌──────────────┐
   │  Paperclip   │          │    Hermes    │
   │              │◄────────►│   Gateway    │
   └──────┬───────┘          └──────┬───────┘
          │                         │
          │                         │
          │                 ┌───────┴────────┐
          │                 │                │
          ▼                 ▼                ▼
     PostgreSQL         OpenCode           AGY
                            │                │
                            ▼                ▼
                       Workspaces       Multimodal

42. Recommended Infrastructure

Initial server:

CPU:
  8+ cores

RAM:
  32 GB minimum
  64 GB recommended

Storage:
  500 GB minimum
  1 TB+ recommended

OS:
  Linux

Containerization:
  Docker / Docker Compose

Database:
  PostgreSQL


Model inference should initially be external unless there is a specific requirement to self-host models.

43. Container Layout

Suggested:

docker-compose.yml

services:

  paperclip:
    image: ...
  
  postgres:
    image: postgres:...

  hermes:
    image: ...

  opencode:
    image: ...

  agy:
    image: ...

  reverse-proxy:
    image: ...


However, OpenCode and AGY should only be containerized if their CLI/tooling and filesystem requirements are compatible with container isolation.

The first implementation should favor reliability over maximal containerization.

44. Workspace Mounting

Shared project workspace:

/workspaces/project-a


Hermes:

read/write


OpenCode:

read/write


AGY:

read-only


unless it specifically needs to generate artifacts.

This prevents multimodal tooling from accidentally modifying source code.

45. Git Strategy

Each engineering task should preferably use a branch or worktree.

Example:

main
│
├── worktree/backend-TASK-123
├── worktree/frontend-TASK-124
└── worktree/qa-TASK-125


OpenCode works inside the assigned worktree.

Paperclip tracks the task.

Hermes coordinates the work.

46. Human Interaction

Humans interact primarily with Paperclip.

Possible future interfaces:

Web UI
CLI
Slack
Discord
Telegram
API


The human should not need to manually manage Hermes/OpenCode/AGY processes.

47. Human Command Model

Example:

Start project "Ecommerce v2".


Paperclip:

Creates project.
Creates tasks.
Assigns agents.


Hermes:

Plans execution.


OpenCode:

Writes code.


AGY:

Reviews UI.


Paperclip:

Reports progress.

48. Example Autonomous Loop
EVERY 15 MINUTES

Paperclip
    ↓
Check agent assignments
    ↓
Wake Hermes
    ↓
Hermes reads task + memory
    ↓
Is work required?
    │
    ├── NO → sleep
    │
    └── YES
          ↓
       create plan
          ↓
       specialist?
          │
      ┌───┴────┐
      │        │
    OpenCode  AGY
      │        │
      └───┬────┘
          ↓
       evaluate
          ↓
       continue?
       ┌──┴──┐
      YES    NO
       │      │
       ▼      ▼
    continue done

49. Development Phases
Phase 0 — Architecture Validation

Goal:

Prove that:

Paperclip
   ↓
Hermes
   ↓
OpenCode


works reliably.

Deliverables:

Paperclip deployment
Hermes gateway
Paperclip → Hermes connection
Hermes → OpenCode integration
shared workspace
task correlation
basic logging
50. Phase 1 — MVP

Implement:

Paperclip
Hermes
OpenCode
PostgreSQL
one project
one autonomous coding agent
basic memory
scheduled heartbeats
Git worktrees
basic observability

Success condition:

An agent can receive a task, implement it, run tests, preserve memory, sleep, wake later, and continue.

51. Phase 2 — Multimodal

Add AGY.

Implement:

Hermes
  ↓
AGY
  ↓
visual analysis


Use cases:

screenshot review
UI comparison
image analysis
visual QA

Success condition:

A coding agent can request multimodal analysis and use the result to improve its implementation.

52. Phase 3 — Multi-Agent

Add:

CTO
backend engineer
frontend engineer
QA
researcher

Implement task delegation.

Example:

CTO
 ├── Backend
 ├── Frontend
 └── QA


Success condition:

A high-level task can be decomposed and executed by multiple specialized agents.

53. Phase 4 — Autonomous Organization

Add:

automatic task creation
dependency management
agent hiring/spawning
budgets
approval workflows
automated prioritization
automated QA
automated deployment

Success condition:

The system can operate an entire software project with minimal human intervention.

54. Phase 5 — Production Hardening

Implement:

backups
disaster recovery
secret management
resource quotas
rate limiting
security isolation
monitoring
alerting
audit logs
automated recovery
upgrade strategy
55. MVP Acceptance Criteria

The MVP is successful if the following workflow works without manual intervention:

1. Create Paperclip task.

2. Assign task to agent.

3. Paperclip wakes Hermes.

4. Hermes reads task.

5. Hermes retrieves relevant memory.

6. Hermes invokes OpenCode.

7. OpenCode modifies repository.

8. OpenCode runs tests.

9. Hermes receives result.

10. Hermes decides whether further work is needed.

11. If required, Hermes invokes OpenCode again.

12. Hermes persists useful memory.

13. Hermes reports result.

14. Paperclip records completion.

15. Agent becomes idle.

16. Later heartbeat wakes the same agent.

17. Agent can retrieve previous knowledge and continue.

56. Multimodal Acceptance Criteria

The system is successful if:

Task:
"Build a dashboard matching design.png"

↓

Hermes

↓

OpenCode implements dashboard

↓

AGY analyzes screenshot

↓

AGY reports:
"Mobile layout has spacing problems."

↓

Hermes

↓

OpenCode fixes dashboard

↓

AGY rechecks

↓

PASS

57. Security Acceptance Criteria

The MVP must ensure:

agents cannot access unrelated projects
production credentials are not automatically available
dangerous operations can require approval
specialist tools have explicit permissions
agent spawning has limits
task/run IDs are auditable
secrets are not written to logs
failed agents cannot create infinite retry loops
58. Reliability Requirements

Target:

Paperclip uptime:
99%+

Agent run recovery:
automatic where possible

Duplicate task execution:
prevented through idempotency

Lost session:
recoverable where runtime supports resume

Server restart:
no loss of authoritative task state

59. Cost Controls

Each agent should have:

budget:
  daily_usd: 20
  monthly_usd: 300


Paperclip should own organizational budget accounting.

Hermes should expose model/token usage where available.

Specialist executions should be attributed to the parent task.

Example:

TASK-123

Hermes:
  $0.40

OpenCode:
  $1.80

AGY:
  $0.20

Total:
  $2.40

60. Agent Policy

Each agent should have a policy.

Example:

agent:
  name: frontend-engineer

  permissions:
    filesystem:
      read:
        - /workspaces/frontend
      write:
        - /workspaces/frontend

    tools:
      - opencode
      - agy
      - github

    operations:
      production_deploy: false
      destructive_database_operations: false
      spawn_agents: false

61. Specialist Policy

OpenCode:

opencode:
  permissions:
    filesystem: read_write
    terminal: allowed
    git: allowed
    network: restricted


AGY:

agy:
  permissions:
    filesystem:
      read:
        - screenshots/
        - design/
    filesystem_write:
      - artifacts/


AGY should generally not have unrestricted write access to source code.

62. Long-Term Vision

The eventual system should behave like an autonomous software company.

Example:

                    AI COMPANY
                       │
                      CEO
                       │
                    CTO Hermes
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Backend        Frontend          QA
     Hermes         Hermes          Hermes
        │              │              │
    OpenCode        OpenCode        OpenCode
                       │
                      AGY
                       │
                  Visual QA


Paperclip manages the organization.

Hermes provides intelligence.

OpenCode provides engineering execution.

AGY provides multimodal intelligence.

63. Future Specialist Runtimes

The architecture should allow future specialists without changing the core.

Potential specialists:

OpenCode
  → coding

AGY
  → multimodal

Browser Agent
  → browser automation

Research Agent
  → research

Security Agent
  → security auditing

Data Agent
  → analytics

DevOps Agent
  → infrastructure

Design Agent
  → visual/product design


The interface should remain:

Hermes
   ↓
Specialist Tool / MCP
   ↓
Specialist Runtime

64. Architectural Rule: Avoid Runtime Leakage

A specialist should not become an accidental second orchestrator.

For example:

OpenCode should not own:

organization state
task assignment
global scheduling
agent hiring


AGY should not own:

project management
task assignment
agent scheduling


Hermes should not own:

global organizational state


Paperclip should not own:

LLM reasoning

65. Decision Summary

The platform will use the following responsibility model:

┌─────────────────────────────────────────────┐
│                 PAPERCLIP                   │
│                                             │
│ "WHAT SHOULD HAPPEN?"                       │
│                                             │
│ Tasks / Projects / Agents / Schedule        │
│ Organization / Budgets / Governance         │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│                   HERMES                    │
│                                             │
│ "WHAT SHOULD I DO?"                         │
│                                             │
│ Reasoning / Memory / Skills / Delegation    │
└───────────────┬─────────────────┬───────────┘
                │                 │
                ▼                 ▼
┌────────────────────────┐ ┌──────────────────┐
│        OPENCODE        │ │       AGY        │
│                        │ │                  │
│ "HOW DO I CODE IT?"    │ │ "WHAT DO I SEE?" │
│                        │ │                  │
│ Code / Git / Tests     │ │ Vision / Images  │
│ Terminal / MCP         │ │ Video / Research │
└────────────────────────┘ └──────────────────┘

66. Final Recommendation

The initial implementation should use:

Paperclip
    ↓
Hermes Gateway
    ↓
┌───────────────┐
│               │
▼               ▼
OpenCode        AGY


with:

Paperclip = control plane
Hermes    = primary agent runtime
OpenCode  = coding specialist
AGY       = multimodal specialist


This architecture intentionally avoids making any single component responsible for everything.

The system should be built incrementally.

The first milestone is NOT a fully autonomous AI company.

The first milestone is:

One Paperclip-managed Hermes agent that can autonomously complete software-engineering tasks using OpenCode, retain memory between runs, and recover after sleeping/restarting.

Once that works reliably, add AGY.

Once that works, add multiple agents.

Only after those pieces are reliable should autonomous organization-wide behavior be enabled.

67. Current Integration Notes

Paperclip currently exposes OpenCode and Hermes as built-in adapters, including opencode_local, hermes_local, and hermes_gateway. The OpenCode adapter supports provider/model routing and session resume, while the Hermes gateway adapter is designed to connect Paperclip to an independently running Hermes API server. 
G
GitHub
+2

Hermes currently provides persistent memory, skills, MCP, delegation, multiple toolsets, and external memory-provider support. It can also operate as an MCP server, allowing its capabilities to participate in a broader tool architecture. 
H
Hermes Agent
+1

The exact AGY integration should be treated as an adapter/bridge boundary during implementation. It should not be considered a hard dependency of the core architecture. If the AGY interface changes, the Hermes specialist interface should remain stable.

68. Immediate Next Steps
Step 1

Deploy:

Paperclip
PostgreSQL
Hermes Gateway

Step 2

Configure:

Paperclip → Hermes Gateway

Step 3

Create:

Frontend Engineer


using Hermes as its runtime.

Step 4

Give Hermes access to OpenCode through a controlled specialist interface.

Step 5

Run the first autonomous task:

Inspect repository.
Implement a small feature.
Run tests.
Report completion.

Step 6

Verify:

Paperclip task state
Hermes session
Hermes memory
OpenCode session
Git state
Run correlation

Step 7

Add AGY.

Step 8

Implement visual QA.

Step 9

Add additional agents.

Step 10

Enable autonomous scheduling.

69. Definition of Done for Version 1

Version 1 is considered complete when:

 Paperclip is running reliably.
 PostgreSQL persistence is configured.
 Hermes Gateway is running independently.
 Paperclip can start Hermes runs.
 Hermes can access persistent memory.
 Hermes can invoke OpenCode.
 OpenCode can modify an isolated repository.
 OpenCode can run tests.
 Hermes can evaluate OpenCode results.
 Paperclip records the complete run.
 Agent sessions can resume.
 Agents can sleep and wake.
 Failed runs can be retried safely.
 Task/run IDs are correlated across components.
 Secrets are isolated.
 Workspaces are isolated.
 Basic monitoring is available.
 AGY integration can be added without changing Paperclip's task model.
70. Guiding Principle

The entire system should follow one rule:

Paperclip coordinates the work. Hermes thinks about the work. OpenCode does the engineering. AGY sees what the other agents cannot.

Everything else in the architecture should support that separation of concerns.


A few implementation details in this spec are intentionally conservative. In particular, **I would not hard-wire AGY into Paperclip initially**. Paperclip already has a strong adapter boundary, and Hermes already supports MCP, so keeping AGY behind Hermes gives you a much cleaner failure/replacement boundary. Paperclip's current adapter catalog also explicitly includes both OpenCode and Hermes, which makes the proposed control-plane/runtime split practical rather than purely theoretical. 
P
Paperclip Docs
+1



For the first build, I'd focus almost entirely on **Phase 0 → Phase 1**: get `Paperclip → Hermes Gateway → OpenCode` working with proper task/run correlation and persistent memory. Then add AGY as a specialist. That will let us discover the real integration constraints before building the multi-agent layer.
G
H
P
Sources
