# test-harness.ps1 (v3)

function Assert-Fail {
    param([scriptblock]$Script, [string]$TestName)
    try {
        & $Script > $null 2>&1
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) {
            Write-Host "[PASS] $TestName (Exit code $exitCode)" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $TestName (Expected failure, got success)" -ForegroundColor Red
        }
    } catch {
        Write-Host "[PASS] $TestName (Threw error)" -ForegroundColor Green
    }
}

function Reset-State {
    param([string]$State = "BACKLOG", [bool]$VerificationPassed = $false)
    $json = @"
{
  "current_state": "$State",
  "current_phase": 1,
  "workstreams": {
    "WS-1": { "status": "PENDING", "depends_on": [], "attempts": 0 },
    "WS-2": { "status": "PENDING", "depends_on": [], "attempts": 0 },
    "WS-3": { "status": "PENDING", "depends_on": ["WS-1", "WS-2"], "attempts": 0 }
  },
  "verification": { "passed": $($VerificationPassed.ToString().ToLower()), "exit_code": -1, "timestamp": "" },
  "pr_info": { "number": null, "url": "", "status": "" }
}
"@
    $json | Set-Content ".agents\state\execution.json"
}

# 1. Invalid State Transition
Reset-State "PLANNING"
Assert-Fail { powershell -ExecutionPolicy Bypass -File .\scripts\harness\transition.ps1 "DONE" } "Invalid state transition (PLANNING -> DONE)"

# 2. Dependency Violation
Reset-State "IMPLEMENTATION"
Assert-Fail { powershell -ExecutionPolicy Bypass -File .\scripts\harness\start-workstream.ps1 "WS-3" } "Dependency violation (Start WS-3 with pending dependencies)"

# 3. Local Verification state requirement
Reset-State "PLANNING"
Assert-Fail { powershell -ExecutionPolicy Bypass -File .\scripts\harness\verify.ps1 } "Verification blocked if state is not LOCAL_VERIFICATION"

# 4. Corrupted execution.json
Set-Content ".agents\state\execution.json" "{ invalid json"
Assert-Fail { powershell -ExecutionPolicy Bypass -File .\scripts\harness\transition.ps1 "BLOCKED_ESCALATED" } "Corrupted execution.json -> BLOCKED_ESCALATED"

# Restore valid state for next test
Reset-State "BACKLOG"

# 5. Harness Tampering
$originalContent = Get-Content "scripts\harness\transition.ps1" -Raw
Set-Content "scripts\harness\transition.ps1" ($originalContent + "`n# tampered")
Assert-Fail { powershell -ExecutionPolicy Bypass -File .\scripts\harness\transition.ps1 "PLANNING" } "Harness tampering detected"
# Restore
Set-Content "scripts\harness\transition.ps1" $originalContent

Write-Host "Self-tests completed."
