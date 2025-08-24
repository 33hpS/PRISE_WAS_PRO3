/**
 * @file PaintCostPanel.tsx
 * @description Панель расчёта стоимости покраски изделия по выбранному рецепту.
 * Поддерживает: выбор рецепта, ввод габаритов, слоёв, потерь и коэффициента сложности.
 * Источники данных:
 *  - Supabase: paint_recipes, paint_complexity (если есть)
 *  - Fallback: localStorage ('wasser_paint_recipes') + дефолтные сложности
 */

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Calculator, PaintBucket } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { computePaintCost, surfaceAreaM2 } from '../lib/costing'

/** Минимальная форма рецепта для расчёта */
interface PaintRecipeShape {
  id: string
  name: string
  finish_type?: string | null
  price_per_m2?: number | null
  cost_per_g?: number | null
  consumption_g_per_m2?: number | null
  /** JSON с ratio: { ratio: { base, hardener, thinner } } */
  notes?: string | null
  base?: string | null
  hardener?: string | null
  thinner?: string | null
}

/** Сложность окраски */
interface ComplexityShape {
  id?: string
  name: string
  coeff: number
}

/** Ключ локального хранилища с рецептами (как в PaintRecipesManager) */
const LS_RECIPES = 'wasser_paint_recipes'

