# Azure Functions Python Error Diagnostic Script
Write-Host "=== AZURE FUNCTIONS PYTHON DIAGNOSTIC ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check Azure Functions Core Tools version
Write-Host "[1] Azure Functions Core Tools Version:" -ForegroundColor Yellow
func --version
Write-Host ""

# 2. Check Python version and location
Write-Host "[2] Python Version and Location:" -ForegroundColor Yellow
python --version
where.exe python
Write-Host ""

# 3. Check if Python is from Microsoft Store
Write-Host "[3] Checking for Microsoft Store Python:" -ForegroundColor Yellow
$pythonPath = (where.exe python)[0]
if ($pythonPath -like "*WindowsApps*") {
    Write-Host "WARNING: Using Microsoft Store Python! This causes issues." -ForegroundColor Red
} else {
    Write-Host "Good: Not using Microsoft Store Python" -ForegroundColor Green
}
Write-Host ""

# 4. Check virtual environment Python
Write-Host "[4] Virtual Environment Python:" -ForegroundColor Yellow
if (Test-Path "api\.venv\Scripts\python.exe") {
    & api\.venv\Scripts\python.exe --version
    & api\.venv\Scripts\python.exe -c "import sys; print(f'Executable: {sys.executable}')"
} else {
    Write-Host "No virtual environment found at api\.venv" -ForegroundColor Red
}
Write-Host ""

# 5. List installed packages in venv
Write-Host "[5] Packages in Virtual Environment:" -ForegroundColor Yellow
if (Test-Path "api\.venv\Scripts\pip.exe") {
    & api\.venv\Scripts\pip.exe list | Select-String -Pattern "azure-functions|six|pyodbc|pydantic|azure-identity"
} else {
    Write-Host "Cannot check packages - venv not found" -ForegroundColor Red
}
Write-Host ""

# 6. Check for conflicting six installations
Write-Host "[6] Checking 'six' module locations:" -ForegroundColor Yellow
& api\.venv\Scripts\python.exe -c "import six; print(f'six location: {six.__file__}')" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "six module not found in venv" -ForegroundColor Gray
}
Write-Host ""

# 7. Check system PATH for Python conflicts
Write-Host "[7] Python entries in system PATH:" -ForegroundColor Yellow
$env:PATH -split ';' | Where-Object { $_ -like "*python*" -or $_ -like "*Python*" } | ForEach-Object { Write-Host "  $_" }
Write-Host ""

# 8. Test Azure Functions worker
Write-Host "[8] Testing Azure Functions Python Worker:" -ForegroundColor Yellow
Push-Location api
Write-Host "Creating minimal test function..."

# Create a minimal test function
$testFunction = @"
import azure.functions as func
import logging

app = func.FunctionApp()

@app.function_name(name="TestFunction")
@app.route(route="test")
def test_function(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("Test OK", status_code=200)
"@

$testFunction | Out-File -FilePath "test_function.py" -Encoding UTF8

Write-Host "Starting func with minimal test..."
$process = Start-Process -FilePath "func" -ArgumentList "start", "--verbose" -NoNewWindow -PassThru -RedirectStandardOutput "func_output.txt" -RedirectStandardError "func_error.txt"

Start-Sleep -Seconds 5
Stop-Process -Id $process.Id -Force 2>$null

Write-Host "`nFunction output:"
Get-Content "func_output.txt" | Select-Object -First 20
Write-Host "`nFunction errors:"
Get-Content "func_error.txt" | Select-Object -First 20

# Cleanup
Remove-Item "test_function.py" -ErrorAction SilentlyContinue
Remove-Item "func_output.txt" -ErrorAction SilentlyContinue
Remove-Item "func_error.txt" -ErrorAction SilentlyContinue

Pop-Location
Write-Host ""

# 9. Check Azure Functions extension bundle
Write-Host "[9] Checking host.json configuration:" -ForegroundColor Yellow
if (Test-Path "api\host.json") {
    Get-Content "api\host.json"
} else {
    Write-Host "host.json not found!" -ForegroundColor Red
}
Write-Host ""

# Summary and recommendations
Write-Host "=== DIAGNOSTIC SUMMARY ===" -ForegroundColor Cyan
Write-Host "Run this script and share the output to diagnose the issue." -ForegroundColor White
Write-Host "Common fixes based on the output:" -ForegroundColor White
Write-Host "1. If Core Tools < 4.0.5530: Run 'npm install -g azure-functions-core-tools@4 --unsafe-perm true'" -ForegroundColor Gray
Write-Host "2. If using Microsoft Store Python: Uninstall it and use python.org version" -ForegroundColor Gray
Write-Host "3. If Python > 3.11: Consider downgrading to Python 3.11 for compatibility" -ForegroundColor Gray
Write-Host "4. If six module issues: Clear all __pycache__ folders and recreate venv" -ForegroundColor Gray