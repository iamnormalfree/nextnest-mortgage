@echo off
REM Setup Windows Task Scheduler for Chatwoot conversation auto-fix
REM This creates a scheduled task that runs every 5 minutes

set TASK_NAME=ChatwootConversationAutoFix
set SCRIPT_PATH=%~dp0auto-fix-chatwoot-conversations.js
set LOG_PATH=%~dp0logs\chatwoot-autofix.log

REM Create logs directory if it doesn't exist
if not exist "%~dp0logs" mkdir "%~dp0logs"

echo Setting up Windows Task Scheduler for Chatwoot auto-fix...
echo Script: %SCRIPT_PATH%
echo Log: %LOG_PATH%

REM Delete existing task if it exists
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

REM Create new scheduled task
schtasks /create /tn "%TASK_NAME%" ^
    /tr "cmd /c cd /d \"%~dp0..\" && node \"%SCRIPT_PATH%\" >> \"%LOG_PATH%\" 2>&1" ^
    /sc minute /mo 5 ^
    /ru "SYSTEM" ^
    /rl highest

if %errorlevel% equ 0 (
    echo ✅ Successfully created scheduled task "%TASK_NAME%"
    echo 📝 Task will run every 5 minutes
    echo 📄 Logs will be written to: %LOG_PATH%
    echo.
    echo To manage the task:
    echo   View:   schtasks /query /tn "%TASK_NAME%" /fo table
    echo   Run:    schtasks /run /tn "%TASK_NAME%"
    echo   Stop:   schtasks /end /tn "%TASK_NAME%"
    echo   Delete: schtasks /delete /tn "%TASK_NAME%" /f
    echo.
    echo Starting the task now for initial test...
    schtasks /run /tn "%TASK_NAME%"
) else (
    echo ❌ Failed to create scheduled task
    echo You may need to run this as Administrator
)

pause