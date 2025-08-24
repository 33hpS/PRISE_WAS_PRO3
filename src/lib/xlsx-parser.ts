/**
 * @file xlsx-parser.ts
 * @description Excel parsers and helpers:
 * - Tech card parser compatible with provided template (Russian headers).
 * - Materials parser for bulk import.
 * - Cost calculator for tech card materials (+ labor).
 * Includes number normalization with comma support and tolerant header detection.
 */

import * as XLSX from 'xlsx'

/** Normalize any value to string, trim whitespace. */
function vStr(v: any): string {
  if (v === undefined || v === null) return ''
  return String(v).trim()
}

/** Normalize numeric cell:
 * - Accepts "1 234,56" or "1,234.56" or plain number
 * - Returns NaN if cannot parse
 */
function vNum(v: any): number {
  if (typeof v === 'number') return v
  const s = vStr(v)
  if (!s) return NaN
  // Replace space as thousand sep; handle comma as decimal
  const normalized = s
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.\-]/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : NaN
}

/* =============================
 * Types
 * ============================= */

/** Single material in a tech card table. */
export interface TechCardMaterial {
  article?: string
  name: string
  unit?: string
  /** Quantity already includes multiplier and itemsInOrder. */
  quantity?: number
  /** Optional coefficient extracted from the sheet. */
  coefficient?: number
  /** Optional raw quantity from the sheet (before multipliers). */
  baseQty?: number
  note?: string
  /** Optional unit price (fallback when DB price map is not provided). */
  price?: number
}

/** Parsed tech card payload (main sheet only). */
export interface TechCard {
  productName: string
  collection?: string
  type?: string
  category?: string
  itemsInOrder?: number
  materials: TechCardMaterial[]
}

/** Row shape for materials import from Excel. */
export interface ParsedMaterialRow {
  name: string
  unit: string
  price: number
  category?: string
  article?: string
}

/* =============================
 * Tech card parser (for your template)
 * ============================= */

/**
 * Parse tech card from File (delegates to ArrayBuffer parser).
 */
export async function parseTechCardFromFile(file: File): Promise<TechCard> {
  const buf = await file.arrayBuffer()
  return parseTechCardFromArrayBuffer(buf)
}

/**
 * Parse tech card from ArrayBuffer.
 * - Detects header row by Russian titles.
 * - Reads meta fields above table: "Изделие", "Количество изделий в заказе".
 * - Computes quantity = baseQty × coefficient × itemsInOrder.
 */
