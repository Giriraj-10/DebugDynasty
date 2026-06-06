# ============================================================
# IntelliCare — Start Backend + Frontend
# Run this from the project root:  .\start.ps1
# ============================================================

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  ██╗███╗   ██╗████████╗███████╗██╗     ██╗     ██╗ ██████╗ █████╗ ██████╗ ███████╗" -ForegroundColor Cyan
Write-Host "  ██║████╗  ██║╚══██╔══╝██╔════╝██║     ██║     ██║██╔════╝██╔══██╗██╔══██╗██╔════╝" -ForegroundColor Cyan
Write-Host "  ██║██╔██╗ ██║   ██║   █████╗  ██║     ██║     ██║██║     ███████║██████╔╝█████╗  " -ForegroundColor Cyan
Write-Host "  ██║██║╚██╗██║   ██║   ██╔══╝  ██║     ██║     ██║██║     ██╔══██║██╔══██╗██╔══╝  " -ForegroundColor Cyan
Write-Host "  ██║██║ ╚████║   ██║   ███████╗███████╗███████╗██║╚██████╗██║  ██║██║  ██║███████╗" -ForegroundColor Cyan
Write-Host "  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝╚══════╝╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Starting IntelliCare — Backend (Spring Boot :8080) + Frontend (Vite :5173)" -ForegroundColor Green
Write-Host "  Press Ctrl+C in either window to stop." -ForegroundColor Yellow
Write-Host ""

# ── Start Spring Boot backend in a new terminal window ──────────────────────
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\backend'; Write-Host '[Backend] Starting Spring Boot on :8080...' -ForegroundColor Cyan; mvn spring-boot:run"
) -WindowStyle Normal

# ── Start Vite frontend dev server in a new terminal window ─────────────────
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\frontend'; Write-Host '[Frontend] Starting Vite dev server on :5173...' -ForegroundColor Green; npm run dev"
) -WindowStyle Normal

Write-Host "  Both servers launched in separate windows." -ForegroundColor Green
Write-Host "  Frontend : http://localhost:5173" -ForegroundColor White
Write-Host "  Backend  : http://localhost:8080" -ForegroundColor White
Write-Host "  H2 Console: http://localhost:8080/h2-console" -ForegroundColor DarkGray
Write-Host ""
