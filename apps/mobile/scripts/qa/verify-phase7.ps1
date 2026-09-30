# Verification Script for Phase 7 Deliverables & Evidence References
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
$mobileDir = (Resolve-Path "$scriptDir\..\..").Path
$projectRoot = (Resolve-Path "$mobileDir\..\..").Path
$docsDir = Join-Path $projectRoot "docs/w4"
$evidenceDir = Join-Path $docsDir "evidence"

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "   PHASE 7 DELIVERABLES VERIFICATION     " -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

$requiredFiles = @(
    "AGENT_STATE_W4.md",
    "SCOPE_MATRIX.md",
    "TEST_PLAN.md",
    "TEST_RESULTS.md",
    "BUGS.md",
    "DECISIONS_NEEDED.md",
    "QA_SCRIPTS.md",
    "USER_GUIDE.md",
    "DEMO_SCRIPT.md",
    "SLIDE_OUTLINE_MOBILE.md",
    "REPORT_MOBILE.md",
    "KNOWN_ISSUES.md",
    "HANDOFF_DEV_B.md",
    "evidence/demo-app.mp4"
)

$hasError = $false

Write-Host "`n[Check 1/3] Checking required files existence and size..." -ForegroundColor Cyan
foreach ($relPath in $requiredFiles) {
    $fullPath = Join-Path $docsDir $relPath
    if (-not (Test-Path $fullPath)) {
        Write-Host "  [MISSING] $relPath" -ForegroundColor Red
        $hasError = $true
    } else {
        $item = Get-Item $fullPath
        $lines = if ($item.Extension -eq ".md") { (Get-Content $fullPath | Measure-Object -Line).Lines } else { "binary" }
        Write-Host ("  [OK] {0,-25} ({1,7} bytes | {2} lines)" -f $relPath, $item.Length, $lines) -ForegroundColor Green
    }
}

Write-Host "`n[Check 2/3] Checking evidence references in markdown files..." -ForegroundColor Cyan
$mdFiles = Get-ChildItem -Path $docsDir -Filter "*.md"
$refCount = 0
$brokenCount = 0

foreach ($file in $mdFiles) {
    $content = Get-Content $file.FullName -Raw
    $pattern = '(?i)(?:evidence[\\/]|docs[\\/]w4[\\/]evidence[\\/])([a-zA-Z0-9_\-\.]+\.(?:png|mp4))'
    $matches = [regex]::Matches($content, $pattern)
    foreach ($m in $matches) {
        $targetName = $m.Groups[1].Value
        $targetPath = Join-Path $evidenceDir $targetName
        $refCount++
        if (-not (Test-Path $targetPath)) {
            Write-Host ("  [BROKEN REF] in {0}: {1}" -f $file.Name, $targetName) -ForegroundColor Red
            $brokenCount++
            $hasError = $true
        }
    }
}

Write-Host "  Verified $refCount evidence references across $($mdFiles.Count) markdown files ($brokenCount broken)." -ForegroundColor Green

Write-Host "`n[Check 3/3] Checking KNOWN_ISSUES and BUGS alignment..." -ForegroundColor Cyan
$bugsContent = Get-Content (Join-Path $docsDir "BUGS.md") -Raw
$knownContent = Get-Content (Join-Path $docsDir "KNOWN_ISSUES.md") -Raw

foreach ($bug in @("BUG-001", "BUG-002", "BUG-003")) {
    if ($bugsContent.Contains($bug) -and $knownContent.Contains($bug)) {
        Write-Host "  [ALIGNED] $bug is present in both BUGS.md and KNOWN_ISSUES.md" -ForegroundColor Green
    } else {
        Write-Host "  [MISMATCH] $bug mismatch between BUGS.md and KNOWN_ISSUES.md" -ForegroundColor Red
        $hasError = $true
    }
}

Write-Host "`n=========================================" -ForegroundColor Magenta
if (-not $hasError) {
    Write-Host "  ALL PHASE 7 DELIVERABLES VERIFIED OK!  " -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Magenta
    exit 0
} else {
    Write-Host "  VERIFICATION FAILED!                   " -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Magenta
    exit 1
}
