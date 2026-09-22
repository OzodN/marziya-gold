# AI Workflow Harness v3: Final Adversarial Security Audit

**Date:** 2026-09-22
**Auditor:** Root Agent (Adversarial Persona)
**Scope:** Assess the robustness of Harness v3 against an OS-privileged, rogue/hallucinating Root Agent attempting to bypass mechanical controls, given the new GitHub external trust boundary.

---

## Adversarial Bypass Paths

| Attack Path | Possible? | Why | Trust Boundary | Remaining Risk |
| :--- | :--- | :--- | :--- | :--- |
| **1. Direct `execution.json` manipulation** | **NO** (for merge) / **YES** (for local state) | Agent can forge `execution.json` to state `PR_CREATED` or `DONE`. However, this local forgery cannot trick GitHub into merging unapproved/failing code. | **GitHub** | **LOW**. Agent can confuse itself locally, but cannot break `dev`. |
| **2. Script tampering** | **NO** (for merge) / **YES** (for local state) | Agent can edit local scripts. Tampering will either fail `hashes.json` (fail-closed) or, if both are forged, skip local checks. However, GitHub ignores local scripts. | **GitHub** | **LOW**. Agent can skip local verification, but CI will catch it remotely. |
| **3. Hash manipulation** | **NO** (for merge) / **YES** (for local state) | Agent can forge `hashes.json` locally. Does not grant merge rights. | **GitHub** | **LOW**. |
| **4. Git hook deletion** | **N/A** | Git hooks (`pre-merge-commit`) have been explicitly removed/deprecated in v3 because local merges are prohibited. | **GitHub** | **NONE**. |
| **5. Raw `git merge`** | **NO** (to `dev`) / **YES** (locally) | Agent can execute `git merge dev` locally, but `git push origin dev` will be mechanically rejected by GitHub's Branch Protection Rules. | **GitHub** | **NONE**. The remote `dev` branch is protected. |
| **6. Local verification bypass** | **YES** | Agent can skip `verify.ps1` locally. | **GitHub** | **NONE** (for merge). Remote CI `.github/workflows/ci.yml` is required to pass before merge. |
| **7. Approval bypass** | **NO** | Agent can no longer bypass approval locally because the PR model dictates that a human code owner must review the PR on GitHub. The agent lacks admin rights to override this. | **GitHub** | **NONE**. Mechanically enforced by GitHub. |
| **8. Workstream DAG bypass** | **YES** | Agent can edit `execution.json` to skip dependencies or run `invoke_subagent` directly. | **Local OS** | **MEDIUM**. Agent can execute work out of order, wasting compute or causing conflicts, but bad code is still caught by CI. |
| **9. Workspace isolation bypass** | **YES** | Agent can call `invoke_subagent` with `Workspace: inherit`. | **Local OS** | **HIGH**. Still relies on `AGENT-DISCIPLINE`. May corrupt the local working tree. |

---

## Final Security Posture Evaluation

Can the Root Agent, possessing standard contributor permissions, autonomously alter `dev` or bypass mandatory CI/Review?
**NO.**

Because the ultimate authority has been decoupled from the agent's execution environment (Local OS) and placed in an external service (GitHub), the agent is cryptographically and mechanically bound to the rules of the repository. 

*   The agent **cannot** merge without CI passing (Enforced by GitHub Status Checks).
*   The agent **cannot** merge without human approval (Enforced by GitHub PR Reviews).
*   The agent **cannot** force push to dev (Enforced by GitHub Branch Protection).

The only remaining risks are bounded to the local environment (wasting time, corrupting its own local repository clone via bad workspace isolation, or breaking its own local orchestration state).

**Final Assessment:** **ROBUST (At the Trust Boundary)**
