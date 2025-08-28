/**
 * @file utils/furniture/pdfGenerator.ts
 * @description PDF генератор для прайс-листов мебельной фабрики WASSER
 * 
 * Основано на userExamples generatePriceList
 * Функциональный подход с jsPDF и детальным форматированием
 */

import type { 
  FurnitureItemProps, 
  PriceListGenerationOptions,
  PriceListItem 
} from '../../types/furniture'
import { 
  calculateFurniturePrice,
  formatPrice,
  groupFurnitureByCollection,
  sortFurniture
} from './pricing'

/**
 * Генерация прайс-листа в PDF (расширение userExamples)
 * Функциональный подход с типобезопасностью
 */
export const generatePriceList = async (
  items: FurnitureItemProps[],
  options: PriceListGenerationOptions = {}
): Promise<void> => {
  // Динамический импорт jsPDF для оптимизации бандла
  const { jsPDF } = await import('jspdf')
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const {
    title = 'Прайс-лист мебельной фабрики WASSER',
    groupByCollection = true,
    showMaterials = true,
    currency = 'RUB'
  } = options

  let yPosition = 20

  // Заголовок документа
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 105, yPosition, { align: 'center' })
  yPosition += 15

  // Информация о компании
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('ООО "WASSER" - Мебельная фабрика', 105, yPosition, { align: 'center' })
  yPosition += 8

  doc.setFontSize(10)
  doc.text(`Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`, 15, yPosition)
  yPosition += 15

  // Подготовка данных с ценами
  const priceListItems: PriceListItem[] = items.map(item => {
    const calculatedPrice = calculateFurniturePrice(item)
    return {
      ...item,
      calculatedPrice,
      formattedPrice: formatPrice(calculatedPrice.finalPrice, currency)
    }
  })

  // Генерация контента
  if (groupByCollection) {
    await generateGroupedContent(doc, priceListItems, yPosition, showMaterials)
  } else {
    const sortedItems = sortFurniture(priceListItems, 'name')
    await generateSimpleContent(doc, sortedItems, yPosition, showMaterials)
  }

  // Подвал документа
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageHeight = doc.internal.pageSize.height
    
    doc.setFontSize(8)
    doc.text(`Страница ${i} из ${pageCount}`, 195, pageHeight - 10, { align: 'right' })
    doc.text(`Всего позиций: ${items.length}`, 15, pageHeight - 10)
    doc.text(`WASSER © ${new Date().getFullYear()}`, 105, pageHeight - 10, { align: 'center' })
  }

  // Сохранение файла (как в userExamples, но улучшенное)
  const fileName = `wasser-pricelist-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

/**
 * Генерация контента сгруппированного по коллекциям
 */
const generateGroupedContent = async (
  doc: any,
  items: PriceListItem[],
  startY: number,
  showMaterials: boolean
): Promise<number> => {
  let yPosition = startY
  const groupedItems = groupFurnitureByCollection(items)

  for (const [collection, collectionItems] of Object.entries(groupedItems)) {
    // Проверяем место на странице
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    // Заголовок коллекции
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Коллекция "${collection.toUpperCase()}"`, 15, yPosition)
    yPosition += 8

    // Линия под заголовком
    doc.setLineWidth(0.5)
    doc.line(15, yPosition, 195, yPosition)
    yPosition += 10

    // Изделия коллекции
    yPosition = await generateItemsList(doc, collectionItems, yPosition, showMaterials)
    yPosition += 10
  }

  return yPosition
}

/**
 * Генерация простого списка без группировки
 */
const generateSimpleContent = async (
  doc: any,
  items: PriceListItem[],
  startY: number,
  showMaterials: boolean
): Promise<number> => {
  return generateItemsList(doc, items, startY, showMaterials)
}

/**
 * Генерация списка изделий
 */
const generateItemsList = async (
  doc: any,
  items: PriceListItem[],
  startY: number,
  showMaterials: boolean
): Promise<number> => {
  let yPosition = startY

  for (const item of items) {
    // Проверяем место на странице
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }

    // Название изделия
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(item.name, 15, yPosition)

    // Цена (справа)
    doc.text(item.formattedPrice, 195, yPosition, { align: 'right' })

    yPosition += 5

    // Артикул и детали
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Артикул: ${item.article}`, 15, yPosition)

    if (showMaterials && item.materials.length > 0) {
      yPosition += 4
      doc.text(`Материалы: ${item.materials.join(', ')}`, 15, yPosition)
    }

    yPosition += 6

    // Разделительная линия
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.1)
    doc.line(15, yPosition, 195, yPosition)
    yPosition += 4
  }

  return yPosition
}

/**
 * Быстрая генерация простого прайс-листа (из userExamples улучшенная)
 */
export const generateSimplePriceList = async (items: FurnitureItemProps[]): Promise<void> => {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  
  // Заголовок (как в userExamples)
  doc.setFontSize(16)
  doc.text('Прайс-лист WASSER', 10, 20)
  
  let yPos = 40
  doc.setFontSize(12)
  
  // Перебор изделий (как в userExamples улучшенный)
  for (const item of items) {
    if (yPos > 280) {
      doc.addPage()
      yPos = 20
    }
    
    const pricing = calculateFurniturePrice(item)
    const formattedPrice = formatPrice(pricing.finalPrice)
    
    // Название и цена (как в userExamples)
    doc.text(`${item.name} - ${formattedPrice}`, 10, yPos)
    yPos += 10
  }
  
  // Сохранение (как в userExamples)
  doc.save('price-list.pdf')
}

/**
 * Экспорт в CSV для Excel
 * Дополнительная функция для работы с таблицами
 */
export const exportToCSV = (items: FurnitureItemProps[]): void => {
  const headers = [
    'Артикул',
    'Название',
    'Коллекция',
    'Материалы',
    'Базовая цена',
    'Финальная цена',
    'Множитель коллекции',
    'Множитель материалов'
  ]

  const rows = items.map(item => {
    const pricing = calculateFurniturePrice(item)
    return [
      item.article,
      item.name,
      item.collection,
      item.materials.join('; '),
      item.price.toString(),
      pricing.finalPrice.toString(),
      pricing.collectionMultiplier.toString(),
      pricing.materialMultiplier.toFixed(2)
    ]
  })

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  // Создание и скачивание файла
  const blob = new Blob(['\uFEFF' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  })
  
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `wasser-catalog-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export default {
  generatePriceList,
  generateSimplePriceList,
  exportToCSV
}
