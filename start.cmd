@echo off
if /i "%~1"=="--server-only" (
  call "%~dp0scripts\node.cmd" "%~dp0scripts\lifecycle.mjs" start
) else (
  call "%~dp0scripts\node.cmd" "%~dp0scripts\lifecycle.mjs" start --open
)
exit /b %errorlevel%
