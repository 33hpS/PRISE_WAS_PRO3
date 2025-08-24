/**
 * @file PinnedCollectionsPanel.tsx
 * @description Панель закреплённых коллекций с краткими данными и обложкой.
 */
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'

/** Упрощённая коллекция для панели */
export interface SimpleCollection {
  id: string
  name: string
  productIds?: string[]
  cover_url?: string
}

/**
 * PinnedCollectionsPanel — список закреплённых коллекций
 */
export default function PinnedCollectionsPanel({
  collections,
  productMap,
  onOpenCollections,
}: {
  collections: SimpleCollection[]
  productMap: Map<string, any>
  onOpenCollections: () => void
}): JSX.Element {
  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="flex items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Закреплённые коллекции</CardTitle>
        <Button variant="outline" className="bg-transparent h-8 px-3" onClick={onOpenCollections} aria-label="Открыть раздел «Коллекции»">
          Открыть все
        </Button>
      </CardHeader>
      <CardContent>
        {collections.length === 0 ? (
          <div className="text-sm text-gray-500">Нет закреплённых коллекций</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {collections.map((c) => {
              const count = (c.productIds || []).filter((id) => productMap.has(id)).length
              return (
                <div key={c.id} className="p-0 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                  <div className="h-20 w-full bg-gray-100 relative">
                    {c.cover_url ? (
                      <img
                        src={c.cover_url}
                        alt={c.name}
                        className="object-cover w-full h-full"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200" />
                    )}
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-gray-900">{c.name}</div>
                    <div className="text-sm text-gray-600 mt-1">Позиций: {count}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
