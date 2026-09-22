# AI Engineering Workflow Harness v2: Architecture Proposal

## 1. Current Architecture & Failure Modes
The v1 Harness relies on a "Prompt-Driven" architecture where the Root Agent (Orchestrator) is guided by textual instructions (`SKILL.md`) and a human-readable Markdown checklist (`task.md`). 
**Current Failure Modes:**
Because there is no external state machine enforcing execution, the system is vulnerable to LLM hallucinations:
* **Approval Bypass:** Transitioning to implementation without a UI lock.
* **Workspace Collision:** Invoking write-capable subagents in shared workspaces.
* **Unverified Merges:** Executing `git merge` without running tests.
* **State Corruption:** Skipping dependencies or ignoring retry limits.

## 2. Target Architecture
The v2 architecture transitions from a **prompt-based policy** to a **script-enforced state machine**.
* **execution.json as Source of Truth:** `execution.json` is the sole machine-readable source of truth for the execution state. 
* **task.md as Read-Only Projection:** `task.md` is no longer the source of truth. It is strictly a read-only human-readable projection generated automatically by the Harness scripts from `execution.json`. The Root Agent is prohibited from editing it manually to change state.
* **Trusted Execution Engine:** Critical operations are wrapped in PowerShell scripts (`transition.ps1`, `approve.ps1`, `verify.ps1`, `merge.ps1`, `start-workstream.ps1`).

## 3. State Machine & Fail-Closed Principle
**State Machine:**
`BACKLOG` → `PLANNING` → `PENDING_APPROVAL` → `IMPLEMENTATION` → `VERIFICATION` → `REVIEW` → `MERGE` → `DONE`
*Exception States:* `BLOCKED_ESCALATED`, `RECOVERY`, `FAILED`.

**Fail-Closed Principle:**
This is an absolute requirement of the Harness. If the system cannot reliably determine the current state, execution.json schema, approval hash, verification result, workstream dependency, or Harness integrity, it MUST transition to `BLOCKED_ESCALATED` and halt execution. There are no "continue anyway" fallbacks.

