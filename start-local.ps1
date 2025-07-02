# Launch script for HohimerPro Azure local development

Write-Host "Starting HohimerPro 401(k) Payment Tracking System..." -ForegroundColor Green
Write-Host ""

# Check if Azure CLI is logged in
Write-Host "Checking Azure authentication..." -ForegroundColor Yellow
$azAccount = az account show 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged into Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}
Write-Host "Azure authentication confirmed" -ForegroundColor Green
Write-Host ""

# Check if Python virtual environment exists
if (!(Test-Path "api\.venv")) {
    Write-Host "Python virtual environment not found. Creating..." -ForegroundColor Yellow
    Push-Location api
    python -m venv .venv
    & .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    Pop-Location
    Write-Host "Virtual environment created" -ForegroundColor Green
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "Node modules not found. Installing..." -ForegroundColor Yellow
    npm install
    Write-Host "Node modules installed" -ForegroundColor Green
}

# Start backend in new PowerShell window
Write-Host "Starting Backend (Azure Functions)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'BACKEND - Azure Functions' -ForegroundColor Cyan; Write-Host '=========================' -ForegroundColor Cyan; cd api; & .\.venv\Scripts\Activate.ps1; func start"

# Give backend time to start
Start-Sleep -Seconds 3

# Start frontend in new PowerShell window
Write-Host "Starting Frontend (Teams Tab)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'FRONTEND - Teams Tab' -ForegroundColor Magenta; Write-Host '====================' -ForegroundColor Magenta; npm run dev:teamsfx"

Write-Host ""
Write-Host "Both services are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API will be available at: " -NoNewline
Write-Host "http://localhost:7071/api/" -ForegroundColor Yellow
Write-Host "Frontend URL will be shown in the Teams Toolkit output" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop the services" -ForegroundColor Gray