export async function parseTechCardFromArrayBuffer(buffer: ArrayBuffer): Promise<TechCard> {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) {
    return { productName: 'Изделие', materials: [], itemsInOrder: 1 }
  }

  const ws = wb.Sheets[sheetName]
  const ref = (ws as any)['!ref'] || 'A1:Z2000'
  const range = XLSX.utils.decode_range(ref)

  // Meta: find "Изделие" and "Количество изделий в заказе" in left column
  let productName = 'Изделие'
  let itemsInOrder = 1
  for (let r = range.s.r; r <= Math.min(range.s.r + 20, range.e.r); r++) {
    const label = vStr((ws as any)[XLSX.utils.encode_cell({ r, c: 0 })]?.v).toLowerCase()
    const value = vStr((ws as any)[XLSX.utils.encode_cell({ r, c: 1 })]?.v)
    if (!label) continue
    if (label.includes('изделие')) {
      productName = value || productName
    } else if (label.includes('количество изделий') || label.includes('в заказе')) {
      const n = vNum(value)
      itemsInOrder = Number.isFinite(n) && n > 0 ? Math.round(n) : 1
    }
  }

  // Find header row for the materials table
  type MapKeys = 'article' | 'name' | 'note' | 'coef' | 'qty' | 'unit'
  const map: Record<MapKeys, number | undefined> = {
    article: undefined,
    name: undefined,
    note: undefined,
    coef: undefined,
    qty: undefined,
    unit: undefined,
  }

  let headerRow = -1
  for (let r = range.s.r; r <= range.e.r; r++) {
    const rowValues: string[] = []
    for (let c = range.s.c; c <= range.e.c; c++) {
      rowValues.push(vStr((ws as any)[XLSX.utils.encode_cell({ r, c })]?.v))
    }
    const lower = rowValues.map((s) => s.toLowerCase())

    const hasName = lower.some((s) => s.includes('наимен') || s.includes('материал'))
    const hasQty = lower.some((s) => s.includes('количество') || s.includes('кол-во') || s.includes('qty'))
    if (hasName && hasQty) {
      headerRow = r
      rowValues.forEach((h, idx) => {
        const s = h.toLowerCase()
        if (s.includes('артик')) map.article = idx
        else if (s.includes('наимен') || s.includes('материал')) map.name = idx
        else if (s.includes('примеч')) map.note = idx
        else if (s.includes('коэф')) map.coef = idx // "Коэф-т"
        else if (s.includes('кол')) map.qty = idx // "Количество в заказе"
        else if (s.includes('ед') || s.includes('изм')) map.unit = idx
      })
      break
    }
  }

  const materials: TechCardMaterial[] = []
  if (headerRow >= 0) {
    for (let r = headerRow + 1; r <= range.e.r; r++) {
      const name = map.name !== undefined ? vStr((ws as any)[XLSX.utils.encode_cell({ r, c: map.name })]?.v) : ''
      const isEmptyRow = !name
      if (isEmptyRow) {
        // stop on two consecutive empty rows
        const nextName =
          map.name !== undefined
            ? vStr((ws as any)[XLSX.utils.encode_cell({ r: r + 1, c: map.name })]?.v)
            : ''
        if (!nextName) break
        continue
      }

      const article = map.article !== undefined ? vStr((ws as any)[XLSX.utils.encode_cell({ r, c: map.article })]?.v) : ''
      const note = map.note !== undefined ? vStr((ws as any)[XLSX.utils.encode_cell({ r, c: map.note })]?.v) : ''
      const unit = map.unit !== undefined ? vStr((ws as any)[XLSX.utils.encode_cell({ r, c: map.unit })]?.v) : ''
      const coefRaw = map.coef !== undefined ? (ws as any)[XLSX.utils.encode_cell({ r, c: map.coef })]?.v : ''
      const qtyRaw = map.qty !== undefined ? (ws as any)[XLSX.utils.encode_cell({ r, c: map.qty })]?.v : ''

      const coef = Number.isFinite(vNum(coefRaw)) ? Math.max(0, vNum(coefRaw)) : 1
      const baseQty = Number.isFinite(vNum(qtyRaw)) ? Math.max(0, vNum(qtyRaw)) : 0
      const quantity = Math.max(0, baseQty * coef * (itemsInOrder || 1))

      materials.push({
        article: article || undefined,
        name,
        unit: unit || undefined,
        quantity,
        coefficient: coef,
        baseQty,
        note: note || undefined,
      })
    }
  }

  return {
    productName,
    itemsInOrder,
    materials,
  }
}

/**
 * Alias used around the app (accepts File or ArrayBuffer).
 */
export async function parseXLSXTechCard(input: File | ArrayBuffer): Promise<TechCard> {
  if (input instanceof File) return parseTechCardFromFile(input)
  return parseTechCardFromArrayBuffer(input)
}

/* =============================
 * Materials parser (bulk import)
 * ============================= */

/**
 * Parse materials list from an Excel sheet.
 * Detects header row by typical Russian titles and parses until empty rows.
 */
