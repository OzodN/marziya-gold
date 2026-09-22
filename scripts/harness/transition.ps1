param(
    [Parameter(Mandatory=$true)]
    [string]$NewState
)

Import-Module "$PSScriptRoot\harness-core.psm1" -Force

$state = Read-ExecutionState
$currentState = $state.current_state

$validTransitions = @{
    "BACKLOG" = @("PLANNING", "BLOCKED_ESCALATED")
    "PLANNING" = @("IMPLEMENTATION", "BLOCKED_ESCALATED")
    "IMPLEMENTATION" = @("LOCAL_VERIFICATION", "BLOCKED_ESCALATED")
    "LOCAL_VERIFICATION" = @("PR_CREATED", "IMPLEMENTATION", "BLOCKED_ESCALATED")
    "PR_CREATED" = @("DONE", "IMPLEMENTATION", "BLOCKED_ESCALATED")
    "BLOCKED_ESCALATED" = @("RECOVERY")
    "RECOVERY" = @("IMPLEMENTATION", "LOCAL_VERIFICATION", "PR_CREATED", "BLOCKED_ESCALATED")
    "DONE" = @()
}

$allowed = $validTransitions[$currentState]

if ($null -eq $allowed -or $NewState -notin $allowed) {
    Write-Host "Transition $currentState -> $NewState is NOT allowed." -ForegroundColor Red
    exit 1
}

Write-Host "Transitioning: $currentState -> $NewState" -ForegroundColor Green

# Reset local verification if entering PLANNING or IMPLEMENTATION
if ($NewState -eq "PLANNING" -or $NewState -eq "IMPLEMENTATION") {
    $state.verification.passed = $false
}

$state.current_state = $NewState
Write-ExecutionState $state

exit 0


