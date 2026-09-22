Import-Module "$PSScriptRoot\harness-core.psm1" -Force

$state = Read-ExecutionState

if ($state.current_state -ne "LOCAL_VERIFICATION") {
    Write-Host "Verification script must be run in LOCAL_VERIFICATION state." -ForegroundColor Red
    exit 1
}

Write-Host "Invoking local project verification script..."
# Run the actual project verify script
& "$PSScriptRoot\..\verify.ps1"
$exitCode = $LASTEXITCODE

$state.verification.exit_code = $exitCode
$state.verification.timestamp = (Get-Date).ToString("o")

if ($exitCode -eq 0) {
    $state.verification.passed = $true
    Write-Host "Local verification passed! Updating execution.json." -ForegroundColor Green
} else {
    $state.verification.passed = $false
    Write-Host "Local verification failed." -ForegroundColor Red
}

Write-ExecutionState $state
exit $exitCode
