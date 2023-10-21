@ECHO OFF
REM BFCPEOPTIONSTART
REM Advanced BAT to EXE Converter www.BatToExeConverter.com
REM BFCPEEXE=.\FolderTransferer.exe
REM BFCPEICON=.\ExecutableGear.ico
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

SET ExeName=%~nx0
REM Count the number of instances running
for /f %%a in ('tasklist ^| findstr /I /C:"%ExeName%" ^| find /C /V ""') do set count=%%a
if %count% GTR 1 (
    exit
)

REM TODO: Change 500 to 15 or less number or appropriate number accordingly.
for /L %%i in (1,1,500) do (
    node contractors_folderTransferer.js
    pause
)
