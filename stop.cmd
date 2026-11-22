@echo off
call "%~dp0scripts\node.cmd" "%~dp0scripts\lifecycle.mjs" stop --close-browser
exit /b %errorlevel%
