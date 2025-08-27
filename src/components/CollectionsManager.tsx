/**
 * Component for managing collections in the furniture factory system
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

interface Collection {
  id: string
  name: string
  description: string
}

/**
 * Collections management component
 */
export default function CollectionsManager() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    loadCollections()
  }, [])

  /**
   * Load collections from database
   */
  const loadCollections = async () => {
    try {
      const { data, error } = await supabase.from('collections').select('*').order('name')

      if (error) throw error
      setCollections(data || [])
    } catch (error) {
      console.error('Error loading collections:', error)
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
      if (editingCollection) {
        const { error } = await supabase
          .from('collections')
          .update(formData)
          .eq('id', editingCollection.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('collections').insert([formData])

        if (error) throw error
      }

      await loadCollections()
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving collection:', error)
    }
  }

  /**
   * Start editing collection
   */
  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection)
    setFormData({
      name: collection.name,
      description: collection.description,
    })
    setIsDialogOpen(true)
  }

  /**
   * Delete collection
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить коллекцию?')) return

    try {
      const { error } = await supabase.from('collections').delete().eq('id', id)

      if (error) throw error
      await loadCollections()
    } catch (error) {
      console.error('Error deleting collection:', error)
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
    setEditingCollection(null)
  }

  /**
   * Filter collections based on search
   */
  const filteredCollections = collections.filter(
    collection =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-lg'>Загрузка коллекций...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <h2 className='text-2xl font-bold'>Управление коллекциями</h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className='w-4 h-4 mr-2' />
              Добавить коллекцию
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[425px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-xl sm:rounded-lg'>
            <DialogHeader>
              <DialogTitle>
                {editingCollection ? 'Редактировать коллекцию' : 'Добавить коллекцию'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <Label htmlFor='name'>Название коллекции</Label>
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
                  {editingCollection ? 'Сохранить' : 'Добавить'}
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
              placeholder='Поиск коллекций...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>
      </div>

      <div className='grid gap-4'>
        {filteredCollections.length === 0 ? (
          <Card>
            <CardContent className='p-8 text-center'>
              <p className='text-gray-500'>Коллекции не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredCollections.map(collection => (
            <Card key={collection.id}>
              <CardContent className='p-4'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-lg'>{collection.name}</h3>
                    {collection.description && (
                      <p className='text-sm text-gray-600 mt-1'>{collection.description}</p>
                    )}
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm' onClick={() => handleEdit(collection)}>
                      <Edit2 className='w-4 h-4' />
                    </Button>
                    <Button variant='outline' size='sm' onClick={() => handleDelete(collection.id)}>
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
