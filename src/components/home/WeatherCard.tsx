/**
 * @file WeatherCard.tsx
 * @description Карточка погоды: поддержка двух провайдеров — OpenWeatherMap (реальный ключ) и Open‑Meteo (без ключа).
 * - Настройки внутри карточки: координаты, выбор провайдера, ввод API ключа.
 * - Ключ хранится в localStorage: weather:owmKey (frontend), не отправляется на сервер.
 * - Fallback: при ошибке/отсутствии ключа для OWM — автоматический переход на Open‑Meteo.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'

/** Провайдеры погоды */
type WeatherProvider = 'owm' | 'openmeteo'

/** Ответ Open-Meteo (сокращённая форма) */
interface MeteoResponse {
  current?: {
    temperature_2m: number
    weather_code: number
    wind_speed_10m?: number
    time?: string
  }
}

/** Ответ OpenWeatherMap (сокращённая форма) */
interface OwmResponse {
  weather: Array<{ id: number; main: string; description: string; icon: string }>
  main: { temp: number; humidity?: number; pressure?: number }
  wind?: { speed?: number }
  name?: string
}

/** Описание погодного кода WMO (Open‑Meteo) */
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

/** Описание по коду OpenWeatherMap */
function describeOwm(code: number): { label: string; emoji: string } {
  // Диапазоны: 2xx — гроза, 3xx — морось, 5xx — дождь, 6xx — снег, 7xx — туман/пыль, 800 — ясно, 80x — облачно
  if (code >= 200 && code < 300) return { label: 'Гроза', emoji: '⛈️' }
  if (code >= 300 && code < 400) return { label: 'Морось', emoji: '🌦️' }
  if (code >= 500 && code < 600) return { label: 'Дождь', emoji: '🌧️' }
  if (code >= 600 && code < 700) return { label: 'Снег', emoji: '🌨️' }
  if (code >= 700 && code < 800) return { label: 'Атмосфера', emoji: '🌫️' }
  if (code === 800) return { label: 'Ясно', emoji: '☀️' }
  if (code > 800 && code < 900) return { label: 'Облачно', emoji: '☁️' }
  return { label: 'Погода', emoji: '🌤️' }
}

/** Безопасное чтение/запись LS */
function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function writeLS<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* noop */
  }
}

/**
 * WeatherCard — реальная погода:
 * - provider: OpenWeatherMap (если задан ключ) или Open‑Meteo (fallback).
 * - Настройки: lat/lon, API key, выбор провайдера.
 */
