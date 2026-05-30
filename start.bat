@echo off
cd /d "%~dp0"
echo Starting bat-viewer dev server...
call npx vite --port 5178
pause
