# АРХИТЕКТУРНЫЙ МАНИФЕСТ WASSER МЕБЕЛЬНАЯ ФАБРИКА
## Функциональная типобезопасная архитектура

### 🏗️ Принципы архитектуры
- **Функциональность**: React компоненты с чистыми функциями
- **Типобезопасность**: Строгая TypeScript типизация
- **Модульность**: Четкое разделение ответственности
- **Производительность**: Мемоизация и оптимизация рендеринга

### 📦 Технологическая база
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS  
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **PDF Generation**: jsPDF + autoTable
- **Build Tool**: Vite + esbuild

### 🎯 Архитектурные слои
1. **Presentation Layer**: React компоненты с типизированными props
2. **Business Logic Layer**: Хуки и утилиты для бизнес-логики
3. **Data Layer**: Supabase клиент и кэширование
4. **Infrastructure Layer**: PDF генерация, экспорт, импорт

### 🔧 Соглашения по коду
- Интерфейсы для всех компонентов: \interface ComponentNameProps\
- React.memo для оптимизации: \React.memo(Component)\
- useMemo/useCallback для тяжелых вычислений
- Функциональные компоненты с деструктуризацией props

### 📋 Проверки качества
- TypeScript: npm run type-check
- ESLint: npm run lint  
- Prettier: npm run format
- Build: npm run build

Дата создания: 27.08.2025 13:53
Версия архитектуры: 2.0.0
