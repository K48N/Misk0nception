$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$processes = Get-CimInstance Win32_Process | Where-Object {
    ($_.CommandLine -like '*uvicorn app.main:app*' -or $_.CommandLine -like '*npm run dev*' -or $_.CommandLine -like '*vite*') -and
    $_.CommandLine -like "*$repoRoot*"
}

if (-not $processes) {
    Write-Host 'No local dev server processes found for this repository.' -ForegroundColor Yellow
    return
}

$processes | ForEach-Object {
    try {
        Stop-Process -Id $_.ProcessId -Force
        Write-Host "Stopped PID $($_.ProcessId): $($_.Name)" -ForegroundColor Green
    } catch {
        Write-Warning "Failed to stop PID $($_.ProcessId): $($_.Exception.Message)"
    }
}
