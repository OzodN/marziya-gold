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
     "description": "Writes code and runs tests to implement a feature.",
     "system_prompt": "You are a Feature Builder. You must write code according to the plan. You CANNOT claim completion until you run `.\\scripts\\verify.ps1` and receive an exit code of 0. Max retries: 3.",
     "enable_write_tools": true,
     "enable_subagent_tools": false,
     "enable_mcp_tools": false
   }
   ```
3. Invoke the subagent using `Workspace: "share"`.
   Provide the `Prompt` with the implementation plan and instruct it to checkout a new branch:
   `git checkout -b feature/<task-name>`

### 4. IMPLEMENTATION -> VERIFICATION
1. The `FeatureBuilder` works in the shared workspace branch.
2. It MUST run `.\scripts\verify.ps1` (or equivalent test command).
3. If tests fail, it retries up to 3 times.
4. If it succeeds (exit code 0), it messages you (Lead Orchestrator) that VERIFICATION is complete.
5. If it fails 3 times, it messages you with failure, and you transition to `BLOCKED_ESCALATED`.

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
