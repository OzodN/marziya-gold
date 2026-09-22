# AI Workflow Harness v3: Architecture Proposal

## 1. Goal: External Trust Boundary
Harness v2 demonstrated that local mechanical enforcement is vulnerable (BYPASSABLE) because the Root Agent and the enforcement scripts share the same OS privilege ring. 

Harness v3 resolves this by moving the ultimate authority (the Trust Boundary) to an external system: **GitHub**.
*   **Local AI Orchestration:** Antigravity and the Root Agent handle planning, context, task decomposition, workstream orchestration, implementation, local fast-feedback testing, local state management (`execution.json`), and retry/recovery loops.
*   **External Trust Boundary:** GitHub and GitHub Actions act as the absolute, immutable source of truth for merge eligibility, independent verification, branch protection, human review, and merge enforcement.

## 2. GitHub as Trust Boundary
The target workflow shifts from local agent-driven merges to a strictly controlled Pull Request (PR) model:
`Feature Branch` → `Pull Request` → `GitHub Actions CI` → `Required Status Checks` → `Human Approval` → `Protected Main` → `Merge`

*   **Required Checks:** GitHub Actions CI workflow must pass (exit 0).
*   **Required Approvals:** At least 1 human reviewer must approve the PR.
*   **Merge Rights:** Only designated human Code Owners (or GitHub auto-merge) have merge rights. 
*   **Admin Privileges:** The AI agent **MUST NOT** have Admin or Bypass permissions on the repository. It operates with standard contributor write access to push feature branches.
*   **Protection of `main`:** The `main` branch is protected by server-side Branch Protection Rules, preventing direct pushes and bypassing of rules.
*   **Enforcement:** Merges are mechanically blocked by GitHub's servers if rules are violated. `MECHANICALLY ENFORCED`.

## 3. Independent Verification (Remote CI)
True independent verification occurs **only** on the remote CI server. The local `verify.ps1` remains as a fast-feedback loop for the agent, but it is stripped of its authority to authorize a merge.
Remote CI (`.github/workflows/ci.yml`) must execute:
*   Compilation / Build
*   Unit & Integration Tests
*   Linting & Static Code Analysis
*   Security Scans (if applicable)

## 4. Human Approval
The chat-based `APPROVED` mechanism (from Harness v1/v2) is deprecated as a security gate and replaced by **GitHub Pull Request Reviews**.
*   **Architecture/Requirements:** High-level plans can still be reviewed locally via chat, but the *enforcement* happens at the PR level. If an agent builds something architecturally unsound, the human rejects the PR.
*   **Code Review (Merge to Main):** Requires explicit GitHub PR approval.
*   **Production Deployment:** Requires human approval on GitHub Environments/Deployments.

## 5. Local `execution.json`
`execution.json` is retained as the local orchestration state engine to manage task decomposition, workstreams, and retry logic. However, it is no longer the final security authority.
*   `execution.json` tracks local progress. (`verification.passed` simply means *local* tests passed).
*   **GitHub Status Checks** are the absolute authority for merge eligibility.

## 6. Local Merge vs Remote Merge
The Root Agent **will no longer execute `git merge`**.
*   **Target Workflow:** Root Agent implements code → Pushes feature branch → Opens/Updates PR (via GitHub API or `gh` CLI) → Waits for CI + Human → Human (or GitHub Auto-Merge) merges into `main`.
*   The local `merge.ps1` script and Git hooks are deprecated as security boundaries, as GitHub handles this natively.

## 7. Minimal CI Pipeline Design (`.github/workflows/ci.yml`)
*   **Triggers:** `pull_request` (against `main`), `push` (to `main`).
*   **Jobs:**
    *   `build`: Compiles backend and frontend.
    *   `test`: Runs unit/integration tests.
    *   `lint`: Runs linters/formatters.
*   **Failure Behavior:** Fails the status check, mechanically blocking the PR. The Root Agent observes the failure, fetches logs, and attempts fixes on the branch.
*   **Status Check Names:** `build`, `test`, `lint`.

