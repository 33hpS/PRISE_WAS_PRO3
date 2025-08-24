/**
 * Component for managing products in the furniture factory system
 */
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Trash2, Edit2, Plus, Search, Upload, FileSpreadsheet, Eye, Image, History, X } from 'lucide-react'
import PaintCostPanel from './PaintCostPanel'
import { supabase } from '../lib/supabase'
import FileUpload from './FileUpload'
import TechCardHistory from './TechCardHistory'
import { TechCard, calculateTotalCost } from '../lib/xlsx-parser'

interface Product {
  id: string
  name: string
  description: string
  category: string
  type: string
  collection: string
  view_type: string
  markup: number
  images: string[]
  tech_specs: any
  materials_used: any
  total_cost: number
  created_at: string
  updated_at: string
  article?: string
  base_price?: number
  tech_card?: any
}

interface Collection {
  id: string
  name: string
}

interface ProductType {
  id: string
  name: string
}

/**
 * Products management component
 */
export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCollection, setFilterCollection] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    description: string
    category: string
    type: string
    collection: string
    view_type: string
    markup: number
    images: string[]
    tech_specs: any
    materials_used: any
    total_cost: number
    article?: string
    base_price?: number
    tech_card?: any
  }>({
    name: '',
    description: '',
    category: 'Мебель для ванной',
    type: '',
    collection: '',
    view_type: 'Стандартный',
    markup: 150,
    images: [],
    tech_specs: null,
    materials_used: null,
    total_cost: 0,
    article: '',
    base_price: 0,
    tech_card: null
  })
  const [techCardDialogOpen, setTechCardDialogOpen] = useState(false)
  const [selectedProductForTechCard, setSelectedProductForTechCard] = useState<Product | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  /**
   * Load all data from database
   */
  const loadData = async () => {
    try {
      const [productsResult, collectionsResult, typesResult] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('collections').select('*').order('name'),
        supabase.from('product_types').select('*').order('name')
      ])

      if (productsResult.error) throw productsResult.error
      if (collectionsResult.error) throw collectionsResult.error
      if (typesResult.error) throw typesResult.error

      setProducts(productsResult.data || [])
      setCollections(collectionsResult.data || [])
      setProductTypes(typesResult.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Prepare data according to Supabase schema
      // Note: 'category' column is not present in DB, do not send it
      const productData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        collection: formData.collection,
        view_type: formData.view_type,
        markup: formData.markup,
        images: formData.images || [],
        tech_specs: formData.tech_card || null,
        materials_used: formData.materials_used || null,
        total_cost: formData.total_cost || 0
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
        
        if (error) {
          console.error('Update error:', error)
          throw error
        }
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData])
        
        if (error) {
          console.error('Insert error:', error)
          throw error
        }
      }

      await loadData()
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Ошибка при сохранении товара: ' + (error.message || 'Неизвестная ошибка'))
    }
  }

  /**
   * Start editing product
   */
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category || 'Мебель для ванной',
      type: product.type || '',
      collection: product.collection || '',
      view_type: product.view_type || 'Стандартный',
      markup: product.markup || 150,
      images: product.images || [],
      tech_specs: product.tech_specs || null,
      materials_used: product.materials_used || null,
      total_cost: product.total_cost || 0,
      article: product.article || '',
      base_price: product.base_price || 0,
      tech_card: product.tech_specs || undefined
    })
    setIsDialogOpen(true)
  }

  /**
   * Delete product
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  /**
   * Handle tech card upload
   */
  const handleTechCardParsed = async (techCard: TechCard) => {
    try {
      console.log('🔄 Обработка тех карты:', techCard)
      
      // Calculate total cost from materials
      const materialPrices: Record<string, number> = {}
      
      // Get material prices from database
      const { data: materials } = await supabase
        .from('materials')
        .select('name, price')
        .then(res => res)
        .catch(() => ({ data: null, error: 'Table not found' }))
      
      if (materials) {
        materials.forEach(m => {
          materialPrices[m.name] = m.price
        })
        console.log('💰 Цены материалов загружены:', Object.keys(materialPrices).length)
      }
      
      // Get labor cost for this product type
      let laborCost = 800 // default
      try {
        const { data: viewTypes } = await supabase
          .from('product_view_types')
          .select('labor_cost')
          .eq('name', techCard.type || 'Тумба')
          .single()
          .then(res => res)
          .catch(() => ({ data: null, error: 'Table not found' }))
        
        if (viewTypes) {
          laborCost = viewTypes.labor_cost || 800
        }
        console.log('🔧 Стоимость работы:', laborCost, 'сом')
      } catch (error) {
        console.log('⚠️ Используем стандартную стоимость работы:', laborCost)
      }
      
      // Enrich materials with prices
      const enrichedMaterials = techCard.materials.map(material => ({
        ...material,
        price: materialPrices[material.name] || 0
      }))
      
      const totalCost = calculateTotalCost(enrichedMaterials, materialPrices, laborCost)
      const calculatedMarkup = Math.round(totalCost * 0.5) // 50% markup
      
      console.log('💰 Калькуляция:', {
        materials: enrichedMaterials.length,
        materialsCost: enrichedMaterials.reduce((sum, m) => sum + ((m.price || 0) * (m.quantity || 0)), 0),
        laborCost,
        totalCost,
        markup: calculatedMarkup
      })
      
      setFormData(prev => ({
        ...prev,
        name: techCard.productName,
        collection: techCard.collection || prev.collection,
        type: techCard.type || prev.type,
        category: techCard.category || prev.category,
        description: `Автозагрузка из тех карты. Материалов: ${techCard.materials.length}, Стоимость работ: ${laborCost} сом`,
        tech_card: { ...techCard, laborCost },
        tech_specs: { ...techCard, laborCost },
        materials_used: enrichedMaterials,
        total_cost: totalCost,
        markup: calculatedMarkup,
        base_price: totalCost + calculatedMarkup
      }))
    } catch (error) {
      console.error('❌ Ошибка обработки тех карты:', error)
    }
  }

  /**
   * Handle images upload
   */
  const handleImagesUploaded = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.includes('image'))
    const imageUrls = imageFiles.map(f => URL.createObjectURL(f))
    setFormData(prev => ({
      ...prev,
      images: imageUrls
    }))
  }

  /**
   * View tech card details
   */
  const viewTechCard = (product: Product) => {
    setSelectedProductForTechCard(product)
    setTechCardDialogOpen(true)
  }

  /**
   * View product history
   */
  const viewHistory = (product: Product) => {
    setSelectedProductForHistory(product)
    setHistoryDialogOpen(true)
  }

  /**
   * View product details
   */
  const viewDetails = (product: Product) => {
    setSelectedProductForDetails(product)
    setDetailsDialogOpen(true)
  }

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Мебель для ванной',
      type: '',
      collection: '',
      view_type: 'Стандартный',
      markup: 150,
      images: [],
      tech_specs: null,
      materials_used: null,
      total_cost: 0,
      article: '',
      base_price: 0,
      tech_card: undefined
    })
    setEditingProduct(null)
  }

  /**
   * Get collection color scheme
   */
  const getCollectionColors = (collection: string) => {
    const colorSchemes: Record<string, { bg: string, border: string, text: string, accent: string }> = {
      'Классик': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', accent: 'bg-blue-500' },
      'Грация': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', accent: 'bg-purple-500' },
      'Модерн': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', accent: 'bg-green-500' },
      'Лофт': { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800', accent: 'bg-gray-600' },
      'Престиж': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', accent: 'bg-amber-500' },
      'Элегант': { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', accent: 'bg-rose-500' },
      'Минимал': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', accent: 'bg-slate-500' },
      'Прованс': { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', accent: 'bg-violet-500' },
      'Скандинавский': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', accent: 'bg-cyan-500' },
      'Арт-деко': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', accent: 'bg-orange-500' }
    }
    
    return colorSchemes[collection] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', accent: 'bg-gray-500' }
  }

  /**
   * Filter products based on search, collection and type
   */
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCollection = filterCollection === 'all' || product.collection === filterCollection
    const matchesType = filterType === 'all' || product.type === filterType
    return matchesSearch && matchesCollection && matchesType
  })

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
        <h2 className="text-2xl font-bold">Управление товарами</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить товар
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-xl sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Основные данные</TabsTrigger>
                <TabsTrigger value="techcard">Тех карта</TabsTrigger>
                <TabsTrigger value="paint">Покраска</TabsTrigger>
                <TabsTrigger value="images">Изображения</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Наименование</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Категория</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Тумбы">Тумбы</SelectItem>
                          <SelectItem value="Пеналы">Пеналы</SelectItem>
                          <SelectItem value="Зеркала">Зеркала</SelectItem>
                          <SelectItem value="Полки">Полки</SelectItem>
                          <SelectItem value="Шкафы">Шкафы</SelectItem>
                          <SelectItem value="Мебель для ванной">Мебель для ванной</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="collection">Коллекция</Label>
                      <Select
                        value={formData.collection}
                        onValueChange={(value) => setFormData({...formData, collection: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите коллекцию" />
                        </SelectTrigger>
                        <SelectContent>
                          {collections.map(collection => (
                            <SelectItem key={collection.id} value={collection.name}>
                              {collection.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="type">Тип товара</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({...formData, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent>
                          {productTypes.map(type => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="total_cost">Себестоимость (сом)</Label>
                      <Input
                        id="total_cost"
                        type="number"
                        step="0.01"
                        value={formData.total_cost}
                        onChange={(e) => {
                          const cost = parseFloat(e.target.value) || 0
                          setFormData({
                            ...formData, 
                            total_cost: cost,
                            base_price: cost + formData.markup
                          })
                        }}
                        readOnly={!!formData.tech_card}
                        className={formData.tech_card ? 'bg-gray-100' : ''}
                      />
                      {formData.tech_card && (
                        <p className="text-xs text-gray-500 mt-1">
                          Рассчитывается автоматически из тех карты
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="markup">Наценка (сом)</Label>
                      <Input
                        id="markup"
                        type="number"
                        step="0.01"
                        value={formData.markup}
                        onChange={(e) => {
                          const markup = parseFloat(e.target.value) || 0
                          setFormData({
                            ...formData, 
                            markup: markup,
                            base_price: formData.total_cost + markup
                          })
                        }}
                        required
                      />
                      {formData.total_cost > 0 && formData.markup > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          Процент: {((formData.markup / formData.total_cost) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="base_price">Итоговая цена (сом)</Label>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value) || 0
                        setFormData({
                          ...formData, 
                          base_price: price,
                          markup: price - formData.total_cost
                        })
                      }}
                      className="font-bold text-green-600"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingProduct ? 'Сохранить' : 'Добавить'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Отмена
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="techcard" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Техническая карта</h4>
                    {formData.tech_card && (
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Загружена
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {formData.materials_used?.length || 0} материалов
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <FileUpload
                    mode="tech-card"
                    onTechCardParsed={handleTechCardParsed}
                    title="Загрузить тех карту"
                    description="Перетащите Excel файл с тех картой или нажмите для выбора"
                    acceptedFileTypes={['.xlsx', '.xls']}
                    maxFiles={1}
                  />
                  
                  {formData.tech_card && (
                    <Card className="p-4 bg-gray-50">
                      <h5 className="font-medium mb-3">Информация о тех карте</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Изделие:</span>
                          <p>{formData.tech_card.productName}</p>
                        </div>
                        <div>
                          <span className="font-medium">Количество материалов:</span>
                          <p>{formData.materials_used?.length || 0}</p>
                        </div>
                        <div>
                          <span className="font-medium">Себестоимость:</span>
                          <p className="text-blue-600 font-semibold">
                            {formData.total_cost.toLocaleString('ru-RU')} сом
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Рекомендуемая цена:</span>
                          <p className="text-green-600 font-semibold">
                            {Math.round(formData.total_cost * 1.5).toLocaleString('ru-RU')} сом
                          </p>
                        </div>
                      </div>
                      
                      {formData.materials_used && formData.materials_used.length > 0 && (
                        <div className="mt-4">
                          <h6 className="font-medium mb-2">Калькуляция материалов:</h6>
                          <div className="max-h-64 overflow-y-auto border rounded">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr className="border-b">
                                  <th className="text-left py-2 px-2 font-medium">Артикул</th>
                                  <th className="text-left py-2 px-2 font-medium">Наименование</th>
                                  <th className="text-right py-2 px-2 font-medium">Кол-во</th>
                                  <th className="text-left py-2 px-2 font-medium">Ед.</th>
                                  <th className="text-right py-2 px-2 font-medium">Цена за ед.</th>
                                  <th className="text-right py-2 px-2 font-medium">Сумма</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formData.materials_used.map((material, index) => {
                                  const price = material.price || 0
                                  const quantity = material.quantity || 0
                                  const total = price * quantity
                                  
                                  return (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                      <td className="py-2 px-2 text-gray-600">{material.article}</td>
                                      <td className="py-2 px-2">{material.name}</td>
                                      <td className="py-2 px-2 text-right font-medium">{quantity}</td>
                                      <td className="py-2 px-2">{material.unit}</td>
                                      <td className="py-2 px-2 text-right text-blue-600">
                                        {price.toLocaleString('ru-RU')} сом
                                      </td>
                                      <td className="py-2 px-2 text-right font-semibold text-green-600">
                                        {total.toLocaleString('ru-RU')} сом
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                              <tfoot className="bg-gray-50 border-t-2">
                                <tr>
                                  <td colSpan="5" className="py-2 px-2 font-medium text-right">
                                    Итого материалы:
                                  </td>
                                  <td className="py-2 px-2 text-right font-bold text-blue-600">
                                    {formData.materials_used.reduce((sum, m) => sum + ((m.price || 0) * (m.quantity || 0)), 0).toLocaleString('ru-RU')} сом
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan="5" className="py-2 px-2 font-medium text-right">
                                    Работа:
                                  </td>
                                  <td className="py-2 px-2 text-right font-bold text-orange-600">
                                    {(formData.tech_card?.laborCost || 800).toLocaleString('ru-RU')} сом
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan="5" className="py-2 px-2 font-semibold text-right bg-green-50">
                                    ИТОГО себестоимость:
                                  </td>
                                  <td className="py-2 px-2 text-right font-bold text-green-700 text-base bg-green-50">
                                    {formData.total_cost.toLocaleString('ru-RU')} сом
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="paint" className="space-y-4">
                {/**
                 * Вкладка "Покраска": расчёт стоимости по рецепту.
                 * Кнопки обновляют formData.total_cost и пересчитывают base_price.
                 */}
                <PaintCostPanel
                  onApplyAdd={(cost) => {
                    setFormData(prev => {
                      const total = (prev.total_cost || 0) + (cost || 0)
                      return { ...prev, total_cost: total, base_price: total + (prev.markup || 0) }
                    })
                  }}
                  onApplyReplace={(cost) => {
                    setFormData(prev => {
                      const total = cost || 0
                      return { ...prev, total_cost: total, base_price: total + (prev.markup || 0) }
                    })
                  }}
                />
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Изображения товара</h4>
                    {formData.images && formData.images.length > 0 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {formData.images.length} фото
                      </Badge>
                    )}
                  </div>
                  
                  <FileUpload
                    onFilesUploaded={handleImagesUploaded}
                    title="Загрузить изображения"
                    description="Перетащите изображения товара или нажмите для выбора"
                    acceptedFileTypes={['.jpg', '.jpeg', '.png']}
                    maxFiles={5}
                  />
                  
                  {formData.images && formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Изображение ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            type="button"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newImages = formData.images?.filter((_, i) => i !== index) || []
                              setFormData(prev => ({ ...prev, images: newImages }))
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск по названию или артикулу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="lg:w-48">
          <Select value={filterCollection} onValueChange={setFilterCollection}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все коллекции</SelectItem>
              {collections.map(collection => (
                <SelectItem key={collection.id} value={collection.name}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="lg:w-48">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {productTypes.map(type => (
                <SelectItem key={type.id} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Товары не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => {
            const colors = getCollectionColors(product.collection)
            const finalPrice = (product.base_price && product.base_price > 0) 
              ? product.base_price 
              : (product.total_cost + product.markup)
            
            return (
              <Card key={product.id} className={`cursor-pointer hover:shadow-lg transition-all duration-300 ${colors.bg} ${colors.border} border-2`}>
                <CardContent className="p-4">
                  {/* Collection accent bar */}
                  <div className={`h-1 ${colors.accent} rounded-full mb-3 opacity-60`}></div>
                  
                  <div 
                    className="flex items-start gap-4"
                    onClick={() => viewDetails(product)}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <div className="relative">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className={`w-24 h-24 object-cover rounded-lg border-2 ${colors.border} shadow-md hover:shadow-lg transition-shadow`}
                            onError={(e) => {
                              console.log('❌ Ошибка загрузки изображения:', product.images[0])
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                          <div className={`w-24 h-24 ${colors.bg} rounded-lg border-2 ${colors.border} items-center justify-center hidden`}>
                            <Image className={`w-8 h-8 ${colors.text} opacity-60`} />
                          </div>
                        </div>
                      ) : (
                        <div className={`w-24 h-24 ${colors.bg} rounded-lg border-2 ${colors.border} flex items-center justify-center shadow-md`}>
                          <Image className={`w-8 h-8 ${colors.text} opacity-60`} />
                        </div>
                      )}
                    </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${colors.text} hover:opacity-80 transition-opacity`}>
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Категория: {product.category}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${colors.accent} text-white border-0 shadow-sm`}>
                        {product.collection}
                      </Badge>
                      <Badge variant="secondary" className="bg-white border border-gray-300 text-gray-700">
                        {product.type}
                      </Badge>
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {product.description.length > 100 
                          ? product.description.substring(0, 100) + '...' 
                          : product.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xl font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg shadow-sm">
                        {finalPrice > 0 ? finalPrice.toLocaleString('ru-RU') : '0'} сом
                      </p>
                      {product.total_cost > 0 && (
                        <p className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          Себестоимость: {product.total_cost.toLocaleString('ru-RU')} сом
                        </p>
                      )}
                      {product.markup > 0 && (
                        <p className={`text-sm ${colors.text} bg-white px-2 py-1 rounded border`}>
                          Наценка: {product.markup.toLocaleString('ru-RU')} сом
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {product.tech_specs && (
                        <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                          <FileSpreadsheet className="w-3 h-3 mr-1" />
                          Тех карта
                        </Badge>
                      )}
                      {product.images && product.images.length > 0 && (
                        <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                          <Image className="w-3 h-3 mr-1" />
                          {product.images.length} фото
                        </Badge>
                      )}
                      {finalPrice === 0 && (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 border border-red-200">
                          ⚠️ Цена не установлена
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    {product.tech_specs && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewTechCard(product)}
                        className={`${colors.text} hover:bg-blue-50 border-blue-200`}
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewHistory(product)}
                      className="text-purple-600 hover:bg-purple-50 border-purple-200"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className={`${colors.text} hover:${colors.bg} ${colors.border}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })
        )}
      </div>
    </div>
  )
}