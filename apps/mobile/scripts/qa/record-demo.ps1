# Demo Recording Script using adb shell screenrecord
param(
    [string]$AdbDevice = "127.0.0.1:5555"
)

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
$mobileDir = (Resolve-Path "$scriptDir\..\..").Path
$projectRoot = (Resolve-Path "$mobileDir\..\..").Path
$evidenceDir = Join-Path $projectRoot "docs/w4/evidence"
$mp4Path = Join-Path $evidenceDir "demo-app.mp4"

Write-Host "Connecting to $AdbDevice..." -ForegroundColor Cyan
adb connect $AdbDevice | Out-Null
Start-Sleep -Seconds 1

Write-Host "Resetting window size and density..." -ForegroundColor Cyan
adb -s $AdbDevice shell wm size reset | Out-Null
adb -s $AdbDevice shell wm density reset | Out-Null
adb reverse tcp:8081 tcp:8081 | Out-Null

# Remove previous recording if any
adb -s $AdbDevice shell rm -f /sdcard/demo-app.mp4

Write-Host "Starting screenrecord for 25 seconds in background..." -ForegroundColor Magenta
# Start screenrecord process via Start-Process
$proc = Start-Process -FilePath "adb" -ArgumentList "-s $AdbDevice shell screenrecord --time-limit 25 --size 720x1280 --bit-rate 4000000 /sdcard/demo-app.mp4" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

Write-Host "Performing demo interactions..." -ForegroundColor Cyan

# 1. Feed scroll & interactions
adb -s $AdbDevice shell input tap 108 1840 # Feed tab
Start-Sleep -Seconds 2
adb -s $AdbDevice shell input swipe 540 1200 540 600 300 # Scroll feed
Start-Sleep -Seconds 2
adb -s $AdbDevice shell input tap 120 1400 # Like post
Start-Sleep -Seconds 1
adb -s $AdbDevice shell input tap 960 1400 # Bookmark post
Start-Sleep -Seconds 1

# 2. Search flow
adb -s $AdbDevice shell input tap 324 1840 # Search tab
Start-Sleep -Seconds 2
adb -s $AdbDevice shell input tap 400 220 # Search input
Start-Sleep -Milliseconds 500
adb -s $AdbDevice shell input text "sarah"
Start-Sleep -Seconds 2

# 3. Notifications flow
adb -s $AdbDevice shell input tap 756 1840 # Notification tab
Start-Sleep -Seconds 2
adb -s $AdbDevice shell input tap 400 300 # Tap item
Start-Sleep -Seconds 1

# 4. Profile flow
adb -s $AdbDevice shell input tap 972 1840 # Profile tab
Start-Sleep -Seconds 3

# Wait for recording process to exit
Write-Host "Waiting for screenrecord to finalize..." -ForegroundColor Cyan
$proc.WaitForExit(30000) | Out-Null
Start-Sleep -Seconds 2

# Pull recorded video to host
Write-Host "Pulling video to $mp4Path..." -ForegroundColor Green
adb -s $AdbDevice pull /sdcard/demo-app.mp4 $mp4Path
adb -s $AdbDevice shell rm -f /sdcard/demo-app.mp4

if (Test-Path $mp4Path) {
    $size = (Get-Item $mp4Path).Length
    Write-Host "[SUCCESS] Video saved: $mp4Path (Size: $size bytes)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Video not found!" -ForegroundColor Red
}
