/**
 * Component for managing materials in the furniture factory system
 * - Robust batch import to Supabase with progress and clearer error messages.
 * - Global progress bar via useSyncStore (startSync, setProgress, setMessage, stopSync).
 * - Fixed HTML entity artifacts (&lt;, &gt;, &amp;) → real operators (<, >, &&).
 */

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Trash2, Edit2, Plus, Search, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { parseXLSXMaterials, MaterialImport } from '../lib/xlsx-parser'
import FileUpload from './FileUpload'
import { useSyncStore } from '../store/sync-store'

/** Shape of a material row in UI */
interface Material {
  id: string
  name: string
  article?: string
  type: string
  unit: string
  price: number
  category?: string
  created_at?: string
  updated_at?: string
}

/**
 * Materials management component
 */
export default function MaterialsManager() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [importedMaterials, setImportedMaterials] = useState<MaterialImport[]>([])
  const [isImporting, setIsImporting] = useState(false)

  // Local progress state for batch import (preview)
  const [importProgress, setImportProgress] = useState(0)
  const [importTotal, setImportTotal] = useState(0)
  const [importError, setImportError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    article: '',
    type: '',
    unit: '',
    price: 0,
  })

  const materialTypes = [
    'Листовые материалы',
    'Фурнитура',
    'Крепеж',
    'Кромка',
    'Клей',
    'Пленка',
    'Прочие',
  ]

  const units = ['шт', 'м', 'м2', 'м3', 'кг', 'г', 'л', 'мл', 'пог.м']

  // Global sync/progress API
  const { startSync, setMessage, setProgress, stopSync } = useSyncStore()

  useEffect(() => {
    loadMaterials()
  }, [])

  /**
   * Load materials from database
   */
  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase.from('materials').select('*').order('name')

      if (error) throw error
      setMaterials((data as any) || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle form submission for create/update
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingMaterial) {
        // Первая попытка: с type (если есть в форме)
        let { error } = await supabase
          .from('materials')
          .update(formData)
          .eq('id', editingMaterial.id)
        // Если в схеме нет колонки type — повторим без неё
        if (error && /type/i.test(error.message || '')) {
          const { type, ...safe } = formData as any
          const retry = await supabase.from('materials').update(safe).eq('id', editingMaterial.id)
          if (retry.error) throw retry.error
        } else if (error) {
          throw error
        }
      } else {
        // Первая попытка: с type
        let { error } = await supabase.from('materials').insert([formData])
        if (error && /type/i.test(error.message || '')) {
          const { type, ...safe } = formData as any
          const retry = await supabase.from('materials').insert([safe])
          if (retry.error) throw retry.error
        } else if (error) {
          throw error
        }
      }

      await loadMaterials()
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving material:', error)
      alert('Не удалось сохранить материал. Подробности в консоли.')
    }
  }

  /**
   * Start editing material
   */
  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name,
      article: material.article || '',
      type: material.type,
      unit: material.unit,
      price: material.price,
    })
    setIsDialogOpen(true)
  }

  /**
   * Delete material by id
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить материал?')) return

    try {
      const { error } = await supabase.from('materials').delete().eq('id', id)
      if (error) throw error
      await loadMaterials()
    } catch (error) {
      console.error('Error deleting material:', error)
      alert('Не удалось удалить материал. Подробности в консоли.')
    }
  }

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      name: '',
      article: '',
      type: '',
      unit: '',
      price: 0,
    })
    setEditingMaterial(null)
  }

  /**
   * Handle Excel file upload for materials import
   */
  const handleExcelUpload = async (files: File[]) => {
    const excelFile = files.find(file => file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))

    if (!excelFile) {
      alert('Пожалуйста, выберите Excel файл (.xlsx или .xls)')
      return
    }

    try {
      setIsImporting(true)
      setImportError(null)

      // Global header — reading Excel
      startSync('Чтение Excel...', 10)
      const materials = await parseXLSXMaterials(excelFile)
      setProgress(60)
      setMessage('Подготовка данных...')

      if (materials.length === 0) {
        alert('В файле не найдено материалов для импорта')
        setProgress(100)
        stopSync()
        return
      }
      setImportedMaterials(materials)
      setProgress(100)
    } catch (error: any) {
      console.error('Error parsing Excel:', error)
      alert('Ошибка при обработке Excel файла: ' + (error?.message || String(error)))
    } finally {
      setIsImporting(false)
      stopSync()
    }
  }

  /**
   * Import materials to database
   * - Inserts in small batches to avoid payload/network issues.
   * - Shows progress and provides clearer error messages.
   * - Updates global top progress bar.
   */
  const handleImportMaterials = async () => {
    if (importedMaterials.length === 0) return

    // Prepare materials for database insertion
    const materialsToInsert = importedMaterials.map((material, index) => ({
      name: material.name,
      article: material.article || `IMP-${Date.now()}-${String(index + 1).padStart(3, '0')}`,
      // type может отсутствовать в БД — будем пытаться добавить, при ошибке удалим это поле и повторим
      type: material.category || 'Прочие материалы',
      unit: material.unit || 'шт',
      price: material.price || 0,
    }))

    const BATCH_SIZE = 200
    setIsImporting(true)
    setImportError(null)
    setImportTotal(materialsToInsert.length)
    setImportProgress(0)

    // Global header — import
    startSync('Импорт материалов...', 0)

    try {
      for (let i = 0; i < materialsToInsert.length; i += BATCH_SIZE) {
        const chunk = materialsToInsert.slice(i, i + BATCH_SIZE)

        try {
          // Первая попытка — с type
          let { error } = await supabase.from('materials').insert(chunk)
          if (error && /type/i.test(error.message || '')) {
            // Если колонка type отсутствует — повторяем вставку без неё
            const chunkSafe = chunk.map(({ type, ...rest }) => rest)
            const retry = await supabase.from('materials').insert(chunkSafe as any[])
            if (retry.error) {
              throw new Error(retry.error.message || 'Ошибка вставки данных (повтор без type)')
            }
          } else if (error) {
            throw new Error(error.message || 'Ошибка вставки данных')
          }
        } catch (err: any) {
          if (err?.message?.includes('Failed to fetch')) {
            setImportError(
              'Сетевая ошибка при отправке данных. Проверьте интернет/блокировщики и повторите позже.'
            )
          } else {
            setImportError(err?.message || 'Не удалось импортировать часть данных.')
          }
          console.error('Batch import error:', err)
          throw err // stop further batches
        }

        // Local and global progress
        setImportProgress(prev =>
          Math.min(importTotal || materialsToInsert.length, prev + chunk.length)
        )
        const percent =
          (Math.min(importTotal || materialsToInsert.length, i + chunk.length) /
            (importTotal || materialsToInsert.length)) *
          100
        setProgress(percent)

        // Small delay to avoid rate limiting
        await new Promise(res => setTimeout(res, 150))
      }

      alert(`Успешно импортировано ${materialsToInsert.length} материалов`)
      // Reload materials and close dialog
      await loadMaterials()
      setIsImportDialogOpen(false)
      setImportedMaterials([])
      setProgress(100)
    } catch {
      // error message is already set in importError
    } finally {
      setIsImporting(false)
      stopSync()
    }
  }

  /**
   * Cancel import process
   */
  const handleCancelImport = () => {
    setImportedMaterials([])
    setIsImportDialogOpen(false)
    setImportError(null)
    setImportProgress(0)
    setImportTotal(0)
  }

  /**
   * Filter materials based on search and type
   */
  const filteredMaterials = materials.filter(material => {
    const matchesSearch =
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.article || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || material.type === filterType
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='w-full max-w-md'>
          <div className='h-2 w-full bg-gray-200 rounded'>
            <div className='h-2 w-1/3 bg-gray-400 animate-pulse rounded' />
          </div>
          <p className='mt-3 text-center text-gray-600'>Загрузка материалов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <h2 className='text-2xl font-bold'>Управление материалами</h2>

        <div className='flex gap-2'>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant='outline'>
                <Upload className='w-4 h-4 mr-2' />
                Загрузить из Excel
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[600px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-xl'>
              <DialogHeader>
                <DialogTitle>Импорт материалов из Excel</DialogTitle>
              </DialogHeader>

              <div className='space-y-4'>
                {importedMaterials.length === 0 ? (
                  <div>
                    <p className='text-sm text-gray-600 mb-4'>
                      Шаблон колонок: <b>Артикул (необязательно)</b>, <b>Наименование</b>,{' '}
                      <b>Единица измерения</b>, <b>Цена</b>.
                      <br />
                      Поддерживаются цены с запятыми и пробелами (например, 1&nbsp;165,97).
                    </p>

                    <FileUpload
                      title='Выберите Excel файл'
                      description='Поддерживаемые форматы: .xlsx, .xls'
                      acceptedFileTypes={['.xlsx', '.xls']}
                      maxFiles={1}
                      onFilesUploaded={handleExcelUpload}
                    />

                    {isImporting && (
                      <div className='mt-4'>
                        <div className='w-full h-2 bg-gray-100 rounded'>
                          <div className='h-2 w-1/2 bg-blue-500 animate-pulse rounded' />
                        </div>
                        <p className='mt-2 text-sm text-blue-600'>Обработка файла...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <h4 className='font-medium'>
                        Найдено материалов: {importedMaterials.length}
                      </h4>
                      <div className='flex gap-2'>
                        <Button onClick={handleImportMaterials} disabled={isImporting}>
                          {isImporting ? 'Импорт...' : 'Импортировать все'}
                        </Button>
                        <Button variant='outline' onClick={handleCancelImport}>
                          Отмена
                        </Button>
                      </div>
                    </div>

                    {/* Progress & error display */}
                    {(isImporting || importProgress > 0 || importError) && (
                      <div className='mb-3 space-y-2'>
                        <div className='text-xs text-gray-600'>
                          Прогресс: {importProgress} / {importTotal || importedMaterials.length}
                        </div>
                        <div className='w-full h-2 bg-gray-100 rounded'>
                          <div
                            className='h-2 bg-blue-500 rounded'
                            style={{
                              width: `${Math.round(
                                ((importProgress || 0) /
                                  (importTotal || importedMaterials.length)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                        {importError && <div className='text-sm text-red-600'>{importError}</div>}
                      </div>
                    )}

                    <div className='max-h-96 overflow-y-auto border rounded-lg'>
                      <table className='w-full text-sm'>
                        <thead className='bg-gray-50 sticky top-0'>
                          <tr>
                            <th className='p-2 text-left'>Артикул</th>
                            <th className='p-2 text-left'>Наименование</th>
                            <th className='p-2 text-left'>Категория</th>
                            <th className='p-2 text-left'>Единица</th>
                            <th className='p-2 text-left'>Цена (сом)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importedMaterials.map((material, index) => (
                            <tr key={index} className='border-t'>
                              <td className='p-2 text-gray-600'>{material.article || '—'}</td>
                              <td className='p-2 font-medium'>{material.name}</td>
                              <td className='p-2 text-gray-600'>{material.category}</td>
                              <td className='p-2'>{material.unit}</td>
                              <td className='p-2'>{material.price.toFixed(2)} сом</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className='w-4 h-4 mr-2' />
                Добавить материал
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-xl sm:rounded-lg'>
              <DialogHeader>
                <DialogTitle>
                  {editingMaterial ? 'Редактировать материал' : 'Добавить материал'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <Label htmlFor='name'>Наименование</Label>
                  <Input
                    id='name'
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='article'>Артикул</Label>
                  <Input
                    id='article'
                    value={formData.article}
                    onChange={e => setFormData({ ...formData, article: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor='type'>Тип материала</Label>
                  <Select
                    value={formData.type}
                    onValueChange={value => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Выберите тип' />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='unit'>Единица измерения</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={value => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Выберите единицу' />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='price'>Цена</Label>
                  <Input
                    id='price'
                    type='number'
                    step='0.01'
                    value={formData.price}
                    onChange={e =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className='flex gap-2'>
                  <Button type='submit' className='flex-1'>
                    {editingMaterial ? 'Сохранить' : 'Добавить'}
                  </Button>
                  <Button type='button' variant='outline' onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              placeholder='Поиск по названию или артикулу...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>
        <div className='sm:w-64'>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Все типы</SelectItem>
              {materialTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='grid gap-4'>
        {filteredMaterials.length === 0 ? (
          <Card>
            <CardContent className='p-8 text-center'>
              <p className='text-gray-500'>Материалы не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredMaterials.map(material => (
            <Card key={material.id}>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-lg'>{material.name}</h3>
                    <p className='text-sm text-gray-600'>
                      Артикул: {material.article || '—'} | Тип: {material.type || '—'}
                    </p>
                    <p className='text-sm text-gray-600'>
                      Цена: {material.price} сом/{material.unit}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm' onClick={() => handleEdit(material)}>
                      <Edit2 className='w-4 h-4' />
                    </Button>
                    <Button variant='outline' size='sm' onClick={() => handleDelete(material.id)}>
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
