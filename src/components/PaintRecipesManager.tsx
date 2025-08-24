/** 
 * @file PaintRecipesManager.tsx
 * @description Менеджер рецептов окраски: список, поиск и модальная форма «Добавить рецепт краски».
 * В этой редакции улучшена вёрстка модального окна:
 *  - Ровная сетка, одинаковая высота полей и подсказок, предсказуемые отступы.
 *  - Инпуты h-10, равные колонки, стабильные подсказки (min-h для хинтов).
 *  - Блок «Соотношение A:B:Th» вынесен в собственную строку с 3 равными колонками.
 * Функциональность выбора материалов и авторасчёта сохранена.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { PaintBucket, Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import MaterialAutocomplete, { MaterialOption } from './inputs/MaterialAutocomplete'

/** Структура рецепта окраски (расширенная) */
interface PaintRecipe {
  id: string
  colorName: string
  base: string
  hardener: string
  thinner: string
  coatingType: string
  pricePerM2?: number
  pricePerSqm?: number
  costPerG?: number
  consumptionGPerM2?: number
  ratio?: { base: number; hardener: number; thinner: number } | null
  notes?: string | null
  created_at: string
}

/** Результат загрузки */
interface LoadResult {
  data: PaintRecipe[]
  from: 'db' | 'local'
}

/** Ключи локального кэша */
const LS_KEY = 'paint:recipes'
const LS_KEY_COMPAT = 'wasser_paint_recipes'

