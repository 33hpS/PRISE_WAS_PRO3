/**
 * Component for managing product types in the furniture factory system
 */
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { Trash2, Edit2, Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ProductType {
  id: string
  name: string
  description: string
}

/**
 * Product types management component
 */
export default function ProductTypesManager() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<ProductType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    loadProductTypes()
  }, [])

  /**
   * Load product types from database
   */
  const loadProductTypes = async () => {
    try {
      const { data, error } = await supabase.from('product_types').select('*').order('name')

      if (error) throw error
      setProductTypes(data || [])
    } catch (error) {
      console.error('Error loading product types:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingType) {
        const { error } = await supabase
          .from('product_types')
          .update(formData)
          .eq('id', editingType.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('product_types').insert([formData])

        if (error) throw error
      }

      await loadProductTypes()
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving product type:', error)
    }
  }

  /**
   * Start editing product type
   */
  const handleEdit = (type: ProductType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description,
    })
    setIsDialogOpen(true)
  }

  /**
   * Delete product type
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить тип товара?')) return

    try {
      const { error } = await supabase.from('product_types').delete().eq('id', id)

      if (error) throw error
      await loadProductTypes()
    } catch (error) {
      console.error('Error deleting product type:', error)
    }
  }

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    })
    setEditingType(null)
  }

  /**
   * Filter product types based on search
   */
  const filteredTypes = productTypes.filter(
    type =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-lg'>Загрузка типов товаров...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <h2 className='text-2xl font-bold'>Управление типами товаров</h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className='w-4 h-4 mr-2' />
              Добавить тип товара
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[425px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-xl sm:rounded-lg'>
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Редактировать тип товара' : 'Добавить тип товара'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <Label htmlFor='name'>Название типа</Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor='description'>Описание</Label>
                <Textarea
                  id='description'
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className='flex gap-2'>
                <Button type='submit' className='flex-1'>
                  {editingType ? 'Сохранить' : 'Добавить'}
                </Button>
                <Button type='button' variant='outline' onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='flex gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              placeholder='Поиск типов товаров...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>
      </div>

      <div className='grid gap-4'>
        {filteredTypes.length === 0 ? (
          <Card>
            <CardContent className='p-8 text-center'>
              <p className='text-gray-500'>Типы товаров не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredTypes.map(type => (
            <Card key={type.id}>
              <CardContent className='p-4'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-lg'>{type.name}</h3>
                    {type.description && (
                      <p className='text-sm text-gray-600 mt-1'>{type.description}</p>
                    )}
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm' onClick={() => handleEdit(type)}>
                      <Edit2 className='w-4 h-4' />
                    </Button>
                    <Button variant='outline' size='sm' onClick={() => handleDelete(type.id)}>
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
