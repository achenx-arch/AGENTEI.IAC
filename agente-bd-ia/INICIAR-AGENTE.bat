@echo off
echo ================================================
echo    Iniciando Agente IA - Oracle HR
echo ================================================
echo.

cd /d "%~dp0backend"

echo [1/3] Verificando archivo .env...
if not exist .env (
    echo Archivo .env no existe. Creando uno nuevo...
    echo DB_CLIENT=sqlite3 > .env
    echo.
    echo NOTA: El archivo .env ha sido creado con configuracion SQLite.
    echo Si deseas usar Oracle, edita el archivo .env
    echo.
)

echo [2/3] Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias...
    call npm install
    echo.
)

echo [3/3] Iniciando servidor...
echo.
echo Servidor disponible en: http://localhost:3000
echo Abre tu navegador en esa direccion
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

node server.js

pause