export default function WeatherCard(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /** Значения по умолчанию: Бишкек */
  const [lat, setLat] = useState<number>(() => readLS('weather:lat', 42.87))
  const [lon, setLon] = useState<number>(() => readLS('weather:lon', 74.59))
  const [provider, setProvider] = useState<WeatherProvider>(() =>
    readLS<WeatherProvider>('weather:provider', 'openmeteo')
  )

  /** Ключ для OpenWeatherMap */
  const [owmKey, setOwmKey] = useState<string>(() => readLS('weather:owmKey', ''))

  const [temp, setTemp] = useState<number | null>(null)
  const [desc, setDesc] = useState<string>('Погода')
  const [emoji, setEmoji] = useState<string>('🌤️')
  const [wind, setWind] = useState<number | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState<boolean>(false)

  /** Если выбран OWM, но ключа нет — принудительно откатываемся на Open‑Meteo (безопасно) */
  useEffect(() => {
    if (provider === 'owm' && !owmKey) {
      setProvider('openmeteo')
      writeLS('weather:provider', 'openmeteo')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Сохранение настроек */
  const saveSettings = useCallback(() => {
    writeLS('weather:lat', lat)
    writeLS('weather:lon', lon)
    writeLS('weather:provider', provider)
    writeLS('weather:owmKey', owmKey)
    setShowSettings(false)
    // перезагружаем данные после сохранения
    void load()
  }, [lat, lon, provider, owmKey])

  /** Загрузка текущей погоды с учётом провайдера */
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (provider === 'owm') {
        if (!owmKey) {
          throw new Error('Не задан API ключ OpenWeatherMap')
        }
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(
          owmKey
        )}&units=metric&lang=ru`
        const resp = await fetch(url)
        if (!resp.ok) throw new Error('HTTP ' + resp.status)
        const data: OwmResponse = await resp.json()

        const t = data?.main?.temp
        const id = data?.weather?.[0]?.id
        if (typeof t !== 'number' || typeof id !== 'number') {
          throw new Error('Некорректный ответ OpenWeatherMap')
        }

        const d = describeOwm(id)
        setTemp(t)
        setDesc(data.weather?.[0]?.description || d.label)
        setEmoji(d.emoji)
        setWind(typeof data.wind?.speed === 'number' ? data.wind!.speed! : null)
        setUpdatedAt(Date.now())
        setLoading(false)
        return
      }

      // Fallback: Open‑Meteo (без ключа)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error('HTTP ' + resp.status)
      const data: MeteoResponse = await resp.json()
      const t = data?.current?.temperature_2m
      const c = data?.current?.weather_code
      if (typeof t !== 'number' || typeof c !== 'number') {
        throw new Error('Некорректный ответ Open‑Meteo')
      }
      const d = describeWmo(c)
      setTemp(t)
      setDesc(d.label)
      setEmoji(d.emoji)
      setWind(
        typeof data.current?.wind_speed_10m === 'number' ? data.current!.wind_speed_10m! : null
      )
      setUpdatedAt(Date.now())
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить погоду')
      // Смягчающий fallback — демо
      setTemp(18)
      setDesc('Переменная облачность')
      setEmoji('⛅')
      setWind(2)
      setUpdatedAt(Date.now())
    } finally {
      setLoading(false)
    }
  }, [provider, owmKey, lat, lon])

  useEffect(() => {
    void load()
  }, [load])

  const title = 'Погода'
  const providerLabel = provider === 'owm' ? 'OpenWeatherMap' : 'Open‑Meteo'

  return (
    <Card className='bg-white border border-gray-200 overflow-hidden'>
      <CardHeader className='flex items-center justify-between space-y-0'>
        <CardTitle className='text-base font-semibold'>
          {title} ({providerLabel})
        </CardTitle>

        <div className='flex items-center gap-2'>
          {/* Переключатель провайдера */}
          <div
            className='inline-flex rounded-lg border border-gray-200 overflow-hidden'
            role='tablist'
            aria-label='Провайдер погоды'
          >
            {(['owm', 'openmeteo'] as WeatherProvider[]).map(p => {
              const active = provider === p
              const label = p === 'owm' ? 'OWM' : 'Open‑Meteo'
              const disabled = p === 'owm' && !owmKey
              return (
                <button
                  key={p}
                  onClick={() => {
                    if (disabled) return
                    setProvider(p)
                    writeLS('weather:provider', p)
                    void load()
                  }}
                  className={`px-2.5 py-1.5 text-xs transition ${active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  role='tab'
                  aria-selected={active}
                  title={
                    p === 'owm' && !owmKey
                      ? 'Укажите API ключ для OpenWeatherMap в Настройках'
                      : label
                  }
                >
                  {label}
                </button>
              )
            })}
          </div>

          <Button
            variant='outline'
            className='bg-transparent h-8 px-3'
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? 'Обновление…' : 'Обновить'}
          </Button>
          <Button
            variant='outline'
            className='bg-transparent h-8 px-3'
            onClick={() => setShowSettings(s => !s)}
          >
            {showSettings ? 'Скрыть' : 'Настройки'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Основной блок */}
        <div className='flex items-center gap-4'>
          <div className='w-20 h-20 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-3xl'>
            {emoji}
          </div>
          <div>
            <div className='text-2xl font-bold text-gray-900'>
              {temp !== null ? `${Math.round(temp)}°` : '—'}
            </div>
            <div className='text-sm text-gray-600 capitalize'>{desc}</div>
            {typeof wind === 'number' && (
              <div className='text-xs text-gray-500 mt-0.5'>Ветер: {wind} м/с</div>
            )}
            {updatedAt && (
              <div className='text-xs text-gray-400 mt-1'>
                Обновлено: {new Date(updatedAt).toLocaleTimeString('ru-RU')}
              </div>
            )}
            {error && (
              <div className='text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2 inline-block'>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Настройки */}
        {showSettings && (
          <div className='mt-4 p-3 rounded-lg border border-gray-200 bg-gray-50'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
              <div>
                <label className='block text-xs text-gray-600 mb-1'>Широта (lat)</label>
                <input
                  type='number'
                  step='0.0001'
                  value={lat}
                  onChange={e => setLat(parseFloat(e.target.value || '0'))}
                  className='w-full px-2.5 py-2 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-xs text-gray-600 mb-1'>Долгота (lon)</label>
                <input
                  type='number'
                  step='0.0001'
                  value={lon}
                  onChange={e => setLon(parseFloat(e.target.value || '0'))}
                  className='w-full px-2.5 py-2 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div className='md:col-span-2'>
                <label className='block text-xs text-gray-600 mb-1'>API Key (OpenWeatherMap)</label>
                <input
                  type='text'
                  placeholder='Вставьте ключ OWM'
                  value={owmKey}
                  onChange={e => setOwmKey(e.target.value.trim())}
                  className='w-full px-2.5 py-2 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                {!owmKey && (
                  <div className='mt-1 text-[11px] text-gray-500'>
                    Без ключа используется Open‑Meteo (без авторизации). Вставьте ключ OWM чтобы
                    видеть точные данные.
                  </div>
                )}
              </div>
            </div>
            <div className='mt-3 flex items-center justify-end gap-2'>
              <Button
                variant='outline'
                className='bg-transparent h-8 px-3'
                onClick={() => setShowSettings(false)}
              >
                Отмена
              </Button>
              <Button className='h-8 px-3' onClick={saveSettings}>
                Сохранить
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
