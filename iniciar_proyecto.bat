@echo off
color 0A
echo =======================================================
echo          INICIALIZANDO BOVWEIGHT CR (AUTO-SETUP)
echo =======================================================
echo.
echo Este script configurara o arrancara automaticamente todo el sistema.
echo Asegurate de tener instalado Node.js, Composer, PHP y Docker.
echo.

REM --- 1. FRONTEND DEPENDENCIES CHECK ---
if exist mobile-app\node_modules goto :skip_frontend_install
echo [1/3] INSTALANDO DEPENDENCIAS FRONTEND (MOBILE-APP)...
echo -------------------------------------------------------
cd mobile-app
call npm install
cd ..
echo Frontend listo.
goto :check_backend

:skip_frontend_install
echo [1/3] Frontend ya configurado (node_modules detectado). Saltando instalacion.

:check_backend
echo.
REM --- 2. BACKEND DEPENDENCIES CHECK ---
if exist backend\vendor goto :skip_backend_install
echo [2/3] CONFIGURANDO BACKEND (LARAVEL)...
echo -------------------------------------------------------

REM Hacemos un respaldo de nuestro codigo customizado si existe
if not exist backend goto :create_backend
move backend backend_custom
echo Creando proyecto base Laravel (esto puede tardar unos minutos)...
call composer create-project laravel/laravel backend
echo Integrando codigo customizado de BovWeight CR...
xcopy /Y /S backend_custom\* backend\
rd /S /Q backend_custom
goto :configure_env

:create_backend
echo Creando proyecto base Laravel...
call composer create-project laravel/laravel backend

:configure_env
cd backend
echo Configurando entorno...
if not exist .env copy .env.example .env
call php artisan key:generate
cd ..
echo Backend listo.
goto :docker_section

:skip_backend_install
echo [2/3] Backend ya configurado (vendor detectado). Saltando inicializacion de Laravel.

:docker_section
echo.
REM --- 3. DOCKER SERVICES ---
echo [3/3] LEVANTANDO SERVICIOS DOCKER (BD MySQL e IA Python)...
echo -------------------------------------------------------
echo Asegurate de que Docker Desktop este abierto.
docker-compose up -d --build
echo.

echo =======================================================
echo           INICIANDO SERVIDORES DE DESARROLLO
echo =======================================================
echo.
echo [1/2] Iniciando Backend de Laravel (php artisan serve)...
start "BovWeight Backend - Laravel" cmd /k "cd backend && php artisan serve"

echo [2/2] Iniciando Frontend (pnpm run dev)...
start "BovWeight Frontend - Vite" cmd /k "cd mobile-app && pnpm run dev"

echo.
echo =======================================================
echo                   TODO LISTO! 🎉
echo =======================================================
echo.
echo Se han abierto dos terminales adicionales con los servidores de desarrollo:
echo   - Backend (API):  http://127.0.0.1:8000
echo   - Frontend (App): http://localhost:8100
echo.
echo Presiona cualquier tecla para salir...
pause >nul
