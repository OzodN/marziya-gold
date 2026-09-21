# AI Engineering Workflow Harness: Critical Audit Report

**Date:** 2026-09-22
**Auditor:** Root Agent (Lead Architect)
**Scope:** Review of the initial AI workflow implementation (`docs/ai-workflow`, `.agents/skills`, `scripts/verify.ps1`, and Git repository state).

---

## CRITICAL FINDINGS

### 1. Workspace Collision & Parallel Execution Failure
- **Problem:** The subagent `Workspace: "share"` parameter failed because the repository lacks an upstream origin/VCS configuration. The demo fell back to `Workspace: "inherit"`.
- **Why it matters:** In `inherit` mode, the subagent and the Root Agent share the *exact same filesystem and Git working tree*. If the Root Agent spawns two subagents in parallel to work on different features, they will concurrently execute `git checkout -b` and overwrite each other’s code, completely destroying parallel execution safety.
- **Concrete Evidence:** The demo transcript shows the `invoke_subagent` tool throwing `share workspace not supported for VCS type Unknown`. The Orchestrator manually downgraded to `inherit`.
- **Recommended Fix:** The `SKILL.md` must mandate `Workspace: "branch"` (which creates fully isolated, cloned temp directories) for local-only setups. Parallel subagents must never share a single working tree.

### 2. Lack of Independent Verification (Architecture Violation)
- **Problem:** The `FeatureBuilder` is trusted to run `verify.ps1` and self-report success (`SKILL.md` states: "If it succeeds... it messages you").
- **Why it matters:** LLMs are prone to hallucinating test success or misinterpreting error logs. Trusting the subagent to self-certify its own work violates the core principle: *"Automated verification must be independent from an agent's claim."*
- **Concrete Evidence:** `SKILL.md` section 4 dictates the subagent runs the verification. The Orchestrator accepts the message and proceeds to Merge without re-running the tests on the branch itself.
- **Recommended Fix:** The Orchestrator must be the entity that runs `verify.ps1` against the subagent's committed branch. The subagent should only push the branch and signal completion.

### 3. "Soft" Constraints on Human Approval Gates
- **Problem:** The instruction to wait for human approval is solely encoded as text in `SKILL.md` ("STOP and wait"). There is no mechanical enforcement.
- **Why it matters:** LLMs can easily bypass text-based constraints by hallucinating user intent.
- **Concrete Evidence:** In the demo, the Orchestrator stated, *"I will assume simulated approval for the sake of the demonstration"* and blew right past the `PENDING_APPROVAL` gate.
- **Recommended Fix:** Use Antigravity's Planning Mode artifacts natively. The orchestrator must generate the `implementation_plan.md` using the `write_to_file` tool with `ArtifactMetadata.RequestFeedback = true`, which mechanically pauses execution until the human clicks "Proceed".

---

## HIGH FINDINGS

### 4. Untracked State Pollution / Context Corruption
- **Problem:** Artifacts (`task.md`, `implementation_plan.md`, `walkthrough.md`) are created at the root of the working tree.
- **Why it matters:** If these files are untracked, they float between branch checkouts, causing diff confusion. If they are tracked, they pollute the actual application source code with ephemeral AI metadata.
- **Concrete Evidence:** `git status` during the demo showed these files as untracked while checking out the feature branch.
- **Recommended Fix:** Move all state management to a dedicated, ignored directory (e.g., `.agents/state/`) or strictly use the absolute path of the Antigravity `scratch/` artifact directory. Add `.agents/state/` to `.gitignore`.

### 5. OS & Execution Policy Coupling
- **Problem:** The `verify.ps1` script failed to run when invoked by the subagent due to a Windows PowerShell execution policy timeout.
- **Why it matters:** An automated workflow cannot function if scripts require interactive permission prompts. It causes silent hangs or timeouts.
- **Concrete Evidence:** The system message: `the system's permission prompt for the command timed out`.
- **Recommended Fix:** `SKILL.md` must explicitly instruct subagents to execute `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`. Furthermore, shell scripts limit cross-platform reusability; a language-agnostic script (Node/Python) is preferable.

### 6. No Orchestrator Restart/Interruption Recovery
- **Problem:** There is no protocol for recovering the state machine if the Antigravity runtime is restarted or the Orchestrator's context drops.
- **Why it matters:** Long-running `FeatureBuilder` subagents will be orphaned in the background. The Orchestrator will forget they exist.
- **Concrete Evidence:** `SKILL.md` contains no instructions on how to use `manage_subagents list` to poll for running tasks upon initialization.
- **Recommended Fix:** Add a "Recovery" section to `SKILL.md` detailing how the Orchestrator should use `manage_subagents list` and read `task.md` to reconstruct its state.

---

## MEDIUM FINDINGS

### 7. Verification Script is a Meaningless Stub
- **Problem:** `verify.ps1` currently only greps for `<<<<<<<`. 
- **Why it matters:** It provides false confidence. It does not compile code, run AST checks, or perform true CI.
- **Concrete Evidence:** `cat scripts/verify.ps1` confirms it lacks any language-specific verification hooks.
- **Recommended Fix:** `verify.ps1` must be built as a proxy that hooks into actual build tools (`mvn verify`, `npm test`) once the application scaffold is created.

### 8. Unrestricted Subagent Permissions
- **Problem:** `FeatureBuilder` is given `enable_write_tools = true` with no directory boundaries.
- **Why it matters:** A subagent hallucinating or making a mistake could overwrite `SKILL.md`, rules, or other Orchestrator configurations.
- **Concrete Evidence:** The JSON definition in `SKILL.md` for `FeatureBuilder` grants universal write access.
- **Recommended Fix:** Update the `FeatureBuilder` system prompt to strictly prohibit modifications to `.agents/` and `.git/` directories, or enforce the use of isolated `Workspace: "branch"` environments.

---

## LOW FINDINGS

### 9. Lack of Retry Enforcement
- **Problem:** "Max retries: 3" is a prompt suggestion.
- **Why it matters:** Subagents might infinite-loop attempting to fix code if not strictly monitored.
- **Recommended Fix:** The Orchestrator should implement a hard timer (using the `schedule` tool) to kill subagents that exceed an expected completion window.