export async function parseXLSXMaterials(input: File | ArrayBuffer): Promise<ParsedMaterialRow[]> {
  const buffer = input instanceof File ? await input.arrayBuffer() : input
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return []
  const sheet = wb.Sheets[sheetName]
  const ref = (sheet as any)['!ref'] || 'A1:Z2000'
  const range = XLSX.utils.decode_range(ref)

  let headerRow = -1
  const map: Record<'article' | 'name' | 'unit' | 'price' | 'category', number | undefined> = {
    article: undefined,
    name: undefined,
    unit: undefined,
    price: undefined,
    category: undefined,
  }

  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: string[] = []
    for (let c = range.s.c; c <= range.e.c; c++) {
      row.push(vStr((sheet as any)[XLSX.utils.encode_cell({ r, c })]?.v))
    }
    const low = row.map((s) => s.toLowerCase())
    const hasName = low.some((s) => s.includes('наимен') || s.includes('материал') || s.includes('name'))
    const hasPrice = low.some((s) => s.includes('цена') || s.includes('стоим') || s.includes('price'))
    if (hasName && hasPrice) {
      headerRow = r
      row.forEach((h, idx) => {
        const s = h.toLowerCase()
        if (s.includes('артик')) map.article = idx
        else if (s.includes('наимен') || s.includes('материал') || s === 'name') map.name = idx
        else if ((s.includes('ед') && s.includes('изм')) || s === 'ед.' || s === 'unit') map.unit = idx
        else if (s.includes('цена') || s.includes('стоим') || s === 'price' || s.includes('сом')) map.price = idx
        else if (s.includes('катег') || s.includes('тип') || s === 'category') map.category = idx
      })
      break
    }
  }

  // Fallback when headers not found: parse columns A-D (Name, Unit, Price, Category/Article)
  if (headerRow < 0 || map.name === undefined || map.price === undefined) {
    const fallback: ParsedMaterialRow[] = []
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      const name = vStr((sheet as any)[XLSX.utils.encode_cell({ r, c: 0 })]?.v)
      const unit = vStr((sheet as any)[XLSX.utils.encode_cell({ r, c: 1 })]?.v)
      const price = vNum((sheet as any)[XLSX.utils.encode_cell({ r, c: 2 })]?.v)
      const extra = vStr((sheet as any)[XLSX.utils.encode_cell({ r, c: 3 })]?.v)
      if (!name && !unit && !price) continue
      fallback.push({
        name: name || 'Материал',
        unit: unit || 'шт',
        price: Number.isFinite(price) ? price : 0,
        category: extra || undefined,
      })
    }
    return fallback
  }

  // Parse rows under the header
  const out: ParsedMaterialRow[] = []
  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const name =
      map.name !== undefined ? vStr((sheet as any)[XLSX.utils.encode_cell({ r, c: map.name })]?.v) : ''
    const priceRaw =
      map.price !== undefined ? (sheet as any)[XLSX.utils.encode_cell({ r, c: map.price })]?.v : ''
    const unit =
      map.unit !== undefined ? vStr((sheet as any)[XLSX.utils.encode_cell({ r, c: map.unit })]?.v) : ''
    const category =
      map.category !== undefined
        ? vStr((sheet as any)[XLSX.utils.encode_cell({ r, c: map.category })]?.v)
        : ''
    const article =
      map.article !== undefined
        ? vStr((sheet as any)[XLSX.utils.encode_cell({ r, c: map.article })]?.v)
        : ''

    const isEmpty = !name && (priceRaw === '' || priceRaw === null || priceRaw === undefined)
    if (isEmpty) {
      const nextName =
        map.name !== undefined
          ? vStr((sheet as any)[XLSX.utils.encode_cell({ r: r + 1, c: map.name })]?.v)
          : ''
      if (!nextName) break
      continue
    }

    const price = vNum(priceRaw)
    out.push({
      name: name || 'Материал',
      unit: unit || 'шт',
      price: Number.isFinite(price) ? price : 0,
      category: category || undefined,
      article: article || undefined,
    })
  }

  return out
}

/* =============================
 * Cost calculator
 * ============================= */

/**
 * Calculate total cost for a set of materials plus labor.
 * - Uses price from row if present, otherwise from provided `priceMap` by material name.
 * - Ignores rows with non-finite quantities.
 * @param materials Parsed materials with quantities
 * @param priceMap Map name -> unit price (сом)
 * @param laborCost Labor cost (сом)
 * @returns Total cost rounded to the nearest integer
 */
export function calculateTotalCost(
  materials: Array<Pick<TechCardMaterial, 'name' | 'quantity' | 'price'>>,
  priceMap: Record<string, number> = {},
  laborCost = 0,
): number {
  let sum = 0
  for (const m of materials) {
    const qty = Number(m.quantity) || 0
    if (qty <= 0) continue
    const unitPrice = Number.isFinite(Number(m.price)) && Number(m.price) > 0 ? Number(m.price) : (priceMap[m.name] || 0)
    sum += unitPrice * qty
  }
  const total = sum + Math.max(0, laborCost || 0)
  return Math.round(total)
}
