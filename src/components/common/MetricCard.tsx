/**
 * @file MetricCard.tsx
 * @description Компактная карточка метрики с иконкой.
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

/** Свойства карточки метрики */
export interface MetricCardProps {
  /** Заголовок метрики */
  title: string
  /** Значение */
  value: number | string
  /** Подпись/описание */
  hint?: string
  /** Иконка справа в хедере */
  icon?: React.ReactNode
  /** Доп. классы */
  className?: string
}

/**
 * MetricCard — небольшая карточка показателя
 */
export default function MetricCard({ title, value, hint, icon, className }: MetricCardProps): JSX.Element {
  return (
    <Card className={`bg-white border border-gray-200 ${className || ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
