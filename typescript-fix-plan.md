# ПЛАН ИСПРАВЛЕНИЯ TYPESCRIPT ОШИБОК WASSER
Статус: ESLint исправлен ✅ | TypeScript требует внимания ⚠️

## Приоритет 1: HTML атрибуты (26 ошибок)
### src/components/PdfGeneratorClient.tsx
Проблема: width='6%' не является валидным React атрибутом
Решение: Заменить на style={{width: '6%'}}

Автозамена:
- Найти: width='(\d+%)'
- Заменить: style={{width: '$1'}}

## Приоритет 2: Типизация массивов (7 ошибок)
### src/components/PriceListGenerator.tsx  
Проблема: row.push() ожидает number, получает string
Решение: Изменить типизацию с number[] на (string | number)[]

## Приоритет 3: Supabase Promise (9 ошибок)
### src/components/ProductManager.tsx + src/pages/Home.tsx
Проблема: .catch() не существует на PromiseLike
Решение: Правильная обработка через try/catch или .then().catch()

## Приоритет 4: Интерфейсы материалов (3 ошибки)
### src/components/MaterialsManager.tsx
Проблема: Несоответствие MaterialImport и ParsedMaterialRow
Решение: Синхронизировать интерфейсы или добавить type assertions

## Остальные ошибки (11 штук)
- UI компоненты (calendar.tsx, chart.tsx)
- Серверный код (pdf-server.tsx)

## Рекомендуемый порядок:
1. PdfGeneratorClient.tsx - массовая замена атрибутов
2. PriceListGenerator.tsx - исправление типизации
3. ProductManager.tsx + Home.tsx - Supabase handling
4. MaterialsManager.tsx - интерфейсы
5. UI компоненты - по необходимости

Прогресс: 0/56 исправлено
