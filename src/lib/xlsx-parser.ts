/**
 * XLSX parsing utilities for tech cards and materials
 */
import * as XLSX from 'xlsx'

export interface Material {
  article: string
  name: string
  quantity: number
  unit: string
}

export interface TechCard {
  productName: string
  materials: Material[]
  orderQuantity: number
  category?: string
  type?: string
  collection?: string
}

export interface MaterialImport {
  name: string
  unit: string
  price: number
  category: string
  article?: string
}

/**
 * Parse XLSX tech card file
 */
export async function parseXLSXTechCard(file: File): Promise<TechCard> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        const techCard = parseTechCardData(jsonData)
        resolve(techCard)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse material list from XLSX file
 */
export async function parseXLSXMaterials(file: File): Promise<MaterialImport[]> {
  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Get raw data as array of arrays
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false 
    }) as any[][]

    const materials = parseMaterialsData(jsonData)
    return materials
  } catch (error: any) {
    console.error('Error parsing XLSX materials:', error)
    throw new Error('Ошибка при парсинге файла материалов: ' + (error?.message || String(error)))
  }
}

/**
 * Utility: normalize number from RU formatting
 * - removes spaces and NBSP
 * - replaces comma with dot
 */
function parseRuNumber(input: any): number {
  if (input === null || input === undefined) return 0
  const str = String(input)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, '')
    .replace(',', '.')
  const num = parseFloat(str)
  return Number.isFinite(num) ? num : 0
}

/**
 * Find header indexes by names (case-insensitive). Supports EN/RU labels.
 */
function detectColumns(headerRow: any[]): {
  idxArticle: number | null
  idxName: number | null
  idxUnit: number | null
  idxPrice: number | null
} {
  const header = (headerRow || []).map((c) => String(c || '').trim().toLowerCase())
  const has = (v: string) => header.findIndex((h) => h.includes(v))

  let idxArticle = has('article')
  if (idxArticle === -1) idxArticle = has('артикул')
  if (idxArticle === -1) idxArticle = has('арт')
  if (idxArticle === -1) idxArticle = null

  let idxName = has('name')
  if (idxName === -1) idxName = has('наимен')
  if (idxName === -1) idxName = has('материал')
  if (idxName === -1) idxName = null

  let idxUnit = has('unit')
  if (idxUnit === -1) idxUnit = has('ед.')
  if (idxUnit === -1) idxUnit = has('ед ')
  if (idxUnit === -1) idxUnit = has('единиц')
  if (idxUnit === -1) idxUnit = null

  let idxPrice = has('price')
  if (idxPrice === -1) idxPrice = has('цена')
  if (idxPrice === -1) idxPrice = has('стоим')
  if (idxPrice === -1) idxPrice = null

  return { idxArticle, idxName, idxUnit, idxPrice }
}

/**
 * Parse materials data from Excel rows.
 * - Robust header detection (article/name/unit/price)
 * - Flexible column order
 * - RU number parsing ("1 165,97" -> 1165.97)
 * - Optional article
 */
function parseMaterialsData(data: any[][]): MaterialImport[] {
  const materials: MaterialImport[] = []

  if (!Array.isArray(data) || data.length === 0) return materials

  // 1) Try to find header row within first 6 lines
  let headerRowIndex = -1
  let mapping: ReturnType<typeof detectColumns> | null = null

  for (let i = 0; i < Math.min(data.length, 6); i++) {
    const row = data[i] || []
    const m = detectColumns(row)
    if (m.idxName !== null && m.idxUnit !== null && m.idxPrice !== null) {
      headerRowIndex = i
      mapping = m
      break
    }
  }

  // 2) Fallback: assume Excel template columns: A:article, B:name, C:unit, D:price
  if (headerRowIndex === -1) {
    headerRowIndex = 0
    mapping = { idxArticle: 0, idxName: 1, idxUnit: 2, idxPrice: 3 }
  }

  const { idxArticle, idxName, idxUnit, idxPrice } = mapping!

  // 3) Start from first data row
  const start = headerRowIndex + 1

  for (let i = start; i < data.length; i++) {
    const row = data[i] || []

    const name = (idxName !== null ? row[idxName] : '')?.toString().trim() || ''
    const unit = (idxUnit !== null ? row[idxUnit] : '')?.toString().trim() || 'шт'
    const priceRaw = idxPrice !== null ? row[idxPrice] : ''
    const article = (idxArticle !== null ? row[idxArticle] : '')?.toString().trim() || undefined

    // Skip completely empty lines
    if (!name && !unit && (priceRaw === '' || priceRaw === null || priceRaw === undefined)) continue
    if (!name) continue

    const price = parseRuNumber(priceRaw)
    if (!(price > 0)) continue

    const category = determineMaterialCategory(name)

    materials.push({
      name,
      unit,
      price,
      category,
      article,
    })
  }

  return materials
}

