/**
 * @file calc-engine.ts
 * @description Универсальный движок расчётов себестоимости и цены изделия в стиле "прикреплённого документа".
 * Содержит: calculateMaterialCost, processBOM, calculatePaintCost, calculateProductCost, validateCostCalculation.
 * Терпимо относится к неполным данным (id/артикул/имя, коэффициенты, рецепты).
 */

export interface MaterialRecord {
  id?: string
  name: string
  unit?: string
  price?: number
  article?: string
  consumptionCoeff?: number | null
  type?: string
}

export interface TechCardItemRef {
  materialId?: string
  article?: string
  name?: string
  quantity?: number
  unit?: string
  /** Коэффициент потребления материала, если задан для конкретной строки */
  consumptionCoeff?: number | null
}

export interface PaintRecipeRef {
  id: string
  name: string
  /** Прямая цена за м² (сом/м²) */
  pricePerM2?: number | null
  /** Цена смеси за грамм (сом/г) */
  costPerG?: number | null
  /** Расход г/м² */
  consumptionGPerM2?: number | null
  /** Идентификатор сложности по умолчанию (необязательно) */
  complexityId?: string | null
}

export interface PaintComplexityRef {
  id: string
  name: string
  coeff: number
}

export interface PaintJob {
  recipeId: string
  layers: number
  complexityId?: string
}

export interface ProductLike {
  id?: string
  name: string
  article?: string
  /** Размер в мм строкой: "ШхВхГ", например "600x800x150" */
  size?: string
  /** Техкарта (BOM) — список материалов */
  techCard?: TechCardItemRef[]
  /** Задачи покраски */
  paintJobs?: PaintJob[]
}

export interface Settings {
  currency?: string
  /** Процент потерь (например 15 означает 15%) */
  paintLossCoeff?: number
}

/** Значения по умолчанию для настроек */
export const DEFAULT_SETTINGS: Required<Settings> = {
  currency: 'KGS',
  paintLossCoeff: 15,
}

export interface CostDatasets {
  materials: MaterialRecord[]
  recipes?: PaintRecipeRef[]
  complexities?: PaintComplexityRef[]
  settings?: Settings
}

/** Вспомогательная: безопасный перевод в число */
function num(n: any, fallback = 0): number {
  const v = Number(n)
  return Number.isFinite(v) ? v : fallback
}

/** Вспомогательная: поиск материала по id/артикулу/имени */
function findMaterial(ref: TechCardItemRef, list: MaterialRecord[]): MaterialRecord | null {
  if (!list || list.length === 0) return null
  if (ref.materialId) {
    const byId = list.find(m => m.id === ref.materialId)
    if (byId) return byId
  }
  if (ref.article) {
    const byArticle = list.find(
      m => (m.article || '').trim().toLowerCase() === (ref.article || '').trim().toLowerCase()
    )
    if (byArticle) return byArticle
  }
  if (ref.name) {
    const byName = list.find(
      m => m.name.trim().toLowerCase() === (ref.name || '').trim().toLowerCase()
    )
    if (byName) return byName
  }
  return null
}

/** Вспомогательная: разбор размеров "600x800x150" -> [600, 800, 150] в мм */
function parseSize(size?: string): [number, number, number] {
  if (!size) return [0, 0, 0]
  const parts = size.split('x').map(s => num(s, 0))
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
}

/** Площадь поверхности параллелепипеда в м² (как в документе): 2*(W*H + W*D + H*D), мм -> м */
export function surfaceAreaM2FromSize(size?: string): number {
  const [w, h, d] = parseSize(size)
  const W = w / 1000,
    H = h / 1000,
    D = d / 1000
  if (W <= 0 || H <= 0 || D <= 0) return 0
  return 2 * (W * H + W * D + H * D)
}

/** Результат по одной строке материала */
export interface MaterialCostRow {
  id?: string
  name: string
  article?: string
  unit?: string
  quantity: number
  unitPrice: number
  consumptionCoeff: number
  totalCost: number
  isValid: boolean
}

/**
 * calculateMaterialCost — цена по позиции BOM.
 * Формула: Price × Quantity × ConsumptionCoeff.
 */
