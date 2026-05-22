# start.ps1 — ReMarket dev launcher
$Root = $PSScriptRoot
$Width = 60

function Write-Banner {
    Write-Host ""
    Write-Host ("=" * $Width) -ForegroundColor DarkCyan
    Write-Host "  ReMarket — Entorno de desarrollo" -ForegroundColor Cyan
    Write-Host ("=" * $Width) -ForegroundColor DarkCyan
    Write-Host ""
}

function Write-Step {
    param([string]$Icon, [string]$Text, [string]$Color = "White")
    Write-Host "  $Icon  $Text" -ForegroundColor $Color
}

function Write-StepOk {
    param([string]$Text)
    Write-Host "  [OK] $Text" -ForegroundColor Green
}

function Write-StepSkip {
    param([string]$Text)
    Write-Host "  [-]  $Text" -ForegroundColor DarkGray
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "  -- $Title" -ForegroundColor DarkYellow
}

Write-Banner

# ─────────────────────────────────────────────────────────
# 1. Crear .env si no existe
# ─────────────────────────────────────────────────────────
Write-Section "Configuracion"

$envFile = "$Root\backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Step "..." "Creando backend\.env (SQLite local)..."
    @"
DATABASE_URL=sqlite+aiosqlite:///./remarket.db
SECRET_KEY=dev_secret_key_remarket_2026_cambiar_en_prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
PRICE_ALERT_THRESHOLD_PCT=30
MAX_IMAGE_SIZE_MB=5
CORS_ORIGINS=["http://localhost:5173"]
"@ | Out-File -FilePath $envFile -Encoding utf8
    Write-StepOk "backend\.env creado"
} else {
    Write-StepSkip "backend\.env ya existe, se omite"
}

# ─────────────────────────────────────────────────────────
# 2. Localizar uv
# ─────────────────────────────────────────────────────────
Write-Section "Dependencias Python (uv)"

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
    Write-Host "  [ERROR] uv no encontrado." -ForegroundColor Red
    Write-Host "          Instalalo con: pip install uv" -ForegroundColor Red
    exit 1
}
Write-StepOk "uv encontrado en: $uv"

Write-Step "..." "Sincronizando entorno virtual del backend..."
Push-Location "$Root\backend"
$uvOut = & $uv sync 2>&1
Pop-Location
Write-StepOk "Entorno virtual listo"

# ─────────────────────────────────────────────────────────
# 3. Dependencias frontend
# ─────────────────────────────────────────────────────────
Write-Section "Dependencias Node (npm)"

$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
$npm = if ($npmCmd) { $npmCmd.Source } else { "npm" }

$nodeModules = "$Root\frontend\node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Step "..." "Instalando dependencias del frontend (puede tardar un momento)..."
    Push-Location "$Root\frontend"
    & $npm install --silent 2>&1 | Out-Null
    Pop-Location
    Write-StepOk "node_modules instalado"
} else {
    Write-StepSkip "node_modules ya existe, se omite"
}

# ─────────────────────────────────────────────────────────
# 4. Liberar puertos
# ─────────────────────────────────────────────────────────
Write-Section "Puertos"

foreach ($port in 8000, 5173, 5174) {
    $pid_ = (netstat -ano 2>$null | Select-String ":$port\s" | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Select-Object -First 1)
    if ($pid_ -and $pid_ -match '^\d+$') {
        Stop-Process -Id ([int]$pid_) -Force -ErrorAction SilentlyContinue
        Write-StepOk "Puerto $port liberado (PID $pid_)"
    } else {
        Write-StepSkip "Puerto $port libre"
    }
}
Start-Sleep -Seconds 1

# ─────────────────────────────────────────────────────────
# 5. Migraciones Alembic
# ─────────────────────────────────────────────────────────
Write-Section "Base de datos"

Write-Step "..." "Aplicando migraciones Alembic..."
Push-Location "$Root\backend"
$migOut = & $uv run alembic upgrade head 2>&1
Pop-Location

$migOut | ForEach-Object {
    $line = $_.ToString().Trim()
    if ($line -ne "") {
        if ($line -match "Running upgrade") {
            Write-Host "       $line" -ForegroundColor Cyan
        } elseif ($line -match "INFO") {
            Write-Host "       $line" -ForegroundColor DarkGray
        } else {
            Write-Host "       $line" -ForegroundColor DarkGray
        }
    }
}
Write-StepOk "Migraciones aplicadas"

# ─────────────────────────────────────────────────────────
# 6. Seed
# ─────────────────────────────────────────────────────────
Write-Step "..." "Cargando datos de prueba (seed)..."
Push-Location "$Root\backend"
$seedOut = & $uv run python -m app.seed 2>&1
Pop-Location

$seedOut | ForEach-Object {
    $line = $_.ToString().Trim()
    if ($line -ne "" -and $line -notmatch "DeprecationWarning|datetime.utcnow|Use timezone") {
        Write-Host "       $line" -ForegroundColor DarkGray
    }
}
Write-StepOk "Datos de prueba listos"

# ─────────────────────────────────────────────────────────
# 7. Arrancar backend y frontend
# ─────────────────────────────────────────────────────────
Write-Section "Servidores"

Write-Step "..." "Arrancando backend  (FastAPI + uvicorn)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$Root\backend'; Write-Host '  [backend] Arrancando en http://localhost:8000' -ForegroundColor Cyan; & '$uv' run uvicorn app.main:app --reload --port 8000" `
    -WindowStyle Normal
Write-StepOk "Backend iniciado"

Start-Sleep -Seconds 1

Write-Step "..." "Arrancando frontend (Vite + React)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$Root\frontend'; Write-Host '  [frontend] Arrancando en http://localhost:5173' -ForegroundColor Cyan; & '$npm' run dev" `
    -WindowStyle Normal
Write-StepOk "Frontend iniciado"

# ─────────────────────────────────────────────────────────
# 8. Resumen final
# ─────────────────────────────────────────────────────────
Start-Sleep -Seconds 3

Write-Host ""
Write-Host ("=" * $Width) -ForegroundColor DarkCyan
Write-Host "  Todo listo" -ForegroundColor Green
Write-Host ("=" * $Width) -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  Frontend  ->  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend   ->  http://localhost:8000" -ForegroundColor White
Write-Host "  API docs  ->  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "  Credenciales de prueba:" -ForegroundColor DarkYellow
Write-Host "    jorge@remarket.com  /  Test1234!  (cliente)" -ForegroundColor Gray
Write-Host "    ana@remarket.com    /  Test1234!  (cliente)" -ForegroundColor Gray
Write-Host "    mod@remarket.com    /  Mod1234!   (moderador)" -ForegroundColor Gray
Write-Host ""
