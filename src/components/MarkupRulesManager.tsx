/**
 * @file MarkupRulesManager.tsx
 * @description Управление правилами наценки: CRUD через Supabase с fallback.
 * Таблица: markup_rules (id, name text, percent numeric, condition jsonb, active boolean)
 */

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Plus, Edit2, Trash2, Search, Percent } from 'lucide-react'
import { supabase } from '../lib/supabase'

/** Правило наценки */
export interface MarkupRule {
  id: string
  name: string
  percent: number
  condition?: any
  active: boolean
}

/** Безопасный парсер JSON-условия */
function safeJsonParse(input: string): any | null {
  const t = (input || '').trim()
  if (!t) return null
  try {
    return JSON.parse(t)
  } catch {
    return { raw: t }
  }
}

/** Возврат JSON компактной строкой */
function pretty(obj: any): string {
  try {
    return JSON.stringify(obj ?? null, null, 2)
  } catch {
    return ''
  }
}

/**
 * MarkupRulesManager — CRUD для правил наценки
 */
export default function MarkupRulesManager(): JSX.Element {
  const [items, setItems] = useState<MarkupRule[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [open, setOpen] = useState<boolean>(false)
  const [editing, setEditing] = useState<MarkupRule | null>(null)

  const [form, setForm] = useState<{
    name: string
    percent: number
    conditionText: string
    active: boolean
  }>({
    name: '',
    percent: 0,
    conditionText: '',
    active: true,
  })

  /** Загрузка */
  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('markup_rules').select('*').order('name')
      if (!error && data) {
        setItems(
          data.map((x: any) => ({
            id: x.id,
            name: x.name,
            percent: Number(x.percent || 0),
            condition: x.condition ?? null,
            active: !!x.active,
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
    setForm({ name: '', percent: 0, conditionText: '', active: true })
    setOpen(true)
  }
  const openEdit = (row: MarkupRule) => {
    setEditing(row)
    setForm({
      name: row.name,
      percent: row.percent,
      conditionText: pretty(row.condition),
      active: row.active,
    })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      percent: form.percent,
      condition: safeJsonParse(form.conditionText),
      active: form.active,
    }
    try {
      if (editing) {
        const { error } = await supabase.from('markup_rules').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('markup_rules').insert([payload])
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
    if (!confirm('Удалить правило наценки?')) return
    try {
      const { error } = await supabase.from('markup_rules').delete().eq('id', id)
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
        String(x.percent).includes(q) ||
        JSON.stringify(x.condition || {})
          .toLowerCase()
          .includes(q)
    )
  }, [items, search])

  if (loading) return <div className='p-8 text-center text-gray-600'>Загрузка правил...</div>

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <h2 className='text-2xl font-bold flex items-center gap-2'>
          <Percent className='w-5 h-5' />
          Правила наценки
        </h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className='w-4 h-4 mr-2' />
              Добавить правило
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[720px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-xl sm:rounded-lg'>
            <DialogHeader>
              <DialogTitle>{editing ? 'Редактировать правило' : 'Новое правило'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='md:col-span-2'>
                  <Label htmlFor='name'>Название</Label>
                  <Input
                    id='name'
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='percent'>Наценка, %</Label>
                  <Input
                    id='percent'
                    type='number'
                    step='0.1'
                    value={form.percent}
                    onChange={e =>
                      setForm(f => ({ ...f, percent: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='cond'>Условие (JSON)</Label>
                <Textarea
                  id='cond'
                  rows={6}
                  placeholder='Например: { "category": "sinks", "brand": "Aqua" }'
                  value={form.conditionText}
                  onChange={e => setForm(f => ({ ...f, conditionText: e.target.value }))}
                />
                <div className='text-xs text-gray-500 mt-1'>
                  Если оставить пустым — правило применяется ко всем позициям.
                </div>
              </div>

              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className='rounded border-gray-300'
                />
                Активно
              </label>

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
            placeholder='Поиск по названию, проценту, условию...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      <div className='grid gap-4'>
        {filtered.length === 0 ? (
          <Card>
            <CardContent className='p-8 text-center text-gray-500'>Правила не найдены</CardContent>
          </Card>
        ) : (
          filtered.map(row => (
            <Card key={row.id}>
              <CardContent className='p-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='font-semibold text-lg'>
                      {row.name} · <span className='text-gray-600'>{row.percent}%</span>{' '}
                      {row.active ? '' : <span className='text-red-600'>· не активно</span>}
                    </div>
                    <div className='text-xs text-gray-600 mt-1'>
                      Условие: <span className='font-mono'>{pretty(row.condition) || '—'}</span>
                    </div>
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