## 8. Branch Protection Rules
**MUST (MECHANICALLY ENFORCED):**
*   Require a pull request before merging.
*   Require status checks to pass before merging (CI pipeline jobs).
*   **Do not allow bypassing the above settings** (Crucial: Agent must not have bypass/admin rights).
*   Restrict who can push to matching branches (Block direct pushes to `main`).

**SHOULD:**
*   Require approvals (at least 1 human approval).
*   Require review from Code Owners.
*   Block force pushes and deletion of `main`.

**OPTIONAL:**
*   Require signed commits.
*   Require merge queue.

## 9. Workspace Isolation
Workspace isolation via the `invoke_subagent` native tool remains **AGENT-DISCIPLINE**.
*   **Limitation:** We cannot mechanically intercept native platform tools in the local OS without an external proxy.
*   **Evolution Path (Harness v4+):** An MCP Agent Manager or Sandboxed Agent Runtime that intercepts subagent creation, forcibly provisions containerized/isolated worktrees, and routes traffic.

## 10. Responsibility Matrix

| Responsibility | Local AI | GitHub / CI | Human |
| :--- | :---: | :---: | :---: |
| Planning & Decomposition | ✅ | | ✅ (Review) |
| Implementation | ✅ | | |
| Local Fast-Feedback Tests | ✅ | | |
| Independent CI Verification | | ✅ | |
| PR Code Review | | (Platform) | ✅ |
| Merge Eligibility Authority | | ✅ | |
| Merge to Main | | ✅ (or Human) | ✅ |
| Production Deployment | | ✅ | ✅ |

## 11. Failure & Recovery Model

*   **Local Failure (Build/Test):** Handled by Root Agent (retry loop using `execution.json`).
*   **CI Failure:** GitHub blocks PR. Root Agent reads CI logs via API, pushes fixes to branch.
*   **Review Rejection:** Human requests changes on PR. Root Agent processes feedback, pushes fixes.
*   **Merge Blocked:** Enforced by GitHub. Agent must wait or fix issues.
*   **Agent Crash / Workflow Restart:** Agent uses `execution.json` to recover local state, checks active PRs via GitHub API to sync with remote state.

## 12. Security Model Comparison

| Adversarial Audit Bypass Path (v2) | Harness v3 Mitigation | New Status |
| :--- | :--- | :--- |
| **Direct State Manipulation** | Forging `execution.json` cannot bypass GitHub Branch Protection. | **MECHANICALLY ENFORCED** (by GitHub) |
| **Hash Bypass (Scripts)** | Tampering local scripts cannot forge remote CI status checks. | **MECHANICALLY ENFORCED** (by GitHub) |
| **Git Hook Bypass** | Deleting local hooks allows local merges, but pushing the merge to `main` is blocked by GitHub. | **MECHANICALLY ENFORCED** (by GitHub) |
| **Raw Git Commands** | Direct push to `main` is mechanically rejected by GitHub. | **MECHANICALLY ENFORCED** (by GitHub) |
| **Verification Bypass** | Agent modifying local `verify.ps1` cannot bypass the remote `.github/workflows/ci.yml`. | **MECHANICALLY ENFORCED** (by GitHub) |
| **Approval Bypass** | Local script bypass is irrelevant; GitHub requires human PR approval. | **MECHANICALLY ENFORCED** (by GitHub) |
| **Workstream DAG Bypass** | Agent can still bypass local DAG orchestration. | **PARTIALLY ENFORCED** (Local only) |
| **Workspace Isolation** | Agent can still misuse `invoke_subagent`. | **AGENT-DISCIPLINE** |

## 13. Final Recommendation
1.  **Target Architecture:** Local AI Orchestration + GitHub External Trust Boundary.
2.  **Keep from v2:** `execution.json` for local orchestration, `task.md` projection, local fast-feedback scripts.
3.  **Move to GitHub:** CI/CD pipelines, Merge Authority, Human Approval Gates, Branch Protection.
4.  **Human Responsibility:** Reviewing PRs, architectural alignment, deployment authorization.
5.  **Limitations Remaining:** Workspace isolation (Agent-Discipline), Local DAG adherence (Partially Enforced).
6.  **Harness v4 Evolution:** Containerized/Sandboxed Agent Runtime via MCP to mechanically isolate workspaces and intercept local tool calls.
