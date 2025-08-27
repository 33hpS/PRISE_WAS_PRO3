/**
 * @file SystemMetricsPanel.tsx
 * @description Отображение системных метрик: количество изделий, коллекций, материалов.
 */
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

/** Набор метрик системы */
export interface SystemMetrics {
  products: number
  collections: number
  materials: number
  lastUpdate?: number
}

/**
 * SystemMetricsPanel — компактная панель метрик
 */
export default function SystemMetricsPanel({ metrics }: { metrics: SystemMetrics }): JSX.Element {
  const items = [
    { label: 'Изделия', value: metrics.products },
    { label: 'Коллекции', value: metrics.collections },
    { label: 'Материалы', value: metrics.materials },
  ] as const

  return (
    <Card className='bg-white border border-gray-200'>
      <CardHeader>
        <CardTitle className='text-base font-semibold'>Системные метрики</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {items.map(it => (
            <div key={it.label} className='p-4 rounded-lg border border-gray-200 bg-gray-50'>
              <div className='text-sm text-gray-500'>{it.label}</div>
              <div className='text-2xl font-bold text-gray-900'>{it.value}</div>
            </div>
          ))}
        </div>
        {metrics.lastUpdate && (
          <div className='text-xs text-gray-500 mt-3'>
            Обновлено: {new Date(metrics.lastUpdate).toLocaleString('ru-RU')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
