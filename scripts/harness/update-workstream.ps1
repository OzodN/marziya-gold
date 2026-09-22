param(
    [Parameter(Mandatory=$true)]
    [string]$WorkstreamId,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("COMPLETED", "FAILED")]
    [string]$Status
)

Import-Module "$PSScriptRoot\harness-core.psm1" -Force

$state = Read-ExecutionState

$ws = $state.workstreams.$WorkstreamId
if ($null -eq $ws) {
    Write-Host "Workstream '$WorkstreamId' not found." -ForegroundColor Red
    exit 1
}

$ws.status = $Status

Write-ExecutionState $state
Write-Host "Workstream $WorkstreamId marked as $Status." -ForegroundColor Green
exit 0
