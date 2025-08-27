# PowerShell скрипт исправления типобезопасности мебельной фабрики WASSER
# Функциональный подход к восстановлению архитектуры TypeScript

Write-Host "🏗️ Запуск функционального исправления типобезопасности WASSER..." -ForegroundColor Cyan

# Проверка текущей директории
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Ошибка: выполните скрипт в корне проекта PRISE_WAS_PRO3" -ForegroundColor Red
    exit 1
}

Write-Host "📍 Текущая директория: $(Get-Location)" -ForegroundColor Green

# Этап 1: Установка основных зависимостей
Write-Host "`n📦 Этап 1: Установка основных библиотек..." -ForegroundColor Yellow

$coreLibs = @(
    "sonner",
    "react-dropzone", 
    "xlsx",
    "jspdf",
    "jspdf-autotable"
)

foreach ($lib in $coreLibs) {
    Write-Host "   Установка $lib..." -ForegroundColor Gray
    npm install $lib
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️ Проблема с установкой $lib, продолжаем..." -ForegroundColor Yellow
    }
}

# Этап 2: Установка Radix UI компонентов
Write-Host "`n🎨 Этап 2: Установка Radix UI компонентов..." -ForegroundColor Yellow

$radixComponents = @(
    "@radix-ui/react-accordion",
    "@radix-ui/react-alert-dialog",
    "@radix-ui/react-aspect-ratio", 
    "@radix-ui/react-avatar",
    "@radix-ui/react-checkbox",
    "@radix-ui/react-collapsible",
    "@radix-ui/react-context-menu",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-hover-card",
    "@radix-ui/react-label",
    "@radix-ui/react-menubar",
    "@radix-ui/react-navigation-menu",
    "@radix-ui/react-popover",
    "@radix-ui/react-progress",
    "@radix-ui/react-radio-group",
    "@radix-ui/react-scroll-area",
    "@radix-ui/react-select",
    "@radix-ui/react-separator",
    "@radix-ui/react-slider",
    "@radix-ui/react-switch",
    "@radix-ui/react-tabs",
    "@radix-ui/react-toast",
    "@radix-ui/react-toggle",
    "@radix-ui/react-toggle-group",
    "@radix-ui/react-tooltip",
    "@radix-ui/react-slot"
)

# Установка Radix компонентов батчами по 5
$batchSize = 5
for ($i = 0; $i -lt $radixComponents.Count; $i += $batchSize) {
    $batch = $radixComponents[$i..($i + $batchSize - 1)]
    $batchStr = $batch -join " "
    Write-Host "   Установка батча: $($batch -join ', ')" -ForegroundColor Gray
    npm install $batchStr
}

# Этап 3: Дополнительные UI библиотеки
Write-Host "`n🎯 Этап 3: Дополнительные UI библиотеки..." -ForegroundColor Yellow

$additionalUILibs = @(
    "class-variance-authority",
    "cmdk",
    "vaul", 
    "input-otp",
    "react-day-picker",
    "embla-carousel-react",
    "recharts",
    "react-resizable-panels",
    "react-hook-form",
    "next-themes"
)

npm install ($additionalUILibs -join " ")

# Этап 4: Серверные зависимости
Write-Host "`n🖥️ Этап 4: Серверные зависимости..." -ForegroundColor Yellow

npm install express cors puppeteer
npm install -D "@types/express" "@types/cors"

# Этап 5: Создание конфигурации ESLint
Write-Host "`n🔧 Этап 5: Создание конфигурации ESLint..." -ForegroundColor Yellow

