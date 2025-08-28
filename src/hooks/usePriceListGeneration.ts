/**
 * @file hooks/usePriceListGeneration.ts
 * @description Хук для генерации прайс-листов в PDF с функциональным подходом
 */

import { useState, useCallback, useMemo } from 'react'
import type { PriceListItem, PriceListConfig, PDFGenerationResult } from '../types'

interface UsePriceListGenerationProps {
  readonly items: readonly PriceListItem[]
  readonly config: PriceListConfig
}

/**
 * Хук для функциональной генерации PDF прайс-листов
 */
export const usePriceListGeneration = ({
  items,
  config
}: UsePriceListGenerationProps) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastResult, setLastResult] = useState<PDFGenerationResult | null>(null)

  // ===========================
  // 🎯 МЕМОИЗИРОВАННАЯ ПОДГОТОВКА ДАННЫХ
  // ===========================

  /** Отсортированные элементы */
  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      switch (config.sortBy) {
        case 'article':
          return a.article.localeCompare(b.article)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price':
          return b.finalPrice - a.finalPrice
        case 'collection':
          return a.collection.localeCompare(b.collection)
        default:
          return 0
      }
    })
    
    return sorted
  }, [items, config.sortBy])

  /** Группировка по коллекциям */
  const groupedItems = useMemo(() => {
    if (!config.groupByCollection) {
      return { 'Все позиции': sortedItems }
    }

    return sortedItems.reduce((groups, item) => {
      const collection = item.collection || 'Без коллекции'
      if (!groups[collection]) {
        groups[collection] = []
      }
      groups[collection].push(item)
      return groups
    }, {} as Record<string, PriceListItem[]>)
  }, [sortedItems, config.groupByCollection])

  /** Статистика прайс-листа */
  const statistics = useMemo(() => {
    const totalItems = sortedItems.length
    const totalValue = sortedItems.reduce((sum, item) => sum + item.finalPrice, 0)
    const avgPrice = totalItems > 0 ? totalValue / totalItems : 0
    const collections = new Set(sortedItems.map(item => item.collection)).size

    return {
      totalItems,
      totalValue,
      avgPrice,
      collections,
      generatedAt: new Date().toISOString()
    }
  }, [sortedItems])

  // ===========================
  // 🔧 ГЕНЕРАЦИЯ PDF
  // ===========================

  /** Функциональная генерация PDF документа */
  const generatePDF = useCallback(async (): Promise<PDFGenerationResult> => {
    const startTime = performance.now()
    setIsGenerating(true)

    try {
      // Динамический импорт jsPDF для код-сплиттинга
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({
        format: config.format.toLowerCase() as 'a4' | 'a3' | 'letter'
      })

      let yPosition = 20

      // ===========================
      // 📋 ЗАГОЛОВОК ДОКУМЕНТА
      // ===========================
      doc.setFontSize(20)
      doc.text(config.title, 20, yPosition)
      yPosition += 10

      if (config.subtitle) {
        doc.setFontSize(14)
        doc.text(config.subtitle, 20, yPosition)
        yPosition += 10
      }

      // Информация о генерации
      doc.setFontSize(10)
      doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, yPosition)
      yPosition += 5
      doc.text(`Всего позиций: ${statistics.totalItems}`, 20, yPosition)
      yPosition += 5
      doc.text(`Коллекций: ${statistics.collections}`, 20, yPosition)
      yPosition += 15

      // ===========================
      // 📊 КОНТЕНТ ПРАЙС-ЛИСТА
      // ===========================
      
      for (const [collectionName, collectionItems] of Object.entries(groupedItems)) {
        // Заголовок коллекции
        if (config.groupByCollection) {
          doc.setFontSize(16)
          doc.text(collectionName, 20, yPosition)
          yPosition += 10
        }

        // Заголовки таблицы
        doc.setFontSize(10)
        doc.text('Артикул', 20, yPosition)
        doc.text('Наименование', 60, yPosition)
        doc.text('Цена', 150, yPosition)
        
        if (config.includeMaterials) {
          doc.text('Материалы', 180, yPosition)
        }
        
        yPosition += 5

        // Линия под заголовками
        doc.line(20, yPosition, 200, yPosition)
        yPosition += 5

        // Элементы коллекции
        for (const item of collectionItems) {
          // Проверка на новую страницу
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }

          doc.setFontSize(9)
          doc.text(item.article, 20, yPosition)
          
          // Обрезка длинных названий
          const maxNameLength = 35
          const displayName = item.name.length > maxNameLength 
            ? item.name.substring(0, maxNameLength) + '...'
            : item.name
          doc.text(displayName, 60, yPosition)
          
          // Форматированная цена
          const formattedPrice = `${item.finalPrice.toLocaleString('ru-RU')} ₽`
          doc.text(formattedPrice, 150, yPosition)

          // Материалы (опционально)
          if (config.includeMaterials && item.materials.length > 0) {
            const materialsText = item.materials
              .slice(0, 2) // Только первые 2 материала
              .map(m => m.name)
              .join(', ')
            doc.text(materialsText, 180, yPosition, { maxWidth: 15 })
          }

          yPosition += 7
        }

        yPosition += 10 // Отступ между коллекциями
      }

      // ===========================
      // 📈 ИТОГОВАЯ СТАТИСТИКА
      // ===========================
      
      doc.addPage()
      yPosition = 20
      
      doc.setFontSize(16)
      doc.text('Статистика прайс-листа', 20, yPosition)
      yPosition += 15

      doc.setFontSize(12)
      doc.text(`Общее количество позиций: ${statistics.totalItems}`, 20, yPosition)
      yPosition += 8
      doc.text(`Количество коллекций: ${statistics.collections}`, 20, yPosition)
      yPosition += 8
      doc.text(`Общая стоимость: ${statistics.totalValue.toLocaleString('ru-RU')} ₽`, 20, yPosition)
      yPosition += 8
      doc.text(`Средняя цена: ${statistics.avgPrice.toLocaleString('ru-RU')} ₽`, 20, yPosition)

      // ===========================
      // 💾 СОХРАНЕНИЕ И РЕЗУЛЬТАТ
      // ===========================

      const filename = `wasser-price-list-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)

      const endTime = performance.now()
      const generationTime = endTime - startTime

      // Примерный расчет размера файла (в KB)
      const estimatedSize = Math.round((statistics.totalItems * 0.5 + 50))

      const result: PDFGenerationResult = {
        success: true,
        filename,
        itemsCount: statistics.totalItems,
        fileSize: estimatedSize,
        generationTime,
      }

      setLastResult(result)
      return result

    } catch (error) {
      const errorResult: PDFGenerationResult = {
        success: false,
        filename: '',
        itemsCount: 0,
        fileSize: 0,
        generationTime: 0,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      }

      setLastResult(errorResult)
      return errorResult

    } finally {
      setIsGenerating(false)
    }
  }, [config, groupedItems, statistics])

  /** Предварительный просмотр данных */
  const previewData = useMemo(() => {
    return {
      config,
      statistics,
      firstItems: sortedItems.slice(0, 5), // Первые 5 элементов для превью
      collections: Object.keys(groupedItems)
    }
  }, [config, statistics, sortedItems, groupedItems])

  return {
    // Состояние
    isGenerating,
    lastResult,
    
    // Данные
    sortedItems,
    groupedItems,
    statistics,
    previewData,
    
    // Действия
    generatePDF
  }
}
