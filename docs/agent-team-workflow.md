# Agent Team Workflow

TutorPal uses the user-facing root Codex session as an orchestrator. The root
analyzes each request, establishes acceptance criteria, assigns the relevant
specialists, enforces quality gates, and presents the final result. Specialists
return work to the root and never spawn or direct one another.

## Models and roles

The project default in `.codex/config.toml` is `gpt-5.6-sol`, which is the
orchestrator model unless a live session explicitly overrides it. The solution
architect also uses `gpt-5.6-sol`; every other custom specialist uses
`gpt-5.6-terra`.

| Agent | Access | Responsibility |
| --- | --- | --- |
| `solution_architect` | Read-only | Research and decide consequential architecture before implementation |
| `designer` | Read-only | Shape UI work and audit the tested result with Impeccable |
| `frontend_executor` | Workspace write | Implement scoped frontend production changes |
| `backend_executor` | Workspace write | Implement scoped backend production changes |
| `frontend_tester` | Workspace write, test assets only | Validate frontend behavior and own frontend tests |
| `backend_tester` | Workspace write, test assets only | Validate backend behavior and own backend tests |
| `frontend_reviewer` | Read-only | Perform final frontend engineering and convention review |
| `backend_reviewer` | Read-only | Perform final backend engineering and convention review |

`agents.max_depth = 1` keeps every specialist directly under the root.
`agents.max_threads = 8` allows all eight specialist role threads while the
root remains the sole coordinator.

Because the root and most specialists use different configured models, the
root must spawn every custom specialist with a bounded context fork, not the
default full-history fork. Using the same rule for the solution architect keeps
delegations predictable. The delegation prompt therefore includes the complete
assignment, acceptance criteria, owned paths, and required prior handoffs.

## Routing and gates

Architecture-sensitive work begins with:

```text
solution architect -> applicable implementation pipeline(s)
```

Use this gate for new or changed subsystem boundaries, frontend/backend
contracts, data models or migration strategy, external integrations,
authentication or security architecture, framework/dependency choices,
performance architecture, or consequential compatibility behavior. Routine
local implementation skips it.

Backend-only work follows:

```text
backend executor -> backend tester -> backend reviewer -> root summary
```

Frontend work without a user-visible design change follows:

```text
frontend executor -> frontend tester -> frontend reviewer -> root summary
```

UI-impacting frontend work follows:

```text
designer shape -> frontend executor -> frontend tester
              -> designer audit -> frontend reviewer -> root summary
```

UI-impacting work includes new or changed screens, components, layouts,
interactions, visual states, accessibility behavior, responsive behavior,
motion, or design-system behavior. Invisible hooks, generated API clients, and
internal refactors skip the designer unless they change observable UI behavior.

Full-stack work uses both subsystem pipelines. The root may run independent
frontend and backend phases concurrently, but it sequences work when the
frontend depends on a new or unsettled API contract. Two write-capable agents
must not own the same files at the same time.

## Solution architect workflow

The solution architect starts with repository evidence: applicable conventions,
feature history, configuration, schemas, and real execution paths. It performs
external research only when local evidence is insufficient or the decision is
current, version-sensitive, or dependent on external behavior. Research uses
primary sources such as official documentation, standards, specifications, and
original research, with sourced facts separated from inference.

It chooses the smallest architecture that meets the confirmed request and
returns a decision record covering context, constraints, subsystem ownership,
interfaces and schemas, data flow, failure/security/performance considerations,
alternatives and tradeoffs, migration and compatibility, implementation order,
verification, sources, assumptions, and blockers. Executors treat the approved
record as binding input. If later implementation or review evidence invalidates
an assumption, the root re-invokes the architect before assigning more changes.

The solution architect never edits code, tests, configuration, migrations, or
documentation and never replaces an unresolved product decision with a guess.

## Designer workflow

The designer must use the project Impeccable skill for every assignment. It
runs the skill context setup once per agent session, reads `PRODUCT.md`,
`DESIGN.md`, the product register, the applicable Impeccable reference, and
representative existing UI.

- Before implementation, it follows Impeccable's `shape` workflow and returns
  a design brief with the user goal, hierarchy, states, interactions,
  accessibility, responsive behavior, motion, tokens, and visual acceptance
  criteria.
- After frontend testing, it follows Impeccable's `audit` workflow and reports
  accessibility, performance, theming, responsive, and anti-pattern scores
  with prioritized findings.

The designer never edits code, tests, documentation, `PRODUCT.md`, or
`DESIGN.md`. If required design context is missing, it stops and tells the root
that initialization is required rather than bypassing the skill.

## Failure and review loop

A failing phase never advances to the next gate.

- Production defects go back to the owning executor.
- Test-only defects go back to the relevant tester.
- Designer audit findings go back to the frontend executor.
- Reviewer findings go to the executor or tester that owns the affected file.

After a fix, the root repeats every affected downstream test, design-audit, and
review phase. The loop ends only when the gates pass or the root identifies a
genuine blocker requiring user input or external state.

Reviewers read `AGENTS.md`, the appropriate documentation hub and linked
conventions, the complete relevant diff, and all earlier handoffs. Findings use
P0-P3 priority, cite files and lines, explain impact and evidence, and name the
remediation owner. A clean review explicitly states that no actionable findings
remain and records residual validation risks.

## Baseline validation

- Frontend: run `bun run build` from `frontend/`, then perform targeted browser
  checks when the changed behavior and available environment require them.
- Backend: run `bun test` and `bun run check` from `backend/`.

Frontend testers may add minimal test support when repeatable task coverage
justifies it, but this team setup does not bootstrap a frontend test framework.
Open a fresh Codex task after changing agent configuration so the project model,
role definitions, and orchestration instructions are loaded together.
