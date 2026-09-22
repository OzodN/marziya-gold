param(
    [Parameter(Mandatory=$true)]
    [string]$WorkstreamId
)

Import-Module "$PSScriptRoot\harness-core.psm1" -Force

$state = Read-ExecutionState

if ($state.current_state -ne "IMPLEMENTATION") {
    Write-Host "Workstreams can only be started in IMPLEMENTATION state." -ForegroundColor Red
    exit 1
}

$ws = $state.workstreams.$WorkstreamId
if ($null -eq $ws) {
    Write-Host "Workstream '$WorkstreamId' not found." -ForegroundColor Red
    exit 1
}

foreach ($dep in $ws.depends_on) {
    $depWs = $state.workstreams.$dep
    if ($null -eq $depWs -or $depWs.status -ne "COMPLETED") {
        Write-Host "Cannot start $WorkstreamId. Dependency '$dep' is not COMPLETED." -ForegroundColor Red
        exit 1
    }
}

$ws.status = "RUNNING"
$ws.attempts += 1

if ($ws.attempts -gt 3) {
    Write-Host "Workstream $WorkstreamId exceeded retry limit." -ForegroundColor Red
    Invoke-FailClosed "Retry limit exceeded for $WorkstreamId"
}

Write-ExecutionState $state
Write-Host "Workstream $WorkstreamId started." -ForegroundColor Green
exit 0
