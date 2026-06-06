@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Richesses du Monde

echo ============================================================
echo    RICHESSES DU MONDE
echo ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] Node.js n'est pas installe : https://nodejs.org
  pause
  exit /b 1
)

REM Version installee (apres INSTALLER.bat)
if exist "dist\win-unpacked\Richesses du Monde.exe" (
  echo Lancement de l'application...
  start "" "dist\win-unpacked\Richesses du Monde.exe"
  exit /b 0
)

REM Version portable dans dist
for %%f in ("dist\Richesses-du-Monde-Portable-*.exe") do (
  echo Lancement de la version portable...
  start "" "%%~ff"
  exit /b 0
)

REM Mode developpement : fenetre Electron si disponible
if exist "node_modules\electron\cli.js" (
  echo Lancement en mode application (Electron)...
  call npm run app
  exit /b %errorlevel%
)

REM Sinon : navigateur + serveur
echo Mode navigateur : http://localhost:3000
echo Laissez cette fenetre ouverte pendant la partie.
echo.
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
start "" /min cmd /c "timeout /t 2 >nul & start http://localhost:3000"
node server.js
pause
