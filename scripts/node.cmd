@echo off
setlocal
where.exe node.exe >nul 2>&1
if not errorlevel 1 (
  node.exe %*
  exit /b
)
for /d %%D in ("%LOCALAPPDATA%\KGLLM\toolchain\node-*") do (
  if exist "%%~fD\node.exe" (
    "%%~fD\node.exe" %*
    exit /b
  )
)
>&2 echo Node.js 24 LTS is required. See README.md.
exit /b 1
