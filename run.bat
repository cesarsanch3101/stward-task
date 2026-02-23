@echo off
setlocal

echo ==========================================
echo    Stward Task - Inicio Rapido
echo ==========================================

:: 1. Verificar variables de entorno
if not exist .env (
    echo [INFO] No se encontro el archivo .env. Creandolo desde .env.example...
    copy .env.example .env
    echo [TIP] Puedes editar el archivo .env para cambiar las contrasenas.
)

:: 2. Levantar los contenedores con Docker Compose
echo [DOCKER] Construyendo e iniciando contenedores...
docker compose up --build -d

if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose fallo. Asegurate de que Docker Desktop este corriendo.
    pause
    exit /b %errorlevel%
)

:: 3. Aplicar migraciones
echo [DJANGO] Aplicando migraciones de base de datos...
:: Esperar un momento para asegurar que el servicio de backend este listo para aceptar comandos
timeout /t 5 /nobreak > nul
docker compose exec backend python manage.py migrate

if %errorlevel% neq 0 (
    echo [WARNING] Las migraciones pueden haber fallado si la base de datos aun esta iniciando.
    echo Reintentando en 5 segundos...
    timeout /t 5 /nobreak > nul
    docker compose exec backend python manage.py migrate
)

echo.
echo ==========================================
echo    APLICACION LISTA
echo ==========================================
echo Frontend:     http://localhost:3000
echo Backend API:  http://localhost:8000/api/
echo Django Admin: http://localhost:8000/admin/
echo ==========================================
echo.

:: Abrir el navegador
start http://localhost:3000

echo Presiona cualquier tecla para detener los servicios o cierra esta ventana para mantenerlos corriendo.
pause

echo [DOCKER] Deteniendo servicios...
docker compose down

endlocal
