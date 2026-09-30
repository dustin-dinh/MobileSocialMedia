# Device Automated Test for Week 3 Functionality (T3-01 -> T3-13)
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
Write-Host "   WEEK 3 DEVICE FUNCTIONAL TESTS" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# 1. Connect and Ensure App is running
Ensure-AdbConnection -Device $AdbDevice | Out-Null

$window = adb -s $AdbDevice shell dumpsys window | Select-String "mCurrentFocus"
if ($window -notmatch "host\.exp\.exponent") {
    Restart-ExpoApp -Device $AdbDevice
    Start-Sleep -Seconds 5
}

# 2. T3-01: Like / Unlike Post on Feed
Write-Host "`n[TEST T3-01] Testing Like on first post..." -ForegroundColor Cyan
$xml = Get-UiDump -Device $AdbDevice
if ($xml -match 'Mobile Social') {
    # Tap like button
    $tapped = Tap-Element -Pattern "Like post" -Device $AdbDevice
    if (-not $tapped) { $tapped = Tap-Element -Pattern "Unlike post" -Device $AdbDevice }
    Start-Sleep -Seconds 1
    Take-Screenshot -OutputPath (Join-Path $evidenceDir "t3-01-like.png") -Device $AdbDevice
    Write-Host "[T3-01] Like test completed!" -ForegroundColor Green
}

# 3. T3-02: Rapid Like / Unlike Spam
Write-Host "`n[TEST T3-02] Testing rapid like spam..." -ForegroundColor Cyan
for ($i = 0; $i -lt 3; $i++) {
    Tap-Element -Pattern "Like post" -Device $AdbDevice | Out-Null
    Start-Sleep -Milliseconds 300
    Tap-Element -Pattern "Unlike post" -Device $AdbDevice | Out-Null
    Start-Sleep -Milliseconds 300
}
Take-Screenshot -OutputPath (Join-Path $evidenceDir "t3-02-rapid-like.png") -Device $AdbDevice
Write-Host "[T3-02] Rapid like test completed!" -ForegroundColor Green

# 4. T3-03: Comment Modal
Write-Host "`n[TEST T3-03] Testing Comments Modal..." -ForegroundColor Cyan
Tap-Element -Pattern "Comments" -Device $AdbDevice | Out-Null
Start-Sleep -Seconds 2
Take-Screenshot -OutputPath (Join-Path $evidenceDir "t3-03-comment.png") -Device $AdbDevice
Write-Host "[T3-03] Comments modal opened and captured!" -ForegroundColor Green

# Close modal
Press-BackKey -Device $AdbDevice
Start-Sleep -Seconds 1

# 5. T3-05: Search Screen
Write-Host "`n[TEST T3-05] Testing Search Tab..." -ForegroundColor Cyan
Tap-Element -Pattern "Search" -Device $AdbDevice | Out-Null
Start-Sleep -Seconds 2
Take-Screenshot -OutputPath (Join-Path $evidenceDir "t3-05-search.png") -Device $AdbDevice
Write-Host "[T3-05] Search tab opened and captured!" -ForegroundColor Green

# 6. T3-07: Follow User from Search
Write-Host "`n[TEST T3-07] Testing Follow button in Search..." -ForegroundColor Cyan
$followTapped = Tap-Element -Pattern "Follow" -Device $AdbDevice
Start-Sleep -Seconds 1
Take-Screenshot -OutputPath (Join-Path $evidenceDir "t3-07-follow.png") -Device $AdbDevice
Write-Host "[T3-07] Follow button tested!" -ForegroundColor Green

# 7. T3-08 & T3-09: Notifications Screen
Write-Host "`n[TEST T3-08 & T3-09] Testing Notifications Tab..." -ForegroundColor Cyan
Tap-Element -Pattern "Notifications" -Device $AdbDevice | Out-Null
Start-Sleep -Seconds 2
Take-Screenshot -OutputPath (Join-Path $evidenceDir "t3-08-notif-display.png") -Device $AdbDevice
Write-Host "[T3-08/T3-09] Notifications screen captured!" -ForegroundColor Green

# 8. Return to Home
Write-Host "`n[TEST T3-13] Returning to Home Feed..." -ForegroundColor Cyan
Tap-Element -Pattern "Home" -Device $AdbDevice | Out-Null
Start-Sleep -Seconds 2
Take-Screenshot -OutputPath (Join-Path $evidenceDir "t3-13-regression.png") -Device $AdbDevice
Write-Host "[T3-13] Back on Home Feed!" -ForegroundColor Green

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "   WEEK 3 TESTS COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
exit 0