/** Безопасный парс notes JSON */
function parseNotes<T = any>(raw?: string | null): T | null {
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

/** Формат сом */
function kgs(n?: number | null) {
  if (!n || n <= 0) return '—'
  return `${Math.round(n).toLocaleString('ru-RU')} сом`
}

/**
 * Компонент панели расчёта стоимости покраски.
 * Пропсы: onApplyAdd/onApplyReplace — коллбеки для передачи рассчитанной цены вверх.
 */
export default function PaintCostPanel({
  onApplyAdd,
  onApplyReplace,
}: {
  /** Добавить рассчитанную стоимость к текущей себестоимости */
  onApplyAdd?: (cost: number) => void
  /** Заменить текущую себестоимость рассчитанной стоимостью */
  onApplyReplace?: (cost: number) => void
}) {
  const [recipes, setRecipes] = useState<PaintRecipeShape[]>([])
  const [complexities, setComplexities] = useState<ComplexityShape[]>([
    { name: 'Стандарт', coeff: 1.0 },
    { name: 'Сложный', coeff: 1.15 },
    { name: 'Очень сложный', coeff: 1.3 },
  ])
  const [loading, setLoading] = useState<boolean>(true)

  // Форма расчёта
  const [recipeId, setRecipeId] = useState<string>('')
  const [complexityName, setComplexityName] = useState<string>('Стандарт')
  const [width, setWidth] = useState<number>(600)    // мм
  const [height, setHeight] = useState<number>(800)  // мм
  const [depth, setDepth] = useState<number>(150)    // мм
  const [layers, setLayers] = useState<number>(2)
  const [loss, setLoss] = useState<number>(5)

  useEffect(() => { void load() }, [])

  /**
   * Загрузка рецептов и сложностей.
   * Fallback: localStorage для рецептов и предустановленный массив для сложностей.
   */
  const load = async () => {
    try {
      setLoading(true)
      // РЕЦЕПТЫ
      const { data, error } = await supabase
        .from('paint_recipes')
        .select('id, name, finish_type, price_per_m2, cost_per_g, consumption_g_per_m2, notes, base, hardener, thinner')
        .order('name')
      if (error) {
        // fallback LS
        const raw = localStorage.getItem(LS_RECIPES)
        const ls = raw ? (JSON.parse(raw) as PaintRecipeShape[]) : []
        setRecipes(ls)
      } else {
        setRecipes(data || [])
        // параллельно поддержим локальный кеш
        try { localStorage.setItem(LS_RECIPES, JSON.stringify(data || [])) } catch {/* noop */}
      }

      // СЛОЖНОСТИ (необязательная таблица)
      try {
        const { data: cmx, error: e2 } = await supabase
          .from('paint_complexity')
          .select('id, name, coeff')
          .order('coeff')
        if (!e2 && cmx && cmx.length > 0) {
          const normalized = cmx.map((c: any) => ({ id: c.id, name: c.name, coeff: Number(c.coeff) || 1 }))
          setComplexities(normalized)
          if (!normalized.find(c => c.name === complexityName)) {
            setComplexityName(normalized[0].name)
          }
        }
      } catch { /* ignore */ }
    } finally {
      setLoading(false)
    }
  }

  /** Выбранный рецепт и сложность */
  const selectedRecipe = useMemo(() => recipes.find(r => r.id === recipeId) || null, [recipes, recipeId])
  const selectedComplexity = useMemo(
    () => complexities.find(c => c.name === complexityName) || { name: 'Стандарт', coeff: 1 },
    [complexities, complexityName]
  )

  /** Площадь, эффективная цена за м² и финальная стоимость */
  const areaM2 = useMemo(() => surfaceAreaM2(width, height, depth), [width, height, depth])

  const effectivePricePerM2 = useMemo(() => {
    if (!selectedRecipe) return 0
    const direct = Math.max(0, Number(selectedRecipe.price_per_m2) || 0)
    if (direct > 0) return direct
    const perG = Math.max(0, Number(selectedRecipe.cost_per_g) || 0)
    const cons = Math.max(0, Number(selectedRecipe.consumption_g_per_m2) || 0)
    return perG > 0 && cons > 0 ? Math.round(perG * cons) : 0
  }, [selectedRecipe])

  const finalCost = useMemo(() => {
    return computePaintCost({
      recipe: selectedRecipe || undefined,
      complexity: selectedComplexity,
      width_mm: width,
      height_mm: height,
      depth_mm: depth,
      layers,
      lossPercent: loss,
    })
  }, [selectedRecipe, selectedComplexity, width, height, depth, layers, loss])

  /** Строка соотношения A:B:Th (из notes.ratio) */
  const ratioStr = useMemo(() => {
    const ratio = parseNotes(selectedRecipe?.notes || '')?.ratio
    const a = Math.max(0, Number(ratio?.base) || 0)
    const b = Math.max(0, Number(ratio?.hardener) || 0)
    const t = Math.max(0, Number(ratio?.thinner) || 0)
    if (a === 0 && b === 0 && t === 0) return '—'
    return `${a}:${b}:${t}`
  }, [selectedRecipe])

  if (loading) {
    return <div className="p-4 text-gray-600">Загрузка рецептов...</div>
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PaintBucket className="w-5 h-5" />
          Расчёт покраски
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Выбор рецепта и сложности */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Рецепт</Label>
            <Select value={recipeId} onValueChange={setRecipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите рецепт" />
              </SelectTrigger>
              <SelectContent>
                {recipes.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Сложность</Label>
            <Select value={complexityName} onValueChange={setComplexityName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {complexities.map(c => (
                  <SelectItem key={c.id || c.name} value={c.name}>
                    {c.name} ({c.coeff.toFixed(2)}×)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Инфо о рецепте */}
        {selectedRecipe ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">{selectedRecipe.finish_type || 'Покрытие'}</Badge>
            <Badge variant="outline">A:B:Th = {ratioStr}</Badge>
            <Badge variant="outline">
              Расход: {selectedRecipe.consumption_g_per_m2 ? `${selectedRecipe.consumption_g_per_m2} г/м²` : '—'}
            </Badge>
            <Badge className="bg-blue-50 text-blue-800 border border-blue-200">
              Цена м²: {kgs(effectivePricePerM2)}
            </Badge>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Выберите рецепт для расчёта.</div>
        )}

        {/* Геометрия */}
        <div className="rounded-lg border p-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Ширина, мм</Label>
              <Input type="number" min="1" value={width} onChange={e => setWidth(Number(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Высота, мм</Label>
              <Input type="number" min="1" value={height} onChange={e => setHeight(Number(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Глубина, мм</Label>
              <Input type="number" min="1" value={depth} onChange={e => setDepth(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <Label>Слоёв</Label>
              <Input type="number" min="1" value={layers} onChange={e => setLayers(Number(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Потери, %</Label>
              <Input type="number" min="0" value={loss} onChange={e => setLoss(Number(e.target.value) || 0)} />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Площадь: <span className="font-semibold">{areaM2.toFixed(3)}</span> м²
              </div>
            </div>
          </div>
        </div>

        {/* Итог и действия */}
        <div className="rounded-lg border p-3 bg-gray-50">
          <div className="flex items-center gap-2 text-gray-700">
            <Calculator className="w-4 h-4" />
            Итоговая стоимость покраски:
            <span className="font-semibold text-green-700">{kgs(finalCost)}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={!selectedRecipe || finalCost <= 0}
              onClick={() => onApplyAdd && onApplyAdd(finalCost)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Добавить к себестоимости
            </Button>
            <Button
              variant="outline"
              disabled={!selectedRecipe || finalCost <= 0}
              onClick={() => onApplyReplace && onApplyReplace(finalCost)}
            >
              Заменить себестоимость
            </Button>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Формула: (
            {effectivePricePerM2 > 0 ? 'цена м²' : 'цена/г × расход'} × коэффициент сложности × (1 + потери%) × площадь × слои).
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
