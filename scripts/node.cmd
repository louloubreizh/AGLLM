@echo off
setlocal
where.exe node.exe >nul 2>&1
if not errorlevel 1 (
  node.exe %*
  exit /b
)
for %%P in ("%~dp0..") do set "PROJECT_FOLDER=%%~nxP"
for /d %%D in ("%LOCALAPPDATA%\AGLLM\toolchain\node-*" "%LOCALAPPDATA%\%PROJECT_FOLDER%\toolchain\node-*") do (
  if exist "%%~fD\node.exe" (
    "%%~fD\node.exe" %*
    exit /b
  )
)
>&2 echo Node.js 24 LTS is required. See README.md.
exit /b 1
