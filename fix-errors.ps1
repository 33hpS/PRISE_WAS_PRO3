# PowerShell скрипт для исправления всех ошибок сборки
Write-Host "🔧 Исправляем ошибки в проекте WASSER..." -ForegroundColor Cyan

# 1. Создаем отсутствующий файл типов Product
Write-Host "`n📝 Создаем types/product.ts..." -ForegroundColor Yellow

$productTypes = @'
export interface Material {
  id: string
  name: string
  price: number
  unit: string
  description?: string
}

export interface Collection {
  id: string
  name: string
  description?: string
  image?: string
}

export interface Dimensions {
  width: number
  height: number
  depth: number
}

export interface Product {
  id: string
  article: string
  name: string
  description?: string
  basePrice: number
  collection?: Collection
  materials?: Material[]
  dimensions?: Dimensions
  images?: string[]
  category?: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface PriceListItem {
  product: Product
  quantity: number
  markup: number
  finalPrice: number
}

export interface PriceList {
  id: string
  name: string
  items: PriceListItem[]
  createdAt: Date
  updatedAt: Date
}
'@

# Создаем директорию types если не существует
if (!(Test-Path "src/types")) {
    New-Item -ItemType Directory -Path "src/types"
}

$productTypes | Out-File -FilePath "src/types/product.ts" -Encoding UTF8
Write-Host "✅ Файл types/product.ts создан" -ForegroundColor Green

# 2. Исправляем Home.tsx - добавляем export default
Write-Host "`n📝 Исправляем pages/Home.tsx..." -ForegroundColor Yellow

$homeContent = @'
import React from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Package, FileText, Users, TrendingUp } from 'lucide-react'

