# WorkMatrix Startup Script

# Function to check if a process is running
function Test-ProcessRunning {
    param($ProcessName)
    return Get-Process $ProcessName -ErrorAction SilentlyContinue
}

# Function to start the background service
function Start-BackgroundService {
    $backgroundExe = Join-Path $PSScriptRoot "workmatrix-background.exe"
    if (Test-Path $backgroundExe) {
        Write-Host "Starting WorkMatrix background service..."
        Start-Process -FilePath $backgroundExe -WindowStyle Hidden
    } else {
        Write-Host "Error: Background service executable not found at: $backgroundExe"
        exit 1
    }
}

# Function to start the frontend
function Start-Frontend {
    $frontendPath = Join-Path $PSScriptRoot ".." "Front-End"
    if (Test-Path $frontendPath) {
        Write-Host "Starting WorkMatrix frontend..."
        Set-Location $frontendPath
        Start-Process "npm" -ArgumentList "start" -WindowStyle Normal
    } else {
        Write-Host "Error: Frontend directory not found at: $frontendPath"
        exit 1
    }
}

# Main execution
try {
    # Create necessary directories if they don't exist
    $dirs = @(
        "data\screenshots",
        "logs",
        "config"
    )

    foreach ($dir in $dirs) {
        $path = Join-Path $PSScriptRoot $dir
        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
        }
    }

    # Check if .env file exists
    $envFile = Join-Path $PSScriptRoot ".env"
    if (-not (Test-Path $envFile)) {
        Write-Host "Warning: .env file not found. Please configure it before running the application."
        exit 1
    }

    # Start background service if not already running
    if (-not (Test-ProcessRunning "workmatrix-background")) {
        Start-BackgroundService
    } else {
        Write-Host "Background service is already running."
    }

    # Start frontend
    Start-Frontend

    Write-Host "WorkMatrix started successfully!"
    Write-Host "Press Ctrl+C to stop all services."

    # Keep the script running and handle shutdown
    while ($true) {
        Start-Sleep -Seconds 1
        if ($Host.UI.RawUI.KeyAvailable -and 
            ($Host.UI.RawUI.ReadKey("AllowCtrlC,IncludeKeyUp,NoEcho").Character -eq 3)) {
            Write-Host "`nStopping WorkMatrix services..."
            Get-Process "workmatrix-background" -ErrorAction SilentlyContinue | Stop-Process
            Get-Process "node" -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like "*WorkMatrix*"} | Stop-Process
            break
        }
    }

} catch {
    Write-Host "Error: $_"
    exit 1
} 