export function calculateMaterialCost(
  item: TechCardItemRef,
  materials: MaterialRecord[]
): MaterialCostRow {
  const m = findMaterial(item, materials)
  const qty = Math.max(0, num(item.quantity, 0))
  const unitPrice = Math.max(0, num(m?.price, 0))
  const coeff = Math.max(0, num(item.consumptionCoeff ?? m?.consumptionCoeff, 1))
  const total = unitPrice * qty * coeff

  if (!m) {
    // Нет материала — возвращаем фиктивную строку с isValid=false
    return {
      id: undefined,
      name: item.name || 'Материал',
      article: item.article,
      unit: item.unit || m?.unit,
      quantity: qty,
      unitPrice,
      consumptionCoeff: coeff,
      totalCost: 0,
      isValid: false,
    }
  }

  return {
    id: m.id,
    name: m.name,
    article: m.article,
    unit: item.unit || m.unit,
    quantity: qty,
    unitPrice,
    consumptionCoeff: coeff,
    totalCost: total,
    isValid: unitPrice > 0 && qty > 0,
  }
}

/** Результат обработки BOM */
export interface BomProcessResult {
  total: number
  items: MaterialCostRow[]
  hasErrors: boolean
}

/**
 * processBOM — проходит по всем строкам техкарты и суммирует стоимость материалов.
 */
export function processBOM(product: ProductLike, datasets: CostDatasets): BomProcessResult {
  const items = (product.techCard || []).map(row => calculateMaterialCost(row, datasets.materials))
  const total = items.reduce((s, r) => s + r.totalCost, 0)
  return {
    total,
    items,
    hasErrors: items.some(i => !i.isValid),
  }
}

/** Результат расчёта покраски */
export interface PaintJobResult {
  recipeName: string
  complexity: string
  layers: number
  costPerM2: number
  totalCost: number
}

/** Результат блока покраски */
export interface PaintCostResult {
  total: number
  surfaceArea: number
  jobs: PaintJobResult[]
}

/**
 * calculatePaintCost — расчёт покраски по задачам покраски:
 * Base Price/m² × Surface Area × Complexity × (1 + Loss%) × Layers
 * Источник цены:
 *  - recipe.pricePerM2 напрямую, или
 *  - (costPerG × consumptionGPerM2), если прямая цена отсутствует.
 */
export function calculatePaintCost(product: ProductLike, datasets: CostDatasets): PaintCostResult {
  const settings = { ...DEFAULT_SETTINGS, ...(datasets.settings || {}) }
  const recipes = datasets.recipes || []
  const complexities = datasets.complexities || []

  const area = surfaceAreaM2FromSize(product.size)
  if (!product.paintJobs || product.paintJobs.length === 0 || area <= 0) {
    return { total: 0, surfaceArea: area, jobs: [] }
  }

  let totalPaintCost = 0
  const jobs: PaintJobResult[] = []

  for (const job of product.paintJobs) {
    const recipe = recipes.find(r => r.id === job.recipeId)
    if (!recipe) {
      // отсутствует рецепт — пропуск
      continue
    }

    const cmx = complexities.find(
      c => c.id === (job.complexityId || recipe.complexityId || '')
    ) || {
      name: 'Standard',
      coeff: 1.0,
      id: 'std',
    }

    const direct = Math.max(0, num(recipe.pricePerM2, 0))
    const derived = Math.max(0, num(recipe.costPerG, 0) * num(recipe.consumptionGPerM2, 0))
    const pricePerM2 = direct > 0 ? direct : derived

    const loss = Math.max(0, num(settings.paintLossCoeff, 0)) / 100
    const layers = Math.max(0, num(job.layers, 0))
    const costPerM2 = pricePerM2 * cmx.coeff * (1 + loss)
    const jobCost = costPerM2 * area * layers

    totalPaintCost += jobCost
    jobs.push({
      recipeName: recipe.name,
      complexity: cmx.name,
      layers,
      costPerM2,
      totalCost: jobCost,
    })
  }

  return {
    total: Math.round(totalPaintCost),
    surfaceArea: area,
    jobs,
  }
}

