@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Richesses du Monde - Construction de l'application

echo ============================================================
echo    RICHESSES DU MONDE - Creer l'application Windows
echo ------------------------------------------------------------
echo    Cela installe Electron et genere :
echo    - un installateur (.exe) dans le dossier dist\
echo    - une version portable (sans installation)
echo ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] Node.js est requis : https://nodejs.org
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] npm est requis (fourni avec Node.js).
  pause
  exit /b 1
)

echo [1/2] Installation des dependances...
call npm install
if errorlevel 1 (
  echo [ERREUR] npm install a echoue.
  pause
  exit /b 1
)

echo.
echo [2/2] Construction de l'application (quelques minutes)...
call npm run dist
if errorlevel 1 (
  echo [ERREUR] La construction a echoue.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo    TERMINE !
echo    - Installateur : dist\Richesses du Monde Setup *.exe
echo    - Portable     : dist\Richesses-du-Monde-Portable-*.exe
echo.
echo    Envoyez l'un de ces fichiers a vos amis pour jouer.
echo ============================================================
pause
