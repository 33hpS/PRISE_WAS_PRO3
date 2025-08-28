/**
 * @file utils/priceListGenerator.ts
 * @description Функциональная генерация PDF прайс-листов для мебельной фабрики
 */

import jsPDF from 'jspdf'
import type { PriceListItem } from '../types'
import { formatPrice } from './furniture'

// ===========================
// 🎯 КОНФИГУРАЦИЯ ПРАЙС-ЛИСТА
// ===========================

interface PriceListConfig {
  readonly title: string
  readonly subtitle?: string
  readonly includeImages: boolean
  readonly includeMaterials: boolean
  readonly groupByCollection: boolean
  readonly sortBy: 'article' | 'name' | 'price' | 'collection'
  readonly format: 'A4' | 'A3' | 'Letter'
}

// ===========================
// 🧮 ФУНКЦИОНАЛЬНАЯ ГЕНЕРАЦИЯ PDF
// ===========================

/**
 * Главная функция генерации прайс-листа
 * Следует функциональной архитектуре без побочных эффектов до самого конца
 */
export const generatePriceList = async (
  items: readonly PriceListItem[],
  config: PriceListConfig = {
    title: 'Прайс-лист WASSER',
    subtitle: 'Мебельная фабрика',
    includeImages: false,
    includeMaterials: true,
    groupByCollection: true,
    sortBy: 'name',
    format: 'A4'
  }
): Promise<void> => {
  // Подготовка данных (чистые функции)
  const sortedItems = sortItems(items, config.sortBy)
  const groupedItems = config.groupByCollection 
    ? groupItemsByCollection(sortedItems)
    : { 'Все позиции': sortedItems }
  
  const statistics = calculateStatistics(sortedItems)
  
  // Создание PDF документа
  const doc = new jsPDF({
    format: config.format.toLowerCase() as 'a4' | 'a3' | 'letter'
  })

  let yPosition = 20

  // Заголовок документа
  yPosition = renderHeader(doc, yPosition, config, statistics)
  
  // Контент по коллекциям
  for (const [collectionName, collectionItems] of Object.entries(groupedItems)) {
    yPosition = renderCollection(
      doc, 
      yPosition, 
      collectionName, 
      collectionItems, 
      config
    )
    
    // Проверка на новую страницу
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
  }

  // Статистика в конце
  renderFooterStatistics(doc, statistics)
  
  // Сохранение файла
  const filename = `wasser-price-list-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

// ===========================
// 🔧 ЧИСТЫЕ ФУНКЦИИ-ПОМОЩНИКИ
// ===========================

/**
 * Сортировка элементов прайс-листа
 */
const sortItems = (
  items: readonly PriceListItem[],
  sortBy: PriceListConfig['sortBy']
): readonly PriceListItem[] => {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'article':
        return a.article.localeCompare(b.article)
      case 'name':
        return a.name.localeCompare(b.name, 'ru')
      case 'price':
        return b.finalPrice - a.finalPrice
      case 'collection':
        return a.collection.localeCompare(b.collection, 'ru')
      default:
        return 0
    }
  })
}

/**
 * Группировка по коллекциям
 */
const groupItemsByCollection = (
  items: readonly PriceListItem[]
): Record<string, readonly PriceListItem[]> => {
  return items.reduce((groups, item) => {
    const collection = item.collection || 'Без коллекции'
    return {
      ...groups,
      [collection]: [...(groups[collection] || []), item]
    }
  }, {} as Record<string, readonly PriceListItem[]>)
}

/**
 * Расчет статистики прайс-листа
 */
const calculateStatistics = (items: readonly PriceListItem[]) => {
  const totalItems = items.length
  const totalValue = items.reduce((sum, item) => sum + item.finalPrice, 0)
  const avgPrice = totalItems > 0 ? totalValue / totalItems : 0
  const collections = new Set(items.map(item => item.collection)).size
  const avgMargin = totalItems > 0 
    ? items.reduce((sum, item) => sum + item.profitMargin, 0) / totalItems 
    : 0

  return {
    totalItems,
    totalValue,
    avgPrice,
    collections,
    avgMargin,
    generatedAt: new Date()
  } as const
}

/**
 * Рендер заголовка документа
 */
const renderHeader = (
  doc: jsPDF, 
  yPosition: number, 
  config: PriceListConfig,
  statistics: ReturnType<typeof calculateStatistics>
): number => {
  // Логотип и заголовок
  doc.setFontSize(24)
  doc.text(config.title, 20, yPosition)
  yPosition += 12

  if (config.subtitle) {
    doc.setFontSize(16)
    doc.text(config.subtitle, 20, yPosition)
    yPosition += 10
  }

  // Информация о генерации
  doc.setFontSize(10)
  doc.text(`Дата генерации: ${new Date().toLocaleDateString('ru-RU')}`, 20, yPosition)
  yPosition += 5
  doc.text(`Всего позиций: ${statistics.totalItems}`, 20, yPosition)
  yPosition += 5
  doc.text(`Коллекций: ${statistics.collections}`, 20, yPosition)
  yPosition += 5
  doc.text(`Средняя цена: ${formatPrice(statistics.avgPrice)}`, 20, yPosition)
  yPosition += 15

  return yPosition
}

/**
 * Рендер коллекции
 */
const renderCollection = (
  doc: jsPDF,
  yPosition: number,
  collectionName: string,
  items: readonly PriceListItem[],
  config: PriceListConfig
): number => {
  // Заголовок коллекции
  if (config.groupByCollection && collectionName !== 'Все позиции') {
    doc.setFontSize(14)
    doc.text(collectionName, 20, yPosition)
    yPosition += 8
  }

  // Заголовки таблицы
  doc.setFontSize(10)
  doc.text('Артикул', 20, yPosition)
  doc.text('Наименование', 60, yPosition)
  doc.text('Цена', 150, yPosition)
  
  if (config.includeMaterials) {
    doc.text('Материалы', 180, yPosition)
  }
  
  yPosition += 3

  // Линия под заголовками
  doc.line(20, yPosition, 200, yPosition)
  yPosition += 5

  // Элементы коллекции
  for (const item of items) {
    // Проверка на новую страницу
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(9)
    doc.text(item.article, 20, yPosition)
    
    // Обрезка длинных названий
    const maxNameLength = 40
    const displayName = item.name.length > maxNameLength 
      ? item.name.substring(0, maxNameLength) + '...'
      : item.name
    doc.text(displayName, 60, yPosition)
    
    // Форматированная цена
    doc.text(formatPrice(item.finalPrice), 150, yPosition)

    // Материалы (если включены)
    if (config.includeMaterials && item.materials.length > 0) {
      const materialsText = item.materials
        .slice(0, 2)
        .map(m => m.name)
        .join(', ')
      doc.text(materialsText, 180, yPosition, { maxWidth: 15 })
    }

    yPosition += 6
  }

  return yPosition + 8
}

/**
 * Рендер статистики в конце документа
 */
const renderFooterStatistics = (
  doc: jsPDF,
  statistics: ReturnType<typeof calculateStatistics>
): void => {
  doc.addPage()
  let yPosition = 20
  
  doc.setFontSize(16)
  doc.text('Итоговая статистика', 20, yPosition)
  yPosition += 15

  doc.setFontSize(12)
  doc.text(`Общее количество позиций: ${statistics.totalItems}`, 20, yPosition)
  yPosition += 8
  doc.text(`Количество коллекций: ${statistics.collections}`, 20, yPosition)
  yPosition += 8
  doc.text(`Общая стоимость: ${formatPrice(statistics.totalValue)}`, 20, yPosition)
  yPosition += 8
  doc.text(`Средняя цена: ${formatPrice(statistics.avgPrice)}`, 20, yPosition)
  yPosition += 8
  doc.text(`Средняя маржа: ${statistics.avgMargin.toFixed(1)}%`, 20, yPosition)
}