/**
 * Parse tech card data from Excel rows
 */
function parseTechCardData(data: any[][]): TechCard {
  let productName = ''
  let orderQuantity = 1
  const materials: Material[] = []
  
  // Find product name and order quantity
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (row[0] && typeof row[0] === 'string') {
      if (row[0].includes('Изделие') || row[0].includes('Заказ')) {
        productName = row[1] || row[3] || ''
      }
      if (row[0].includes('Количество изделий')) {
        orderQuantity = parseInt(row[1]) || 1
      }
    }
  }
  
  // Find materials table start
  let materialsStart = -1
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if ((row[0] === 'Артикул' || row[0]?.toString().toLowerCase().includes('артикул')) && 
        (row[1]?.toString().toLowerCase().includes('наименование') || row[1]?.toString().toLowerCase().includes('материал'))) {
      materialsStart = i + 1
      break
    }
  }
  
  // Parse materials
  if (materialsStart > -1) {
    for (let i = materialsStart; i < data.length; i++) {
      const row = data[i]
      if (row[0] && row[1] && (row[2] !== undefined && row[2] !== null) && row[3]) {
        const quantity = parseFloat(row[2])
        if (!isNaN(quantity) && quantity > 0) {
          materials.push({
            article: row[0].toString(),
            name: row[1].toString(),
            quantity: quantity,
            unit: row[3].toString()
          })
        }
      }
    }
  }
  
  // Determine category and type from product name
  const category = determineCategory(productName)
  const type = determineType(productName)
  const collection = determineCollection(productName)
  
  return {
    productName,
    materials,
    orderQuantity,
    category,
    type,
    collection
  }
}

/**
 * Determine product category from name
 */
function determineCategory(productName: string): string {
  const name = productName.toLowerCase()
  
  if (name.includes('зеркало')) return 'Зеркала'
  if (name.includes('тумба')) return 'Тумбы'
  if (name.includes('пенал')) return 'Пеналы'
  if (name.includes('полка')) return 'Полки'
  if (name.includes('шкаф')) return 'Шкафы'
  
  return 'Мебель для ванной'
}

/**
 * Determine product type from name
 */
function determineType(productName: string): string {
  const name = productName.toLowerCase()
  
  if (name.includes('краш')) return 'Крашенная'
  if (name.includes('пленочн')) return 'Пленочная'
  if (name.includes('led')) return 'LED'
  
  return 'Обычная'
}

/**
 * Determine collection from name
 */
function determineCollection(productName: string): string {
  const name = productName.toLowerCase()
  
  if (name.includes('классик')) return 'Классик'
  if (name.includes('грация')) return 'Грация'
  if (name.includes('модерн')) return 'Модерн'
  if (name.includes('элит')) return 'Элит'
  
  return 'Стандарт'
}

/**
 * Determine material category from name
 */
function determineMaterialCategory(materialName: string): string {
  const name = materialName.toLowerCase()
  
  // Плитные материалы
  if (name.includes('лдсп') || name.includes('мдф')) return 'Плитные материалы'
  
  // Кромочные материалы
  if (name.includes('кромка')) return 'Кромочные материалы'
  
  // Фурнитура и механизмы
  if (name.includes('петля') || name.includes('направляющ') || name.includes('саморез') || 
      name.includes('винт') || name.includes('евровинт') || name.includes('шкант') ||
      name.includes('заглушк') || name.includes('подвес') || name.includes('push') ||
      name.includes('ограничитель') || name.includes('каркас')) return 'Фурнитура'
  
  // Электрика и подсветка
  if (name.includes('блок питан') || name.includes('датчик') || name.includes('сенсор') ||
      name.includes('led') || name.includes('подсветк')) return 'Электрика и подсветка'
  
  // Клеи и составы
  if (name.includes('клей') || name.includes('акфикс') || name.includes('миррор') ||
      name.includes('грунт')) return 'Клеи и составы'
  
  // Отделочные материалы
  if (name.includes('пленка') || name.includes('наклейк') || name.includes('краска') ||
      name.includes('картон') || name.includes('изовер') || name.includes('подложк')) return 'Отделочные материалы'
  
  // Зеркала
  if (name.includes('зер') && name.includes('мм')) return 'Зеркала'
  
  return 'Прочие материалы'
}

/**
 * Calculate total cost from materials and prices
 */
export function calculateTotalCost(materials: Material[], materialPrices: Record<string, number>, laborCost: number = 0): number {
  const materialsCost = materials.reduce((total, material) => {
    const price = materialPrices[material.name] || 0
    return total + (material.quantity * price)
  }, 0)
  
  return materialsCost + laborCost
}
