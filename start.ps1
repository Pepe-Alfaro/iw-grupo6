# start.ps1 — arranca backend + frontend de ReMarket
$Root = $PSScriptRoot

# ── crear .env si no existe ──────────────────────────────────────────────────
$envFile = "$Root\backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "  Creando backend\.env con configuracion local (SQLite)..." -ForegroundColor Cyan
    @"
DATABASE_URL=sqlite+aiosqlite:///./remarket.db
SECRET_KEY=dev_secret_key_remarket_2026_cambiar_en_prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
PRICE_ALERT_THRESHOLD_PCT=30
MAX_IMAGE_SIZE_MB=5
CORS_ORIGINS=["http://localhost:5173"]
"@ | Out-File -FilePath $envFile -Encoding utf8
}

# ── instalar dependencias frontend si hace falta ────────────────────────────
$nodeModules = "$Root\frontend\node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "  Instalando dependencias del frontend..." -ForegroundColor Cyan
    Push-Location "$Root\frontend"
    npm install | Out-Null
    Pop-Location
}

# ── localizar uv ────────────────────────────────────────────────────────────
$uv = @(
    "$env:USERPROFILE\.local\bin\uv.exe",
    "$env:APPDATA\Python\Python314\Scripts\uv.exe",
    "$env:APPDATA\Python\Python313\Scripts\uv.exe",
    "$env:APPDATA\Python\Python312\Scripts\uv.exe",
    "$env:LOCALAPPDATA\uv\uv.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $uv) {
    $cmd = Get-Command uv -ErrorAction SilentlyContinue
    if ($cmd) { $uv = $cmd.Source }
}
if (-not $uv) {
    Write-Error "uv no encontrado. Instálalo con: pip install uv"
    exit 1
}

# ── liberar puertos si están ocupados ───────────────────────────────────────
foreach ($port in 8000, 5173, 5174) {
    $pid_ = (netstat -ano 2>$null | Select-String ":$port\s" | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Select-Object -First 1)
    if ($pid_ -and $pid_ -match '^\d+$') {
        Stop-Process -Id ([int]$pid_) -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 1

# ── migraciones + seed ───────────────────────────────────────────────────────
Push-Location "$Root\backend"
Write-Host "  Aplicando migraciones..." -ForegroundColor Cyan
& $uv run alembic upgrade head 2>&1 | Out-Null
Write-Host "  Cargando datos de prueba..." -ForegroundColor Cyan
& $uv run python -m app.seed 2>&1 | Out-Null
Pop-Location

# ── backend ──────────────────────────────────────────────────────────────────
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$Root\backend'; & '$uv' run uvicorn app.main:app --reload --port 8000" `
    -WindowStyle Normal

# ── frontend ─────────────────────────────────────────────────────────────────
$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
$npm = if ($npmCmd) { $npmCmd.Source } else { "npm" }

Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$Root\frontend'; & '$npm' run dev" `
    -WindowStyle Normal

# ── info ─────────────────────────────────────────────────────────────────────
Start-Sleep -Seconds 4
Write-Host ""
Write-Host "  ReMarket arrancado" -ForegroundColor Green
Write-Host "  Frontend  ->  http://localhost:5173"
Write-Host "  Backend   ->  http://localhost:8000"
Write-Host "  API docs  ->  http://localhost:8000/docs"
Write-Host ""