const Home = () => {
  const stats = [
    {
      title: 'Товары',
      value: '248',
      description: 'Активных позиций',
      icon: Package,
      trend: '+12%'
    },
    {
      title: 'Прайс-листы',
      value: '12',
      description: 'Сгенерировано за месяц',
      icon: FileText,
      trend: '+8%'
    },
    {
      title: 'Клиенты',
      value: '64',
      description: 'Активных партнеров',
      icon: Users,
      trend: '+23%'
    },
    {
      title: 'Продажи',
      value: '₽2.4М',
      description: 'За текущий месяц',
      icon: TrendingUp,
      trend: '+18%'
    }
  ]

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Панель управления</h2>
        <div className="flex items-center space-x-2">
          <Button>Создать прайс-лист</Button>
        </div>
      </div>
      
      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <p className="text-xs text-green-500 mt-1">{stat.trend} с прошлого месяца</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Последние действия */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Последние товары</CardTitle>
            <CardDescription>
              Недавно добавленные или обновленные товары
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Стол обеденный "Классик"', collection: 'Premium', price: '45,000 ₽' },
                { name: 'Шкаф-купе "Модерн"', collection: 'Comfort', price: '82,000 ₽' },
                { name: 'Кровать двуспальная "Люкс"', collection: 'Premium', price: '95,000 ₽' },
                { name: 'Комод "Минимал"', collection: 'Basic', price: '28,000 ₽' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Коллекция: {item.collection}</p>
                  </div>
                  <div className="font-bold">{item.price}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Активность</CardTitle>
            <CardDescription>
              История последних действий в системе
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Создан прайс-лист', user: 'Админ', time: '2 мин назад' },
                { action: 'Обновлен товар', user: 'Менеджер', time: '15 мин назад' },
                { action: 'Добавлен материал', user: 'Админ', time: '1 час назад' },
                { action: 'Экспорт в PDF', user: 'Менеджер', time: '2 часа назад' }
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-muted-foreground">{activity.user}</p>
                  </div>
                  <p className="text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Home
'@

$homeContent | Out-File -FilePath "src/pages/Home.tsx" -Encoding UTF8
Write-Host "✅ Файл pages/Home.tsx исправлен" -ForegroundColor Green

# 3. Исправляем calendar.tsx
Write-Host "`n📝 Исправляем components/ui/calendar.tsx..." -ForegroundColor Yellow

$calendarContent = @'
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
'@

$calendarContent | Out-File -FilePath "src/components/ui/calendar.tsx" -Encoding UTF8
Write-Host "✅ Файл components/ui/calendar.tsx исправлен" -ForegroundColor Green

# 4. Исправляем chart.tsx
Write-Host "`n📝 Исправляем components/ui/chart.tsx..." -ForegroundColor Yellow

$chartContent = @'
import * as React from "react"
import { cn } from "../../lib/utils"

export interface ChartConfig {
  [key: string]: {
    label?: string
    color?: string
    icon?: React.ComponentType
  }
}

interface ChartContainerProps {
  config: ChartConfig
  children: React.ReactNode
  className?: string
}

export function ChartContainer({
  config,
  children,
  className,
}: ChartContainerProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
    </div>
  )
}

export interface ChartTooltipContentProps {
  active?: boolean
  payload?: any[]
  label?: string
  className?: string
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
}

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(({ active, payload, label, className, hideLabel, hideIndicator }, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-background p-2 shadow-sm",
        className
      )}
    >
      {!hideLabel && label && (
        <div className="mb-1 px-2 text-sm font-medium">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((item: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between gap-8 px-2"
          >
            <div className="flex items-center gap-2">
              {!hideIndicator && (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-sm text-muted-foreground">
                {item.name || item.dataKey}
              </span>
            </div>
            <span className="text-sm font-mono font-medium">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})

ChartTooltipContent.displayName = "ChartTooltipContent"

export interface ChartLegendContentProps {
  payload?: any[]
  className?: string
  nameKey?: string
}

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(({ payload, className }, ref) => {
  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
    >
      {payload.map((item: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm">{item.value}</span>
        </div>
      ))}
    </div>
  )
})

ChartLegendContent.displayName = "ChartLegendContent"

export const ChartStyle = (config: ChartConfig) => {
  const colorConfig = Object.entries(config).reduce(
    (acc, [key, value]) => {
      if (value.color) {
        acc[`--color-${key}`] = value.color
      }
      return acc
    },
    {} as Record<string, string>
  )

  return colorConfig
}
'@

$chartContent | Out-File -FilePath "src/components/ui/chart.tsx" -Encoding UTF8
Write-Host "✅ Файл components/ui/chart.tsx исправлен" -ForegroundColor Green

# 5. Устанавливаем необходимые зависимости
Write-Host "`n📦 Проверяем зависимости..." -ForegroundColor Yellow

# Проверяем package.json на наличие зависимостей
$packageJson = Get-Content package.json -Raw | ConvertFrom-Json

$requiredDeps = @(
    "jspdf",
    "jspdf-autotable",
    "react-day-picker",
    "lucide-react"
)

$missingDeps = @()
foreach ($dep in $requiredDeps) {
    if (-not ($packageJson.dependencies.PSObject.Properties.Name -contains $dep)) {
        $missingDeps += $dep
    }
}

if ($missingDeps.Count -gt 0) {
    Write-Host "Устанавливаем недостающие зависимости: $($missingDeps -join ', ')" -ForegroundColor Yellow
    npm install $($missingDeps -join ' ')
} else {
    Write-Host "✅ Все необходимые зависимости установлены" -ForegroundColor Green
}

# 6. Создаем lib/utils.ts если не существует
Write-Host "`n📝 Проверяем lib/utils.ts..." -ForegroundColor Yellow

if (!(Test-Path "src/lib")) {
    New-Item -ItemType Directory -Path "src/lib"
}

if (!(Test-Path "src/lib/utils.ts")) {
    $utilsContent = @'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
'@
    
    $utilsContent | Out-File -FilePath "src/lib/utils.ts" -Encoding UTF8
    Write-Host "✅ Файл lib/utils.ts создан" -ForegroundColor Green
    
    # Устанавливаем необходимые зависимости для utils
    npm install clsx tailwind-merge
}

Write-Host "`n🔄 Запускаем финальную проверку сборки..." -ForegroundColor Cyan

# Финальная проверка
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ВСЕ ОШИБКИ ИСПРАВЛЕНЫ! Проект успешно собирается!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host "🚀 Теперь можете запустить:" -ForegroundColor Cyan
    Write-Host "  npm run dev - для разработки" -ForegroundColor White
    Write-Host "  npm run build - для продакшн сборки" -ForegroundColor White
    Write-Host "================================" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Еще остались ошибки. Проверьте вывод выше." -ForegroundColor Yellow
}