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
set "versionWith3Digits=00%version%"
set "versionWith3Digits=%versionWith3Digits:~-3%"
set folder=AutomotiveDownloaderUploader%versionWith3Digits%

if exist %folder% (
    echo Folder %folder% already exists. Exiting...
    exit /b
)

rem Fetch the last directory starting with AutomotiveDownloaderUploader
for /F "delims=" %%A in ('dir /b /ad /o-n AutomotiveDownloaderUploader*') do (
    set "lastDir=%%A"
    goto continue
)
:continue

mkdir %folder%
cd %folder%
git clone https://github.com/anandphulwani/AutomotiveDownloaderUploader .
mkdir .\datastore\ContractorsZone
mkdir .\datastore\Downloads
mkdir .\datastore\FinishedUploadingZone
mkdir .\datastore\LockingBackupsZone
mkdir .\datastore\RecordKeepingZone
mkdir .\datastore\UploadingZone

rem Copy required files from last directory
copy /Y "..\%lastDir%\configs\config.js" ".\configs\"
copy /Y "..\%lastDir%\configs\config-user.js" ".\configs\"
xcopy /E /I /Y "..\%lastDir%\configs\DealerConfiguration\*.*" ".\configs\DealerConfiguration"

echo ewogICAicm9vdHMiOiB7CiAgICAgICJib29rbWFya19iYXIiOiB7CiAgICAgICAgICJjaGlsZHJlbiI6IFtdLAogICAgICAgICAiZGF0ZV9hZGRlZCI6ICIxMzMyMTA5NzE4MzQ2NTgzNCIsCiAgICAgICAgICJkYXRlX2xhc3RfdXNlZCI6ICIwIiwKICAgICAgICAgImRhdGVfbW9kaWZpZWQiOiAiMTMzMjg5NjA4Mjc3Nzc1NTEiLAogICAgICAgICAiZ3VpZCI6ICIwYmM1ZDEzZi0yY2JhLTVkNzQtOTUxZi0zZjIzM2ZlNmM5MDgiLAogICAgICAgICAiaWQiOiAiMSIsCiAgICAgICAgICJuYW1lIjogIkJvb2ttYXJrcyBiYXIiLAogICAgICAgICAidHlwZSI6ICJmb2xkZXIiCiAgICAgIH0KICAgfSwKICAgInZlcnNpb24iOiAxCn0= > %TEMP%\temp.b64 && certutil -decode -f %TEMP%\temp.b64 Bookmarks && del %TEMP%\temp.b64
move /Y ".\resources\InstallNewVersion.exe" "%TEMP%\InstallNewVersion.exe"
move /Y ".\resources\InstallNewVersionReplacer.exe" "%TEMP%\InstallNewVersionReplacer.exe"

rmdir /s /q resources
call npm i -y || echo npm i resulted in non zero status, continuing...
set /p runCount="Enter the number of runs (1-100, default is 1): "
if not defined runCount set /a runCount=1
set /a runCount=%runCount% 2>nul
if %runCount% lss 1 set /a runCount=1
if %runCount% gtr 100 set /a runCount=100
setlocal enabledelayedexpansion
for %%F in (RunDownloader.exe RunUploader.exe) do (
    set "filename=%%~nF"
    set "extension=%%~xF"
    set "newname=%version%!filename!!extension!"
    echo Set oWS = WScript.CreateObject^("WScript.Shell"^) > CreateShortcut.vbs
    echo sLinkFile = "%USERPROFILE%\Desktop\!newname!.lnk" >> CreateShortcut.vbs
    echo Set oLink = oWS.CreateShortcut^(sLinkFile^) >> CreateShortcut.vbs
    echo oLink.TargetPath = "%CD%\%%F" >> CreateShortcut.vbs
    echo oLink.Arguments = "!runCount!" >> CreateShortcut.vbs
    echo oLink.Save >> CreateShortcut.vbs
    cscript CreateShortcut.vbs
    del CreateShortcut.vbs
)
endlocal
cd ..

REM Check if both files exist in the temp directory
IF EXIST "%TEMP%\InstallNewVersion.exe" (
    IF EXIST "%TEMP%\InstallNewVersionReplacer.exe" (
        REM Launch InstallNewVersionReplacer.exe without waiting
        start "" /D "%~dp0" "%TEMP%\InstallNewVersionReplacer.exe"
    )
)