/** Результат мастер-расчёта */
export interface MasterCostResult {
  // Cost breakdown
  materialsCost: number
  paintCost: number
  laborCost: number
  totalCost: number

  // Pricing
  markupPercent: number
  finalPrice: number

  // Business metrics
  grossProfit: number
  grossMargin: number
  roi: number

  // Quality flags
  hasErrors: boolean
  breakdown: {
    materials: MaterialCostRow[]
    paint: PaintJobResult[]
  }
}

/**
 * calculateProductCost — мастер-движок:
 * 1) BOM → материалы
 * 2) paintJobs → покраска
 * 3) Производственная себестоимость = материалы + покраска + труд
 * 4) Финальная цена = (себестоимость) × (1 + markup%)
 */
export function calculateProductCost(params: {
  product: ProductLike
  datasets: CostDatasets
  laborCost?: number
  markupPercent?: number
}): MasterCostResult {
  const { product, datasets } = params
  const labor = Math.max(0, num(params.laborCost, 0))
  const markupPercent = Math.max(0, num(params.markupPercent, 0))

  const bom = processBOM(product, datasets)
  const paint = calculatePaintCost(product, datasets)
  const productionCost = bom.total + paint.total

  const totalCost = productionCost + labor
  const finalPrice = totalCost * (1 + markupPercent / 100)
  const grossProfit = finalPrice - totalCost
  const grossMargin = finalPrice > 0 ? (grossProfit / finalPrice) * 100 : 0
  const roi = productionCost > 0 ? (grossProfit / productionCost) * 100 : 0

  // Логи в стиле документа
  // eslint-disable-next-line no-console
  console.log(`🔄 CALCULATING COST FOR: ${product.name} (${product.article || '—'})`)
  // eslint-disable-next-line no-console
  console.log(`💰 Production Cost Breakdown:`)
  // eslint-disable-next-line no-console
  console.log(`   📦 Materials: ${bom.total.toFixed(2)} KGS`)
  // eslint-disable-next-line no-console
  console.log(`   🎨 Paint: ${paint.total.toFixed(2)} KGS`)
  // eslint-disable-next-line no-console
  console.log(`   🏭 TOTAL PRODUCTION: ${productionCost.toFixed(2)} KGS`)
  // eslint-disable-next-line no-console
  console.log(`📈 Pricing Breakdown:`)
  // eslint-disable-next-line no-console
  console.log(`   🔧 Labor Cost: ${labor.toFixed(2)} KGS`)
  // eslint-disable-next-line no-console
  console.log(`   📊 Markup: ${markupPercent}%`)
  // eslint-disable-next-line no-console
  console.log(`   💎 FINAL PRICE: ${finalPrice.toFixed(2)} KGS`)

  return {
    materialsCost: Math.round(bom.total),
    paintCost: Math.round(paint.total),
    laborCost: Math.round(labor),
    totalCost: Math.round(productionCost),

    markupPercent,
    finalPrice: Math.round(finalPrice),

    grossProfit: Math.round(grossProfit),
    grossMargin,
    roi,

    hasErrors: bom.hasErrors,
    breakdown: {
      materials: bom.items,
      paint: paint.jobs,
    },
  }
}

/**
 * validateCostCalculation — простая подпись расчёта и запись в localStorage.
 * Важно: это клиентская целостность, не защита от атак. Для продакшена — серверные проверки.
 */
export function validateCostCalculation(
  product: ProductLike,
  result: MasterCostResult
): MasterCostResult {
  try {
    const payload = {
      materials: result.breakdown.materials.map(i => ({
        id: i.id,
        name: i.name,
        qty: i.quantity,
        price: i.unitPrice,
        coeff: i.consumptionCoeff,
      })),
      paint: result.breakdown.paint.map(j => ({
        recipe: j.recipeName,
        layers: j.layers,
        costPerM2: j.costPerM2,
      })),
      total: result.totalCost,
      final: result.finalPrice,
      ts: Date.now(),
    }
    const hash = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    const key = `calc_${product.id || product.name}`
    localStorage.setItem(key, hash)
  } catch {
    // ignore
  }
  return result
}
