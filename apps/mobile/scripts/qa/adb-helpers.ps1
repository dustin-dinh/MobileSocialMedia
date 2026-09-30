# ADB Helper Functions for MobileSocialMedia QA Automation
param(
    [string]$AdbDevice = "127.0.0.1:5555"
)

function Ensure-AdbConnection {
    param([string]$Device = $AdbDevice)
    $devices = adb devices
    if ($devices -notmatch "$Device\s+device") {
        Write-Host "[ADB] Connecting to $Device..." -ForegroundColor Cyan
        adb connect $Device | Out-Null
        Start-Sleep -Seconds 2
    }
    $check = adb devices
    if ($check -match "$Device\s+device") {
        adb -s $Device reverse tcp:8081 tcp:8081 | Out-Null
        return $true
    }
    Write-Warning "[ADB] Device $Device is not connected or offline."
    return $false
}

function Take-Screenshot {
    param(
        [Parameter(Mandatory=$true)][string]$OutputPath,
        [string]$Device = $AdbDevice
    )
    $parent = Split-Path -Parent $OutputPath
    if ($parent -and -not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    adb -s $Device shell screencap -p /sdcard/qa_screen.png | Out-Null
    adb -s $Device pull /sdcard/qa_screen.png $OutputPath | Out-Null
    if (Test-Path $OutputPath) {
        Write-Host "[ADB] Screenshot saved: $OutputPath" -ForegroundColor Green
        return $true
    }
    return $false
}

function Get-UiDump {
    param([string]$Device = $AdbDevice)
    adb connect $Device | Out-Null
    adb -s $Device shell uiautomator dump /sdcard/qa_window_dump.xml | Out-Null
    $localPath = "$env:TEMP\qa_window_dump.xml"
    adb -s $Device pull /sdcard/qa_window_dump.xml $localPath | Out-Null
    if (Test-Path $localPath) {
        return (Get-Content $localPath -Raw)
    }
    return ""
}

function Find-UiBounds {
    param(
        [Parameter(Mandatory=$true)][string]$Pattern,
        [string]$Device = $AdbDevice
    )
    $xmlContent = Get-UiDump -Device $Device
    if (-not $xmlContent) { return $null }

    try {
        [xml]$doc = $xmlContent
        $nodes = $doc.SelectNodes("//node[contains(@content-desc, '$Pattern') or contains(@text, '$Pattern')]")
        if ($nodes -and $nodes.Count -gt 0) {
            $node = $nodes[0]
            if ($node.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
                $x1 = [int]$Matches[1]
                $y1 = [int]$Matches[2]
                $x2 = [int]$Matches[3]
                $y2 = [int]$Matches[4]
                $cx = [int](($x1 + $x2) / 2)
                $cy = [int](($y1 + $y2) / 2)
                return @{ X1=$x1; Y1=$y1; X2=$x2; Y2=$y2; CenterX=$cx; CenterY=$cy }
            }
        }
    } catch {
        # Fallback to regex if XML parse has any edge case
        if ($xmlContent -match '(\[(' + '\d+' + '),(' + '\d+' + ')\]\[(' + '\d+' + '),(' + '\d+' + ')\]).*?' + [regex]::Escape($Pattern)) {
            # continue
        }
    }

    # Well-known bottom tab fallback coordinates (900x1600 screen)
    if ($Pattern -eq "Home") { return @{ CenterX=214; CenterY=1534 } }
    if ($Pattern -eq "Search") { return @{ CenterX=344; CenterY=1534 } }
    if ($Pattern -eq "Create post" -or $Pattern -eq "Create") { return @{ CenterX=450; CenterY=1521 } }
    if ($Pattern -eq "Notifications") { return @{ CenterX=556; CenterY=1534 } }
    if ($Pattern -eq "Profile") { return @{ CenterX=686; CenterY=1534 } }

    return $null
}

function Tap-Element {
    param(
        [Parameter(Mandatory=$true)][string]$Pattern,
        [string]$Device = $AdbDevice
    )
    $bounds = Find-UiBounds -Pattern $Pattern -Device $Device
    if ($bounds) {
        $cx = $bounds.CenterX
        $cy = $bounds.CenterY
        Write-Host "[ADB] Tapping '$Pattern' at ($cx, $cy)..." -ForegroundColor Cyan
        adb -s $Device shell input tap $cx $cy | Out-Null
        Start-Sleep -Milliseconds 800
        return $true
    }
    Write-Warning "[ADB] Element '$Pattern' not found in UI dump."
    return $false
}

function Input-TextSafe {
    param(
        [Parameter(Mandatory=$true)][string]$Text,
        [string]$Device = $AdbDevice
    )
    # Replace spaces with %s for adb input text
    $escaped = $Text -replace ' ', '%s'
    adb -s $Device shell input text "$escaped" | Out-Null
    Start-Sleep -Milliseconds 500
}

function Press-BackKey {
    param([string]$Device = $AdbDevice)
    adb -s $Device shell input keyevent 4 | Out-Null
    Start-Sleep -Milliseconds 500
}

function Get-LogcatErrors {
    param(
        [int]$Lines = 100,
        [string]$Device = $AdbDevice
    )
    $logs = adb -s $Device logcat -d -t $Lines *:E
    $fatal = $logs | Where-Object { $_ -match "ReactNativeJS|FATAL|AndroidRuntime|ExpoModules" }
    return $fatal
}

function Restart-ExpoApp {
    param([string]$Device = $AdbDevice)
    Write-Host "[ADB] Force stopping Expo Go..." -ForegroundColor Yellow
    adb -s $Device shell am force-stop host.exp.exponent | Out-Null
    Start-Sleep -Seconds 1
    adb -s $Device reverse tcp:8081 tcp:8081 | Out-Null
    Write-Host "[ADB] Launching Expo Go exp://127.0.0.1:8081..." -ForegroundColor Green
    adb -s $Device shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" -n host.exp.exponent/.LauncherActivity | Out-Null
    Start-Sleep -Seconds 5
}

function Set-Resolution {
    param(
        [Parameter(Mandatory=$true)][int]$Width,
        [Parameter(Mandatory=$true)][int]$Height,
        [Parameter(Mandatory=$true)][int]$Density,
        [string]$Device = $AdbDevice
    )
    Write-Host "[ADB] Setting screen size ${Width}x${Height} density ${Density}..." -ForegroundColor Cyan
    adb -s $Device shell wm size "${Width}x${Height}" | Out-Null
    adb -s $Device shell wm density $Density | Out-Null
    Start-Sleep -Seconds 2
}

function Reset-Resolution {
    param([string]$Device = $AdbDevice)
    Write-Host "[ADB] Resetting screen size and density..." -ForegroundColor Cyan
    adb -s $Device shell wm size reset | Out-Null
    adb -s $Device shell wm density reset | Out-Null
    Start-Sleep -Seconds 2
}
