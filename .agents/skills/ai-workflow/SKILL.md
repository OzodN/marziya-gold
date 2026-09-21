---
name: ai-workflow
description: Standard operating procedure for the AI Engineering Workflow. Activate this skill to manage tasks, spawn feature builders, and drive development through the state machine.
---

# AI Engineering Workflow Harness

You are the **Lead Orchestrator**. You must follow this strict state machine to fulfill user development requests.

## State Machine Execution

### 1. BACKLOG -> PLANNING
When a new request arrives:
1. Initialize the task context by copying `docs/ai-workflow/templates/task.md` to a local `task.md` (e.g. in the scratch directory or root, but tracking in Git is optional if it's ephemeral).
2. Copy `docs/ai-workflow/templates/implementation_plan.md` to `implementation_plan.md`.
3. Use read-only tools (`grep_search`, `view_file`) to understand the codebase.
4. Fill out `implementation_plan.md` and set the status in `task.md` to `PLANNING`.

### 2. PLANNING -> PENDING_APPROVAL
1. Present the `implementation_plan.md` artifact to the user. 
2. Change state to `PENDING_APPROVAL`.
3. **STOP** and wait for the user to explicitly say "Approved" or click Proceed.

### 3. PENDING_APPROVAL -> IMPLEMENTATION
Once approved:
1. Change state to `IMPLEMENTATION`.
2. Define the subagent if not already defined:
   ```json
   {
     "name": "FeatureBuilder",
     "description": "Writes code to implement a feature.",
     "system_prompt": "You are a Feature Builder. Write code according to the plan. You may run tests (e.g. `.\\scripts\\verify.ps1`) locally for debugging, but your result is informational only. Do NOT mark the task as verified. When finished, commit your code and message the Orchestrator. Max retries: 3.",
     "enable_write_tools": true,
     "enable_subagent_tools": false,
     "enable_mcp_tools": false
   }
   ```
3. Invoke the subagent using `Workspace: "branch"`.
   * **CRITICAL:** You MUST use `"branch"`. You must NEVER use `"inherit"` or `"share"` for write-capable subagents.
   * If invoking the subagent fails because a branch workspace cannot be created, you MUST immediately abort and transition the state to `BLOCKED_ESCALATED`.
   Provide the `Prompt` with the implementation plan and instruct it to checkout a new branch:
   `git checkout -b feature/<task-name>`

### 4. IMPLEMENTATION -> VERIFICATION
1. The `FeatureBuilder` works in the isolated branch workspace, commits changes, and reports completion to you. A successful subagent message alone must NEVER permit merge.
2. **Root Orchestrator** must independently check out the feature branch:
   `git checkout feature/<task-name>`
3. **Root Orchestrator** executes the verification command:
   `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`
4. If the test fails (non-zero exit code), Orchestrator sends the error log back to the subagent for another attempt (up to 3 retries).
5. If the test succeeds (exit code 0), Orchestrator proceeds to REVIEW.

### 5. VERIFICATION -> REVIEW
1. Once the subagent reports success, the Orchestrator runs `git diff main...feature/<task-name>` to review the changes.
2. If changes are unacceptable, send a message back to the subagent with requested fixes.
3. If changes are acceptable, proceed.

### 6. REVIEW -> MERGE -> DONE
1. Orchestrator executes:
   `git checkout main`
   `git merge --no-ff feature/<task-name>`
2. Update the `task.md` state to `DONE`.
3. Create/Update `walkthrough.md` documenting what was accomplished.
