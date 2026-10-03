@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is needed for this local preview server.
  echo You can also open preview\index.html directly in a browser.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:4177/preview/index.html"
node preview-server.mjs
pause
