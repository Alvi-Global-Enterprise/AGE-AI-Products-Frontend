@echo off
:: Run this file as Administrator (right-click -> Run as administrator)
echo.
echo === DueWise LAN access fix ===
echo.

powershell -NoProfile -Command "Set-NetConnectionProfile -InterfaceAlias 'Wi-Fi' -NetworkCategory Private"
netsh advfirewall firewall delete rule name="Vite Dev Server 5173" >nul 2>&1
netsh advfirewall firewall add rule name="Vite Dev Server 5173" dir=in action=allow protocol=TCP localport=5173 profile=any

echo.
echo Done. On phone/friend laptop open:
echo   http://192.168.200.173:5173/
echo.
pause
