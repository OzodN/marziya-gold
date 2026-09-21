#!/usr/bin/env pwsh
# verify.ps1
# Single entry point for Root Orchestrator verification.
#
# Verification Steps:
# 1. Git Conflict Markers: Fails if any unresolved '<<<<<<<' markers exist in the working tree.
# 2. Java (Maven): If pom.xml exists, runs 'mvn verify -B' to compile and test.
# 3. Node.js (NPM): If package.json exists, runs 'npm test'.
#
# Returns exit code 0 ONLY if all applicable checks pass.
# Returns non-zero immediately on the first failure.

Write-Host "Running CI Verification..."

# 1. Conflict Marker Check
# git grep returns 0 if it finds a match, 1 if no match.
# Using regex <{7} avoids placing the literal conflict string in this script.
$conflictMarkers = & git grep -lE "<{7}( |$)" 2>$null
if ($LASTEXITCODE -eq 0 -and $conflictMarkers) {
    Write-Host "ERROR: Merge conflict markers found in:"
    Write-Host $conflictMarkers
    exit 1
}
Write-Host "No merge conflicts detected."

# 2. Java / Maven Check
if (Test-Path "pom.xml") {
    Write-Host "Detected pom.xml - Running Maven Verification..."
    & mvn verify -B
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Maven verification failed."
        exit $LASTEXITCODE
    }
    Write-Host "Maven verification passed."
}

# 3. Node.js / NPM Check
if (Test-Path "package.json") {
    Write-Host "Detected package.json - Running NPM Verification..."
    & npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: NPM verification failed."
        exit $LASTEXITCODE
    }
    Write-Host "NPM verification passed."
}

Write-Host "Verification Passed. (Exit code 0)"
exit 0
