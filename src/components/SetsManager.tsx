/**
 * @file SetsManager.tsx
 * @description Управление комплектами (наборами): CRUD с Supabase и мягким fallback.
 * Таблица: sets (id, name, items jsonb[{name, qty}], discount_percent numeric, price numeric, notes text)
 */

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { Plus, Edit2, Trash2, Search, Boxes } from 'lucide-react'
import { supabase } from '../lib/supabase'

/** Одна позиция комплекта */
interface SetItem {
  name: string
  qty: number
}

/** Комплект */
export interface ProductSet {
  id: string
  name: string
  items: SetItem[]
  discount_percent?: number
  price?: number
  notes?: string
}

/**
 * parseItems — парсер строк "Название xКол-во" в массив SetItem
 */
function parseItems(text: string): SetItem[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(.+?)\s+x(\d+)$/i)
      if (m) return { name: m[1], qty: parseInt(m[2]) || 1 }
      return { name: l, qty: 1 }
    })
}

/**
 * stringifyItems — обратное преобразование массива в многострочный текст
 */
function stringifyItems(list: SetItem[]): string {
  return (list || []).map((it) => `${it.name} x${it.qty}`).join('\n')
}

/**
 * SetsManager — CRUD для комплектов/наборов
 */
export default function SetsManager(): JSX.Element {
  const [items, setItems] = useState<ProductSet[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [editing, setEditing] = useState<ProductSet | null>(null)

  const [form, setForm] = useState<{
    name: string
    itemsText: string
    discount_percent: number
    price: number
    notes: string
  }>({
    name: '',
    itemsText: '',
    discount_percent: 0,
    price: 0,
    notes: '',
  })

  useEffect(() => {
    void load()
  }, [])

  /** Загрузка из Supabase */
  const load = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('sets').select('*').order('name')
      if (!error && data) {
        setItems(
          data.map((x: any) => ({
            id: x.id,
            name: x.name,
            items: Array.isArray(x.items) ? x.items : [],
            discount_percent: Number(x.discount_percent || 0),
            price: Number(x.price || 0),
            notes: x.notes || '',
          }))
        )
      } else {
        setItems([])
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', itemsText: '', discount_percent: 0, price: 0, notes: '' })
    setDialogOpen(true)
  }

  const openEdit = (row: ProductSet) => {
    setEditing(row)
    setForm({
      name: row.name,
      itemsText: stringifyItems(row.items || []),
      discount_percent: row.discount_percent || 0,
      price: row.price || 0,
      notes: row.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      items: parseItems(form.itemsText),
      discount_percent: form.discount_percent,
      price: form.price,
      notes: form.notes.trim() || null,
    }
    try {
      if (editing) {
        const { error } = await supabase.from('sets').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('sets').insert([payload])
        if (error) throw error
      }
      await load()
      setDialogOpen(false)
    } catch {
      if (editing) {
        setItems((prev) => prev.map((x) => (x.id === editing.id ? ({ ...x, ...payload } as any) : x)))
      } else {
        setItems((prev) => [{ ...payload, id: 'local-' + Date.now().toString(36) } as any, ...prev])
      }
      setDialogOpen(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить комплект?')) return
    try {
      const { error } = await supabase.from('sets').delete().eq('id', id)
      if (error) throw error
      await load()
    } catch {
      setItems((prev) => prev.filter((x) => x.id !== id))
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return items
    return items.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        (x.notes || '').toLowerCase().includes(q) ||
        (x.items || []).some((it) => it.name.toLowerCase().includes(q))
    )
  }, [items, search])

  if (loading) return <div className="p-8 text-center text-gray-600">Загрузка комплектов...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Boxes className="w-5 h-5" />
          Комплекты
        </h2>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Создать комплект
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[680px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-xl sm:rounded-lg">
            <DialogHeader><DialogTitle>{editing ? 'Редактировать комплект' : 'Новый комплект'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Название</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>

              <div>
                <Label htmlFor="items">Состав (по строке: "Название xКол-во")</Label>
                <Textarea
                  id="items"
                  rows={5}
                  placeholder={'Тумба 600 x1\nЗеркало 600 x1'}
                  value={form.itemsText}
                  onChange={(e) => setForm((f) => ({ ...f, itemsText: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discount">Скидка, %</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.1"
                    value={form.discount_percent}
                    onChange={(e) => setForm((f) => ({ ...f, discount_percent: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Цена, сом</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div></div>
              </div>

              <div>
                <Label htmlFor="notes">Заметки</Label>
                <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">{editing ? 'Сохранить' : 'Добавить'}</Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="bg-transparent">Отмена</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Поиск по названию, составу, заметкам..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500">Комплекты не найдены</CardContent></Card>
        ) : (
          filtered.map((row) => (
            <Card key={row.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{row.name}</h3>
                    {row.items && row.items.length > 0 && (
                      <div className="text-sm text-gray-700 mt-1">
                        Состав:&nbsp;
                        {row.items.map((it, idx) => (
                          <span key={idx} className="inline-block bg-gray-50 border border-gray-200 rounded px-2 py-0.5 mr-1 mb-1">
                            {it.name} × {it.qty}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 mt-1">
                      {typeof row.discount_percent === 'number' && row.discount_percent > 0 && <>Скидка: {row.discount_percent}% • </>}
                      {typeof row.price === 'number' && row.price > 0 && <>Цена: {row.price.toLocaleString('ru-RU')} сом</>}
                    </div>
                    {row.notes && <div className="text-xs text-gray-500 mt-1">{row.notes}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(row)} className="bg-transparent">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void remove(row.id)} className="bg-transparent">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
