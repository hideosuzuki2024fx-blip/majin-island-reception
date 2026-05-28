@echo off
cd /d E:\majin-island-reception
start "Majin Island Reception Server" /min cmd /c "npm start"
timeout /t 2 /nobreak > nul
start "" http://localhost:5188
