@echo off
REM ===========================
REM 🧪 WASSER Integration Test Script (Windows)  
REM ===========================

echo 🚀 Запуск тестирования интеграции WASSER Dashboard...

REM Проверка TypeScript
echo 📋 Проверка типов TypeScript...
call npm run dashboard:type-check

if %ERRORLEVEL% neq 0 (
    echo ❌ Ошибки типов TypeScript
    exit /b 1
)

echo ✅ Типы TypeScript корректны

REM Проверка компиляции
echo 🔧 Проверка компиляции...
call npm run dashboard:build

if %ERRORLEVEL% neq 0 (
    echo ❌ Ошибки компиляции
    exit /b 1
)

echo ✅ Компиляция успешна

REM Запуск dev сервера
echo 🌐 Запуск dev сервера...
echo 📍 Откройте http://localhost:5173/test-integration для тестирования

call npm run dashboard:dev