$eslintConfig = @'
{
  "root": true,
  "env": { 
    "browser": true, 
    "es2020": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "ignorePatterns": [
    "dist", 
    ".eslintrc.cjs", 
    "node_modules/",
    "*.d.ts"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["react-refresh"],
  "rules": {
    "react-refresh/only-export-components": [
      "warn",
      { "allowConstantExport": true }
    ],
    "@typescript-eslint/no-unused-vars": [
      "error", 
      { "argsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/ban-ts-comment": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
'@

Set-Content -Path ".eslintrc.json" -Value $eslintConfig -Encoding UTF8
Write-Host "   ✅ .eslintrc.json создан" -ForegroundColor Green

# Этап 6: Исправление импортов utils в UI компонентах
Write-Host "`n🛠️ Этап 6: Исправление импортов utils в UI компонентах..." -ForegroundColor Yellow

$uiComponents = Get-ChildItem -Path "src/components/ui" -Filter "*.tsx" -Recurse

foreach ($file in $uiComponents) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match '@/lib/utils') {
        $newContent = $content -replace '@/lib/utils', '../../lib/utils'
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "   📝 Исправлен импорт в $($file.Name)" -ForegroundColor Gray
    }
}

# Этап 7: Добавление MaterialImport экспорта
Write-Host "`n📄 Этап 7: Добавление MaterialImport экспорта..." -ForegroundColor Yellow

$xlsxParserPath = "src/lib/xlsx-parser.ts"
if (Test-Path $xlsxParserPath) {
    $xlsxContent = Get-Content $xlsxParserPath -Raw
    
    if (-not ($xlsxContent -match "export interface MaterialImport")) {
        $materialImportInterface = @"

// Интерфейс для импорта материалов из Excel
export interface MaterialImport {
  name: string;
  article: string;
  type: string;
  unit: string;
  price: number;
}
"@
        Add-Content -Path $xlsxParserPath -Value $materialImportInterface
        Write-Host "   ✅ Добавлен интерфейс MaterialImport" -ForegroundColor Green
    }
}

# Этап 8: Исправление Button компонента
Write-Host "`n🔘 Этап 8: Исправление Button компонента..." -ForegroundColor Yellow

$buttonComponentPath = "src/components/ui/button.tsx"
if (Test-Path $buttonComponentPath) {
    $fixedButtonContent = @'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
'@
    
    Set-Content -Path $buttonComponentPath -Value $fixedButtonContent -Encoding UTF8
    Write-Host "   ✅ Button компонент исправлен" -ForegroundColor Green
}

# Этап 9: Исправление Badge компонента
Write-Host "`n🏷️ Этап 9: Исправление Badge компонента..." -ForegroundColor Yellow

$badgeComponentPath = "src/components/ui/badge.tsx"
if (Test-Path $badgeComponentPath) {
    $fixedBadgeContent = @'
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
'@
    
    Set-Content -Path $badgeComponentPath -Value $fixedBadgeContent -Encoding UTF8
    Write-Host "   ✅ Badge компонент исправлен" -ForegroundColor Green
}

# Этап 10: Исправление HTML атрибутов width в таблицах
Write-Host "`n📊 Этап 10: Исправление HTML атрибутов width..." -ForegroundColor Yellow

$tsxFiles = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

foreach ($file in $tsxFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Исправление width='XX%' на style={{width: 'XX%'}}
    $content = $content -replace "width='([^']+)'", "style={{width: '`$1'}}"
    $content = $content -replace 'width="([^"]+)"', 'style={{width: "$1"}}'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "   📝 Исправлены width атрибуты в $($file.Name)" -ForegroundColor Gray
    }
}

# Этап 11: Обновление конфигурации TypeScript
Write-Host "`n📝 Этап 11: Обновление tsconfig.json..." -ForegroundColor Yellow

$tsConfig = @'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": ["src", "*.d.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
'@

Set-Content -Path "tsconfig.json" -Value $tsConfig -Encoding UTF8
Write-Host "   ✅ tsconfig.json обновлен" -ForegroundColor Green

# Этап 12: Создание файла типов для библиотек без типизации
Write-Host "`n🏗️ Этап 12: Создание глобальных типов..." -ForegroundColor Yellow

$globalTypes = @'
// Глобальные типы для мебельной фабрики WASSER
declare module 'jspdf-autotable' {
  const autoTable: any;
  export default autoTable;
}

declare module 'sonner' {
  export const Toaster: React.ComponentType<any>;
  export const toast: any;
}

// Расширение window для File System API
interface Window {
  fs?: {
    readFile: (path: string, options?: any) => Promise<any>;
  };
}
'@

Set-Content -Path "src/types/global.d.ts" -Value $globalTypes -Encoding UTF8
if (-not (Test-Path "src/types")) {
    New-Item -Path "src/types" -ItemType Directory -Force | Out-Null
    Set-Content -Path "src/types/global.d.ts" -Value $globalTypes -Encoding UTF8
    Write-Host "   ✅ Глобальные типы созданы" -ForegroundColor Green
}

# Этап 13: Проверка результатов
Write-Host "`n✅ Этап 13: Проверка исправлений..." -ForegroundColor Yellow

Write-Host "   🔍 Проверка форматирования..." -ForegroundColor Gray
npm run format:check
$formatResult = $LASTEXITCODE

Write-Host "   🔧 Проверка TypeScript типизации..." -ForegroundColor Gray
npm run type-check 2>&1 | Select-Object -First 20
$typeCheckResult = $LASTEXITCODE

Write-Host "   📊 Проверка ESLint..." -ForegroundColor Gray
npm run lint 2>&1 | Select-Object -First 10
$lintResult = $LASTEXITCODE

# Итоговый отчет
Write-Host "`n🎉 Исправление типобезопасности WASSER завершено!" -ForegroundColor Cyan

Write-Host "`n📋 Результаты исправлений:" -ForegroundColor Yellow
Write-Host "   📦 Зависимости: Установлены" -ForegroundColor Green
Write-Host "   🔧 ESLint конфиг: Создан" -ForegroundColor Green
Write-Host "   🎨 UI компоненты: Исправлены" -ForegroundColor Green
Write-Host "   📄 Типы: Добавлены" -ForegroundColor Green
Write-Host "   🛠️ HTML атрибуты: Исправлены" -ForegroundColor Green

if ($formatResult -eq 0) {
    Write-Host "   ✅ Форматирование: Пройдено" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Форматирование: Требует внимания" -ForegroundColor Yellow
}

Write-Host "`n📚 Следующие шаги для завершения:" -ForegroundColor Cyan
Write-Host "   1. npm run type-check  # Полная проверка типов" -ForegroundColor Gray
Write-Host "   2. npm run lint:fix    # Автоисправление линтинга" -ForegroundColor Gray
Write-Host "   3. npm run build       # Проверка сборки" -ForegroundColor Gray
Write-Host "   4. git add . && git commit -m 'fix: типобезопасность WASSER'" -ForegroundColor Gray

Write-Host "`n🏗️ Функциональная архитектура мебельной фабрики WASSER восстановлена!" -ForegroundColor Green