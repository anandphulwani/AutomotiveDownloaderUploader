@ECHO OFF
REM BFCPEOPTIONSTART
REM Advanced BAT to EXE Converter www.BatToExeConverter.com
REM BFCPEEXE=C:\Users\Administrator\Desktop\AutomotiveDownloaderUploader\resources\InstallNewVersionReplacer.exe
REM BFCPEICON=C:\Program Files (x86)\Advanced BAT to EXE Converter PRO v2.91\ab2econv291pro\icons\icon11.ico
REM BFCPEICONINDEX=1
REM BFCPEEMBEDDISPLAY=0
REM BFCPEEMBEDDELETE=1
REM BFCPEADMINEXE=1
REM BFCPEINVISEXE=0
REM BFCPEVERINCLUDE=0
REM BFCPEVERVERSION=1.0.0.0
REM BFCPEVERPRODUCT=Product Name
REM BFCPEVERDESC=Product Description
REM BFCPEVERCOMPANY=Your Company
REM BFCPEVERCOPYRIGHT=Copyright Info
REM BFCPEOPTIONEND
@ECHO ON
@echo off

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
move /Y "%TEMP%\InstallNewVersion.exe" ".\InstallNewVersion.exe"
start cmd /c "timeout /t 3 && del /Q /F ""%~f0"""
exit /b
