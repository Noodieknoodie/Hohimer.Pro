#!/usr/bin/env pwsh
# Stop script for HohimerPro Azure local development

Write-Host "Stopping HohimerPro services..." -ForegroundColor Yellow

# Find and stop func.exe processes (Azure Functions)
$funcProcesses = Get-Process -Name "func" -ErrorAction SilentlyContinue
if ($funcProcesses) {
    Write-Host "Stopping Azure Functions..." -ForegroundColor Cyan
    $funcProcesses | Stop-Process -Force
    Write-Host "Azure Functions stopped ✓" -ForegroundColor Green
} else {
    Write-Host "Azure Functions not running" -ForegroundColor Gray
}

# Find and stop node processes running on common dev ports
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*dev:teamsfx*" -or 
    $_.CommandLine -like "*vite*" -or
    $_.CommandLine -like "*webpack*"
}
if ($nodeProcesses) {
    Write-Host "Stopping Teams Tab frontend..." -ForegroundColor Magenta
    $nodeProcesses | Stop-Process -Force
    Write-Host "Teams Tab frontend stopped ✓" -ForegroundColor Green
} else {
    Write-Host "Teams Tab frontend not running" -ForegroundColor Gray
}

# Also check for any PowerShell windows with our services
$psWindows = Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*Azure Functions*" -or 
    $_.MainWindowTitle -like "*Teams Tab*"
}
if ($psWindows) {
    Write-Host "Closing service windows..." -ForegroundColor Yellow
    $psWindows | Stop-Process -Force
}

Write-Host ""
Write-Host "All services stopped!" -ForegroundColor Green