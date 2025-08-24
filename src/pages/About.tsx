/**
 * @file About.tsx
 * @description Страница "О системе" / "Release Notes" — WASSER PRO v4.1.0 Production Ready.
 * Содержит структурированное описание возможностей, технологий, деплоя, безопасности и т.д.
 */

import React, { useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import {
  Rocket,
  Layers,
  Package,
  Grid2X2,
  Calculator,
  ClipboardCheck,
  Shield,
  Palette,
  Gauge,
  Smartphone,
  FileSpreadsheet,
  FileText,
  Terminal,
  Check,
  Calendar,
  Home,
} from 'lucide-react'

/**
 * Копирование текста в буфер обмена с фолбэком через скрытый textarea
 */
function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
        return true
      }
    } catch {
      // fallback
    }
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      ta.setSelectionRange(0, text.length)
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(ok)
      window.setTimeout(() => setCopied(false), 1500)
      return ok
    } catch {
      setCopied(false)
      return false
    }
  }, [])
  return { copied, copy }
}

/**
 * Маркированный пункт с иконкой Check
 */
function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="w-4 h-4 mt-0.5 text-emerald-600" />
      <span className="text-sm text-gray-700">{children}</span>
    </li>
  )
}

/**
 * AboutPage — основная страница с релиз-нотами
 */
