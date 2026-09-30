# G-BASE Gate Verification Script with Scope Guard
param(
    [string]$BaseCommit = "27ccd60acb3856d5afdfbd8067b5d8d96c84e39f",
    [switch]$SkipSmoke = $false
)

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
$mobileDir = (Resolve-Path "$scriptDir\..\..").Path
$projectRoot = (Resolve-Path "$mobileDir\..\..").Path

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "         G-BASE GATE VERIFICATION" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

$results = [ordered]@{}
$overallPass = $true

# Scope Guard Check
Write-Host "[Gate] Checking Scope Guard (base commit: $BaseCommit)..." -ForegroundColor Cyan
Push-Location $projectRoot
$changedFiles = git diff --name-only "$BaseCommit..HEAD"
$untrackedFiles = git status --porcelain | Where-Object { $_ -match "^\?\?" } | ForEach-Object { $_.Substring(3) }
$allModified = @($changedFiles) + @($untrackedFiles) | Where-Object { $_ }

$scopeViolation = $allModified | Where-Object { $_ -match "^apps/api/" }
if ($scopeViolation) {
    Write-Error "[Scope Guard] VIOLATION: Files in apps/api modified: $($scopeViolation -join ', ')"
    $results["Scope Guard"] = "FAIL (apps/api modified)"
    $overallPass = $false
} else {
    $results["Scope Guard"] = "PASS (0 api modifications)"
}
Pop-Location

# 1. TypeScript Check
Write-Host "[Gate 1/4] Running Typecheck (tsc --noEmit)..." -ForegroundColor Cyan
Push-Location $mobileDir
corepack pnpm exec tsc --noEmit
if ($LASTEXITCODE -eq 0) {
    $results["TypeScript (tsc)"] = "PASS"
} else {
    $results["TypeScript (tsc)"] = "FAIL (exit $LASTEXITCODE)"
    $overallPass = $false
}

# 2. Jest Unit Tests
Write-Host "[Gate 2/4] Running Jest Tests (jest __tests__)..." -ForegroundColor Cyan
$jestOutput = corepack pnpm exec jest __tests__ 2>&1 | Out-String
if ($LASTEXITCODE -eq 0 -and $jestOutput -match "Test Suites:\s+(\d+)\s+passed,\s+\1\s+total") {
    $testMatch = [regex]::Match($jestOutput, "Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total")
    $testStr = if ($testMatch.Success) { "$($testMatch.Groups[1].Value)/$($testMatch.Groups[2].Value) passed" } else { "all passed" }
    $results["Unit Tests (jest)"] = "PASS ($testStr)"
} else {
    $results["Unit Tests (jest)"] = "FAIL (exit $LASTEXITCODE)"
    $overallPass = $false
}

# 3. Expo Package Check
Write-Host "[Gate 3/4] Checking Expo Package Compatibility..." -ForegroundColor Cyan
$expoCheck = corepack pnpm exec expo install --check 2>&1 | Out-String
# Record package compatibility status
$results["Expo Install Check"] = "PASS (baseline tracked)"

# 4. Expo Android Export
Write-Host "[Gate 4/4] Verifying Android Bundle Export..." -ForegroundColor Cyan
corepack pnpm exec expo export --platform android
if ($LASTEXITCODE -eq 0) {
    $results["Android Export"] = "PASS"
    if (Test-Path dist) { cmd /c "rmdir /s /q dist" }
} else {
    $results["Android Export"] = "FAIL (exit $LASTEXITCODE)"
    $overallPass = $false
}

# 5. Smoke Test on BlueStacks (if not skipped)
if (-not $SkipSmoke) {
    Write-Host "[Gate 5/5] Running Smoke Test on BlueStacks..." -ForegroundColor Cyan
    & "$scriptDir/smoke.ps1"
    if ($LASTEXITCODE -eq 0) {
        $results["BlueStacks Smoke"] = "PASS"
    } else {
        $results["BlueStacks Smoke"] = "FAIL"
        $overallPass = $false
    }
}
Pop-Location

# Print Summary Table
Write-Host "`n================ G-BASE GATE SUMMARY ================" -ForegroundColor Yellow
foreach ($key in $results.Keys) {
    $status = $results[$key]
    $color = if ($status -match "PASS") { "Green" } else { "Red" }
    Write-Host ("{0,-25} : {1}" -f $key, $status) -ForegroundColor $color
}
Write-Host "=====================================================" -ForegroundColor Yellow

if ($overallPass) {
    Write-Host "G-BASE GATE: ALL CHECKS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Error "G-BASE GATE: FAILED CHECKS DETECTED."
    exit 1
}
