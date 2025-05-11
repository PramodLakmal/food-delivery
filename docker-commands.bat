@echo off
setlocal enabledelayedexpansion

:: Colors for better readability
set GREEN=92m
set YELLOW=93m
set RED=91m
set NC=0m

:: Function to display help
if "%1"=="" goto help
if "%1"=="help" goto help

:: Start services
if "%1"=="start" (
    echo [%GREEN%Starting all services...[%NC%
    docker-compose up -d
    echo [%GREEN%Services started. Access the application at http://localhost[%NC%
    goto end
)

:: Stop services
if "%1"=="stop" (
    echo [%YELLOW%Stopping all services...[%NC%
    docker-compose down
    echo [%GREEN%Services stopped.[%NC%
    goto end
)

:: Restart services
if "%1"=="restart" (
    echo [%YELLOW%Restarting all services...[%NC%
    docker-compose restart
    echo [%GREEN%Services restarted.[%NC%
    goto end
)

:: View logs
if "%1"=="logs" (
    if "%2"=="" (
        echo [%GREEN%Viewing logs for all services...[%NC%
        docker-compose logs -f
    ) else (
        echo [%GREEN%Viewing logs for %2...[%NC%
        docker-compose logs -f %2
    )
    goto end
)

:: Rebuild services
if "%1"=="rebuild" (
    if "%2"=="" (
        echo [%YELLOW%Rebuilding all services...[%NC%
        docker-compose build
        docker-compose up -d
    ) else (
        echo [%YELLOW%Rebuilding %2...[%NC%
        docker-compose build %2
        docker-compose up -d %2
    )
    echo [%GREEN%Rebuild completed.[%NC%
    goto end
)

:: Clean up
if "%1"=="clean" (
    echo [%RED%Stopping all services and removing volumes...[%NC%
    docker-compose down -v
    echo [%GREEN%Clean up completed.[%NC%
    goto end
)

:: Show status
if "%1"=="status" (
    echo [%GREEN%Service status:[%NC%
    docker-compose ps
    goto end
)

:help
echo [%YELLOW%Food Delivery Application - Docker Commands[%NC%
echo.
echo Usage: docker-commands.bat [command]
echo.
echo Commands:
echo   start       - Build and start all services
echo   stop        - Stop all services
echo   restart     - Restart all services
echo   logs        - View logs for all services
echo   logs [service] - View logs for a specific service
echo   rebuild     - Rebuild all services
echo   rebuild [service] - Rebuild a specific service
echo   clean       - Stop all services and remove volumes
echo   status      - Show status of all services
echo   help        - Show this help message
echo.
echo Examples:
echo   docker-commands.bat start
echo   docker-commands.bat logs api-gateway
echo   docker-commands.bat rebuild frontend

:end
endlocal