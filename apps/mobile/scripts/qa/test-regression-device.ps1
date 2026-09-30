# Automated Regression Device Test Script for Phase 3 (BlueStacks)
param(
    [string]$AdbDevice = "127.0.0.1:5555"
)

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
. "$scriptDir/adb-helpers.ps1" -AdbDevice $AdbDevice

$mobileDir = (Resolve-Path "$scriptDir\..\..").Path
$projectRoot = (Resolve-Path "$mobileDir\..\..").Path
$evidenceDir = Join-Path $projectRoot "docs/w4/evidence"

if (-not (Test-Path $evidenceDir)) {
    New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null
}

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "   PHASE 3 DEVICE REGRESSION EXECUTION   " -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# 1. Connect ADB
adb connect $AdbDevice
Start-Sleep -Seconds 1

function Capture-Evidence($fileName) {
    $remote = "/sdcard/qa_$fileName"
    $local = Join-Path $evidenceDir $fileName
    adb -s $AdbDevice shell screencap -p $remote
    adb -s $AdbDevice pull $remote $local > $null
    adb -s $AdbDevice shell rm $remote
    Write-Host "[Evidence] Captured: $fileName -> $local" -ForegroundColor Green
}

# Dismiss yellow warning banner if present
adb -s $AdbDevice shell input tap 850 1528
Start-Sleep -Milliseconds 500

# 2. Test R-05: Create Post Screen
Write-Host "`n[R-05] Testing Create Post Navigation..." -ForegroundColor Cyan
# Middle "+" button is at x=540, y=1840 on 1080x1920
adb -s $AdbDevice shell input tap 540 1840
Start-Sleep -Seconds 2
Capture-Evidence "r-05-create-post.png"

# Return back
adb -s $AdbDevice shell input keyevent 4
Start-Sleep -Seconds 1

# 3. Test R-09: Profile Screen
Write-Host "`n[R-09] Testing Profile Screen Navigation..." -ForegroundColor Cyan
# Profile tab is Tab 5 at x=972, y=1840
adb -s $AdbDevice shell input tap 972 1840
Start-Sleep -Seconds 2
Capture-Evidence "r-09-profile.png"

# 4. Test Special State: Restart App (Force-stop & Session restore)
Write-Host "`n[Restart State] Testing App Force-stop and Session Restore..." -ForegroundColor Cyan
adb -s $AdbDevice shell am force-stop host.exp.exponent
Start-Sleep -Seconds 2
adb -s $AdbDevice shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" -n host.exp.exponent/.LauncherActivity
Start-Sleep -Seconds 8
# Dismiss warning banner if present
adb -s $AdbDevice shell input tap 850 1528
Start-Sleep -Milliseconds 500
Capture-Evidence "r-restart-session.png"

# 5. Test Special State: Network Failure
Write-Host "`n[Network State] Testing Network Failure Resilience..." -ForegroundColor Cyan
adb -s $AdbDevice shell svc wifi disable
Start-Sleep -Seconds 2
# Tap Feed tab
adb -s $AdbDevice shell input tap 108 1840
Start-Sleep -Seconds 1
Capture-Evidence "r-network-offline.png"

# Restore WiFi immediately
Write-Host "[Network State] Restoring WiFi..." -ForegroundColor Cyan
adb -s $AdbDevice shell svc wifi enable
Start-Sleep -Seconds 2

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " PHASE 3 DEVICE REGRESSION COMPLETED!   " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
