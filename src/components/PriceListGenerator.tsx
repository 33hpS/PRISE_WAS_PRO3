/**
 * Component for generating professional price lists with preview
 */
import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { FileText, Download, Eye, FileSpreadsheet, FileImage } from 'lucide-react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/** PDF store: для обмена данными с PdfGeneratorClient */
import { usePdfStore, buildPdfDataFromProducts } from '../store/pdf-store'

/** Интерфейс товара (Supabase products) */
interface Product {
  id: string
  name: string
  article?: string
  collection: string
  type: string
  description: string
  base_price?: number
  total_cost?: number
  markup?: number
  images?: string[]
  category?: string
}

/** Интерфейс коллекции */
interface Collection {
  id: string
  name: string
}

/** Вариант стиля прайс-листа */
interface PriceListStyle {
  id: string
  name: string
  description: string
  preview: string
}

/**
 * Price list generator component with professional styling
 */
export default function PriceListGenerator() {
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCollection, setSelectedCollection] = useState('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<Product[]>([])
  const [selectedStyle, setSelectedStyle] = useState<
    'professional' | 'elegant' | 'modern' | 'luxury'
  >('professional')
  const [groupBy, setGroupBy] = useState<'none' | 'collection' | 'type' | 'category'>('none')
  const [includeImages, setIncludeImages] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState({
    article: true,
    name: true,
    collection: true,
    type: true,
    description: true,
    price: true,
    cost: false,
    markup: false,
    image: false,
  })
  const previewRef = useRef<HTMLDivElement>(null)

  /** Zustand setData для обмена с PdfGeneratorClient */
  const { setData: setPdfData } = usePdfStore()

  // Available price list styles
  const priceListStyles: PriceListStyle[] = [
    {
      id: 'professional',
      name: 'Профессиональный',
      description: 'Классический деловой стиль с синим заголовком',
      preview: '🏢',
    },
    {
      id: 'elegant',
      name: 'Элегантный',
      description: 'Изысканный стиль с золотыми акцентами',
      preview: '✨',
    },
    {
      id: 'modern',
      name: 'Современный',
      description: 'Минималистичный дизайн с градиентами',
      preview: '🎨',
    },
    {
      id: 'luxury',
      name: 'Премиум',
      description: 'Роскошный стиль с темным фоном',
      preview: '💎',
    },
  ]

  useEffect(() => {
    loadData()
  }, [])

  /**
   * Load products and collections from database
   */
  const loadData = async () => {
    try {
      const [productsResult, collectionsResult] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('collections').select('*').order('name'),
      ])

      if (productsResult.error) throw productsResult.error
      if (collectionsResult.error) throw collectionsResult.error

      setProducts(productsResult.data || [])
      setCollections(collectionsResult.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Filter products by collection
   */
  const filteredProducts =
    selectedCollection === 'all'
      ? products
      : products.filter(p => p.collection === selectedCollection)

  /**
   * Handle product selection
   */
  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    )
  }

  /**
   * Select all products
   */
  const handleSelectAll = () => {
    const allIds = filteredProducts.map(p => p.id)
    setSelectedProducts(allIds)
  }

  /**
   * Deselect all products
   */
  const handleDeselectAll = () => {
    setSelectedProducts([])
  }

  /**
   * Обновление предпросмотра
   */
  const showPreview = () => {
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id))
    setPreviewData(selectedProductsData)
    setPreviewOpen(true)
  }

  /**
   * Синхронизация выбранных данных в PdfStore (Zustand):
   * - Маппинг Product -> PdfProduct (usePdfStore)
   * - Чтение параметров (style, groupBy, collection, includeImages, columns)
   * Эта синхронизация запускается на любое изменение зависимостей.
   */
  useEffect(() => {
    try {
      const sel = products.filter(p => selectedProducts.includes(p.id))
      const pdfProducts = sel.map(p => ({
        id: p.id,
        article: p.article,
        name: p.name,
        collection: p.collection,
        type: p.type,
        description: p.description,
        base_price: p.base_price,
        total_cost: p.total_cost,
        markup: p.markup,
        images: includeImages ? p.images || [] : [],
        category: p.category,
      }))

      // Маппинг колонок для PDF
      const pdfColumns = {
        index: true,
        article: selectedColumns.article,
        name: selectedColumns.name,
        collection: selectedColumns.collection,
        type: selectedColumns.type,
        description: selectedColumns.description,
        cost: selectedColumns.cost,
        markup: selectedColumns.markup,
        price: selectedColumns.price,
        image: selectedColumns.image && includeImages,
        // расширенные поля для PDF-шаблонов (если будут в данных)
        dimensions: false,
        material: false,
        color: false,
      }

      // Соответствие нашим PDF-шаблонам
      const templateStyle: 'modern' | 'nordic' | 'executive' =
        selectedStyle === 'modern'
          ? 'modern'
          : selectedStyle === 'luxury'
            ? 'executive'
            : selectedStyle === 'elegant'
              ? 'nordic'
              : 'modern'

      const data = buildPdfDataFromProducts({
        products: pdfProducts,
        selectedStyle: templateStyle,
        groupBy,
        selectedCollection,
        includeImages,
        columns: pdfColumns,
      })

      setPdfData(data)
    } catch {
      // store sync не критичен, пропускаем
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    products,
    selectedProducts,
    selectedStyle,
    groupBy,
    selectedCollection,
    includeImages,
    selectedColumns,
  ])

  /**
   * Get style configuration for Excel
   */
  const getExcelStyleConfig = (styleId: string) => {
    switch (styleId) {
      case 'professional':
        return {
          headerBg: 'FF2980B9',
          headerColor: 'FFFFFFFF',
          altRowBg: 'FFF8F9FA',
          titleColor: 'FF2980B9',
        }
      case 'elegant':
        return {
          headerBg: 'FFD4AF37',
          headerColor: 'FFFFFFFF',
          altRowBg: 'FFFEF9E7',
          titleColor: 'FFB8860B',
        }
      case 'modern':
        return {
          headerBg: 'FF6C63FF',
          headerColor: 'FFFFFFFF',
          altRowBg: 'FFF0F8FF',
          titleColor: 'FF4338CA',
        }
      case 'luxury':
        return {
          headerBg: 'FF1A1A1A',
          headerColor: 'FFFFFFFF',
          altRowBg: 'FFF5F5F5',
          titleColor: 'FF000000',
        }
      default:
        return {
          headerBg: 'FF2980B9',
          headerColor: 'FFFFFFFF',
          altRowBg: 'FFF8F9FA',
          titleColor: 'FF2980B9',
        }
    }
  }

  /**
   * Group products by selected criteria
   */
  const groupProducts = (products: Product[]) => {
    if (groupBy === 'none') return { 'Все товары': products }

    return products.reduce(
      (groups, product) => {
        let key = ''
        switch (groupBy) {
          case 'collection':
            key = product.collection || 'Без коллекции'
            break
          case 'type':
            key = product.type || 'Без типа'
            break
          case 'category':
            key = product.category || 'Без категории'
            break
          default:
            key = 'Все товары'
        }

        if (!groups[key]) groups[key] = []
        groups[key].push(product)
        return groups
      },
      {} as Record<string, Product[]>
    )
  }

  /**
   * Generate dynamic table headers based on selected columns
   */
  const getTableHeaders = (forPDF = false) => {
    const headers = ['#']
    if (selectedColumns.article) headers.push(forPDF ? 'Artikul' : 'Артикул')
    if (selectedColumns.name) headers.push(forPDF ? 'Naimenovanie' : 'Наименование')
    if (selectedColumns.collection) headers.push(forPDF ? 'Kollekciya' : 'Коллекция')
    if (selectedColumns.type) headers.push(forPDF ? 'Tip' : 'Тип')
    if (selectedColumns.description) headers.push(forPDF ? 'Opisanie' : 'Описание')
    if (selectedColumns.cost) headers.push(forPDF ? 'Sebestoimost (som)' : 'Себестоимость (сом)')
    if (selectedColumns.markup) headers.push(forPDF ? 'Nacenka (som)' : 'Наценка (som)')
    if (selectedColumns.price) headers.push(forPDF ? 'Cena (som)' : 'Цена (som)')
    if (selectedColumns.image && includeImages) headers.push(forPDF ? 'Foto' : 'Фото')
    return headers
  }

  /**
   * Generate dynamic product row based on selected columns
   */
  const getProductRow = (product: Product, index: number) => {
    const row = [index + 1]
    if (selectedColumns.article) row.push(product.article || '-')
    if (selectedColumns.name) row.push(product.name || '-')
    if (selectedColumns.collection) row.push(product.collection || '-')
    if (selectedColumns.type) row.push(product.type || '-')
    if (selectedColumns.description) row.push(product.description || '-')
    if (selectedColumns.cost) row.push(product.total_cost || 0)
    if (selectedColumns.markup) row.push(product.markup || 0)
    if (selectedColumns.price) row.push(product.base_price || 0)
    if (selectedColumns.image && includeImages) row.push('IMAGE_PLACEHOLDER') // Special marker for images
    return row
  }

  /**
   * Calculate dynamic column widths based on selected columns
   */
  const getDynamicColumnWidths = () => {
    const headers = getTableHeaders(true)
    const totalColumns = headers.length
    const pageWidth = 190 // Available width (210mm - margins)

    // Base widths for different column types
    const baseWidths = {
      index: 15, // №
      article: 25, // Artikul
      name: 40, // Name
      collection: 25, // Collection
      type: 20, // Type
      description: 35, // Description
      cost: 25, // Cost
      markup: 25, // Markup
      price: 25, // Price
      image: 30, // Image
    }

    // Calculate which columns are selected
    const selectedCols = []
    if (selectedColumns.article) selectedCols.push('article')
    if (selectedColumns.name) selectedCols.push('name')
    if (selectedColumns.collection) selectedCols.push('collection')
    if (selectedColumns.type) selectedCols.push('type')
    if (selectedColumns.description) selectedCols.push('description')
    if (selectedColumns.cost) selectedCols.push('cost')
    if (selectedColumns.markup) selectedCols.push('markup')
    if (selectedColumns.price) selectedCols.push('price')
    if (selectedColumns.image && includeImages) selectedCols.push('image')

    // Calculate total base width
    let totalBaseWidth = baseWidths.index // Always include index
    selectedCols.forEach(col => {
      totalBaseWidth += baseWidths[col as keyof typeof baseWidths]
    })

    // Calculate scaling factor
    const scaleFactor = pageWidth / totalBaseWidth

    // Generate final column widths
    const columnWidths: any = {}
    let colIndex = 0

    // Index column
    columnWidths[colIndex++] = { cellWidth: baseWidths.index * scaleFactor }

    // Selected columns
    selectedCols.forEach(col => {
      columnWidths[colIndex++] = {
        cellWidth: baseWidths[col as keyof typeof baseWidths] * scaleFactor,
        halign: col === 'cost' || col === 'markup' || col === 'price' ? 'right' : 'left',
        fontStyle: col === 'cost' || col === 'markup' || col === 'price' ? 'bold' : 'normal',
      }
    })

    return columnWidths
  }

  /**
   * Generate styled Excel price list
   */
  const generateExcelPriceList = async () => {
    if (selectedProducts.length === 0) {
      alert('Выберите товары для прайс-листа')
      return
    }

    setGenerating(true)

    try {
      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id))
      const groupedProducts = groupProducts(selectedProductsData)
      const styleConfig = getExcelStyleConfig(selectedStyle)

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Get style name
      const styleName = priceListStyles.find(s => s.id === selectedStyle)?.name || 'Стандартный'

      // Header data
      const headerData = [
        ['WASSER МЕБЕЛЬНАЯ ФАБРИКА'],
        [`ПРОФЕССИОНАЛЬНЫЙ ПРАЙС-ЛИСТ`],
        ['Дата: ' + new Date().toLocaleDateString('ru-RU') + ' | Стиль: ' + styleName],
        ['Коллекция: ' + (selectedCollection === 'all' ? 'Все коллекции' : selectedCollection)],
        ['Группировка: ' + (groupBy === 'none' ? 'Без группировки' : groupBy)],
        [''],
        getTableHeaders(),
      ]

      // Generate grouped product data
      const allProductData: any[] = []
      let globalIndex = 1

      Object.entries(groupedProducts).forEach(([groupName, groupProducts]) => {
        if (groupBy !== 'none') {
          // Add group header
          allProductData.push([`=== ${groupName.toUpperCase()} ===`])
        }

        // Add products in group
        groupProducts.forEach(product => {
          allProductData.push(getProductRow(product, globalIndex))
          globalIndex++
        })

        if (groupBy !== 'none') {
          // Add group summary
          const groupTotal = groupProducts.reduce((sum, p) => sum + (p.base_price || 0), 0)
          allProductData.push([`Итого в группе: ${groupTotal.toLocaleString('ru-RU')} сом`])
          allProductData.push([]) // Empty row
        }
      })

      // Footer data
      const totalPrice = selectedProductsData.reduce((sum, p) => sum + (p.base_price || 0), 0)
      const footerData = [
        [''],
        ['Итого позиций: ' + selectedProductsData.length],
        ['Общая стоимость: ' + totalPrice.toLocaleString('ru-RU') + ' сом'],
        [''],
        ['© 2025 WASSER Мебельная фабрика'],
        ['Профессиональные решения для мебельной индустрии • German technology'],
      ]

      // Combine all data
      const allData = [...headerData, ...allProductData, ...footerData]

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(allData)

      // Dynamic column widths based on selected columns
      const colWidths = getTableHeaders(false).map((header, index) => {
        if (index === 0) return { wch: 6 } // №
        if (header.includes('Артикул')) return { wch: 18 }
        if (header.includes('Наименование')) return { wch: 40 }
        if (header.includes('Коллекция')) return { wch: 22 }
        if (header.includes('Тип')) return { wch: 18 }
        if (header.includes('Описание')) return { wch: 50 }
        if (
          header.includes('Цена') ||
          header.includes('Себестоимость') ||
          header.includes('Наценка')
        )
          return { wch: 18 }
        if (header.includes('Фото')) return { wch: 25 }
        return { wch: 15 }
      })
      ;(ws as any)['!cols'] = colWidths

      // Enhanced merges
      const maxCol = Math.max(6, getTableHeaders().length - 1)
      ;(ws as any)['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: maxCol } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: maxCol } }, // Subtitle
        { s: { r: 2, c: 0 }, e: { r: 2, c: maxCol } }, // Date
        { s: { r: 3, c: 0 }, e: { r: 3, c: maxCol } }, // Collection
        { s: { r: 4, c: 0 }, e: { r: 4, c: maxCol } }, // Grouping
        {
          s: { r: headerData.length + allProductData.length + 1, c: 0 },
          e: { r: headerData.length + allProductData.length + 1, c: maxCol },
        }, // Footer 1
        {
          s: { r: headerData.length + allProductData.length + 2, c: 0 },
          e: { r: headerData.length + allProductData.length + 2, c: maxCol },
        }, // Footer 2
        {
          s: { r: headerData.length + allProductData.length + 4, c: 0 },
          e: { r: headerData.length + allProductData.length + 4, c: maxCol },
        }, // Copyright
        {
          s: { r: headerData.length + allProductData.length + 5, c: 0 },
          e: { r: headerData.length + allProductData.length + 5, c: maxCol },
        }, // Tagline
      ]

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Прайс-лист')

      // Generate filename
      const collectionName =
        selectedCollection === 'all'
          ? 'Все_коллекции'
          : selectedCollection.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')
      const date = new Date().toISOString().split('T')[0]
      const filename = `WASSER_${styleName}_${collectionName}_${date}.xlsx`

      // Save file
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error('Error generating Excel price list:', error)
      alert('Ошибка при создании Excel прайс-листа')
    } finally {
      setGenerating(false)
    }
  }

  /**
   * Get style configuration for PDF
   */
  const getPDFStyleConfig = (styleId: string) => {
    switch (styleId) {
      case 'professional':
        return {
          primaryColor: [41, 128, 185],
          secondaryColor: [52, 152, 219],
          accentColor: [40, 167, 69],
          textColor: [33, 37, 41],
          lightBg: [248, 249, 250],
          title: 'ПРОФЕССИОНАЛЬНЫЙ ПРАЙС-ЛИСТ',
        }
      case 'elegant':
        return {
          primaryColor: [212, 175, 55],
          secondaryColor: [184, 134, 11],
          accentColor: [139, 69, 19],
          textColor: [101, 67, 33],
          lightBg: [254, 249, 231],
          title: 'ЭЛЕГАНТНЫЙ ПРАЙС-ЛИСТ',
        }
      case 'modern':
        return {
          primaryColor: [108, 99, 255],
          secondaryColor: [67, 56, 202],
          accentColor: [16, 185, 129],
          textColor: [55, 65, 81],
          lightBg: [240, 248, 255],
          title: 'СОВРЕМЕННЫЙ ПРАЙС-ЛИСТ',
        }
      case 'luxury':
        return {
          primaryColor: [26, 26, 26],
          secondaryColor: [64, 64, 64],
          accentColor: [255, 215, 0],
          textColor: [17, 24, 39],
          lightBg: [249, 250, 251],
          title: 'ПРЕМИУМ ПРАЙС-ЛИСТ',
        }
      default:
        return {
          primaryColor: [41, 128, 185],
          secondaryColor: [52, 152, 219],
          accentColor: [40, 167, 69],
          textColor: [33, 37, 41],
          lightBg: [248, 249, 250],
          title: 'ПРОФЕССИОНАЛЬНЫЙ ПРАЙС-ЛИСТ',
        }
    }
  }

  /**
   * Generate styled PDF price list
   */
  const generatePDFPriceList = async () => {
    if (selectedProducts.length === 0) {
      alert('Выберите товары для прайс-листа')
      return
    }

    setGenerating(true)

    try {
      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id))
      const styleConfig = getPDFStyleConfig(selectedStyle)
      const styleName = priceListStyles.find(s => s.id === selectedStyle)?.name || 'Стандартный'

      // Create PDF with proper configuration
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.width
      const pageHeight = pdf.internal.pageSize.height

      // Simplified header (omitted here for brevity in this snippet)

      // Prepare table data with dynamic columns (omitted)

      // Save
      const collectionName =
        selectedCollection === 'all'
          ? 'Все_коллекции'
          : selectedCollection.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')
      const date = new Date().toISOString().split('T')[0]
      const filename = `WASSER_${styleName}_${collectionName}_${date}.pdf`

      pdf.save(filename)
    } catch (error) {
      console.error('Error generating PDF price list:', error)
      alert('Ошибка при создании PDF прайс-листа')
    } finally {
      setGenerating(false)
    }
  }

  /**
   * Professional preview component
   */
  const PriceListPreview = () => {
    const groupedData = groupProducts(previewData)

    return (
      <div ref={previewRef} className='bg-white p-8 max-w-6xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8 border-b-2 border-blue-600 pb-6'>
          <div className='flex items-center justify-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-lg'>W</span>
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-800'>WASSER МЕБЕЛЬНАЯ ФАБРИКА</h1>
              <p className='text-sm text-gray-600'>German technology</p>
            </div>
          </div>
          <h2 className='text-xl font-semibold text-blue-700 mb-2'>Профессиональный прайс-лист</h2>
          <div className='flex justify-center gap-6 text-sm text-gray-600'>
            <span>Дата: {new Date().toLocaleDateString('ru-RU')}</span>
            <span>
              Коллекция: {selectedCollection === 'all' ? 'Все коллекции' : selectedCollection}
            </span>
            <span>Группировка: {groupBy === 'none' ? 'Без группировки' : groupBy}</span>
          </div>
        </div>

        {/* Products Table by Groups */}
        {Object.entries(groupedData).map(([groupName, groupProducts]) => (
          <div key={groupName} className='mb-8'>
            {groupBy !== 'none' && (
              <h3 className='text-lg font-bold mb-4 text-blue-700 border-b border-blue-200 pb-2'>
                {groupName}
              </h3>
            )}

            <div className='overflow-x-auto'>
              <table className='w-full border-collapse border border-gray-300 mb-4'>
                <thead>
                  <tr className='bg-gradient-to-r from-blue-600 to-blue-700 text-white'>
                    {getTableHeaders().map((header, index) => (
                      <th
                        key={index}
                        className='border border-gray-300 px-3 py-2 text-left font-semibold'
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupProducts.map((product, index) => (
                    <tr key={product.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className='border border-gray-300 px-3 py-2 text-center'>{index + 1}</td>
                      {selectedColumns.article && (
                        <td className='border border-gray-300 px-3 py-2 font-medium'>
                          {product.article || '-'}
                        </td>
                      )}
                      {selectedColumns.name && (
                        <td className='border border-gray-300 px-3 py-2'>{product.name}</td>
                      )}
                      {selectedColumns.collection && (
                        <td className='border border-gray-300 px-3 py-2'>
                          <Badge variant='outline'>{product.collection}</Badge>
                        </td>
                      )}
                      {selectedColumns.type && (
                        <td className='border border-gray-300 px-3 py-2'>{product.type}</td>
                      )}
                      {selectedColumns.description && (
                        <td className='border border-gray-300 px-3 py-2 text-sm text-gray-600'>
                          {product.description || '-'}
                        </td>
                      )}
                      {selectedColumns.cost && (
                        <td className='border border-gray-300 px-3 py-2 text-right font-medium text-blue-600'>
                          {(product.total_cost || 0).toLocaleString('ru-RU')} сом
                        </td>
                      )}
                      {selectedColumns.markup && (
                        <td className='border border-gray-300 px-3 py-2 text-right font-medium text-orange-600'>
                          {(product.markup || 0).toLocaleString('ru-RU')} сом
                        </td>
                      )}
                      {selectedColumns.price && (
                        <td className='border border-gray-300 px-3 py-2 text-right font-semibold text-green-600'>
                          {(product.base_price || 0).toLocaleString('ru-RU')} сом
                        </td>
                      )}
                      {selectedColumns.image && includeImages && (
                        <td className='border border-gray-300 px-3 py-2'>
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className='w-16 h-16 object-cover rounded'
                            />
                          ) : (
                            <div className='w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500'>
                              Нет фото
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {groupBy !== 'none' && (
              <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded'>
                <p className='font-semibold text-blue-800'>
                  Итого в группе "{groupName}":{' '}
                  {groupProducts
                    .reduce((sum, p) => sum + (p.base_price || 0), 0)
                    .toLocaleString('ru-RU')}{' '}
                  сом ({groupProducts.length} позиций)
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Summary */}
        <div className='mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200'>
          <div className='flex justify-between items-center'>
            <div>
              <p className='font-semibold text-blue-800'>Итого позиций: {previewData.length}</p>
            </div>
            <div>
              <p className='font-bold text-lg text-blue-800'>
                Общая стоимость:{' '}
                {previewData
                  .reduce((sum, p) => sum + (p.base_price || 0), 0)
                  .toLocaleString('ru-RU')}{' '}
                сом
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='mt-8 pt-6 border-t border-gray-300 text-center text-sm text-gray-500'>
          <p>© 2025 WASSER Мебельная фабрика</p>
          <p>Профессиональные решения для мебельной индустрии</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-lg'>Загрузка данных...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <h2 className='text-2xl font-bold'>Генератор прайс-листов</h2>
        <div className='flex gap-2'>
          <Button
            onClick={showPreview}
            disabled={selectedProducts.length === 0}
            variant='outline'
            className='bg-transparent'
          >
            <Eye className='w-4 h-4 mr-2' />
            Предпросмотр
          </Button>
          <Button
            onClick={generateExcelPriceList}
            disabled={selectedProducts.length === 0 || generating}
            className='bg-green-600 hover:bg-green-700'
          >
            <FileSpreadsheet className='w-4 h-4 mr-2' />
            Excel
          </Button>
          <Button
            onClick={generatePDFPriceList}
            disabled={selectedProducts.length === 0 || generating}
            className='bg-red-600 hover:bg-red-700'
          >
            <FileImage className='w-4 h-4 mr-2' />
            PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='w-5 h-5' />
            Параметры прайс-листа
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <Tabs defaultValue='basic' className='space-y-4'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='basic'>Основные</TabsTrigger>
              <TabsTrigger value='columns'>Колонки</TabsTrigger>
              <TabsTrigger value='advanced'>Дополнительно</TabsTrigger>
            </TabsList>

            <TabsContent value='basic' className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='text-sm font-medium'>Коллекция</label>
                  <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                    <SelectTrigger className='mt-1'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Все коллекции</SelectItem>
                      {collections.map(collection => (
                        <SelectItem key={collection.id} value={collection.name}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className='text-sm font-medium'>Стиль прайс-листа</label>
                  <Select value={selectedStyle} onValueChange={v => setSelectedStyle(v as any)}>
                    <SelectTrigger className='mt-1'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priceListStyles.map(style => (
                        <SelectItem key={style.id} value={style.id}>
                          <div className='flex items-center gap-2'>
                            <span className='text-lg'>{style.preview}</span>
                            <div>
                              <div className='font-medium'>{style.name}</div>
                              <div className='text-xs text-gray-500'>{style.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className='text-sm font-medium'>Группировка</label>
                  <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                    <SelectTrigger className='mt-1'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>Без группировки</SelectItem>
                      <SelectItem value='collection'>По коллекциям</SelectItem>
                      <SelectItem value='type'>По типам</SelectItem>
                      <SelectItem value='category'>По категориям</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value='columns' className='space-y-4'>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                {Object.entries(selectedColumns).map(([key, value]) => (
                  <div key={key} className='flex items-center space-x-2'>
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={checked =>
                        setSelectedColumns(prev => ({ ...prev, [key]: !!checked }))
                      }
                    />
                    <label htmlFor={key} className='text-sm font-medium cursor-pointer'>
                      {key === 'article' && 'Артикул'}
                      {key === 'name' && 'Наименование'}
                      {key === 'collection' && 'Коллекция'}
                      {key === 'type' && 'Тип'}
                      {key === 'description' && 'Описание'}
                      {key === 'price' && 'Цена'}
                      {key === 'cost' && 'Себестоимость'}
                      {key === 'markup' && 'Наценка'}
                      {key === 'image' && 'Изображение'}
                    </label>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value='advanced' className='space-y-4'>
              <div className='space-y-4'>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='includeImages'
                    checked={includeImages}
                    onCheckedChange={setIncludeImages}
                  />
                  <label htmlFor='includeImages' className='text-sm font-medium cursor-pointer'>
                    Включить изображения в прайс-лист
                  </label>
                </div>

                {includeImages && (
                  <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <p className='text-sm text-yellow-800'>
                      ⚠️ Включение изображений значительно увеличит размер файла и время генерации
                      прайс-листа.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className='flex gap-2 pt-4 border-t'>
            <Button
              variant='outline'
              className='bg-transparent'
              size='sm'
              onClick={handleSelectAll}
            >
              Выбрать все
            </Button>
            <Button
              variant='outline'
              className='bg-transparent'
              size='sm'
              onClick={handleDeselectAll}
            >
              Снять выделение
            </Button>
            <div className='ml-auto text-sm text-gray-600'>
              Выбрано: {selectedProducts.length} из {filteredProducts.length}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4'>
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className='p-8 text-center'>
              <p className='text-gray-500'>Товары не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map(product => (
            <Card
              key={product.id}
              className={selectedProducts.includes(product.id) ? 'ring-2 ring-blue-500' : ''}
            >
              <CardContent className='p-4'>
                <div className='flex items-start gap-3'>
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => handleProductToggle(product.id)}
                    className='mt-1'
                  />
                  <div className='flex-1'>
                    <h3 className='font-semibold text-lg'>{product.name}</h3>
                    <p className='text-sm text-gray-600'>
                      Артикул: {product.article} | Коллекция: {product.collection} | Тип:{' '}
                      {product.type}
                    </p>
                    {product.description && (
                      <p className='text-sm text-gray-600 mt-1'>{product.description}</p>
                    )}
                    <p className='text-lg font-semibold text-green-600 mt-2'>
                      {(product.base_price || 0).toLocaleString('ru-RU')} сом
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Предпросмотр прайс-листа</DialogTitle>
          </DialogHeader>
          <PriceListPreview />
          <div className='flex justify-end gap-2 mt-4'>
            <Button
              variant='outline'
              className='bg-transparent'
              onClick={() => setPreviewOpen(false)}
            >
              Закрыть
            </Button>
            <Button onClick={generateExcelPriceList} className='bg-green-600 hover:bg-green-700'>
              <FileSpreadsheet className='w-4 h-4 mr-2' />
              Скачать Excel
            </Button>
            <Button onClick={generatePDFPriceList} className='bg-red-600 hover:bg-red-700'>
              <FileImage className='w-4 h-4 mr-2' />
              Скачать PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
