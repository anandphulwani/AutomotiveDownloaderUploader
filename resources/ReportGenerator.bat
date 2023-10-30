@ECHO OFF
REM BFCPEOPTIONSTART
REM Advanced BAT to EXE Converter www.BatToExeConverter.com
REM BFCPEEXE=.\ReportGenerator.exe
REM BFCPEICON=.\ReportGenerator.ico
REM BFCPEICONINDEX=-1
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
cd "%~dp0"
cls

SET ExeFullPath=%~f0
SET ExeName=%~nx0
SET count=0
REM Count the number of instances running with full path
for /f "tokens=2 delims=," %%a in ('wmic process where "name='%ExeName%'" get ExecutablePath^,ProcessId /FORMAT:csv ^| findstr /I /C:"%ExeFullPath%"') do (
    set /a count+=1
)
if %count% GTR 1 (
    REM Two or more instances with the same full path are running
    echo Another instance with the same full path is running
    exit
)

node generateReport.js
pause
pause
