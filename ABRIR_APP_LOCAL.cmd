@echo off
setlocal
cd /d "%~dp0"
echo Iniciando Palestra en localhost...
echo.
echo URL: http://localhost:8085
echo.
npx expo start --web --port 8085 --localhost --clear
