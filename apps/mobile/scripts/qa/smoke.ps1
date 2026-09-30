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

# 1. Connect Device
$connected = Ensure-AdbConnection -Device $AdbDevice
if (-not $connected) {
    Write-Error "[SMOKE] Cannot connect to ADB device $AdbDevice."
    exit 1
}

# 2. Check if App is running or launch it
$window = adb -s $AdbDevice shell dumpsys window | Select-String "mCurrentFocus"
if ($window -notmatch "host\.exp\.exponent") {
    Write-Host "[SMOKE] Expo Go not in foreground, launching..." -ForegroundColor Yellow
    Restart-ExpoApp -Device $AdbDevice
}

# 3. Wait for Initial Screen Text (Feed: 'Mobile Social' or Auth: 'Welcome' / 'Login')
Write-Host "[SMOKE] Waiting for initial screen (timeout: ${TimeoutSeconds}s)..." -ForegroundColor Cyan
$startTime = Get-Date
$found = $false
$targetText = ""

while (((Get-Date) - $startTime).TotalSeconds -lt $TimeoutSeconds) {
    $xml = Get-UiDump -Device $AdbDevice
    if ($xml -match 'Mobile Social|Sarah Chen|Welcome|Đăng nhập|Login|Sign In') {
        $found = $true
        if ($xml -match 'Mobile Social') { $targetText = 'Mobile Social' }
        elseif ($xml -match 'Sarah Chen') { $targetText = 'Sarah Chen' }
        else { $targetText = 'Auth Screen' }
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