export default function AboutPage(): JSX.Element {
  const { copied, copy } = useCopy()
  const versionString = 'WASSER PRO v4.1.0 - Production Ready'

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1">
                <Rocket className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700">Production Ready</span>
              </div>
              <h1 className="mt-3 text-2xl lg:text-3xl font-extrabold text-gray-900">
                WASSER PRO v4.1.0
              </h1>
              <p className="mt-2 text-gray-600">
                Полнофункциональная система управления производством мебели с современным интерфейсом и продвинутыми возможностями.
              </p>
              <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Последнее обновление: Январь 2025</span>
                <span className="text-gray-300">•</span>
                <span>Статус: <span className="text-emerald-700 font-medium">Готово к продакшену</span></span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={() => copy(versionString)}
                title="Скопировать строку версии"
              >
                {copied ? 'Скопировано' : 'Скопировать версию'}
              </Button>
              <a href="#/" className="inline-flex">
                <Button variant="outline" className="bg-transparent" title="На главную">
                  <Home className="w-4 h-4 mr-2" />
                  На главную
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Возможности */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Управление материалами
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <Bullet>Полный CRUD материалов с валидацией</Bullet>
              <Bullet>Импорт/экспорт Excel с обработкой ошибок</Bullet>
              <Bullet>Поиск и фильтрация в реальном времени</Bullet>
              <Bullet>Пагинация для больших списков</Bullet>
              <Bullet>Статистика и аналитика</Bullet>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Управление изделиями
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <Bullet>Создание изделий с техническими картами</Bullet>
              <Bullet>Автоматический расчет себестоимости и цены</Bullet>
              <Bullet>Два режима отображения (сетка/список)</Bullet>
              <Bullet>Фильтрация по коллекциям и типам</Bullet>
              <Bullet>Сортировка по различным параметрам</Bullet>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid2X2 className="w-5 h-5 text-violet-600" />
              Коллекции товаров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <Bullet>Drag &amp; Drop организация товаров</Bullet>
              <Bullet>Визуальное управление порядком</Bullet>
              <Bullet>Статистика по коллекциям</Bullet>
              <Bullet>Поиск внутри коллекций</Bullet>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-600" />
              Система ценообразования
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <Bullet>Гибкие настройки наценок</Bullet>
              <Bullet>Калькулятор стоимости работ</Bullet>
              <Bullet>Формулы расчета цен</Bullet>
              <Bullet>Предпросмотр изменений</Bullet>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-rose-600" />
              Техническая карта
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <Bullet>Интерактивное управление составом</Bullet>
              <Bullet>Импорт техкарт из Excel</Bullet>
              <Bullet>Автоматический расчет стоимости</Bullet>
              <Bullet>Валидация материалов</Bullet>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Технологии */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-gray-800" />
            Технологии
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="font-semibold">Frontend</div>
              <div className="text-gray-600 mt-1">React 18 + TypeScript</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="font-semibold">Styling</div>
              <div className="text-gray-600 mt-1">Tailwind CSS с кастомными анимациями</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="font-semibold">UI / Icons</div>
              <div className="text-gray-600 mt-1">shadcn/ui, Lucide React</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="font-semibold">State</div>
              <div className="text-gray-600 mt-1">React Hooks + Context</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="font-semibold">Data</div>
              <div className="text-gray-600 mt-1">LocalStorage с резервированием</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="font-semibold">Excel / PDF</div>
              <div className="text-gray-600 mt-1">XLSX.js, jsPDF (отчеты)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Деплой */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Развертывание на Cloudflare Pages
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>Подключите репозиторий к Cloudflare Pages</li>
            <li>Build command: <code className="rounded bg-gray-100 px-1.5 py-0.5">npm run build</code></li>
            <li>Output directory: <code className="rounded bg-gray-100 px-1.5 py-0.5">dist</code></li>
            <li>Переменные окружения (опционально): <code className="rounded bg-gray-100 px-1.5 py-0.5">NODE_ENV=production</code>, <code className="rounded bg-gray-100 px-1.5 py-0.5">VITE_APP_VERSION=4.1.0</code></li>
          </ol>
        </CardContent>
      </Card>

      {/* Безопасность / Адаптивность / Дизайн / Производительность */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-700" />
              Безопасность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <Bullet>Content Security Policy заголовки</Bullet>
              <Bullet>XSS и CSRF защита</Bullet>
              <Bullet>Secure headers в _headers файле</Bullet>
              <Bullet>SPA routing с _redirects</Bullet>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-700" />
              Адаптивность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <Bullet>Полностью адаптивный дизайн</Bullet>
              <Bullet>Мобильная оптимизация</Bullet>
              <Bullet>Touch-friendly интерфейс</Bullet>
              <Bullet>Готовность к PWA</Bullet>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-rose-700" />
              Дизайн
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <Bullet>Современный Material Design</Bullet>
              <Bullet>Темная/светлая тема</Bullet>
              <Bullet>Плавные анимации и переходы</Bullet>
              <Bullet>Accessibility (a11y) совместимость</Bullet>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-amber-700" />
              Производительность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <Bullet>Code splitting и lazy loading</Bullet>
              <Bullet>Оптимизированная сборка</Bullet>
              <Bullet>Кэширование статических ресурсов</Bullet>
              <Bullet>Debounce для поиска и фильтров</Bullet>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Использование / Разработка */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-700" />
              Использование
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div>
              <div className="font-semibold">Первый запуск</div>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Откройте приложение в браузере</li>
                <li>Начните с добавления материалов</li>
                <li>Создайте техкарты для изделий</li>
                <li>Организуйте товары в коллекции</li>
                <li>Настройте ценообразование</li>
              </ol>
            </div>
            <div>
              <div className="font-semibold">Импорт данных</div>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Материалы: Excel (Артикул, Название, Единица, Цена)</li>
                <li>Техкарты: Excel (Артикул материала, Количество)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-gray-800" />
              Разработка
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700">
            <div className="grid grid-cols-1 gap-1">
              <code className="rounded bg-gray-100 px-2 py-1">npm install</code>
              <code className="rounded bg-gray-100 px-2 py-1">npm run dev</code>
              <code className="rounded bg-gray-100 px-2 py-1">npm run build</code>
              <code className="rounded bg-gray-100 px-2 py-1">npm run preview</code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Лицензия / Низ */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Лицензия</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700">
          © 2025 WASSER PRO — Система управления производством
          <div className="mt-2 text-xs text-gray-500">
            Версия: 4.1.0 Production Ready • Последнее обновление: Январь 2025
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
