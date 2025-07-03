# Launch script for HohimerPro Azure local development (Docker version)

Write-Host "Starting HohimerPro 401(k) Payment Tracking System..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
docker version > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "Docker is running" -ForegroundColor Green
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

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "Node modules not found. Installing..." -ForegroundColor Yellow
    npm install
    Write-Host "Node modules installed" -ForegroundColor Green
}

# Start backend with Docker in new PowerShell window
Write-Host "Starting Backend (Azure Functions in Docker)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'BACKEND - Azure Functions (Docker)' -ForegroundColor Cyan; Write-Host '===================================' -ForegroundColor Cyan; docker-compose up api"

# Give backend time to start
Start-Sleep -Seconds 10  # Docker needs more time

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
Write-Host "To stop Docker backend, you can also run: docker-compose down" -ForegroundColor Gray