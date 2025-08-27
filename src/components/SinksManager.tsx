/**
 * @file SinksManager.tsx
 * @description Управление раковинами: CRUD + поиск, Supabase + fallback.
 * Таблица: sinks (id, name, brand, material, size, price numeric, stock int)
 */

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Plus, Edit2, Trash2, Search, Droplets } from 'lucide-react'
import { supabase } from '../lib/supabase'

/** Раковина */
export interface SinkItem {
  id: string
  name: string
  brand?: string
  material?: string
  size?: string
  price?: number
  stock?: number
  notes?: string
}

/**
 * SinksManager — CRUD для раковин
 */
export default function SinksManager(): JSX.Element {
  const [items, setItems] = useState<SinkItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [open, setOpen] = useState<boolean>(false)
  const [editing, setEditing] = useState<SinkItem | null>(null)

  const [form, setForm] = useState<{
    name: string
    brand: string
    material: string
    size: string
    price: number
    stock: number
    notes: string
  }>({
    name: '',
    brand: '',
    material: '',
    size: '',
    price: 0,
    stock: 0,
    notes: '',
  })

  /** Загрузка */
  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('sinks').select('*').order('name')
      if (!error && data) {
        setItems(
          data.map((x: any) => ({
            id: x.id,
            name: x.name,
            brand: x.brand || '',
            material: x.material || '',
            size: x.size || '',
            price: x.price ? Number(x.price) : 0,
            stock: x.stock ? Number(x.stock) : 0,
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
    setForm({ name: '', brand: '', material: '', size: '', price: 0, stock: 0, notes: '' })
    setOpen(true)
  }
  const openEdit = (row: SinkItem) => {
    setEditing(row)
    setForm({
      name: row.name,
      brand: row.brand || '',
      material: row.material || '',
      size: row.size || '',
      price: row.price || 0,
      stock: row.stock || 0,
      notes: row.notes || '',
    })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      material: form.material.trim() || null,
      size: form.size.trim() || null,
      price: form.price,
      stock: form.stock,
      notes: form.notes.trim() || null,
    }
    try {
      if (editing) {
        const { error } = await supabase.from('sinks').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('sinks').insert([payload])
        if (error) throw error
      }
      await load()
      setOpen(false)
    } catch {
      if (editing) {
        setItems(prev => prev.map(x => (x.id === editing.id ? ({ ...x, ...payload } as any) : x)))
      } else {
        setItems(prev => [{ ...payload, id: 'local-' + Date.now().toString(36) } as any, ...prev])
      }
      setOpen(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить раковину?')) return
    try {
      const { error } = await supabase.from('sinks').delete().eq('id', id)
      if (error) throw error
      await load()
    } catch {
      setItems(prev => prev.filter(x => x.id !== id))
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return items
    return items.filter(
      x =>
        x.name.toLowerCase().includes(q) ||
        (x.brand || '').toLowerCase().includes(q) ||
        (x.material || '').toLowerCase().includes(q) ||
        (x.size || '').toLowerCase().includes(q)
    )
  }, [items, search])

  if (loading)
    return <div className='p-8 text-center text-gray-600'>Загрузка каталога раковин...</div>

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <h2 className='text-2xl font-bold flex items-center gap-2'>
          <Droplets className='w-5 h-5' />
          Раковины
        </h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className='w-4 h-4 mr-2' />
              Добавить раковину
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[720px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-xl sm:rounded-lg'>
            <DialogHeader>
              <DialogTitle>{editing ? 'Редактировать раковину' : 'Новая раковина'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='name'>Название</Label>
                  <Input
                    id='name'
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='brand'>Бренд</Label>
                  <Input
                    id='brand'
                    value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor='material'>Материал</Label>
                  <Input
                    id='material'
                    value={form.material}
                    onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor='size'>Размер</Label>
                  <Input
                    id='size'
                    value={form.size}
                    onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='price'>Цена, сом</Label>
                  <Input
                    id='price'
                    type='number'
                    step='0.01'
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor='stock'>Остаток, шт</Label>
                  <Input
                    id='stock'
                    type='number'
                    step='1'
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='notes'>Заметки</Label>
                <Textarea
                  id='notes'
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className='flex gap-2 pt-2'>
                <Button type='submit' className='flex-1'>
                  {editing ? 'Сохранить' : 'Добавить'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  className='bg-transparent'
                  onClick={() => setOpen(false)}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='flex gap-4'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
          <Input
            placeholder='Поиск по названию, бренду, материалу, размеру...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      <div className='grid gap-4'>
        {filtered.length === 0 ? (
          <Card>
            <CardContent className='p-8 text-center text-gray-500'>Раковины не найдены</CardContent>
          </Card>
        ) : (
          filtered.map(row => (
            <Card key={row.id}>
              <CardContent className='p-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='font-semibold text-lg'>
                      {row.name}{' '}
                      {row.brand ? <span className='text-gray-500'>· {row.brand}</span> : null}
                    </div>
                    <div className='text-sm text-gray-600'>
                      {row.material ? `Материал: ${row.material}` : ''}
                      {row.material && row.size ? ' • ' : ''}
                      {row.size ? `Размер: ${row.size}` : ''}
                    </div>
                    <div className='text-sm text-gray-700 mt-1'>
                      {typeof row.price === 'number' && row.price > 0 && (
                        <>Цена: {row.price.toLocaleString('ru-RU')} сом</>
                      )}
                      {typeof row.stock === 'number' && <> · Остаток: {row.stock} шт</>}
                    </div>
                    {row.notes && <div className='text-xs text-gray-500 mt-1'>{row.notes}</div>}
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='bg-transparent'
                      onClick={() => openEdit(row)}
                    >
                      <Edit2 className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='bg-transparent'
                      onClick={() => void remove(row.id)}
                    >
                      <Trash2 className='w-4 h-4' />
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