## 4. execution.json Schema
**Path:** `.agents/state/execution.json`
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "current_state": { 
      "type": "string", 
      "enum": ["BACKLOG", "PLANNING", "PENDING_APPROVAL", "IMPLEMENTATION", "VERIFICATION", "REVIEW", "MERGE", "DONE", "BLOCKED_ESCALATED", "RECOVERY"] 
    },
    "workstreams": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "status": { "type": "string", "enum": ["PENDING", "RUNNING", "COMPLETED", "FAILED"] },
          "depends_on": { "type": "array", "items": { "type": "string" } },
          "assigned_agent_id": { "type": "string" },
          "attempts": { "type": "integer" }
        }
      }
    },
    "approval": {
      "type": "object",
      "properties": {
        "approved": { "type": "boolean" },
        "timestamp": { "type": "string" },
        "plan_hash": { "type": "string" }
      }
    },
    "verification": {
      "type": "object",
      "properties": {
        "passed": { "type": "boolean" },
        "exit_code": { "type": "integer" },
        "timestamp": { "type": "string" }
      }
    }
  },
  "required": ["current_state", "workstreams", "approval", "verification"]
}
```

## 5. Harness Integrity (Trusted Execution Engine)
To prevent silent modifications by a rogue or hallucinating agent, the scripts themselves are protected.
* **Mechanism:** A fixed set of Harness scripts are tracked via hashes/versions.
* **Validation:** Before any critical operation (`merge`, `transition`, `approve`), the Harness performs an integrity check of its own `.ps1` files.
* **Fail-Closed:** If tampering is detected, the operation aborts with a non-zero exit code and sets state to `BLOCKED_ESCALATED`.
* *Note:* This is not an absolute security boundary against an agent with OS privileges, but it ensures *tamper-detection* and fail-closed behavior.

## 6. Control Mechanisms & Enforcement Levels

### 6.1 Mechanical Human Approval Gate (`approve.ps1`)
* **Blocks:** Transition to `IMPLEMENTATION` without explicit approval tied to a specific plan.
* **Mechanism:** Hashes `implementation_plan.md` and records it with a timestamp in `execution.json`. Transition allowed only from `PENDING_APPROVAL`.
* **Enforcement:** `PARTIALLY ENFORCED`. (Hash binding is mechanical, but the agent's trigger is prompt-driven).

### 6.2 Mechanical Merge Gate (`merge.ps1` + Git Hook)
* **Blocks:** Merging untested or unapproved code.
* **Mechanism:** `merge.ps1` validates state (`REVIEW`) and `verification.passed == true`. 
* **Defense-in-Depth:** A Git `pre-merge-commit` hook is added to intercept raw `git merge` commands. The hook parses `execution.json` as a final safety check.
* **Enforcement:** `PARTIALLY ENFORCED`. (The hook acts as a robust mechanical barrier, though theoretically modifiable by an OS-privileged agent).

### 6.3 State Transition Engine (`transition.ps1`)
* **Blocks:** Invalid state jumps (e.g., `PLANNING` → `MERGE`).
* **Mechanism:** Validates current state against allowed DAG edges before updating `execution.json`.
* **Enforcement:** `PARTIALLY ENFORCED`. 

### 6.4 Verification Contract (`verify.ps1`)
* **Blocks:** FeatureBuilders self-certifying tests.
* **Mechanism:** Deterministically runs tests. Only successful runs (exit code 0) can mechanically update `verification.passed = true` in the state file.
* **Enforcement:** `PARTIALLY ENFORCED`.

### 6.5 Machine-Readable DAG (Workstream Orchestration)
* **Blocks:** Running dependent workstreams out of order.
* **Mechanism:** `start-workstream.ps1 <WS_ID>` parses `depends_on`. If dependencies are not `COMPLETED`, exit code != 0.
* **Enforcement:** `PARTIALLY ENFORCED`.

### 6.6 Workspace Isolation (`invoke_subagent`)
* **Limitation:** `invoke_subagent` is a native tool, meaning we cannot build a script wrapper or MCP server at this time to mechanically intercept its arguments.
* **Enforcement:** `AGENT-DISCIPLINE`. We must rely on the LLM's adherence to the `SKILL.md` to pass `Workspace: "branch"` and not fallback to `inherit`.

## 7. Recovery & Escapement
* **Mechanism:** `transition.ps1 BLOCKED_ESCALATED`
* **Protocol:** Retry limits (`attempts`) are tracked in `execution.json`. If attempts exceed limits, or verification fails unrecoverably, `start-workstream.ps1` halts. The Orchestrator must transition to `BLOCKED_ESCALATED` for human escalation. A recovery transition resets appropriate state flags.

## 8. Migration Plan
1. Scaffold `execution.json` and deprecate `task.md` as source of truth.
2. Implement `transition.ps1`, `approve.ps1`, `merge.ps1`, `start-workstream.ps1`.
3. Implement script integrity checking (hash validation).
4. Implement defense-in-depth Git Hook (`pre-merge-commit`).
5. Update `SKILL.md` to strictly forbid raw `git` commands and enforce script usage.
6. Setup read-only projection generation for `task.md`.

## 9. Testing Strategy
We will not rely on "Prompt-Discipline" testing (asking the agent to bypass rules). Instead, we will implement deterministic, negative-path programmatic tests against the Harness scripts:

* **Invalid State Transition:** Attempt to run `transition.ps1 MERGE` while in `PLANNING`. Expect: Exit code != 0, state unchanged.
* **Merge Without Verification:** Modify `execution.json` to `state: REVIEW`, `verification.passed: false`, then run `merge.ps1`. Expect: Merge blocked, Exit code != 0.
* **Workstream Dependency Violation:** Set WS-3 to depend on WS-1 and WS-2. Leave WS-2 as `PENDING`. Run `start-workstream.ps1 WS-3`. Expect: Execution blocked, Exit code != 0.
* **Corrupted execution.json:** Inject malformed JSON or invalid schema values. Expect: Any Harness script run triggers `BLOCKED_ESCALATED`.
* **Harness Tampering:** Modify `merge.ps1` (invalidating its hash), then run `transition.ps1`. Expect: Tampering detected, system transitions to `BLOCKED_ESCALATED`.
* **Direct Git Merge:** With unfulfilled conditions, manually execute `git merge feature-branch`. Expect: Git hook intercepts and aborts the merge.

## 10. Risks and Limitations
* **Antigravity OS Privileges:** The Orchestrator runs with full OS user privileges. It can technically rewrite Git hooks, rewrite `.ps1` files, or edit `.json` directly. The Harness cannot guarantee absolute security against a rogue agent; its goal is robust tamper detection, fail-closed enforcement, and mechanical guardrails against hallucinated actions.
* **Workspace Isolation:** Remains `AGENT-DISCIPLINE` due to native tool limitations. MCP proxy integration is deferred.
