@echo off
chcp 65001 >nul
title Monitoreo de Galería - Presiona Ctrl+C para detener
cd /d "%~dp0"
cls
echo.
echo 🎥 MONITOREO DE GALERÍA EN TIEMPO REAL
echo =====================================
echo.
echo El script está monitoreando la carpeta HISTORIA
echo Cuando agregues nuevas fotos, se actualizarán automáticamente
echo.
echo Presiona Ctrl+C en esta ventana para detener el monitoreo
echo.
echo =====================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0actualizar-galeria.ps1"
