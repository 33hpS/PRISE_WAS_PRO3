#!/bin/bash

# ===========================
# 🧪 WASSER Integration Test Script  
# ===========================

echo "🚀 Запуск тестирования интеграции WASSER Dashboard..."

# Проверка TypeScript
echo "📋 Проверка типов TypeScript..."
npm run dashboard:type-check

if [ $? -ne 0 ]; then
    echo "❌ Ошибки типов TypeScript"
    exit 1
fi

echo "✅ Типы TypeScript корректны"

# Проверка компиляции
echo "🔧 Проверка компиляции..."
npm run dashboard:build

if [ $? -ne 0 ]; then
    echo "❌ Ошибки компиляции"
    exit 1
fi

echo "✅ Компиляция успешна"

# Запуск dev сервера
echo "🌐 Запуск dev сервера..."
echo "📍 Откройте http://localhost:5173/test-integration для тестирования"

npm run dashboard:dev
