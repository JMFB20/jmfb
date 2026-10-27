@echo off
setlocal
title Crear relay de Gazapo Link

echo ============================================================
echo              CREAR RELAY DE GAZAPO LINK
echo ============================================================
echo.
echo Solo uno de los dos jugadores debe completar este proceso.
echo Al final compartira la misma URL con su amigo.
echo.

where node.exe >nul 2>nul
if errorlevel 1 goto :missing_node

where npm.cmd >nul 2>nul
if errorlevel 1 goto :missing_node

echo [1/3] Preparando las herramientas...
call npm.cmd install
if errorlevel 1 goto :failed

echo.
echo [2/3] Iniciando sesion en Cloudflare...
echo Se abrira el navegador. Acepta la autorizacion y vuelve aqui.
call npx.cmd wrangler login
if errorlevel 1 goto :failed

echo.
echo [3/3] Creando tu relay gratuito...
call npx.cmd wrangler deploy
if errorlevel 1 goto :failed

echo.
echo ============================================================
echo RELAY CREADO
echo ============================================================
echo Busca arriba una URL terminada en workers.dev.
echo Copiala completa y guardala en Gazapo Link en los dos telefonos.
echo No necesitas dejar esta computadora encendida.
echo.
pause
exit /b 0

:missing_node
echo No se encontro Node.js.
echo Instala la version LTS desde https://nodejs.org/ y vuelve a ejecutar este archivo.
echo Durante la instalacion deja marcadas las opciones predeterminadas.
echo.
pause
exit /b 1

:failed
echo.
echo No se pudo completar el proceso.
echo Revisa el mensaje de error que aparece arriba y no cierres esta ventana.
echo.
pause
exit /b 1
