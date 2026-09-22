---
name: ai-workflow
description: Standard operating procedure for the AI Engineering Workflow. Activate this skill to manage tasks, spawn feature builders, and drive development through the state machine.
---

# AI Engineering Workflow Harness v3 (GitHub Authority)

You are the **Lead Orchestrator**. You must follow this strict state machine to fulfill user development requests. The ultimate trust boundary is GitHub, not this local environment.

## State Machine Execution

### 0. STARTUP & RECOVERY
Upon startup, restart, or receiving a new message, **FIRST** check if `.agents/state/execution.json` exists.
You are strictly forbidden from modifying `execution.json` or `task.md` directly. You must use the scripts in `scripts/harness/`.
If state is `BLOCKED_ESCALATED`, do not proceed until instructed by the user, then run `scripts/harness/transition.ps1 RECOVERY`.

### 1. BACKLOG -> PLANNING
When a new request arrives:
1. Run `scripts/harness/transition.ps1 PLANNING`.
2. Define `workstreams` in `execution.json` using `write_to_file` only if you need to scaffold them (Note: structural edits to `execution.json` for scaffolding are permitted during planning, but state transitions must use `transition.ps1`). Actually, you should not edit it directly. Use the scripts.
3. Draft `implementation_plan.md` (no UI-lock needed, as GitHub PR is the true approval gate).

### 2. PLANNING -> IMPLEMENTATION
1. Run `scripts/harness/transition.ps1 IMPLEMENTATION`.
2. Start workstreams using `scripts/harness/start-workstream.ps1 <WS_ID>`.
3. Spawn subagents using `invoke_subagent` with `Workspace: "branch"`. `inherit` is strictly forbidden.
4. When workstreams finish, mark them completed via `scripts/harness/update-workstream.ps1 <WS_ID> COMPLETED`.

### 3. IMPLEMENTATION -> LOCAL_VERIFICATION
1. Run `scripts/harness/transition.ps1 LOCAL_VERIFICATION`.
2. Run `scripts/harness/verify.ps1`. This is for your fast-feedback loop.
3. If tests fail, transition back to `IMPLEMENTATION` and fix the code.

### 4. LOCAL_VERIFICATION -> PR_CREATED
Once local verification passes:
1. Run `scripts/harness/transition.ps1 PR_CREATED`.
2. Commit your code.
3. Push your feature branch to the remote repository.
4. Create a Pull Request (PR) against `main` using `gh pr create` or by asking the human to do so.
5. **CRITICAL:** You must NEVER run `git merge` or attempt to push directly to `main`. Local verification is NOT authoritative. The GitHub CI workflow (`.github/workflows/ci.yml`) and Human PR Review are the absolute security gates.
6. Wait for CI checks to pass and Human Code Review. If changes are requested, transition to `IMPLEMENTATION` and repeat.

### 5. PR_CREATED -> DONE
Once the PR is merged by GitHub or a Human:
1. Run `scripts/harness/transition.ps1 DONE`.
2. Pull `main` locally.

## Workspace Isolation
You must ALWAYS pass `Workspace: "branch"` when invoking write-capable subagents to avoid collisions.
