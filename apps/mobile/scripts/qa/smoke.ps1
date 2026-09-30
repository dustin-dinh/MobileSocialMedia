# Smoke Test Script for MobileSocialMedia on BlueStacks
param(
    [string]$AdbDevice = "127.0.0.1:5555",
    [int]$TimeoutSeconds = 90,
    [string]$EvidencePath = "docs/w4/evidence/smoke-screen.png"
)

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
. "$scriptDir/adb-helpers.ps1" -AdbDevice $AdbDevice

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "         MOBILE SMOKE TEST" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# 1. Connect Device & Unlock
$connected = Ensure-AdbConnection -Device $AdbDevice
if (-not $connected) {
    Write-Error "[SMOKE] Cannot connect to ADB device $AdbDevice."
    exit 1
}

# Dismiss keyguard / unlock screen
adb -s $AdbDevice shell wm dismiss-keyguard | Out-Null
adb -s $AdbDevice shell input keyevent 82 | Out-Null
adb -s $AdbDevice reverse tcp:8081 tcp:8081 | Out-Null

# 2. Check if App is running or launch it
$window = adb -s $AdbDevice shell dumpsys window | Select-String "mCurrentFocus"
if ($window -notmatch "host\.exp\.exponent") {
    Write-Host "[SMOKE] Expo Go not in foreground, launching..." -ForegroundColor Yellow
    Restart-ExpoApp -Device $AdbDevice
} else {
    # Ensure current project URL is active
    adb -s $AdbDevice shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" -n host.exp.exponent/.LauncherActivity | Out-Null
}

# 3. Wait for Initial Screen Text/Desc (Feed, Search, Notifications, Profile, Mobile Social)
Write-Host "[SMOKE] Waiting for initial screen (timeout: ${TimeoutSeconds}s)..." -ForegroundColor Cyan
$startTime = Get-Date
$found = $false
$targetText = ""

while (((Get-Date) - $startTime).TotalSeconds -lt $TimeoutSeconds) {
    # Dismiss yellow banner if present
    adb -s $AdbDevice shell input tap 850 1528 | Out-Null

    $xml = Get-UiDump -Device $AdbDevice
    if ($xml -match 'Mobile Social|Sarah Chen|Sarah|Luan Dinh|Welcome|Đăng nhập|Login|Sign In|sarahchen|nhatluan|Bài viết|content-desc="Feed"|content-desc="Profile"') {
        $found = $true
        if ($xml -match 'Mobile Social') { $targetText = 'Mobile Social' }
        elseif ($xml -match 'content-desc="Feed"') { $targetText = 'Feed Tab (Navigation)' }
        elseif ($xml -match 'Sarah Chen|Sarah') { $targetText = 'Sarah Chen' }
        elseif ($xml -match 'Luan Dinh') { $targetText = 'Luan Dinh' }
        else { $targetText = 'App Screen' }
        break
    }
    Start-Sleep -Seconds 3
}

if (-not $found) {
    Write-Error "[SMOKE] Timed out waiting for initial screen within ${TimeoutSeconds}s."
    Take-Screenshot -OutputPath $EvidencePath -Device $AdbDevice
    exit 1
}

Write-Host "[SMOKE] Initial screen detected successfully ($targetText)!" -ForegroundColor Green

# 4. Check for Fatal / Red Screen errors in Logcat
$fatalErrors = Get-LogcatErrors -Lines 50 -Device $AdbDevice
if ($fatalErrors) {
    Write-Warning "[SMOKE] Detected potential errors in logcat:"
    $fatalErrors | ForEach-Object { Write-Warning "  $_" }
}

# 5. Capture Evidence Screenshot
$mobileDir = (Get-Item "$scriptDir/../..").FullName
$projectRoot = (Get-Item "$mobileDir/../..").FullName
$absEvidence = Join-Path $projectRoot $EvidencePath
Take-Screenshot -OutputPath $absEvidence -Device $AdbDevice

Write-Host "[SMOKE] Smoke Test PASSED! Evidence saved to $EvidencePath" -ForegroundColor Green
exit 0
