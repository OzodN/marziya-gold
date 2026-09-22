# GitHub Repository Setup for Harness v3

To enforce the external trust boundary described in Harness v3, the following manual settings **MUST** be applied to the GitHub repository. The local AI agent does not have permissions to configure these.

## 1. Branch Protection Rules
Navigate to: **Settings > Branches > Add branch protection rule**

Set the **Branch name pattern** to `main`.

Enable the following REQUIRED settings:
- [x] **Require a pull request before merging**
  - [x] Require approvals (Set to at least 1)
  - [ ] Dismiss stale pull request approvals when new commits are pushed (Recommended)
  - [x] Require review from Code Owners (Recommended if using CODEOWNERS)
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Add the following status checks: `build-and-test` (from `.github/workflows/ci.yml`)
- [x] **Do not allow bypassing the above settings** 
  *(CRITICAL: This ensures the AI Agent cannot bypass the rules even if it acts maliciously).*
- [x] **Restrict who can push to matching branches**
  *(Leave the list empty, or only allow specific CI bots. Do not allow the AI Agent's user account).*

## 2. Additional Protections
- [x] **Block force pushes**
- [x] **Block deletion**

## 3. General Repository Settings
Navigate to: **Settings > General**

Under **Pull Requests**:
- [x] Allow merge commits
- [x] Allow squash merging (Recommended for cleaner history)
- [ ] Allow rebase merging
- [x] Automatically delete head branches (Keeps repo clean after PRs)

## 4. Environment Approvals (If Deploying to Production)
Navigate to: **Settings > Environments**
- Create an environment named `production`.
- Enable **Required reviewers** and add human code owners.
- Ensure any deployment workflows reference `environment: production` to trigger the approval gate.
