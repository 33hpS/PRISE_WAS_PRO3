/**
 * @file costing.ts
 * @description Утилиты расчета себестоимости: площадь, стоимость покраски и вспомогательные функции.
 * Безопасно обрабатывает частичные данные (fallback), чтобы UI не падал при отсутствии колонок в БД.
 */

export interface PaintRecipeLike {
  /** Цена смеси за грамм (сом/г). Если отсутствует — попробуем вывести из других полей или вернём 0. */
  cost_per_g?: number | null
  /** Расход смеси, г/м² */
  consumption_g_per_m2?: number | null
  /** Устаревшее поле (себестоимость рецепта), fallback: трактуем как сом за 1000г => cost_per_g ~ cost/1000 */
  cost?: number | null
  /** Прямая цена за квадратный метр (сом/м²). Если задана — используем её напрямую. */
  price_per_m2?: number | null
}

export interface PaintComplexityLike {
  /** Коэффициент сложности (например, 1.0, 1.15, 1.3) */
  coeff?: number | null
}

/**
 * Вычислить цену смеси за грамм.
 * Порядок приоритета:
 * 1) cost_per_g (сом/г);
 * 2) если есть cost — трактуем как стоимость 1 кг => делим на 1000;
 * 3) иначе 0.
 */
export function getMixturePricePerGram(recipe?: PaintRecipeLike | null): number {
  if (!recipe) return 0
  if (typeof recipe.cost_per_g === 'number' && recipe.cost_per_g > 0) return recipe.cost_per_g
  if (typeof recipe.cost === 'number' && recipe.cost > 0) return recipe.cost / 1000
  return 0
}

/**
 * Площадь поверхности параллелепипеда (в м²).
 * Если какая-либо сторона отсутствует/некорректна — возвращает 0.
 */
export function surfaceAreaM2(widthMm?: number | null, heightMm?: number | null, depthMm?: number | null): number {
  const w = (Number(widthMm) || 0) / 1000
  const h = (Number(heightMm) || 0) / 1000
  const d = (Number(depthMm) || 0) / 1000
  if (w <= 0 || h <= 0 || d <= 0) return 0
  return 2 * (w * h + w * d + h * d)
}

/**
 * Стоимость покраски:
 * Если recipe.price_per_m2 > 0:
 *   pricePerM2 = recipe.price_per_m2
 * Иначе:
 *   pricePerM2 = pricePerG * consumption
 * Далее:
 *   withComplexity = pricePerM2 * complexity
 *   withLoss = withComplexity * (1 + loss%) 
 *   total = withLoss * area * layers
 */
export function computePaintCost(params: {
  recipe?: PaintRecipeLike | null
  complexity?: PaintComplexityLike | null
  width_mm?: number | null
  height_mm?: number | null
  depth_mm?: number | null
  layers?: number | null
  lossPercent?: number | null
}): number {
  const r = params.recipe || undefined
  const directPricePerM2 = Math.max(0, Number(r?.price_per_m2) || 0)

  let pricePerM2 = 0
  if (directPricePerM2 > 0) {
    // Прямое значение "цена за м²"
    pricePerM2 = directPricePerM2
  } else {
    // Вычисляем по цене за грамм и расходу
    const pricePerG = getMixturePricePerGram(r)
    const consumption = Math.max(0, Number(r?.consumption_g_per_m2) || 0)
    if (pricePerG <= 0 || consumption <= 0) return 0
    pricePerM2 = pricePerG * consumption
  }

  const coeff = Math.max(0, Number(params.complexity?.coeff) || 1)
  const loss = Math.max(0, Number(params.lossPercent) || 0)
  const area = surfaceAreaM2(params.width_mm, params.height_mm, params.depth_mm)
  const layers = Math.max(0, Number(params.layers) || 0)

  if (pricePerM2 <= 0 || coeff <= 0 || area <= 0 || layers <= 0) return 0

  const withComplexity = pricePerM2 * coeff
  const withLoss = withComplexity * (1 + loss / 100)
  const total = withLoss * area * layers

  // Округлим до 1 сома для стабильности отображения
  return Math.round(total)
}

/**
 * Вспомогательная функция: безопасно привести число.
 */
export function toNumberSafe(n: any, fallback = 0): number {
  const v = Number(n)
  return Number.isFinite(v) ? v : fallback
}
