Write-Host "🚀 Launching HohimerPro local dev environment..." -ForegroundColor Green

# Check Docker
docker version > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker not running. Start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check Azure login
az account show > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged into Azure. Run 'az login'." -ForegroundColor Red
    exit 1
}

# Ensure dependencies
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing node modules..."
    npm install
}

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "docker-compose up api"

# Wait for backend to come up
Start-Sleep -Seconds 10

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:teamsfx"

Write-Host ""
Write-Host "✅ App is launching..." -ForegroundColor Green
Write-Host ""
Write-Host "👉 Frontend URL:" -NoNewline
Write-Host " http://localhost:53000" -ForegroundColor Yellow
Write-Host ""

# Auto-open browser after a brief delay
Start-Sleep -Seconds 3
Start-Process "http://localhost:53000"
