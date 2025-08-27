/**
 * @file ProductManager.tsx
 * @description Управление изделиями + интеграция движка расчётов с поддержкой покраски:
 * - Формат размеров (ШxВxГ, мм), сохранение в tech_specs (без изменения схемы БД).
 * - Конфигуратор задач покраски (recipe, complexity, layers) с превью по работе.
 * - Пересчёт финальной цены по движку (BOM + Paint + Labor + Markup%).
 * - Поддержка Supabase: materials, collections, product_types, paint_recipes, paint_complexity.
 * - Fallback: localStorage для рецептов покраски (совместимо с PaintRecipesManager / PaintCostPanel).
 */

import { useState, useEffect, useMemo } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Trash2,
  Edit2,
  Plus,
  Search,
  Upload,
  FileSpreadsheet,
  Eye,
  Image,
  History,
  X,
  PaintBucket,
  RefreshCcw as CalculatorRefresh,
} from 'lucide-react'
import PaintCostPanel from './PaintCostPanel'
import { supabase } from '../lib/supabase'
import FileUpload from './FileUpload'
import TechCardHistory from './TechCardHistory'
import { TechCard } from '../lib/xlsx-parser'
import {
  calculateProductCost,
  calculatePaintCost as enginePaintCost,
  validateCostCalculation,
  DEFAULT_SETTINGS,
  type ProductLike,
  type MaterialRecord,
  type PaintJob as EnginePaintJob,
  type PaintRecipeRef,
  type PaintComplexityRef,
} from '../lib/calc-engine'

/** Сущности БД */
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

/** Внутренние типы для UI покраски */
interface UIPaintJob {
  recipeId: string
  layers: number
  complexityId?: string
}

/**
 * ProductManager — CRUD изделий + интеграция расчётов с покраской.
 */
