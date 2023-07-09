@echo on

:loop
REM Check if InstallNewVersion.exe is running
tasklist /FI "IMAGENAME eq InstallNewVersion.exe" 2>NUL | find /I /N "InstallNewVersion.exe">NUL
IF "%ERRORLEVEL%"=="0" (
    echo InstallNewVersion.exe is running, waiting for it to finish...
    timeout /t 5 /nobreak > NUL
    GOTO loop
)

REM InstallNewVersion.exe is not running, so we can replace it
echo InstallNewVersion.exe is not running, replacing it...
copy /Y "%TEMP%\InstallNewVersion.exe" ".\InstallNewVersion.exe" 
