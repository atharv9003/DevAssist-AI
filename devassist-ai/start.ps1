# ============================================
# DevAssist AI - Windows Startup Script
# Usage: .\start.ps1
# ============================================

$ErrorActionPreference = "Continue"
$PROJECT_DIR = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    DevAssist AI v2.0 - Starting Up     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# -------------------------------------------
# 0. Check .env file exists
# -------------------------------------------
Write-Host "[0/7] Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path "$PROJECT_DIR\.env")) {
    Write-Host "  ERROR: .env file not found. Copy .env.example to .env and fill in your values." -ForegroundColor Red
    exit 1
}
Write-Host "  OK: .env file found" -ForegroundColor Green

# -------------------------------------------
# 1. Check Python venv
# -------------------------------------------
Write-Host "[1/7] Checking virtual environment..." -ForegroundColor Yellow
if (Test-Path "$PROJECT_DIR\.venv\Scripts\Activate.ps1") {
    & "$PROJECT_DIR\.venv\Scripts\Activate.ps1"
    Write-Host "  OK: Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "  ERROR: .venv not found. Run 'python -m venv .venv' and 'pip install -r requirements.txt' first." -ForegroundColor Red
    exit 1
}

# -------------------------------------------
# 2. Check dependencies
# -------------------------------------------
Write-Host "[2/7] Checking dependencies..." -ForegroundColor Yellow
python -c "import fastapi; import celery; import google.genai" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Installing missing dependencies..." -ForegroundColor Yellow
    python -m pip install -r "$PROJECT_DIR\requirements.txt" --quiet
    Write-Host "  OK: Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  OK: All dependencies found" -ForegroundColor Green
}

# -------------------------------------------
# 3. Check Docker (Redis & Postgres)
# -------------------------------------------
Write-Host "[3/7] Checking Docker containers..." -ForegroundColor Yellow
$dockerOk = docker ps --format "{{.Names}}" 2>$null
if ($dockerOk -match "redis" -and $dockerOk -match "postgres") {
    Write-Host "  OK: Docker Redis and Postgres are running" -ForegroundColor Green
} else {
    Write-Host "  Starting Redis & Postgres via Docker Compose..." -ForegroundColor Yellow
    docker compose up -d redis postgres
    Write-Host "  OK: Docker containers started" -ForegroundColor Green
}

# -------------------------------------------
# 4. Build FAISS index (if missing)
# -------------------------------------------
Write-Host "[4/7] Checking FAISS index..." -ForegroundColor Yellow
$indexPath = "$PROJECT_DIR\data\faiss_index\index.faiss"
if (Test-Path $indexPath) {
    Write-Host "  OK: FAISS index exists" -ForegroundColor Green
} else {
    $codePath = python -c "from core.config import get_settings; print(get_settings().CODEBASE_PATH)" 2>$null
    if ($codePath -and (Test-Path $codePath)) {
        Write-Host "  Building FAISS index from $codePath ..." -ForegroundColor Yellow
        python "$PROJECT_DIR\scripts\setup_index.py"
        Write-Host "  OK: FAISS index built" -ForegroundColor Green
    } else {
        Write-Host "  SKIPPED: Set CODEBASE_PATH in .env to a valid repo folder" -ForegroundColor DarkYellow
    }
}

# Ensure PID directory exists
$pidDir = "$PROJECT_DIR\.pids"
if (-not (Test-Path $pidDir)) {
    New-Item -ItemType Directory -Path $pidDir | Out-Null
}

# Helper: stop process listening on a given port
function Stop-PortProcess {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        Write-Host "  Port $Port in use, stopping old process (PID: $($conn.OwningProcess))..." -ForegroundColor Yellow
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

# Helper: wait for an HTTP endpoint to respond
function Wait-ForEndpoint {
    param([string]$Url, [int]$MaxRetries = 15)
    $retries = 0
    while ($retries -lt $MaxRetries) {
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
            return $true
        } catch {
            Start-Sleep -Seconds 1
            $retries++
        }
    }
    return $false
}

# -------------------------------------------
# 5. Start API Server (background)
# -------------------------------------------
Write-Host "[5/7] Starting API server..." -ForegroundColor Yellow
Stop-PortProcess -Port 8000

$apiJob = Start-Process -FilePath "python" `
    -ArgumentList "-m uvicorn api.main:app --host 127.0.0.1 --port 8000" `
    -WorkingDirectory $PROJECT_DIR `
    -PassThru -WindowStyle Minimized

$apiJob.Id | Out-File "$pidDir\api.pid" -Force

Write-Host "  Waiting for API server..." -ForegroundColor DarkGray
if (Wait-ForEndpoint -Url "http://127.0.0.1:8000/health") {
    Write-Host "  OK: API server running at http://127.0.0.1:8000 (PID: $($apiJob.Id))" -ForegroundColor Green
    Write-Host "      Docs: http://127.0.0.1:8000/docs" -ForegroundColor DarkGray
} else {
    Write-Host "  WARNING: API server may not be ready yet - check logs" -ForegroundColor DarkYellow
}

# -------------------------------------------
# 6. Start Celery Worker (background)
# -------------------------------------------
Write-Host "[6/7] Starting Celery worker..." -ForegroundColor Yellow

$celeryJob = Start-Process -FilePath "python" `
    -ArgumentList "-m celery -A taskqueue.celery_app worker --loglevel=info --pool=solo --purge" `
    -WorkingDirectory $PROJECT_DIR `
    -PassThru -WindowStyle Minimized

$celeryJob.Id | Out-File "$pidDir\celery.pid" -Force
Start-Sleep -Seconds 2
Write-Host "  OK: Celery worker started (PID: $($celeryJob.Id))" -ForegroundColor Green

# -------------------------------------------
# 7. Start Next.js Frontend (background)
# -------------------------------------------
Write-Host "[7/7] Starting Next.js frontend..." -ForegroundColor Yellow
Stop-PortProcess -Port 3000

$feJob = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev" `
    -WorkingDirectory "$PROJECT_DIR\frontend" `
    -PassThru -WindowStyle Minimized

$feJob.Id | Out-File "$pidDir\frontend.pid" -Force

Write-Host "  Waiting for Next.js frontend..." -ForegroundColor DarkGray
if (Wait-ForEndpoint -Url "http://localhost:3000") {
    Write-Host "  OK: Next.js running at http://localhost:3000 (PID: $($feJob.Id))" -ForegroundColor Green
} else {
    Write-Host "  INFO: Next.js is starting up at http://localhost:3000" -ForegroundColor Green
}

# -------------------------------------------
# Done!
# -------------------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    DevAssist AI v3.0 is READY!         " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Dashboard: http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "  API:       http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  API Docs:  http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  Health:    http://127.0.0.1:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "  PIDs saved to .pids\ - run .\stop.ps1 to shut everything down." -ForegroundColor DarkGray
Write-Host ""

Start-Process "http://localhost:3000/dashboard"