@ECHO OFF
REM BFCPEOPTIONSTART
REM Advanced BAT to EXE Converter www.BatToExeConverter.com
REM BFCPEEXE=
REM BFCPEICON=C:\Program Files (x86)\Advanced BAT to EXE Converter PRO v2.91\ab2econv291pro\icons\icon11.ico
REM BFCPEICONINDEX=1
REM BFCPEEMBEDDISPLAY=0
REM BFCPEEMBEDDELETE=1
REM BFCPEADMINEXE=0
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
set /p version="Enter the version number: "
set folder=AutomotiveDownloaderUploader%version%

if exist %folder% (
    echo Folder %folder% already exists. Exiting...
    exit /b
) else (
    mkdir %folder%
    cd %folder%
    git clone https://github.com/anandphulwani/AutomotiveDownloaderUploader .
    npm i
    set /p runCount="Enter the number of runs (1-100, default is 1): "
    set /a runCount=%runCount% 2>nul
    if "%runCount%"=="" set /a runCount=1
    if %runCount% lss 1 set /a runCount=1
    if %runCount% gtr 100 set /a runCount=100
    setlocal enabledelayedexpansion
    for %%F in (RunDownloader.exe RunUploader.exe) do (
        set "filename=%%~nF"
        set "extension=%%~xF"
        set "newname=%version%!filename!!extension!"
        echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
        echo sLinkFile = "%USERPROFILE%\Desktop\!newname!.lnk" >> CreateShortcut.vbs
        echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
        echo oLink.TargetPath = "%%F" >> CreateShortcut.vbs
        echo oLink.Arguments = "!runCount!" >> CreateShortcut.vbs
        echo oLink.Save >> CreateShortcut.vbs
        cscript CreateShortcut.vbs
        del CreateShortcut.vbs
    )
    endlocal
)
