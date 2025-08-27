/**
 * @file MaterialAutocomplete.tsx
 * @description Searchable autocomplete for materials filtered as "paints".
 * Pulls from Supabase 'materials' and shows only items marked/recognized as paints.
 * Displays price and unit; returns full material object on selection.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

/** Material shape from DB (safe subset) */
export interface MaterialOption {
  id: string
  name: string
  article?: string | null
  type?: string | null
  category?: string | null
  unit: string
  price: number
}

/** Props for MaterialAutocomplete */
interface MaterialAutocompleteProps {
  label: string
  placeholder?: string
  selected?: MaterialOption | null
  onSelect: (m: MaterialOption | null) => void
  allowClear?: boolean
  hint?: string
}

/** Determine if material is paint-like (server may not have strict flag) */
function isPaintLike(m: Partial<MaterialOption>): boolean {
  const t = (m.type || '').toLowerCase()
  const c = (m.category || '').toLowerCase()
  const n = (m.name || '').toLowerCase()
  // Primary: explicit type/category contains 'краск'
  if (t.includes('краск') || c.includes('краск')) return true
  // Fallback heuristics
  if (n.includes('краска') || n.includes('эмаль') || n.includes('лак')) return true
  return false
}

/** Compact formatter for price/unit */
function priceUnit(m?: MaterialOption | null): string {
  if (!m) return ''
  const unit = m.unit || 'шт'
  const price = Number(m.price) || 0
  if (price <= 0) return `— / ${unit}`
  return `${price.toLocaleString('ru-RU')} сом / ${unit}`
}

/**
 * MaterialAutocomplete: searchable select for paint materials.
 */
export default function MaterialAutocomplete(props: MaterialAutocompleteProps) {
  const { label, placeholder, selected, onSelect, allowClear = true, hint } = props
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')
  const [open, setOpen] = useState<boolean>(false)
  const [items, setItems] = useState<MaterialOption[]>([])

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    void load()
  }, [])

  /** Load materials (fetch superset, then filter paint-like on client for safety) */
  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      // Try to filter on server to reduce payload; then refine on client.
      // Using OR filter: any column that may contain "краск".
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, article, type, category, unit, price')
        .or('type.ilike.%краск%,category.ilike.%краск%,name.ilike.%краск%')
        .order('name', { ascending: true })

      if (error) throw error

      const raw = (data || []) as any[]
      const normalized: MaterialOption[] = raw.map(r => ({
        id: r.id,
        name: r.name,
        article: r.article ?? null,
        type: r.type ?? null,
        category: r.category ?? null,
        unit: r.unit || 'шт',
        price: Number(r.price) || 0,
      }))
      const paints = normalized.filter(isPaintLike)
      setItems(paints)
    } catch (e: any) {
      setError('Не удалось загрузить материалы')
      setItems([])
      console.error('MaterialAutocomplete load error:', e)
    } finally {
      setLoading(false)
    }
  }

  /** Local filtering by query (name/article) */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(m => {
      const nm = (m.name || '').toLowerCase()
      const art = (m.article || '').toLowerCase()
      return nm.includes(q) || art.includes(q)
    })
  }, [items, query])

  /** Close dropdown on outside click */
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div className='space-y-1.5' ref={wrapperRef}>
      <Label className='block'>{label}</Label>
      <div className='relative'>
        <Input
          value={selected ? selected.name : query}
          onChange={e => {
            onSelect(null)
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || 'Поиск по названию или артикулу'}
          aria-label={label}
        />
        {allowClear && (selected || query) && (
          <button
            type='button'
            onClick={() => {
              setQuery('')
              onSelect(null)
            }}
            className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
            aria-label='Очистить'
            title='Очистить'
          >
            ×
          </button>
        )}

        {/* Dropdown */}
        {open && (
          <div className='absolute z-30 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-64 overflow-auto'>
            {loading ? (
              <div className='px-3 py-2 text-sm text-gray-500'>Загрузка...</div>
            ) : error ? (
              <div className='px-3 py-2 text-sm text-red-600'>{error}</div>
            ) : filtered.length === 0 ? (
              <div className='px-3 py-2 text-sm text-gray-500'>Ничего не найдено</div>
            ) : (
              <ul className='divide-y'>
                {filtered.slice(0, 50).map(m => (
                  <li key={m.id}>
                    <button
                      type='button'
                      className='w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50'
                      onClick={() => {
                        onSelect(m)
                        setOpen(false)
                        setQuery('')
                      }}
                      title={m.article ? `Артикул: ${m.article}` : undefined}
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <div className='truncate'>
                          <div className='font-medium text-gray-900 truncate'>{m.name}</div>
                          <div className='text-xs text-gray-500'>
                            {(m.article && `арт. ${m.article} · `) || ''}
                            {(m.type || m.category || '').toString()}
                          </div>
                        </div>
                        <div className='shrink-0 text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700'>
                          {priceUnit(m)}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Selected price tag */}
      {selected && (
        <div className='text-xs text-gray-600'>
          Цена материала: <span className='font-medium'>{priceUnit(selected)}</span>
        </div>
      )}
      {hint && <div className='text-xs text-gray-500'>{hint}</div>}
    </div>
  )
}
