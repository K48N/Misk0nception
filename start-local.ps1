param(
    [switch]$InstallIfMissing
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $repoRoot 'backend'
$frontendPath = Join-Path $repoRoot 'frontend'
$venvActivate = Join-Path $repoRoot '.venv\Scripts\Activate.ps1'

if (-not (Test-Path $backendPath)) {
    throw "Backend folder not found at $backendPath"
}

if (-not (Test-Path $frontendPath)) {
    throw "Frontend folder not found at $frontendPath"
}

if (-not (Test-Path $venvActivate)) {
    throw "Python virtual environment not found at $venvActivate"
}

if ($InstallIfMissing) {
    if (-not (Test-Path (Join-Path $frontendPath 'node_modules'))) {
        Write-Host 'Installing frontend dependencies...' -ForegroundColor Cyan
        Push-Location $frontendPath
        npm install
        Pop-Location
    }

    Write-Host 'Installing backend dependencies from requirements.txt...' -ForegroundColor Cyan
    Push-Location $backendPath
    & $venvActivate
    pip install -r requirements.txt
    Pop-Location
}

$backendCommand = @"
Set-Location '$backendPath'
& '$venvActivate'
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@

$frontendCommand = @"
Set-Location '$frontendPath'
npm run dev
"@

Start-Process -FilePath pwsh -ArgumentList @('-NoExit', '-Command', $backendCommand) -WorkingDirectory $repoRoot
Start-Process -FilePath pwsh -ArgumentList @('-NoExit', '-Command', $frontendCommand) -WorkingDirectory $repoRoot

Write-Host 'Started backend at http://localhost:8000 and frontend at http://localhost:5173' -ForegroundColor Green
Write-Host 'Run ./stop-local.ps1 to stop both processes.' -ForegroundColor Yellow
