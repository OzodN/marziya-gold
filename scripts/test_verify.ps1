#!/usr/bin/env pwsh
# test_verify.ps1
# Deterministic test for the AI Engineering verification mechanism.

$ErrorActionPreference = "Continue"

Write-Host "--- Test 1: Empty repo should pass ---"
& .\scripts\verify.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "Test 1 Failed"; exit 1 }

Write-Host "`n--- Test 2: Conflict markers should fail ---"
# Add a tracked file with conflict markers
@"
<<<<<<< HEAD
conflict
=======
>>>>>>> branch
"@ | Out-File -Encoding utf8 bad_file.txt
git add bad_file.txt
& .\scripts\verify.ps1
$code = $LASTEXITCODE
git reset HEAD bad_file.txt | Out-Null
Remove-Item bad_file.txt
if ($code -eq 0) { Write-Host "Test 2 Failed: Did not detect conflict marker"; exit 1 }
Write-Host "Test 2 Passed."

Write-Host "`n--- Test 3: Invalid pom.xml should fail ---"
"<project><invalid>" | Out-File -Encoding utf8 pom.xml
& .\scripts\verify.ps1
$code = $LASTEXITCODE
Remove-Item pom.xml
if ($code -eq 0) { Write-Host "Test 3 Failed: Did not fail on invalid maven build"; exit 1 }
Write-Host "Test 3 Passed."

Write-Host "`nAll verification tests passed successfully."
exit 0