export default function ProductManager(): JSX.Element {
  // Списки из БД
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  // Покраска: референсы (рецепты и сложности)
  const [paintRecipes, setPaintRecipes] = useState<PaintRecipeRef[]>([])
  const [paintComplexities, setPaintComplexities] = useState<PaintComplexityRef[]>([
    { id: 'std', name: 'Стандарт', coeff: 1.0 },
    { id: 'hard', name: 'Сложный', coeff: 1.15 },
    { id: 'vh', name: 'Очень сложный', coeff: 1.3 },
  ])

  // UI состояния
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCollection, setFilterCollection] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  /** Состояние формы изделия */
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
    size?: string // Новый формат "ШxВxГ", мм
    paint_jobs?: UIPaintJob[] // Задачи покраски
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
    tech_card: null,
    size: '',
    paint_jobs: [],
  })

  // Диалоги "детально"
  const [techCardDialogOpen, setTechCardDialogOpen] = useState(false)
  const [selectedProductForTechCard, setSelectedProductForTechCard] = useState<Product | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null)

  useEffect(() => {
    void loadData()
  }, [])

  /**
   * Загрузка данных из Supabase:
   * - products, collections, product_types
   * - paint_recipes, paint_complexity (fallback для сложностей)
   */
  const loadData = async () => {
    try {
      const [productsResult, collectionsResult, typesResult, recipesResult] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('collections').select('*').order('name'),
        supabase.from('product_types').select('*').order('name'),
        supabase
          .from('paint_recipes')
          .select('id, name, price_per_m2, cost_per_g, consumption_g_per_m2, notes')
          .order('name')
          .then(res => res)
          .catch(() => ({ data: null, error: 'Table not found' }) as any),
      ])

      if (productsResult.error) throw productsResult.error
      if (collectionsResult.error) throw collectionsResult.error
      if (typesResult.error) throw typesResult.error

      setProducts(productsResult.data || [])
      setCollections(collectionsResult.data || [])
      setProductTypes(typesResult.data || [])

      // Рецепты покраски
      if (recipesResult?.data && Array.isArray(recipesResult.data)) {
        const mapped: PaintRecipeRef[] = recipesResult.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          pricePerM2: Number(r.price_per_m2 ?? 0) || undefined,
          costPerG: Number(r.cost_per_g ?? 0) || undefined,
          consumptionGPerM2: Number(r.consumption_g_per_m2 ?? 0) || undefined,
          complexityId: undefined,
        }))
        setPaintRecipes(mapped)
        try {
          // Совместимость с PaintCostPanel / PaintRecipesManager
          localStorage.setItem(
            'wasser_paint_recipes',
            JSON.stringify(
              recipesResult.data.map((r: any) => ({
                id: r.id,
                name: r.name,
                finish_type: null,
                price_per_m2: Number(r.price_per_m2 ?? 0) || null,
                cost_per_g: Number(r.cost_per_g ?? 0) || null,
                consumption_g_per_m2: Number(r.consumption_g_per_m2 ?? 0) || null,
                notes: r.notes || null,
                base: null,
                hardener: null,
                thinner: null,
              }))
            )
          )
        } catch {
          /* noop */
        }
      } else {
        // Fallback на localStorage
        try {
          const raw = localStorage.getItem('wasser_paint_recipes')
          if (raw) {
            const ls = JSON.parse(raw) as any[]
            const mapped: PaintRecipeRef[] = ls.map(r => ({
              id: r.id,
              name: r.name,
              pricePerM2: Number(r.price_per_m2 ?? 0) || undefined,
              costPerG: Number(r.cost_per_g ?? 0) || undefined,
              consumptionGPerM2: Number(r.consumption_g_per_m2 ?? 0) || undefined,
              complexityId: undefined,
            }))
            setPaintRecipes(mapped)
          }
        } catch {
          setPaintRecipes([])
        }
      }

      // Сложности покраски (если таблица есть — подгружаем)
      try {
        const { data: cmx, error: e2 } = await supabase
          .from('paint_complexity')
          .select('id, name, coeff')
          .order('coeff')
        if (!e2 && cmx && cmx.length > 0) {
          setPaintComplexities(
            cmx.map((c: any) => ({ id: c.id, name: c.name, coeff: Number(c.coeff) || 1 }))
          )
        }
      } catch {
        /* ignore, оставим дефолт */
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Сабмит формы (insert/update в products).
   * Важно: мы уже пересчитываем цену при загрузке техкарты и/или вручную кнопкой "Пересчитать по движку".
   * Здесь просто сохраняем текущее состояние.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Формируем payload для products (без поля category в БД — не отправляем)
      const productData: any = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        collection: formData.collection,
        view_type: formData.view_type,
        markup: formData.markup,
        images: formData.images || [],
        tech_specs: {
          ...(formData.tech_card || {}),
          size: formData.size || '',
          paint_jobs: formData.paint_jobs || [],
        },
        materials_used: formData.materials_used || null,
        total_cost: formData.total_cost || 0,
        // article/base_price не в строго типизированной схеме — поля могут отсутствовать в БД
        base_price: formData.base_price || 0,
        article: formData.article || null,
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert([productData])
        if (error) throw error
      }

      await loadData()
      resetForm()
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error('Error saving product:', error)
      alert('Ошибка при сохранении товара: ' + (error?.message || 'Неизвестная ошибка'))
    }
  }

  /** Начать редактирование */
  const handleEdit = (product: Product) => {
    // Извлекаем size и paint_jobs из tech_specs, чтобы отобразить в UI
    const size = product.tech_specs?.size || ''
    const paint_jobs = (product.tech_specs?.paint_jobs as UIPaintJob[]) || []

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
      tech_card: product.tech_specs || undefined,
      size,
      paint_jobs,
    })
    setIsDialogOpen(true)
  }

  /** Удаление товара */
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар?')) return

    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  /**
   * Приём и обработка ТехКарты:
   * - Загружаем материалы из БД (полный набор полей).
   * - Берём труд из product_view_types по типу.
   * - Строим объект productForCalc, подключаем paint_jobs и size из формы.
   * - Запускаем calculateProductCost (материалы + покраска) + добавляем труд и наценку (50% по умолчанию).
   * - Подписываем расчёт validateCostCalculation.
   */
  const handleTechCardParsed = async (techCard: TechCard) => {
    try {
      console.log('🔄 Обработка тех карты:', techCard)

      // 1) Материалы из БД
      const { data: matData } = (await supabase
        .from('materials')
        .select('id, name, article, unit, price, type')
        .order('name')
        .then(res => res)
        .catch(() => ({ data: null, error: 'Table not found' }))) as { data: any[] | null }

      const materialRecords: MaterialRecord[] =
        (matData || []).map(m => ({
          id: m.id,
          name: m.name,
          article: m.article || '',
          unit: m.unit,
          price: m.price,
          type: m.type,
        })) || []

      // 2) Труд из product_view_types
      let laborCost = 800
      try {
        const { data: vt } = await supabase
          .from('product_view_types')
          .select('labor_cost')
          .eq('name', techCard.type || 'Тумба')
          .single()
          .then(res => res)
          .catch(() => ({ data: null, error: 'Table not found' }))
        if (vt) laborCost = vt.labor_cost || laborCost
      } catch {
        /* keep default */
      }

      // 3) Продукт для движка
      const productForCalc: ProductLike = {
        name: techCard.productName,
        article: '',
        size: formData.size || undefined,
        techCard: (techCard.materials || []).map(m => ({
          name: m.name,
          article: m.article,
          unit: m.unit,
          quantity: m.quantity,
        })),
        paintJobs: (formData.paint_jobs || []).map(j => ({
          recipeId: j.recipeId,
          layers: Number(j.layers) || 0,
          complexityId: j.complexityId,
        })),
      }

      // 4) Датасеты для движка
      const datasets = {
        materials: materialRecords,
        recipes: paintRecipes,
        complexities: paintComplexities,
        settings: DEFAULT_SETTINGS,
      }

      // 5) Расчёт
      const calc = calculateProductCost({
        product: productForCalc,
        datasets,
        laborCost,
        markupPercent: 50, // как и раньше
      })

      // Подпись
      validateCostCalculation(productForCalc, calc)

      console.log('💰 Калькуляция:', {
        materials: calc.breakdown.materials.length,
        materialsCost: calc.materialsCost,
        paintCost: calc.paintCost,
        laborCost: calc.laborCost,
        totalCost: calc.totalCost,
        markup: `${calc.markupPercent}%`,
        finalPrice: calc.finalPrice,
        grossMargin: `${calc.grossMargin.toFixed(1)}%`,
        roi: `${calc.roi.toFixed(1)}%`,
      })

      // Таблица материалов для UI
      const materials_used = calc.breakdown.materials.map(r => ({
        article: r.article || '',
        name: r.name,
        unit: r.unit || '',
        quantity: r.quantity,
        price: r.unitPrice,
      }))

      setFormData(prev => ({
        ...prev,
        name: techCard.productName,
        collection: techCard.collection || prev.collection,
        type: techCard.type || prev.type,
        category: techCard.category || prev.category,
        description: `Автозагрузка из тех карты. Материалов: ${techCard.materials.length}, Работа: ${laborCost} сом`,
        tech_card: { ...techCard, laborCost, size: prev.size, paint_jobs: prev.paint_jobs },
        tech_specs: { ...techCard, laborCost, size: prev.size, paint_jobs: prev.paint_jobs },
        materials_used,
        total_cost: calc.totalCost, // производственная (материалы+краска)
        markup: Math.round(calc.finalPrice - (calc.totalCost + calc.laborCost)),
        base_price: calc.finalPrice,
      }))
    } catch (error) {
      console.error('❌ Ошибка обработки тех карты:', error)
    }
  }

  /** Загрузка изображений */
  const handleImagesUploaded = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.includes('image'))
    const imageUrls = imageFiles.map(f => URL.createObjectURL(f))
    setFormData(prev => ({
      ...prev,
      images: imageUrls,
    }))
  }

  /** Просмотр техкарты */
  const viewTechCard = (product: Product) => {
    setSelectedProductForTechCard(product)
    setTechCardDialogOpen(true)
  }

  /** История изменений */
  const viewHistory = (product: Product) => {
    setSelectedProductForHistory(product)
    setHistoryDialogOpen(true)
  }

  /** Детали */
  const viewDetails = (product: Product) => {
    setSelectedProductForDetails(product)
    setDetailsDialogOpen(true)
  }

  /** Сброс формы */
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
      tech_card: undefined,
      size: '',
      paint_jobs: [],
    })
    setEditingProduct(null)
  }

  /**
   * Утилиты: выбор цвета коллекции для UI карточек.
   */
  const getCollectionColors = (collection: string) => {
    const colorSchemes: Record<
      string,
      { bg: string; border: string; text: string; accent: string }
    > = {
      Классик: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        accent: 'bg-blue-500',
      },
      Грация: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-800',
        accent: 'bg-purple-500',
      },
      Модерн: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        accent: 'bg-green-500',
      },
      Лофт: {
        bg: 'bg-gray-50',
        border: 'border-gray-300',
        text: 'text-gray-800',
        accent: 'bg-gray-600',
      },
      Престиж: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        accent: 'bg-amber-500',
      },
      Элегант: {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-800',
        accent: 'bg-rose-500',
      },
      Минимал: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-800',
        accent: 'bg-slate-500',
      },
      Прованс: {
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        text: 'text-violet-800',
        accent: 'bg-violet-500',
      },
      Скандинавский: {
        bg: 'bg-cyan-50',
        border: 'border-cyan-200',
        text: 'text-cyan-800',
        accent: 'bg-cyan-500',
      },
      'Арт-деко': {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        accent: 'bg-orange-500',
      },
    }
    return (
      colorSchemes[collection] || {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-800',
        accent: 'bg-gray-500',
      }
    )
  }

  /**
   * Фильтр списка товаров
   */
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCollection = filterCollection === 'all' || product.collection === filterCollection
    const matchesType = filterType === 'all' || product.type === filterType
    return matchesSearch && matchesCollection && matchesType
  })

  /**
   * Добавить задачу покраски
   */
  const addPaintJob = () => {
    const defaultRecipe = paintRecipes[0]?.id || ''
    const defaultComplex = paintComplexities[0]?.id
    const job: UIPaintJob = { recipeId: defaultRecipe, layers: 1, complexityId: defaultComplex }
    setFormData(prev => ({ ...prev, paint_jobs: [...(prev.paint_jobs || []), job] }))
  }

  /**
   * Удалить задачу покраски
   */
  const removePaintJob = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      paint_jobs: (prev.paint_jobs || []).filter((_, i) => i !== idx),
    }))
  }

  /**
   * Обновить задачу покраски по индексу
   */
  const updatePaintJob = (idx: number, patch: Partial<UIPaintJob>) => {
    setFormData(prev => {
      const list = [...(prev.paint_jobs || [])]
      list[idx] = { ...list[idx], ...patch }
      return { ...prev, paint_jobs: list }
    })
  }

  /**
   * Превью стоимости одной работы (для строки конфигуратора).
   * Использует движок calculatePaintCost для одной job.
   */
  const previewPaintJobCost = (job: UIPaintJob): number => {
    const product: ProductLike = {
      name: formData.name || 'Изделие',
      techCard: [],
      size: formData.size || undefined,
      paintJobs: [
        { recipeId: job.recipeId, layers: Number(job.layers) || 0, complexityId: job.complexityId },
      ],
    }
    const res = enginePaintCost(product, {
      materials: [],
      recipes: paintRecipes,
      complexities: paintComplexities,
      settings: DEFAULT_SETTINGS,
    })
    return Math.round(res.total || 0)
  }

  /**
   * Пересчитать итоговые суммы по текущим данным формы:
   * - tech_card (+ materials from DB)
   * - size, paint_jobs
   * - laborCost из view_types
   * - markup 50% (как по умолчанию)
   */
  const recalcByEngine = async () => {
    try {
      // Материалы из БД
      const { data: matData } = await supabase
        .from('materials')
        .select('id, name, article, unit, price, type')
        .order('name')
        .then(res => res)
        .catch(() => ({ data: null, error: 'Table not found' }))
      const materialRecords: MaterialRecord[] =
        (matData || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          article: m.article || '',
          unit: m.unit,
          price: m.price,
          type: m.type,
        })) || []

      // Труд из view_types
      let laborCost = 800
      try {
        const { data: vt } = await supabase
          .from('product_view_types')
          .select('labor_cost')
          .eq('name', formData.type || 'Тумба')
          .single()
          .then(res => res)
          .catch(() => ({ data: null, error: 'Table not found' }))
        if (vt) laborCost = vt.labor_cost || laborCost
      } catch {
        /* ignore */
      }

      // Продукт для движка
      const productForCalc: ProductLike = {
        name: formData.name || 'Изделие',
        article: formData.article || '',
        size: formData.size || undefined,
        techCard:
          (formData.tech_card?.materials ||
          formData.tech_specs?.materials ||
          formData.materials_used
            ? (formData.materials_used || []).map((m: any) => ({
                name: m.name,
                article: m.article,
                quantity: Number(m.quantity) || 0,
                unit: m.unit,
              }))
            : []) || [],
        paintJobs: (formData.paint_jobs || []).map(j => ({
          recipeId: j.recipeId,
          layers: Number(j.layers) || 0,
          complexityId: j.complexityId,
        })),
      }

      const datasets = {
        materials: materialRecords,
        recipes: paintRecipes,
        complexities: paintComplexities,
        settings: DEFAULT_SETTINGS,
      }

      const calc = calculateProductCost({
        product: productForCalc,
        datasets,
        laborCost,
        markupPercent: 50,
      })

      validateCostCalculation(productForCalc, calc)

      // Отобразим в форме (materials_used оставляем как есть — при необходимости берите из calc.breakdown.materials)
      setFormData(prev => ({
        ...prev,
        total_cost: calc.totalCost,
        markup: Math.round(calc.finalPrice - (calc.totalCost + calc.laborCost)),
        base_price: calc.finalPrice,
      }))
    } catch (e) {
      console.error('❌ Пересчёт не удался:', e)
      alert('Не удалось пересчитать. Подробности в консоли.')
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-lg'>Загрузка товаров...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Шапка и действия */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <h2 className='text-2xl font-bold'>Управление товарами</h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className='w-4 h-4 mr-2' />
              Добавить товар
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-xl sm:rounded-lg'>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Редактировать товар' : 'Добавить товар'}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue='basic' className='space-y-4'>
              <TabsList className='grid w-full grid-cols-5'>
                <TabsTrigger value='basic'>Основные данные</TabsTrigger>
                <TabsTrigger value='techcard'>Тех карта</TabsTrigger>
                <TabsTrigger value='paint'>Покраска</TabsTrigger>
                <TabsTrigger value='images'>Изображения</TabsTrigger>
                <TabsTrigger value='final'>Цена</TabsTrigger>
              </TabsList>

              {/* Основные */}
              <TabsContent value='basic' className='space-y-4'>
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='name'>Наименование</Label>
                      <Input
                        id='name'
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor='category'>Категория</Label>
                      <Select
                        value={formData.category}
                        onValueChange={value => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Выберите категорию' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Тумбы'>Тумбы</SelectItem>
                          <SelectItem value='Пеналы'>Пеналы</SelectItem>
                          <SelectItem value='Зеркала'>Зеркала</SelectItem>
                          <SelectItem value='Полки'>Полки</SelectItem>
                          <SelectItem value='Шкафы'>Шкафы</SelectItem>
                          <SelectItem value='Мебель для ванной'>Мебель для ванной</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor='collection'>Коллекция</Label>
                      <Select
                        value={formData.collection}
                        onValueChange={value => setFormData({ ...formData, collection: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Выберите коллекцию' />
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
                      <Label htmlFor='type'>Тип товара</Label>
                      <Select
                        value={formData.type}
                        onValueChange={value => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Выберите тип' />
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
                    <Label htmlFor='description'>Описание</Label>
                    <Textarea
                      id='description'
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Размер изделия */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='size'>Размер (ШxВxГ, мм)</Label>
                      <Input
                        id='size'
                        placeholder='Например: 600x800x150'
                        value={formData.size || ''}
                        onChange={e => setFormData({ ...formData, size: e.target.value })}
                      />
                      <p className='text-xs text-gray-500 mt-1'>
                        Используется для расчёта площади поверхности в покраске.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor='article'>Артикул (необязательно)</Label>
                      <Input
                        id='article'
                        value={formData.article || ''}
                        onChange={e => setFormData({ ...formData, article: e.target.value })}
                        placeholder='Например: TB-600-WHT'
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='total_cost'>Себестоимость (сом)</Label>
                      <Input
                        id='total_cost'
                        type='number'
                        step='0.01'
                        value={formData.total_cost}
                        onChange={e => {
                          const cost = parseFloat(e.target.value) || 0
                          setFormData({
                            ...formData,
                            total_cost: cost,
                            base_price: cost + formData.markup,
                          })
                        }}
                        readOnly={!!formData.tech_card}
                        className={formData.tech_card ? 'bg-gray-100' : ''}
                      />
                      {formData.tech_card && (
                        <p className='text-xs text-gray-500 mt-1'>Рассчитывается автоматически</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor='markup'>Наценка (сом)</Label>
                      <Input
                        id='markup'
                        type='number'
                        step='0.01'
                        value={formData.markup}
                        onChange={e => {
                          const markup = parseFloat(e.target.value) || 0
                          setFormData({
                            ...formData,
                            markup: markup,
                            base_price: (formData.total_cost || 0) + markup,
                          })
                        }}
                        required
                      />
                      {formData.total_cost > 0 && formData.markup > 0 && (
                        <p className='text-xs text-green-600 mt-1'>
                          Процент:{' '}
                          {(((formData.markup || 0) / (formData.total_cost || 1)) * 100).toFixed(1)}
                          %
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor='base_price'>Итоговая цена (сом)</Label>
                    <Input
                      id='base_price'
                      type='number'
                      step='0.01'
                      value={formData.base_price}
                      onChange={e => {
                        const price = parseFloat(e.target.value) || 0
                        setFormData({
                          ...formData,
                          base_price: price,
                          markup: price - (formData.total_cost || 0),
                        })
                      }}
                      className='font-bold text-green-600'
                    />
                  </div>

                  <div className='flex gap-2 pt-4'>
                    <Button type='submit' className='flex-1'>
                      {editingProduct ? 'Сохранить' : 'Добавить'}
                    </Button>
                    <Button type='button' variant='outline' onClick={() => setIsDialogOpen(false)}>
                      Отмена
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Техкарта */}
              <TabsContent value='techcard' className='space-y-4'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-semibold'>Техническая карта</h4>
                    {formData.tech_card && (
                      <div className='flex gap-2'>
                        <Badge variant='outline' className='bg-green-50 text-green-700'>
                          Загружена
                        </Badge>
                        <Badge variant='outline' className='bg-blue-50 text-blue-700'>
                          {formData.materials_used?.length || 0} материалов
                        </Badge>
                      </div>
                    )}
                  </div>

                  <FileUpload
                    mode='tech-card'
                    onTechCardParsed={handleTechCardParsed}
                    title='Загрузить тех карту'
                    description='Перетащите Excel файл с тех картой или нажмите для выбора'
                    acceptedFileTypes={['.xlsx', '.xls']}
                    maxFiles={1}
                  />

                  {formData.tech_card && (
                    <Card className='p-4 bg-gray-50'>
                      <h5 className='font-medium mb-3'>Информация о тех карте</h5>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                        <div>
                          <span className='font-medium'>Изделие:</span>
                          <p>{formData.tech_card.productName}</p>
                        </div>
                        <div>
                          <span className='font-medium'>Количество материалов:</span>
                          <p>{formData.materials_used?.length || 0}</p>
                        </div>
                        <div>
                          <span className='font-medium'>Себестоимость:</span>
                          <p className='text-blue-600 font-semibold'>
                            {(formData.total_cost || 0).toLocaleString('ru-RU')} сом
                          </p>
                        </div>
                        <div>
                          <span className='font-medium'>Труд (по типу):</span>
                          <p className='text-orange-600 font-semibold'>
                            {(formData.tech_card?.laborCost || 800).toLocaleString('ru-RU')} сом
                          </p>
                        </div>
                      </div>

                      {formData.materials_used && formData.materials_used.length > 0 && (
                        <div className='mt-4'>
                          <h6 className='font-medium mb-2'>Калькуляция материалов:</h6>
                          <div className='max-h-64 overflow-y-auto border rounded'>
                            <table className='w-full text-xs'>
                              <thead className='bg-gray-50 sticky top-0'>
                                <tr className='border-b'>
                                  <th className='text-left py-2 px-2 font-medium'>Артикул</th>
                                  <th className='text-left py-2 px-2 font-medium'>Наименование</th>
                                  <th className='text-right py-2 px-2 font-medium'>Кол-во</th>
                                  <th className='text-left py-2 px-2 font-medium'>Ед.</th>
                                  <th className='text-right py-2 px-2 font-medium'>Цена за ед.</th>
                                  <th className='text-right py-2 px-2 font-medium'>Сумма</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formData.materials_used.map((material: any, index: number) => {
                                  const price = material.price || 0
                                  const quantity = material.quantity || 0
                                  const total = price * quantity

                                  return (
                                    <tr
                                      key={index}
                                      className='border-b border-gray-100 hover:bg-gray-50'
                                    >
                                      <td className='py-2 px-2 text-gray-600'>
                                        {material.article}
                                      </td>
                                      <td className='py-2 px-2'>{material.name}</td>
                                      <td className='py-2 px-2 text-right font-medium'>
                                        {quantity}
                                      </td>
                                      <td className='py-2 px-2'>{material.unit}</td>
                                      <td className='py-2 px-2 text-right text-blue-600'>
                                        {price.toLocaleString('ru-RU')} сом
                                      </td>
                                      <td className='py-2 px-2 text-right font-semibold text-green-600'>
                                        {total.toLocaleString('ru-RU')} сом
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                              <tfoot className='bg-gray-50 border-t-2'>
                                <tr>
                                  <td
                                    colSpan={5}
                                    className='py-2 px-2 font-semibold text-right bg-green-50'
                                  >
                                    ИТОГО себестоимость (материалы + покраска):
                                  </td>
                                  <td className='py-2 px-2 text-right font-bold text-green-700 text-base bg-green-50'>
                                    {(formData.total_cost || 0).toLocaleString('ru-RU')} сом
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

              {/* Покраска */}
              <TabsContent value='paint' className='space-y-4'>
                <Card className='bg-white border border-gray-200'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <PaintBucket className='w-5 h-5' />
                      Настройка покраски (по документу)
                    </CardTitle>
                    <CardDescription>
                      Выберите рецепты, сложность и число слоёв. Площадь берётся из поля «Размер
                      (ШxВxГ, мм)».
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {(formData.paint_jobs || []).length === 0 ? (
                      <div className='p-3 border border-dashed rounded text-gray-600'>
                        Работы не добавлены. Нажмите «Добавить работу».
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        {(formData.paint_jobs || []).map((job, idx) => {
                          const preview = previewPaintJobCost(job)
                          return (
                            <div
                              key={idx}
                              className='grid grid-cols-1 md:grid-cols-12 gap-2 items-end'
                            >
                              <div className='md:col-span-5'>
                                <Label className='text-xs'>Рецепт</Label>
                                <Select
                                  value={job.recipeId}
                                  onValueChange={v => updatePaintJob(idx, { recipeId: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder='Выберите рецепт' />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {paintRecipes.map(r => (
                                      <SelectItem key={r.id} value={r.id}>
                                        {r.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className='md:col-span-3'>
                                <Label className='text-xs'>Сложность</Label>
                                <Select
                                  value={job.complexityId || paintComplexities[0]?.id}
                                  onValueChange={v => updatePaintJob(idx, { complexityId: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {paintComplexities.map(c => (
                                      <SelectItem key={c.id} value={c.id}>
                                        {c.name} ({c.coeff.toFixed(2)}×)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className='md:col-span-2'>
                                <Label className='text-xs'>Слоёв</Label>
                                <Input
                                  type='number'
                                  min={1}
                                  value={job.layers}
                                  onChange={e =>
                                    updatePaintJob(idx, {
                                      layers: Math.max(1, Number(e.target.value) || 1),
                                    })
                                  }
                                />
                              </div>
                              <div className='md:col-span-2'>
                                <div className='text-xs text-gray-500'>Превью</div>
                                <div className='font-semibold text-green-700'>
                                  {preview > 0 ? `${preview.toLocaleString('ru-RU')} сом` : '—'}
                                </div>
                              </div>
                              <div className='md:col-span-12 flex justify-end'>
                                <Button
                                  type='button'
                                  variant='outline'
                                  className='bg-transparent'
                                  onClick={() => removePaintJob(idx)}
                                >
                                  <Trash2 className='w-4 h-4 mr-1' />
                                  Удалить
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className='flex flex-wrap gap-2'>
                      <Button type='button' onClick={addPaintJob}>
                        <Plus className='w-4 h-4 mr-1' />
                        Добавить работу
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={recalcByEngine}
                        className='bg-transparent'
                      >
                        <CalculatorRefresh className='w-4 h-4 mr-1' />
                        Пересчитать цену по движку
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Разовый калькулятор (сохранён) */}
                <Card className='bg-white border border-gray-200'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <PaintBucket className='w-5 h-5' />
                      Разовый расчёт покраски
                    </CardTitle>
                    <CardDescription>Добавляйте/заменяйте себестоимость вручную.</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <PaintCostPanel
                      onApplyAdd={cost => {
                        setFormData(prev => {
                          const total = (prev.total_cost || 0) + (cost || 0)
                          return {
                            ...prev,
                            total_cost: total,
                            base_price: total + (prev.markup || 0),
                          }
                        })
                      }}
                      onApplyReplace={cost => {
                        setFormData(prev => {
                          const total = cost || 0
                          return {
                            ...prev,
                            total_cost: total,
                            base_price: total + (prev.markup || 0),
                          }
                        })
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Изображения */}
              <TabsContent value='images' className='space-y-4'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-semibold'>Изображения товара</h4>
                    {formData.images && formData.images.length > 0 && (
                      <Badge variant='outline' className='bg-blue-50 text-blue-700'>
                        {formData.images.length} фото
                      </Badge>
                    )}
                  </div>

                  <FileUpload
                    onFilesUploaded={handleImagesUploaded}
                    title='Загрузить изображения'
                    description='Перетащите изображения товара или нажмите для выбора'
                    acceptedFileTypes={['.jpg', '.jpeg', '.png']}
                    maxFiles={5}
                  />

                  {formData.images && formData.images.length > 0 && (
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                      {formData.images.map((imageUrl, index) => (
                        <div key={index} className='relative group'>
                          <img
                            src={imageUrl}
                            alt={`Изображение ${index + 1}`}
                            className='w-full h-24 object-cover rounded-lg border'
                          />
                          <Button
                            size='sm'
                            variant='destructive'
                            type='button'
                            className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity'
                            onClick={() => {
                              const newImages = formData.images?.filter((_, i) => i !== index) || []
                              setFormData(prev => ({ ...prev, images: newImages }))
                            }}
                          >
                            <X className='w-3 h-3' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Цена (итог) */}
              <TabsContent value='final' className='space-y-4'>
                <Card className='bg-white border border-gray-200'>
                  <CardHeader>
                    <CardTitle>Итоги</CardTitle>
                    <CardDescription>Проверьте значения перед сохранением.</CardDescription>
                  </CardHeader>
                  <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                      <div className='text-sm text-gray-500'>Себестоимость (мат.+покраска)</div>
                      <div className='text-xl font-bold text-blue-700'>
                        {(formData.total_cost || 0).toLocaleString('ru-RU')} сом
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-gray-500'>Наценка</div>
                      <div className='text-xl font-bold text-amber-700'>
                        {(formData.markup || 0).toLocaleString('ru-RU')} сом
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-gray-500'>Итоговая цена</div>
                      <div className='text-xl font-bold text-green-700'>
                        {(formData.base_price || 0).toLocaleString('ru-RU')} сом
                      </div>
                    </div>
                    <div className='md:col-span-3'>
                      <Button
                        type='button'
                        variant='outline'
                        className='bg-transparent'
                        onClick={recalcByEngine}
                      >
                        <CalculatorRefresh className='w-4 h-4 mr-1' />
                        Пересчитать по движку
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтры списка */}
      <div className='flex flex-col lg:flex-row gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              placeholder='Поиск по названию или артикулу...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>
        <div className='lg:w-48'>
          <Select value={filterCollection} onValueChange={setFilterCollection}>
            <SelectTrigger>
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
        <div className='lg:w-48'>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Все типы</SelectItem>
              {productTypes.map(type => (
                <SelectItem key={type.id} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Список товаров */}
      <div className='grid gap-4'>
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className='p-8 text-center'>
              <p className='text-gray-500'>Товары не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map(product => {
            const colors = getCollectionColors(product.collection)
            const finalPrice =
              product.base_price && product.base_price > 0
                ? product.base_price
                : product.total_cost + product.markup

            return (
              <Card
                key={product.id}
                className={`cursor-pointer hover:shadow-lg transition-all duration-300 ${colors.bg} ${colors.border} border-2`}
              >
                <CardContent className='p-4'>
                  {/* Accent */}
                  <div className={`h-1 ${colors.accent} rounded-full mb-3 opacity-60`}></div>

                  <div className='flex items-start gap-4' onClick={() => viewDetails(product)}>
                    {/* Image */}
                    <div className='flex-shrink-0'>
                      {product.images && product.images.length > 0 ? (
                        <div className='relative'>
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className={`w-24 h-24 object-cover rounded-lg border-2 ${colors.border} shadow-md hover:shadow-lg transition-shadow`}
                            onError={e => {
                              console.log('❌ Ошибка загрузки изображения:', product.images[0])
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                          <div
                            className={`w-24 h-24 ${colors.bg} rounded-lg border-2 ${colors.border} items-center justify-center hidden`}
                          >
                            <Image className={`w-8 h-8 ${colors.text} opacity-60`} />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`w-24 h-24 ${colors.bg} rounded-lg border-2 ${colors.border} flex items-center justify-center shadow-md`}
                        >
                          <Image className={`w-8 h-8 ${colors.text} opacity-60`} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className='flex-1'>
                      <h3
                        className={`font-semibold text-lg ${colors.text} hover:opacity-80 transition-opacity`}
                      >
                        {product.name}
                      </h3>
                      <p className='text-sm text-gray-600'>Категория: {product.category}</p>
                      <div className='flex items-center gap-2 mt-1'>
                        <Badge className={`${colors.accent} text-white border-0 shadow-sm`}>
                          {product.collection}
                        </Badge>
                        <Badge
                          variant='secondary'
                          className='bg-white border border-gray-300 text-gray-700'
                        >
                          {product.type}
                        </Badge>
                      </div>
                      {product.description && (
                        <p className='text-sm text-gray-600 mt-1'>
                          {product.description.length > 100
                            ? product.description.substring(0, 100) + '...'
                            : product.description}
                        </p>
                      )}
                      <div className='flex items-center gap-4 mt-2'>
                        <p className='text-xl font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg shadow-sm'>
                          {finalPrice > 0 ? finalPrice.toLocaleString('ru-RU') : '0'} сом
                        </p>
                        {product.total_cost > 0 && (
                          <p className='text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded'>
                            Себестоимость: {product.total_cost.toLocaleString('ru-RU')} сом
                          </p>
                        )}
                        {product.markup > 0 && (
                          <p className={`text-sm ${colors.text} bg-white px-2 py-1 rounded border`}>
                            Наценка: {product.markup.toLocaleString('ru-RU')} сом
                          </p>
                        )}
                      </div>
                      <div className='flex items-center gap-2 mt-2'>
                        {product.tech_specs && (
                          <Badge className='bg-blue-100 text-blue-800 border border-blue-200'>
                            <FileSpreadsheet className='w-3 h-3 mr-1' />
                            Тех карта
                          </Badge>
                        )}
                        {product.images && product.images.length > 0 && (
                          <Badge className='bg-purple-100 text-purple-800 border border-purple-200'>
                            <Image className='w-3 h-3 mr-1' />
                            {product.images.length} фото
                          </Badge>
                        )}
                        {finalPrice === 0 && (
                          <Badge
                            variant='destructive'
                            className='bg-red-100 text-red-700 border border-red-200'
                          >
                            ⚠️ Цена не установлена
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex flex-col gap-2' onClick={e => e.stopPropagation()}>
                      {product.tech_specs && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => viewTechCard(product)}
                          className={`${colors.text} hover:bg-blue-50 border-blue-200`}
                        >
                          <FileSpreadsheet className='w-4 h-4' />
                        </Button>
                      )}
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => viewHistory(product)}
                        className='text-purple-600 hover:bg-purple-50 border-purple-200'
                      >
                        <History className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEdit(product)}
                        className={`${colors.text} hover:${colors.bg} ${colors.border}`}
                      >
                        <Edit2 className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDelete(product.id)}
                        className='text-red-600 hover:bg-red-50 border-red-200'
                      >
                        <Trash2 className='w-4 h-4' />
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
