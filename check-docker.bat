@echo off
setlocal enabledelayedexpansion

:: Colors for better readability
set GREEN=92m
set YELLOW=93m
set RED=91m
set NC=0m

echo [%YELLOW%Checking Docker and Docker Compose installation...[%NC%

:: Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [%GREEN%Docker is installed.[%NC%
    docker --version
) else (
    echo [%RED%Docker is not installed. Please install Docker first.[%NC%
    echo Visit https://docs.docker.com/get-docker/ for installation instructions.
    exit /b 1
)

:: Check if Docker Compose is installed
where docker-compose >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [%GREEN%Docker Compose is installed.[%NC%
    docker-compose --version
) else (
    echo [%RED%Docker Compose is not installed. Please install Docker Compose first.[%NC%
    echo Visit https://docs.docker.com/compose/install/ for installation instructions.
    exit /b 1
)

:: Check if Docker daemon is running
docker info >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [%GREEN%Docker daemon is running.[%NC%
) else (
    echo [%RED%Docker daemon is not running. Please start Docker first.[%NC%
    exit /b 1
)

echo [%GREEN%All requirements are met. You can now run the application using Docker Compose.[%NC%
echo Run [%YELLOW%docker-commands.bat start[%NC% to start the application.

endlocal 