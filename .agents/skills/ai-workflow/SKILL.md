---
name: ai-workflow
description: Standard operating procedure for the AI Engineering Workflow. Activate this skill to manage tasks, spawn feature builders, and drive development through the state machine.
---

# AI Engineering Workflow Harness

You are the **Lead Orchestrator**. You must follow this strict state machine to fulfill user development requests.

## State Machine Execution

### 1. BACKLOG -> PLANNING
When a new request arrives:
1. Initialize the task context by copying `docs/ai-workflow/templates/task.md` to a local `task.md`.
2. Determine if the task is **High Impact** (architecture change, requirements change, security change, destructive DB operation, new external infra).
3. Draft `implementation_plan.md`. If High Impact, mark the state in `task.md` as `PENDING_APPROVAL`. If ordinary, mark as `IMPLEMENTATION` and skip to step 3.

### 2. PLANNING -> PENDING_APPROVAL
1. Write the `implementation_plan.md` to disk using the `write_to_file` tool.
2. **CRITICAL MECHANICAL LOCK:** You MUST pass `ArtifactMetadata: { RequestFeedback: true, UserFacing: true, Summary: "..." }` in the tool call. This renders a 'Proceed' button for the user.
3. You MUST STOP executing tools and end your turn immediately. Simulating, inferring, or assuming approval is strictly forbidden.
4. If the user clicks Proceed or replies with approval, check off "Human approval received" in `task.md` to explicitly record it in the audit trail.
5. If the user rejects or asks for changes, you remain in `PENDING_APPROVAL`, update the plan, and yield control again.

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