/** Прочитать рецепты из LocalStorage (наш формат) */
function readLocal(): PaintRecipe[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as PaintRecipe[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/** Сохранить рецепты в LocalStorage в двух форматах (наш и совместимый) */
function writeLocal(list: PaintRecipe[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {/* ignore */}
  // Совместимость с PaintCostPanel
  try {
    const mapped = list.map((r) => ({
      id: r.id,
      name: r.colorName,
      finish_type: r.coatingType || null,
      price_per_m2: Number(r.pricePerM2 ?? r.pricePerSqm ?? 0) || null,
      cost_per_g: Number(r.costPerG ?? 0) || null,
      consumption_g_per_m2: Number(r.consumptionGPerM2 ?? 0) || null,
      notes: JSON.stringify({
        ratio: r.ratio || { base: 0, hardener: 0, thinner: 0 },
        base: r.base,
        hardener: r.hardener,
        thinner: r.thinner,
      }),
      base: r.base,
      hardener: r.hardener,
      thinner: r.thinner,
    }))
    localStorage.setItem(LS_KEY_COMPAT, JSON.stringify(mapped))
  } catch {/* ignore */}
}

/** Безопасный парс notes JSON */
function parseNotes<T = any>(raw?: string | null): T | null {
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

/** Вычислить эффективную цену за м²: приоритет — прямая цена, иначе (цена/г × расход) */
function effectivePricePerM2(r?: Partial<PaintRecipe> | null): number {
  if (!r) return 0
  const direct = Number(r.pricePerM2 ?? r.pricePerSqm ?? 0)
  if (direct > 0) return direct
  const perG = Number(r.costPerG ?? 0)
  const cons = Number(r.consumptionGPerM2 ?? 0)
  if (perG > 0 && cons > 0) return Math.round(perG * cons)
  return 0
}

/** Попытаться прочитать из БД (любая из схем). Нормализуем в наш интерфейс. */
async function tryLoadFromDb(): Promise<PaintRecipe[]> {
  const { data, error } = await supabase.from('paint_recipes').select('*').order('created_at', { ascending: false })
  if (error) {
    throw error
  }
  return (data || []).map((r: any) => {
    const notes = r.notes ?? null
    const parsed = parseNotes<{ ratio?: { base?: number; hardener?: number; thinner?: number } }>(notes)
    return {
      id: r.id,
      colorName: r.name ?? r.color_name ?? r.colorName ?? '',
      base: r.base ?? '',
      hardener: r.hardener ?? '',
      thinner: r.thinner ?? '',
      coatingType: r.finish_type ?? r.coating_type ?? '',
      pricePerM2: Number(r.price_per_m2 ?? 0) || undefined,
      pricePerSqm: Number(r.price_per_sqm ?? 0) || undefined,
      costPerG: Number(r.cost_per_g ?? 0) || undefined,
      consumptionGPerM2: Number(r.consumption_g_per_m2 ?? 0) || undefined,
      ratio: parsed?.ratio
        ? {
            base: Number(parsed.ratio.base ?? 0) || 0,
            hardener: Number(parsed.ratio.hardener ?? 0) || 0,
            thinner: Number(parsed.ratio.thinner ?? 0) || 0,
          }
        : null,
      notes: notes,
      created_at: r.created_at || new Date().toISOString(),
    } as PaintRecipe
  })
}

/** Сохранить рецепт в БД: сперва новая схема → fallback на старую. */
async function tryInsertToDb(item: PaintRecipe): Promise<void> {
  const payloadNew = {
    id: item.id,
    name: item.colorName,
    finish_type: item.coatingType,
    price_per_m2: Number(item.pricePerM2 ?? item.pricePerSqm ?? 0) || 0,
    cost_per_g: Number(item.costPerG ?? 0) || null,
    consumption_g_per_m2: Number(item.consumptionGPerM2 ?? 0) || null,
    notes: JSON.stringify({
      ratio: item.ratio || { base: 0, hardener: 0, thinner: 0 },
      base: item.base,
      hardener: item.hardener,
      thinner: item.thinner,
    }),
    base: item.base,
    hardener: item.hardener,
    thinner: item.thinner,
    created_at: item.created_at,
  }
  let res = await supabase.from('paint_recipes').insert([payloadNew])
  if (!res.error) return

  const payloadLegacy = {
    id: item.id,
    color_name: item.colorName,
    base: item.base,
    hardener: item.hardener,
    thinner: item.thinner,
    coating_type: item.coatingType,
    price_per_sqm: Number(item.pricePerM2 ?? item.pricePerSqm ?? 0) || 0,
    created_at: item.created_at,
  }
  res = await supabase.from('paint_recipes').insert([payloadLegacy])
  if (res.error) throw res.error
}

/** Удалить рецепт из БД */
async function tryDeleteFromDb(id: string): Promise<void> {
  const { error } = await supabase.from('paint_recipes').delete().eq('id', id)
  if (error) throw error
}

/** Перевод цены за ед. в цену за грамм (если единица массы поддерживается) */
function unitPriceToPerGram(unit: string | undefined, price: number | undefined | null): number | null {
  const u = (unit || '').toLowerCase()
  const p = Number(price) || 0
  if (p <= 0) return null
  if (u === 'кг' || u === 'kg') return p / 1000
  if (u === 'г' || u === 'гр' || u === 'g') return p
  return null // Л/мл требуют плотность — пропускаем
}

/** Расчёт стоимости грамма смеси по компонентам и соотношению A:B:Th */
function computeMixtureCostPerG(params: {
  base?: MaterialOption | null
  hardener?: MaterialOption | null
  thinner?: MaterialOption | null
  ratio: { base: number; hardener: number; thinner: number }
}): number {
  const { base, hardener, thinner, ratio } = params
  const parts = [
    { perG: base ? unitPriceToPerGram(base.unit, base.price) : null, share: ratio.base },
    { perG: hardener ? unitPriceToPerGram(hardener.unit, hardener.price) : null, share: ratio.hardener },
    { perG: thinner ? unitPriceToPerGram(thinner.unit, thinner.price) : null, share: ratio.thinner },
  ].filter((p) => p.perG !== null && p.share > 0) as { perG: number; share: number }[]

  const sumShare = parts.reduce((s, p) => s + p.share, 0)
  if (sumShare <= 0 || parts.length === 0) return 0

  const weighted = parts.reduce((acc, p) => acc + p.perG * p.share, 0)
  const perG = weighted / sumShare
  return Math.round((perG + Number.EPSILON) * 10000) / 10000 // 4 знака
}

/**
 * Компонент менеджера рецептов окраски
 */
export default function PaintRecipesManager(): JSX.Element {
  const [recipes, setRecipes] = useState<PaintRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'db' | 'local'>('local')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Поля формы
  const [colorName, setColorName] = useState('')
  const [coatingType, setCoatingType] = useState('')

  // Компоненты смеси
  const [baseMat, setBaseMat] = useState<MaterialOption | null>(null)
  const [hardenerMat, setHardenerMat] = useState<MaterialOption | null>(null)
  const [thinnerMat, setThinnerMat] = useState<MaterialOption | null>(null)

  const [ratioBase, setRatioBase] = useState<number>(0)
  const [ratioHardener, setRatioHardener] = useState<number>(0)
  const [ratioThinner, setRatioThinner] = useState<number>(0)

  const [pricePerM2, setPricePerM2] = useState<string>('') // прямое
  const [costPerG, setCostPerG] = useState<string>('')      // сом/г
  const [consumption, setConsumption] = useState<string>('') // г/м²

  const [autoFromComponents, setAutoFromComponents] = useState<boolean>(true)
  const [costDirty, setCostDirty] = useState<boolean>(false)

  /** Загрузка данных с фолбэком */
  const load = useCallback(async (): Promise<LoadResult> => {
    try {
      setLoading(true)
      setError(null)
      const data = await tryLoadFromDb()
      setRecipes(data)
      writeLocal(data)
      return { data, from: 'db' }
    } catch {
      const local = readLocal()
      setRecipes(local)
      return { data: local, from: 'local' }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().then((res) => setSource(res.from))
  }, [load])

  /** Авторасчёт цена/г из выбранных компонентов */
  useEffect(() => {
    if (!autoFromComponents || costDirty) return
    const perG = computeMixtureCostPerG({
      base: baseMat,
      hardener: hardenerMat,
      thinner: thinnerMat,
      ratio: { base: ratioBase || 0, hardener: ratioHardener || 0, thinner: ratioThinner || 0 },
    })
    if (perG > 0) {
      setCostPerG(String(perG))
    }
  }, [autoFromComponents, costDirty, baseMat, hardenerMat, thinnerMat, ratioBase, ratioHardener, ratioThinner])

  /** Фильтрация по поиску */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return recipes
    return recipes.filter((r) => (
      r.colorName.toLowerCase().includes(s) ||
      (r.base || '').toLowerCase().includes(s) ||
      (r.hardener || '').toLowerCase().includes(s) ||
      (r.coatingType || '').toLowerCase().includes(s)
    ))
  }, [q, recipes])

  /** Очистка формы */
  const resetForm = () => {
    setColorName('')
    setCoatingType('')
    setBaseMat(null)
    setHardenerMat(null)
    setThinnerMat(null)
    setRatioBase(0)
    setRatioHardener(0)
    setRatioThinner(0)
    setPricePerM2('')
    setCostPerG('')
    setConsumption('')
    setAutoFromComponents(true)
    setCostDirty(false)
    setError(null)
  }

  /** Превью цены за м² */
  const previewPricePerM2 = useMemo(() => {
    const direct = Number(pricePerM2)
    if (direct > 0) return direct
    const perG = Number(costPerG)
    const cons = Number(consumption)
    if (perG > 0 && cons > 0) return Math.round(perG * cons)
    return 0
  }, [pricePerM2, costPerG, consumption])

  /** Валидация формы */
  const validate = (): string | null => {
    if (!colorName.trim()) return 'Укажите название цвета'
    if (!coatingType.trim()) return 'Укажите тип покрытия'
    const direct = Number(pricePerM2)
    const perG = Number(costPerG)
    const cons = Number(consumption)
    if (!(direct > 0 || (perG > 0 && cons > 0))) {
      return 'Заполните цену за м² или укажите цену/г и расход г/м²'
    }
    if (ratioBase < 0 || ratioHardener < 0 || ratioThinner < 0) {
      return 'Соотношение не может быть отрицательным'
    }
    return null
  }

  /** Создание рецепта */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      return
    }

    const item: PaintRecipe = {
      id: `rec_${Date.now()}`,
      colorName: colorName.trim(),
      base: baseMat ? baseMat.name : '',
      hardener: hardenerMat ? hardenerMat.name : '',
      thinner: thinnerMat ? thinnerMat.name : '',
      coatingType: coatingType.trim(),
      pricePerM2: Number(pricePerM2) || undefined,
      pricePerSqm: Number(pricePerM2) || undefined, // совместимость
      costPerG: Number(costPerG) || undefined,
      consumptionGPerM2: Number(consumption) || undefined,
      ratio: { base: ratioBase || 0, hardener: ratioHardener || 0, thinner: ratioThinner || 0 },
      notes: JSON.stringify({
        ratio: { base: ratioBase || 0, hardener: ratioHardener || 0, thinner: ratioThinner || 0 },
        base: baseMat ? { id: baseMat.id, name: baseMat.name, unit: baseMat.unit, price: baseMat.price } : null,
        hardener: hardenerMat ? { id: hardenerMat.id, name: hardenerMat.name, unit: hardenerMat.unit, price: hardenerMat.price } : null,
        thinner: thinnerMat ? { id: thinnerMat.id, name: thinnerMat.name, unit: thinnerMat.unit, price: thinnerMat.price } : null,
      }),
      created_at: new Date().toISOString(),
    }

    try {
      await tryInsertToDb(item)
      const next = [item, ...recipes]
      setRecipes(next)
      setSource('db')
      writeLocal(next)
      setOpen(false)
      resetForm()
    } catch {
      const next = [item, ...recipes]
      setRecipes(next)
      setSource('local')
      writeLocal(next)
      setOpen(false)
      resetForm()
    }
  }

  /** Удаление рецепта */
  const handleDelete = async (id: string) => {
    const next = recipes.filter((r) => r.id !== id)
    setRecipes(next)
    writeLocal(next)
    try {
      await tryDeleteFromDb(id)
      setSource('db')
    } catch {
      setSource('local')
    }
  }

  /** Формат сом */
  const kgs = (n?: number | null) => (n && n > 0 ? `${Math.round(n).toLocaleString('ru-RU')} сом` : '—')

  return (
    <div className="space-y-4">
      {/* Шапка секции */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <PaintBucket className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-semibold text-gray-900">Рецепты окраски</div>
            <div className="text-xs text-gray-500">
              Источник: {source === 'db' ? 'База данных' : 'Локальное хранилище'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по цвету или типу покрытия"
              className="pl-8 w-[220px] h-10"
              aria-label="Поиск рецептов"
            />
          </div>

          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
            <DialogTrigger asChild>
              <Button className="whitespace-nowrap">
                <Plus className="w-4 h-4 mr-1.5" />
                Добавить рецепт
              </Button>
            </DialogTrigger>

            {/* Контрастное модальное окно */}
            <DialogContent
              aria-describedby={undefined}
              className="sm:max-w-3xl bg-white text-gray-900 border border-gray-200 shadow-2xl rounded-xl p-0"
            >
              <DialogHeader className="border-b border-gray-200 bg-gray-50 rounded-t-xl px-6 py-4 sticky top-0 z-10">
                <DialogTitle className="text-base font-semibold text-gray-900">
                  Добавить рецепт краски
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
                {error && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2.5">
                    {error}
                  </div>
                )}

                {/* Основная информация */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="colorName">Название цвета</Label>
                    <Input
                      id="colorName"
                      className="h-10"
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      placeholder="Например: Белый глянец"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coatingType">Тип покрытия</Label>
                    <Input
                      id="coatingType"
                      className="h-10"
                      value={coatingType}
                      onChange={(e) => setCoatingType(e.target.value)}
                      placeholder="Глянцевое"
                      required
                    />
                  </div>
                </div>

                {/* Компоненты смеси из БД материалов (краски) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MaterialAutocomplete
                    label="Основа (из материалов)"
                    placeholder="Поиск: название или арт"
                    selected={baseMat}
                    onSelect={(m) => setBaseMat(m)}
                    hint="Показываются только материалы типа 'краска'"
                  />
                  <MaterialAutocomplete
                    label="Отвердитель (из материалов)"
                    placeholder="Поиск: название или арт"
                    selected={hardenerMat}
                    onSelect={(m) => setHardenerMat(m)}
                    hint="Показываются только материалы типа 'краска'"
                  />
                  <MaterialAutocomplete
                    label="Разбавитель (из материалов)"
                    placeholder="Поиск: название или арт"
                    selected={thinnerMat}
                    onSelect={(m) => setThinnerMat(m)}
                    hint="Показываются только материалы типа 'краска'"
                  />
                </div>

                {/* Соотношение */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Соотношение A:B:Th</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      type="number"
                      min="0"
                      className="h-10"
                      value={ratioBase}
                      onChange={(e) => setRatioBase(Number(e.target.value) || 0)}
                      placeholder="A (base)"
                    />
                    <Input
                      type="number"
                      min="0"
                      className="h-10"
                      value={ratioHardener}
                      onChange={(e) => setRatioHardener(Number(e.target.value) || 0)}
                      placeholder="B (hardener)"
                    />
                    <Input
                      type="number"
                      min="0"
                      className="h-10"
                      value={ratioThinner}
                      onChange={(e) => setRatioThinner(Number(e.target.value) || 0)}
                      placeholder="Th (thinner)"
                    />
                  </div>
                </div>

                {/* Переключатель авторасчёта */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={autoFromComponents}
                    onCheckedChange={setAutoFromComponents}
                    id="autoFromComponents"
                  />
                  <Label htmlFor="autoFromComponents" className="text-sm">
                    Авторасчёт «цена/г» из компонентов (только для ед. массы: кг/г)
                  </Label>
                </div>

                {/* Экономика: прямая цена или цена/г × расход */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pricePerM2">Цена за м² (прямо)</Label>
                    <Input
                      id="pricePerM2"
                      type="number"
                      step="0.01"
                      min="0"
                      className="h-10"
                      value={pricePerM2}
                      onChange={(e) => setPricePerM2(e.target.value)}
                      placeholder="например, 1200"
                    />
                    {/* Резерв под подсказку, чтобы ряды не «прыгали» */}
                    <div className="text-xs text-gray-500 min-h-[32px]" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="costPerG">Цена/г (сом/г)</Label>
                    <Input
                      id="costPerG"
                      type="number"
                      step="0.0001"
                      min="0"
                      className="h-10"
                      value={costPerG}
                      onChange={(e) => { setCostPerG(e.target.value); setCostDirty(true) }}
                      placeholder="например, 0.9"
                    />
                    <div className="text-xs text-gray-500 min-h-[32px]">
                      Если включён авторасчёт — здесь автоматически появится значение из выбранных материалов и соотношения.
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="consumption">Расход (г/м²)</Label>
                    <Input
                      id="consumption"
                      type="number"
                      step="0.1"
                      min="0"
                      className="h-10"
                      value={consumption}
                      onChange={(e) => setConsumption(e.target.value)}
                      placeholder="например, 120"
                    />
                    <div className="text-xs text-gray-500 min-h-[32px]" />
                  </div>
                </div>

                {/* Превью и подсказка формулы */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge className="bg-blue-50 text-blue-800 border border-blue-200">
                    Цена м² (превью): {kgs(previewPricePerM2)}
                  </Badge>
                  <span className="text-gray-500">
                    Формула: {pricePerM2 && Number(pricePerM2) > 0 ? 'прямая цена' : 'цена/г × расход'}
                  </span>
                </div>

                <DialogFooter className="px-0 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => setOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button type="submit">Сохранить</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Список рецептов */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Список рецептов</CardTitle>
          <CardDescription>Всего: {recipes.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 gap-2">
              <div className="h-9 bg-gray-100 rounded animate-pulse" />
              <div className="h-9 bg-gray-100 rounded animate-pulse" />
              <div className="h-9 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 border border-dashed border-gray-300 rounded-lg text-gray-600">
              Рецептов пока нет. Нажмите «Добавить рецепт», чтобы создать первый.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[260px]">Название цвета</TableHead>
                    <TableHead>Тип покрытия</TableHead>
                    <TableHead>Расход</TableHead>
                    <TableHead className="text-right">Цена за м²</TableHead>
                    <TableHead className="w-[1%] whitespace-nowrap text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const price = effectivePricePerM2(r)
                    const ratio = r.ratio || { base: 0, hardener: 0, thinner: 0 }
                    const ratioText = `${ratio.base}:${ratio.hardener}:${ratio.thinner}`
                    return (
                      <TableRow key={r.id} id={`tabpanel-${r.id}`}>
                        <TableCell className="font-medium">
                          {r.colorName}
                          <div className="text-xs text-gray-500">
                            A:B:Th = {ratioText}
                          </div>
                        </TableCell>
                        <TableCell title={`Основа: ${r.base || '—'} | Отвердитель: ${r.hardener || '—'} | Разбавитель: ${r.thinner || '—'}`}>
                          {r.coatingType || '—'}
                        </TableCell>
                        <TableCell>
                          {r.consumptionGPerM2 ? `${r.consumptionGPerM2} г/м²` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {kgs(price)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="outline"
                            className="bg-transparent"
                            aria-label={`Удалить рецепт ${r.colorName}`}
                            title="Удалить"
                            onClick={() => handleDelete(r.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
