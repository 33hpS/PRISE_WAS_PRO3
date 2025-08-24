/**
 * @file EmptyStateSection.tsx
 * @description Подсказка пустого состояния с кнопками «Загрузить демо-данные» и «Коллекции».
 */
import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'

/**
 * EmptyStateSection — секция для случая, когда нет данных
 */
export default function EmptyStateSection({
  onSeedData,
  onNavigateCollections,
}: {
  onSeedData: () => void
  onNavigateCollections: () => void
}): JSX.Element {
  return (
    <Card className="bg-white border border-gray-200">
      <CardContent className="py-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="text-lg font-semibold text-gray-900">Пока пусто</div>
          <div className="text-sm text-gray-600 mt-1">
            Загрузите демонстрационные данные или перейдите к созданию коллекций.
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="default" onClick={onSeedData}>Загрузить демо-данные</Button>
            <Button variant="outline" className="bg-transparent" onClick={onNavigateCollections}>Открыть «Коллекции»</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
