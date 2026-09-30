# Automated Multi-Configuration Testing Script (wm size / wm density)
param(
    [string]$AdbDevice = "127.0.0.1:5555"
)

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
$mobileDir = (Resolve-Path "$scriptDir\..\..").Path
$projectRoot = (Resolve-Path "$mobileDir\..\..").Path
$evidenceDir = Join-Path $projectRoot "docs/w4/evidence"

if (-not (Test-Path $evidenceDir)) {
    New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null
}

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "   PHASE 4 MULTI-CONFIG RESOLUTION TEST  " -ForegroundColor Magenta
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
    Write-Host "[Evidence] Captured: $fileName" -ForegroundColor Green
}

try {
    # -------------------------------------------------------------------------
    # Config 1: 720x1280 @ 320 dpi (Compact HD)
    # -------------------------------------------------------------------------
    Write-Host "`n[Config 1] Setting 720x1280 @ 320 dpi..." -ForegroundColor Cyan
    adb -s $AdbDevice shell wm size 720x1280
    adb -s $AdbDevice shell wm density 320
    Start-Sleep -Seconds 3

    # Dismiss any warning/dialog
    adb -s $AdbDevice shell input tap 560 1020
    Start-Sleep -Milliseconds 500

    Capture-Evidence "cfg-720x1280-feed.png"

    # Navigate to Profile (tab 5 on 720x1280 is ~ x=648, y=1220)
    adb -s $AdbDevice shell input tap 648 1220
    Start-Sleep -Seconds 2
    Capture-Evidence "cfg-720x1280-profile.png"

    # Return to Feed (tab 1 on 720x1280 is ~ x=72, y=1220)
    adb -s $AdbDevice shell input tap 72 1220
    Start-Sleep -Seconds 1

    # -------------------------------------------------------------------------
    # Config 2: 1080x1920 @ 420 dpi (Standard FHD)
    # -------------------------------------------------------------------------
    Write-Host "`n[Config 2] Setting 1080x1920 @ 420 dpi..." -ForegroundColor Cyan
    adb -s $AdbDevice shell wm size 1080x1920
    adb -s $AdbDevice shell wm density 420
    Start-Sleep -Seconds 3

    Capture-Evidence "cfg-1080x1920-feed.png"

    # Open Search (tab 2 at x=324, y=1840)
    adb -s $AdbDevice shell input tap 324 1840
    Start-Sleep -Seconds 2
    Capture-Evidence "cfg-1080x1920-search.png"

    # Return to Feed (tab 1 at x=108, y=1840)
    adb -s $AdbDevice shell input tap 108 1840
    Start-Sleep -Seconds 1

    # -------------------------------------------------------------------------
    # Config 3: 1080x2400 @ 440 dpi (Modern Tall 20:9 Aspect Ratio)
    # -------------------------------------------------------------------------
    Write-Host "`n[Config 3] Setting 1080x2400 @ 440 dpi..." -ForegroundColor Cyan
    adb -s $AdbDevice shell wm size 1080x2400
    adb -s $AdbDevice shell wm density 440
    Start-Sleep -Seconds 3

    Capture-Evidence "cfg-1080x2400-feed.png"

    # Open Create Post (tab 3 at x=540, y=2300)
    adb -s $AdbDevice shell input tap 540 2300
    Start-Sleep -Seconds 2
    Capture-Evidence "cfg-1080x2400-create.png"

    # Return to Feed
    adb -s $AdbDevice shell input keyevent 4
    Start-Sleep -Seconds 1

} finally {
    Write-Host "`n[Restore] Resetting wm size and wm density..." -ForegroundColor Yellow
    adb -s $AdbDevice shell wm size reset
    adb -s $AdbDevice shell wm density reset
    Start-Sleep -Seconds 2
    $currSize = adb -s $AdbDevice shell wm size
    $currDensity = adb -s $AdbDevice shell wm density
    Write-Host "[Restore] Current: $currSize | $currDensity" -ForegroundColor Green
}

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "   MULTI-CONFIG TESTING COMPLETED!      " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
