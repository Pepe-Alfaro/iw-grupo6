# start.ps1 — arranca backend + frontend de ReMarket
$Root = $PSScriptRoot

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

# ── seed si la BD no tiene datos ─────────────────────────────────────────────
Push-Location "$Root\backend"
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
