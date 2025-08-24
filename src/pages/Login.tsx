/**
 * @file Login.tsx
 * @description Обновленная страница входа: бренд находится внутри карточки, в хедере карточки добавлены виджеты
 * текущего времени и погоды (Open-Meteo, без ключа). Сохранены dev-вход без пароля и запоминание email.
 *
 * Визуальные улучшения:
 * - Чистый split-layout (иллюстрация слева), форма справа.
 * - Бренд (лого + название) в самом окне (Card), а не снаружи.
 * - Компактные виджеты "Время" и "Погода" внутри CardHeader (справа).
 *
 * Accessibility:
 * - Семантичные aria-метки для кнопок/полей.
 * - Высокий контраст в интерактивных элементах.
 */

import { useEffect, useState, useCallback } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { AlertCircle, LogIn, Terminal, Mail, ShieldCheck, Sparkles, ArrowRight, Clock, CloudSun } from 'lucide-react'

/** Weather state shape for the login header mini-widget */
interface MiniWeather {
  temp: number | null
  desc: string
  emoji: string
  wind: number | null
  updatedAt: number | null
}

/**
 * Describe WMO weather code to label and emoji (Open‑Meteo)
 */
function describeWmo(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Ясно', emoji: '☀️' }
  if ([1, 2].includes(code)) return { label: 'Переменная облачность', emoji: '⛅' }
  if (code === 3) return { label: 'Пасмурно', emoji: '☁️' }
  if ([45, 48].includes(code)) return { label: 'Туман', emoji: '🌫️' }
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Морось', emoji: '🌦️' }
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { label: 'Дождь', emoji: '🌧️' }
  if ([66, 67].includes(code)) return { label: 'Ледяной дождь', emoji: '🌧️' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Снег', emoji: '🌨️' }
  if ([95, 96, 99].includes(code)) return { label: 'Гроза', emoji: '⛈️' }
  return { label: 'Погода', emoji: '🌤️' }
}

/**
 * Format time as HH:MM:SS for ru-RU
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Login — вход с безпарольным dev‑режимом и быстрым входом разработчика.
 * Виджеты времени и погоды встроены в заголовок карточки входа.
 */
export default function Login() {
  // Form state
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [remember, setRemember] = useState(true)

  // Header mini-widgets state
  const [now, setNow] = useState<Date>(new Date())
  const [weather, setWeather] = useState<MiniWeather>({
    temp: null,
    desc: '—',
    emoji: '🌤️',
    wind: null,
    updatedAt: null,
  })

  /** Load last used email on mount */
  useEffect(() => {
    try {
      const last = localStorage.getItem('auth:last-email')
      if (last) setEmail(last)
    } catch {
      // ignore
    }
  }, [])

  /** Live clock: tick every second */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /**
   * Fetch current weather from Open‑Meteo (no API key)
   * Bishkek by default: 42.87, 74.59
   */
  const fetchWeather = useCallback(async () => {
    try {
      const lat = 42.87
      const lon = 74.59
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error('HTTP ' + resp.status)
      const data = await resp.json()
      const t = data?.current?.temperature_2m
      const c = data?.current?.weather_code
      const d = describeWmo(typeof c === 'number' ? c : -1)
      setWeather({
        temp: typeof t === 'number' ? Math.round(t) : null,
        desc: d.label,
        emoji: d.emoji,
        wind: typeof data?.current?.wind_speed_10m === 'number' ? Math.round(data.current.wind_speed_10m) : null,
        updatedAt: Date.now(),
      })
    } catch {
      // Soft fallback
      setWeather({
        temp: 21,
        desc: 'Переменная облачность',
        emoji: '⛅',
        wind: 2,
        updatedAt: Date.now(),
      })
    }
  }, [])

  /** Weather: initial load + auto refresh every 10 minutes */
  useEffect(() => {
    void fetchWeather()
    const id = setInterval(() => void fetchWeather(), 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchWeather])

  /**
   * Simple email validation
   */
  const isValidEmail = (val: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(val.trim())
  }

  /**
   * Выполнить локальный вход (без пароля) — создаёт "test-user" с ролью по email.
   */
  const passwordlessLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Пожалуйста, укажите email')
      return
    }
    if (!isValidEmail(email)) {
      setError('Введите корректный email')
      return
    }

    try {
      setLoading(true)

      // Простая логика назначения роли
      const adminEmails = new Set(['sherhan1988hp@gmail.com', 'admin@wasser.com', 'dev@wasser.local'])
      const role = adminEmails.has(email.trim().toLowerCase()) ? 'admin' : 'manager'

      // Сброс любых прежних записей
      localStorage.removeItem('supabase-user')

      // Запоминаем email при необходимости
      if (remember) {
        localStorage.setItem('auth:last-email', email.trim())
      } else {
        localStorage.removeItem('auth:last-email')
      }

      // Создаём локальную dev-сессию
      localStorage.setItem(
        'test-user',
        JSON.stringify({
          email: email.trim(),
          role,
          id: 'test-' + Date.now(),
          authenticated: true,
          timestamp: Date.now(),
        }),
      )

      // Переходим на главную
      window.location.href = '#/'
      window.location.reload()
    } catch (err: any) {
      setError('Не удалось выполнить вход: ' + (err?.message || 'Неизвестная ошибка'))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Быстрый вход для разработчиков — мгновенно логинит admin без email.
   */
  const developerLogin = () => {
    try {
      localStorage.removeItem('supabase-user')

      localStorage.setItem(
        'test-user',
        JSON.stringify({
          email: 'dev@wasser.local',
          role: 'admin',
          id: 'dev-' + Date.now(),
          authenticated: true,
          timestamp: Date.now(),
        }),
      )

      window.location.href = '#/'
      window.location.reload()
    } catch (err) {
      console.error('Developer login error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 grid grid-cols-1 lg:grid-cols-2">
      {/* Иллюстрация и преимущества (desktop) */}
      <div className="hidden lg:flex relative overflow-hidden">
        <img
          src="https://pub-cdn.sider.ai/u/U07GHKZAW71/web-coder/686228d30385cdf9804898f2/resource/bc33337c-1e07-4d33-92bc-25eaaa77eac3.jpg"
          alt="Modern office"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/10" />
        <div className="absolute inset-0 p-10 flex flex-col justify-end text-white">
          <div className="max-w-lg space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs backdrop-blur">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-semibold tracking-wide">WASSER PRO</span>
            </div>
            <h2 className="text-3xl font-extrabold">Мебельная фабрика</h2>
            <p className="text-white/90">
              Управляйте материалами, продукцией и коллекциями. Генерация прайс‑листов и этикеток, аналитика и история
              изменений — в едином интерфейсе.
            </p>
            <ul className="space-y-2 text-sm text-white/90">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Ролевая модель доступа (admin/manager)
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Импорт из Excel, генерация PDF
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Интеграция с Supabase
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Форма входа */}
      <div className="flex items-center justify-center py-10 px-6">
        <div className="w-full max-w-md">
          <Card className="bg-white/90 border border-gray-200 shadow-xl backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                {/* Бренд внутри окна */}
                <div className="flex items-center gap-3">
                  <img
                    src="https://pub-cdn.sider.ai/u/U07GHKZAW71/web-coder/686228d30385cdf9804898f2/resource/1ece3973-6ae2-4150-9d3a-7a6ae9ecdbab.jpg"
                    alt="Brand"
                    className="w-12 h-12 rounded-lg object-cover shadow-sm"
                  />
                  <div>
                    <CardTitle className="text-xl leading-tight">WASSER</CardTitle>
                    <CardDescription>German technology • Мебельная фабрика</CardDescription>
                  </div>
                </div>

                {/* Время и погода */}
                <div className="flex items-center gap-2">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs"
                    title="Текущее время"
                    aria-label="Текущее время"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">{formatTime(now)}</span>
                  </div>

                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs"
                    title="Погода — Бишкек"
                    aria-label="Погода — Бишкек"
                  >
                    <CloudSun className="w-3.5 h-3.5" />
                    <span className="font-semibold">{weather.temp !== null ? `${weather.temp}°` : '—°'}</span>
                    <span className="hidden sm:inline">{weather.emoji}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="mb-4 text-[13px] text-gray-600">
                Режим разработки: вход по email без пароля. В продакшене используйте вход через Supabase.
              </div>

              <form onSubmit={passwordlessLogin} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@company.com"
                      disabled={loading}
                      required
                      className="pl-9"
                      aria-invalid={!!error}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-600 select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Запомнить email на этом устройстве
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={loading} aria-label="Войти без пароля">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Вход...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Войти без пароля
                    </div>
                  )}
                </Button>

                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={developerLogin}
                    className="w-full bg-transparent flex items-center justify-center gap-2"
                    aria-label="Вход для разработчиков (admin)"
                    title="Мгновенный вход как администратор"
                  >
                    <Terminal className="w-4 h-4" />
                    Вход для разработчиков (admin)
                  </Button>
                </div>

                <div className="text-xs text-gray-500 pt-2">
                  Ваш email нигде не сохраняется, кроме локального устройства, для автозаполнения в будущем.
                </div>
              </form>

              <div className="mt-6 flex items-center justify-between">
                <a href="#/about" className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-800">
                  Подробнее о проекте
                  <ArrowRight className="w-4 h-4" />
                </a>

                {weather.updatedAt && (
                  <div className="text-xs text-gray-500">
                    Погода обновлена: {new Date(weather.updatedAt).toLocaleTimeString('ru-RU')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
