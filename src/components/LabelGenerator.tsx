/**
 * Component for generating and printing product labels with logo
 */
import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Printer, Download, QrCode, Tags, Settings, Eye, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import html2canvas from 'html2canvas'
import { LOGO_URL } from '../config/branding'

interface Product {
  id: string
  name: string
  category: string
  type: string
  collection: string
  total_cost: number
  markup: number
  base_price?: number
  article?: string
}

interface LabelData {
  productName: string
  collection: string
  type: string
  article: string
  price: number
  qrCode?: string
  logo: boolean
  showPrice: boolean
  showArticle: boolean
  showCollection: boolean
  showType: boolean
  fontSize: number
  copies: number
  style: string
}

interface LabelStyle {
  id: string
  name: string
  description: string
  preview: string
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
    background: string
  }
}

/**
 * Label generator component for product labels
 */
export default function LabelGenerator() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  // Available label styles
  const labelStyles: LabelStyle[] = [
    {
      id: 'professional',
      name: 'Профессиональный',
      description: 'Классический деловой стиль',
      preview: '🏢',
      colors: {
        primary: '#2563eb',
        secondary: '#1e40af',
        accent: '#16a34a',
        text: '#1f2937',
        background: '#ffffff'
      }
    },
    {
      id: 'elegant',
      name: 'Элегантный',
      description: 'Изысканный золотой стиль',
      preview: '✨',
      colors: {
        primary: '#d97706',
        secondary: '#92400e',
        accent: '#059669',
        text: '#92400e',
        background: '#fef3c7'
      }
    },
    {
      id: 'modern',
      name: 'Современный',
      description: 'Минималистичный дизайн',
      preview: '🎨',
      colors: {
        primary: '#6366f1',
        secondary: '#4338ca',
        accent: '#10b981',
        text: '#374151',
        background: '#f8fafc'
      }
    },
    {
      id: 'luxury',
      name: 'Премиум',
      description: 'Роскошный темный стиль',
      preview: '💎',
      colors: {
        primary: '#1f2937',
        secondary: '#374151',
        accent: '#fbbf24',
        text: '#f9fafb',
        background: '#111827'
      }
    }
  ]

  const [labelSettings, setLabelSettings] = useState<LabelData>({
    productName: '',
    collection: '',
    type: '',
    article: '',
    price: 0,
    logo: true,
    showPrice: true,
    showArticle: true,
    showCollection: true,
    showType: true,
    fontSize: 12,
    copies: 1,
    style: 'professional'
  })
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  /**
   * Load products from database
   */
  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle product selection
   */
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  /**
   * Select all products
   */
  const selectAllProducts = () => {
    setSelectedProducts(products.map(p => p.id))
  }

  /**
   * Clear selection
   */
  const clearSelection = () => {
    setSelectedProducts([])
  }

  /**
   * Generate labels for selected products
   */
  const generateLabels = async () => {
    if (selectedProducts.length === 0) {
      alert('Выберите товары для генерации этикеток')
      return
    }

    setPreviewMode(true)
    setIsDialogOpen(true)
  }

  /**
   * Print labels (исправлено для избежания blob ошибок)
   */
  const printLabels = async () => {
    if (!labelRef.current) return

    try {
      console.log('🖨️ Подготовка к печати этикеток...')
      
      const canvas = await html2canvas(labelRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        width: 220, // 58mm * 3.78 (DPI conversion)
        height: 378  // 100mm * 3.78 (DPI conversion)
      })

      const imgData = canvas.toDataURL('image/png')
      console.log('📸 Снимок этикетки создан')
      
      // Create print window with better error handling
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Печать этикеток</title>
              <style>
                @media print {
                  @page {
                    size: 58mm 100mm;
                    margin: 0;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                  }
                  .label {
                    width: 58mm;
                    height: 100mm;
                    object-fit: contain;
                    page-break-after: always;
                  }
                  .label:last-child {
                    page-break-after: auto;
                  }
                }
                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  font-family: Arial, sans-serif;
                }
              </style>
            </head>
            <body>
              ${selectedProducts.map(() => `<img class="label" src="${imgData}" alt="Этикетка" />`).join('')}
            </body>
          </html>
        `)
        printWindow.document.close()
        
        // Небольшая задержка перед печатью
        setTimeout(() => {
          printWindow.print()
        }, 500)
        
        console.log('✅ Окно печати открыто')
      }
    } catch (error) {
      console.error('❌ Ошибка печати этикеток:', error)
      alert('Ошибка при печати: ' + error.message)
    }
  }

  /**
   * Download labels as image (исправлено для избежания blob ошибок)
   */
  const downloadLabels = async () => {
    if (!labelRef.current) return

    try {
      console.log('💾 Подготовка к скачиванию этикеток...')
      
      const canvas = await html2canvas(labelRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')
      console.log('📸 Изображение этикетки создано')

      // Create and trigger download with proper cleanup
      const link = document.createElement('a')
      link.download = `этикетки_${new Date().toISOString().slice(0, 10)}.png`
      link.href = imgData
      
      // Add to DOM, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('✅ Этикетки скачаны')
      
    } catch (error) {
      console.error('❌ Ошибка скачивания этикеток:', error)
      alert('Ошибка при скачивании: ' + error.message)
    }
  }

  /**
   * Generate QR code URL
   */
  const generateQRCode = (product: Product) => {
    const qrData = `${product.name} | ${product.collection} | ${product.base_price || 0} сом`
    return `https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent(qrData)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Загрузка товаров...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Tags className="w-6 h-6" />
          Генератор этикеток
        </h2>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={selectAllProducts}
            disabled={products.length === 0}
          >
            Выбрать все
          </Button>
          <Button
            variant="outline"
            onClick={clearSelection}
            disabled={selectedProducts.length === 0}
          >
            Снять выделение
          </Button>
          <Button
            onClick={generateLabels}
            disabled={selectedProducts.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Tags className="w-4 h-4 mr-2" />
            Создать этикетки
          </Button>
        </div>
      </div>

      {/* Label Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Настройки этикетки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showLogo"
                checked={labelSettings.logo}
                onCheckedChange={(checked) => 
                  setLabelSettings(prev => ({ ...prev, logo: checked as boolean }))
                }
              />
              <Label htmlFor="showLogo">Логотип</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showPrice"
                checked={labelSettings.showPrice}
                onCheckedChange={(checked) => 
                  setLabelSettings(prev => ({ ...prev, showPrice: checked as boolean }))
                }
              />
              <Label htmlFor="showPrice">Цена</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showArticle"
                checked={labelSettings.showArticle}
                onCheckedChange={(checked) => 
                  setLabelSettings(prev => ({ ...prev, showArticle: checked as boolean }))
                }
              />
              <Label htmlFor="showArticle">Артикул</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showCollection"
                checked={labelSettings.showCollection}
                onCheckedChange={(checked) => 
                  setLabelSettings(prev => ({ ...prev, showCollection: checked as boolean }))
                }
              />
              <Label htmlFor="showCollection">Коллекция</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fontSize">Размер шрифта</Label>
              <Select
                value={labelSettings.fontSize.toString()}
                onValueChange={(value) => 
                  setLabelSettings(prev => ({ ...prev, fontSize: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10px - Мелкий</SelectItem>
                  <SelectItem value="12">12px - Обычный</SelectItem>
                  <SelectItem value="14">14px - Крупный</SelectItem>
                  <SelectItem value="16">16px - Очень крупный</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="copies">Количество копий</Label>
              <Input
                id="copies"
                type="number"
                min="1"
                max="100"
                value={labelSettings.copies}
                onChange={(e) => 
                  setLabelSettings(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle>
            Выбор товаров ({selectedProducts.length} из {products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Товары не найдены</p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProducts.includes(product.id)
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleProductSelection(product.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => {}}
                    />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Badge variant="outline">{product.collection}</Badge>
                        <Badge variant="secondary">{product.type}</Badge>
                        {product.article && (
                          <span className="text-xs">#{product.article}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {(product.base_price || product.total_cost + product.markup).toLocaleString('ru-RU')} сом
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Предпросмотр этикеток
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={printLabels} className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Печать
              </Button>
              <Button onClick={downloadLabels} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Скачать
              </Button>
            </div>
            
            <Separator />
            
            {/* Label Preview */}
            <div className="flex flex-wrap gap-4 justify-center max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
              {selectedProducts.slice(0, 6).map((productId) => {
                const product = products.find(p => p.id === productId)
                if (!product) return null
                
                return (
                  <div
                    key={productId}
                    ref={labelRef}
                    className="bg-white border-2 border-dashed border-gray-300 rounded-lg shadow-sm"
                    style={{
                      width: '58mm',
                      height: '100mm',
                      fontSize: `${labelSettings.fontSize}px`,
                      padding: '4mm',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    {/* Logo */}
                    {labelSettings.logo && (
                      <div className="text-center mb-2">
                        <div className="text-xs font-bold text-blue-600">WASSER</div>
                        <div className="text-xs text-gray-600">German technology</div>
                      </div>
                    )}
                    
                    {/* QR Code */}
                    <div className="text-center mb-2">
                      <img
                        src={generateQRCode(product)}
                        alt="QR Code"
                        className="mx-auto"
                        style={{ width: '40px', height: '40px' }}
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 text-center space-y-1">
                      <div className="font-bold text-xs leading-tight">
                        {product.name}
                      </div>
                      
                      {labelSettings.showCollection && (
                        <div className="text-xs text-gray-600">
                          {product.collection}
                        </div>
                      )}
                      
                      {labelSettings.showType && (
                        <div className="text-xs text-gray-500">
                          {product.type}
                        </div>
                      )}
                      
                      {labelSettings.showArticle && product.article && (
                        <div className="text-xs text-gray-500">
                          #{product.article}
                        </div>
                      )}
                    </div>
                    
                    {/* Price */}
                    {labelSettings.showPrice && (
                      <div className="text-center mt-2">
                        <div className="text-sm font-bold text-green-600">
                          {(product.base_price || product.total_cost + product.markup).toLocaleString('ru-RU')} сом
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {selectedProducts.length > 6 && (
                <div className="flex items-center justify-center w-full text-gray-500 text-sm">
                  И еще {selectedProducts.length - 6} этикеток...
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              Размер этикетки: 58 × 100 мм | Всего этикеток: {selectedProducts.length * labelSettings.copies}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}