# Fix Python & Vite Issues for Hohimer.Pro
# Run this script from C:\Hohimer.Pro directory

Write-Host "=== Fixing Python & Vite Issues ===" -ForegroundColor Cyan

# Part 1: Fix Python/Azure Functions
Write-Host "`n1. Fixing Python Environment..." -ForegroundColor Yellow

# Clean up Python paths
Write-Host "   - Cleaning Python from PATH..."
$userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
$cleanPath = ($userPath -split ';' | Where-Object { 
    $_ -notmatch "Python313" -and 
    $_ -notmatch "Python313\\Scripts" 
}) -join ';'
[System.Environment]::SetEnvironmentVariable("PATH", $cleanPath, "User")

# Set Python 3.12 as default
Write-Host "   - Setting Python 3.12 as default..."
$py12Path = "C:\Program Files\Python312"
$py12Scripts = "C:\Program Files\Python312\Scripts"
$newPath = "$py12Path;$py12Scripts;$cleanPath"
[System.Environment]::SetEnvironmentVariable("PATH", $newPath, "User")

# Refresh environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Recreate API virtual environment
Write-Host "   - Recreating API virtual environment..."
Set-Location api
if (Test-Path .venv) { Remove-Item .venv -Recurse -Force }
& "C:\Program Files\Python312\python.exe" -m venv .venv
& .\.venv\Scripts\Activate.ps1

# Upgrade pip and install requirements
Write-Host "   - Installing dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

# Verify six module fix
pip uninstall six -y
pip install six==1.16.0

# Part 2: Fix Vite/React ESM issue
Set-Location ..
Write-Host "`n2. Fixing Vite/React ESM..." -ForegroundColor Yellow

# Add ESM support to package.json
Write-Host "   - Adding ESM support to package.json..."
$packageJson = Get-Content package.json | ConvertFrom-Json
$packageJson | Add-Member -Name "type" -Value "module" -MemberType NoteProperty -Force
$packageJson | ConvertTo-Json -Depth 10 | Set-Content package.json

# Create new vite.config.mjs (ESM-compatible)
Write-Host "   - Creating ESM-compatible vite.config.mjs..."
@'
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  build: {
    outDir: "lib/static",
    rollupOptions: {
      input: {
        m365agents: resolve(__dirname, "src/static/scripts/m365agents.ts"),
        app: resolve(__dirname, "src/static/scripts/app.tsx"),
        styles: resolve(__dirname, "src/static/styles/custom.css"),
      },
      output: {
        entryFileNames: "scripts/[name].js",
        chunkFileNames: "scripts/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'styles/app.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
'@ | Set-Content vite.config.mjs

# Remove old vite.config.ts
if (Test-Path vite.config.ts) { Remove-Item vite.config.ts }

# Update nodemon.json to use ESM
Write-Host "   - Updating nodemon.json for ESM..."
if (Test-Path nodemon.json) {
    $nodemonConfig = Get-Content nodemon.json | ConvertFrom-Json
    $nodemonConfig.exec = "node --loader ts-node/esm ./lib/app.js"
    $nodemonConfig | ConvertTo-Json -Depth 10 | Set-Content nodemon.json
}

# Clean and reinstall node modules
Write-Host "   - Reinstalling node modules..."
if (Test-Path node_modules) { Remove-Item node_modules -Recurse -Force }
if (Test-Path package-lock.json) { Remove-Item package-lock.json }
npm install

# Part 3: Fix Azure Functions function_app.py
Write-Host "`n3. Checking Azure Functions setup..." -ForegroundColor Yellow

# Check if function_app.py is too large
$funcAppSize = (Get-Item api\function_app.py -ErrorAction SilentlyContinue).Length
if ($funcAppSize -gt 50KB) {
    Write-Host "   ! WARNING: function_app.py is unusually large ($($funcAppSize/1KB)KB)" -ForegroundColor Red
    Write-Host "   ! This might indicate all functions are in one file" -ForegroundColor Red
    Write-Host "   ! Consider splitting into separate function folders" -ForegroundColor Red
}

# Create a simple test function if needed
if (-not (Test-Path api\test-function)) {
    Write-Host "   - Creating test function..."
    New-Item -ItemType Directory -Path api\test-function -Force | Out-Null
    
    @'
import azure.functions as func
import logging

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    return func.HttpResponse("Test function works!", status_code=200)
'@ | Set-Content api\test-function\__init__.py

    @'
{
  "scriptFile": "__init__.py",
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "$return"
    }
  ]
}
'@ | Set-Content api\test-function\function.json
}

# Part 4: Verification
Write-Host "`n4. Verifying fixes..." -ForegroundColor Yellow

# Test Python
Write-Host "   - Python version: " -NoNewline
python --version

# Test pip
Write-Host "   - Pip version: " -NoNewline
pip --version

# Test Azure Functions Core Tools
Write-Host "   - Azure Functions Core Tools: " -NoNewline
func --version

# Test Node/npm
Write-Host "   - Node version: " -NoNewline
node --version
Write-Host "   - npm version: " -NoNewline
npm --version

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Close and reopen your terminal/PowerShell"
Write-Host "2. Navigate to C:\Hohimer.Pro"
Write-Host "3. For backend: cd api && .\.venv\Scripts\Activate.ps1 && func start"
Write-Host "4. For frontend: npm run dev"
Write-Host "`nIf issues persist, run: npm run build && npm run dev" -ForegroundColor Yellow