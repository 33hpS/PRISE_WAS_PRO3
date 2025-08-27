/**
 * @file TestFurnitureComponent.tsx
 * @description Тестовый компонент для проверки VS Code конфигурации и сниппетов
 * Создайте этот файл в src/components/ для тестирования всех возможностей
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react'

// ===== ТЕСТ ТИПОБЕЗОПАСНОСТИ =====

interface Material {
  id: string
  name: string
  price: number
  consumptionCoeff?: number
}

interface Collection {
  id: string
  name: string
  multiplier: number
}

// ===== ТЕСТ СНИППЕТОВ =====

// 1. Протестируйте сниппет "fcomp" - наберите fcomp и нажмите Tab
// Должен сгенерироваться полный типизированный компонент

// 2. Протестируйте сниппет "matcost" - наберите matcost и нажмите Tab
// Должен сгенерироваться калькулятор материалов

// 3. Протестируйте сниппет "usesupabase" - наберите usesupabase и нажмите Tab
// Должен сгенерироваться хук для работы с Supabase

// 4. Протестируйте сниппет "pricegen" - наберите pricegen и нажмите Tab
// Должен сгенерироваться генератор PDF

// ===== ФУНКЦИОНАЛЬНАЯ АРХИТЕКТУРА =====

const COLLECTION_MULTIPLIERS: Record<string, number> = {
  премиум: 1.5,
  люкс: 1.8,
  стандарт: 1.2,
  эконом: 1.0,
} as const

type CollectionType = keyof typeof COLLECTION_MULTIPLIERS

/**
 * Типобезопасная функция расчета множителя коллекции
 * Демонстрирует чистую функциональную архитектуру
 */
const getCollectionMultiplier = (collection: string): number => {
  const normalizedCollection = collection.toLowerCase() as CollectionType
  return COLLECTION_MULTIPLIERS[normalizedCollection] ?? 1.0
}

/**
 * Чистая функция расчета общей стоимости материалов
 * с учетом коэффициентов потребления
 */
const calculateTotalMaterialCost = (
  materials: Material[],
  quantities: Record<string, number>
): number => {
  return materials.reduce((total, material) => {
    const quantity = quantities[material.id] || 0
    const coefficient = material.consumptionCoeff || 1
    return total + material.price * quantity * coefficient
  }, 0)
}

// ===== ОСНОВНОЙ ТЕСТОВЫЙ КОМПОНЕНТ =====

interface TestFurnitureComponentProps {
  article: string
  name: string
  collection: string
  basePrice: number
  materials: Material[]
  quantities: Record<string, number>
}

/**
 * Оптимизированный React-компонент с функциональной архитектурой
 * Демонстрирует все best practices: мемоизация, типобезопасность, чистые функции
 */
export const TestFurnitureComponent: React.FC<TestFurnitureComponentProps> = React.memo(
  ({ article, name, collection, basePrice, materials, quantities }) => {
    // Мемоизированные вычисления для производительности
    const collectionMultiplier = useMemo(() => getCollectionMultiplier(collection), [collection])

    const materialCost = useMemo(
      () => calculateTotalMaterialCost(materials, quantities),
      [materials, quantities]
    )

    const finalPrice = useMemo(
      () => (basePrice + materialCost) * collectionMultiplier,
      [basePrice, materialCost, collectionMultiplier]
    )

    // Функциональные обработчики событий
    const handlePriceRecalculation = useCallback(() => {
      console.log('Пересчет цены:', {
        article,
        basePrice,
        materialCost,
        collectionMultiplier,
        finalPrice,
      })
    }, [article, basePrice, materialCost, collectionMultiplier, finalPrice])

    const handleExportToPDF = useCallback(() => {
      // Здесь можно протестировать сниппет "pricegen"
      console.log('Экспорт в PDF для:', name)
    }, [name])

    return (
      <div className='p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow'>
        {/* Заголовок с типографикой */}
        <div className='mb-4'>
          <h3 className='text-xl font-semibold text-gray-900'>{name}</h3>
          <p className='text-sm text-gray-500'>Артикул: {article}</p>
        </div>

        {/* Информация о коллекции */}
        <div className='mb-4'>
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
            {collection} (×{collectionMultiplier})
          </span>
        </div>

        {/* Детализация стоимости */}
        <div className='space-y-2 mb-4'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>Базовая цена:</span>
            <span className='font-medium'>{basePrice.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>Материалы:</span>
            <span className='font-medium'>{materialCost.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>Множитель коллекции:</span>
            <span className='font-medium'>×{collectionMultiplier}</span>
          </div>
          <hr className='border-gray-200' />
          <div className='flex justify-between font-semibold text-green-600'>
            <span>Итоговая цена:</span>
            <span>{finalPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        {/* Список материалов */}
        <div className='mb-4'>
          <h4 className='text-sm font-medium text-gray-700 mb-2'>Материалы:</h4>
          <div className='space-y-1'>
            {materials.map(material => {
              const quantity = quantities[material.id] || 0
              const coefficient = material.consumptionCoeff || 1
              const cost = material.price * quantity * coefficient

              return (
                <div key={material.id} className='flex justify-between text-xs text-gray-600'>
                  <span>
                    {material.name} ({quantity} ед.)
                  </span>
                  <span>{cost.toLocaleString('ru-RU')} ₽</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Функциональные кнопки */}
        <div className='flex gap-2'>
          <button
            onClick={handlePriceRecalculation}
            className='flex-1 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors'
          >
            Пересчитать
          </button>
          <button
            onClick={handleExportToPDF}
            className='flex-1 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors'
          >
            PDF
          </button>
        </div>
      </div>
    )
  }
)

TestFurnitureComponent.displayName = 'TestFurnitureComponent'

// ===== ДОПОЛНИТЕЛЬНЫЕ ТЕСТЫ =====

/**
 * Хук для тестирования Supabase интеграции
 * Протестируйте сниппет "usesupabase" здесь
 */
export const useTestData = () => {
  const [data, setData] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Здесь протестируйте сниппет "usesupabase"
  // Наберите usesupabase и нажмите Tab

  return { data, loading, error }
}

/**
 * Утилита генерации тестовых данных
 */
export const createTestFurnitureData = (): {
  materials: Material[]
  quantities: Record<string, number>
} => {
  const materials: Material[] = [
    {
      id: '1',
      name: 'Массив дуба',
      price: 15000,
      consumptionCoeff: 1.2,
    },
    {
      id: '2',
      name: 'Фурнитура Blum',
      price: 2500,
      consumptionCoeff: 1.0,
    },
    {
      id: '3',
      name: 'Лак полиуретановый',
      price: 800,
      consumptionCoeff: 1.15,
    },
  ]

  const quantities: Record<string, number> = {
    '1': 2.5, // м²
    '2': 6, // шт
    '3': 0.8, // л
  }

  return { materials, quantities }
}

// ===== ЭКСПОРТ ДЛЯ ТЕСТИРОВАНИЯ =====

export default TestFurnitureComponent
