/**
 * Product view types management component with individual markups
 */
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, Percent } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { supabase, PRODUCT_CATEGORIES } from '../lib/supabase'

interface ProductViewType {
  id: string
  name: string
  category: string
  base_markup: number
  labor_cost: number
  description: string
  created_at: string
  updated_at: string
}

const DEFAULT_VIEW_TYPES = [
  { name: 'Тумба', category: 'Тумбы', base_markup: 150.0, labor_cost: 800, description: 'Базовая тумба' },
  { name: 'Тумба краш', category: 'Тумбы', base_markup: 200.0, labor_cost: 1200, description: 'Тумба с крашенными фасадами' },
  { name: 'Тум с ящ', category: 'Тумбы', base_markup: 180.0, labor_cost: 1000, description: 'Тумба с выдвижными ящиками' },
  { name: 'Тумба с ящ краш', category: 'Тумбы', base_markup: 230.0, labor_cost: 1400, description: 'Тумба с ящиками и крашенными фасадами' },
  { name: 'Пенал', category: 'Пеналы', base_markup: 160.0, labor_cost: 600, description: 'Базовый пенал' },
  { name: 'Пенал краш', category: 'Пеналы', base_markup: 210.0, labor_cost: 900, description: 'Пенал с крашенными фасадами' },
  { name: 'Зеркало', category: 'Зеркала', base_markup: 120.0, labor_cost: 400, description: 'Базовое зеркало' },
  { name: 'Зеркало краш', category: 'Зеркала', base_markup: 170.0, labor_cost: 600, description: 'Зеркало с крашенным корпусом' },
  { name: 'LED', category: 'Зеркала', base_markup: 250.0, labor_cost: 800, description: 'Зеркало с LED подсветкой' },
  { name: 'Простое зеркало', category: 'Зеркала', base_markup: 100.0, labor_cost: 300, description: 'Простое зеркало без корпуса' }
]

/**
 * ProductViewTypesManager component for managing product view types and their individual markups
 */
export default function ProductViewTypesManager() {
  const [viewTypes, setViewTypes] = useState<ProductViewType[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newViewType, setNewViewType] = useState({
    name: '',
    category: 'Тумбы',
    base_markup: 150.0,
    labor_cost: 800,
    description: ''
  })
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchViewTypes()
  }, [])

  const fetchViewTypes = async () => {
    try {
      console.log('🔄 Загрузка видов товаров...')
      
      const { data, error } = await supabase
        .from('product_view_types')
        .select('*')
        .order('category', { ascending: true })
      
      if (error) {
        console.log('⚠️ Ошибка загрузки видов товаров:', error.code, error.message)
        
        // Если таблица не существует или другие ошибки, используем дефолтные данные
        if (error.code === '42P01' || error.code === 'PGRST106' || error.message.includes('does not exist')) {
          console.log('📋 Используем данные по умолчанию')
          
          const defaultTypes = DEFAULT_VIEW_TYPES.map((type, index) => ({
            id: (index + 1).toString(),
            name: type.name,
            category: type.category,
            base_markup: type.base_markup,
            labor_cost: type.labor_cost,
            description: type.description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
          
          setViewTypes(defaultTypes)
          console.log('✅ Загружено видов товаров (по умолчанию):', defaultTypes.length)
          return
        }
        
        // Другие ошибки - показываем пустой список
        setViewTypes([])
        return
      }
      
      console.log('✅ Загружено видов товаров из базы:', data?.length || 0)
      setViewTypes(data || [])
      
    } catch (error) {
      console.error('❌ Критическая ошибка загрузки видов товаров:', error)
      
      // Fallback на дефолтные данные при критических ошибках
      const fallbackTypes = DEFAULT_VIEW_TYPES.map((type, index) => ({
        id: `fallback-${index + 1}`,
        name: type.name,
        category: type.category,
        base_markup: type.base_markup,
        labor_cost: type.labor_cost,
        description: type.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      setViewTypes(fallbackTypes)
      console.log('🆘 Используем аварийные данные:', fallbackTypes.length)
    }
  }

  const addViewType = async () => {
    try {
      const { data, error } = await supabase
        .from('product_view_types')
        .insert([newViewType])
        .select()

      if (error) {
        // If table doesn't exist, add locally
        const newType = {
          id: Date.now().toString(),
          name: newViewType.name,
          category: newViewType.category,
          base_markup: newViewType.base_markup,
          labor_cost: newViewType.labor_cost,
          description: newViewType.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setViewTypes([...viewTypes, newType])
        setNewViewType({ name: '', category: 'Тумбы', base_markup: 150.0, labor_cost: 800, description: '' })
        setShowAddForm(false)
        return
      }
      
      if (data) {
        setViewTypes([...viewTypes, ...data])
        setNewViewType({ name: '', category: 'Тумбы', base_markup: 150.0, labor_cost: 800, description: '' })
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Error adding view type:', error)
      // Fallback to local add
      const newType = {
        id: Date.now().toString(),
        name: newViewType.name,
        category: newViewType.category,
        base_markup: newViewType.base_markup,
        labor_cost: newViewType.labor_cost,
        description: newViewType.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setViewTypes([...viewTypes, newType])
      setNewViewType({ name: '', category: 'Тумбы', base_markup: 150.0, labor_cost: 800, description: '' })
      setShowAddForm(false)
    }
  }

  const updateViewType = async (id: string, updates: Partial<ProductViewType>) => {
    try {
      const { error } = await supabase
        .from('product_view_types')
        .update(updates)
        .eq('id', id)

      if (error) {
        // If table doesn't exist, update locally
        setViewTypes(viewTypes.map(vt => vt.id === id ? { ...vt, ...updates } : vt))
        setEditingId(null)
        return
      }
      
      setViewTypes(viewTypes.map(vt => vt.id === id ? { ...vt, ...updates } : vt))
      setEditingId(null)
    } catch (error) {
      console.error('Error updating view type:', error)
      // Fallback to local update
      setViewTypes(viewTypes.map(vt => vt.id === id ? { ...vt, ...updates } : vt))
      setEditingId(null)
    }
  }

  const deleteViewType = async (id: string) => {
    if (!confirm('Удалить тип товара?')) return
    
    try {
      const { error } = await supabase
        .from('product_view_types')
        .delete()
        .eq('id', id)

      if (error) {
        // If table doesn't exist, delete locally
        setViewTypes(viewTypes.filter(vt => vt.id !== id))
        return
      }
      
      setViewTypes(viewTypes.filter(vt => vt.id !== id))
    } catch (error) {
      console.error('Error deleting view type:', error)
      // Fallback to local delete
      setViewTypes(viewTypes.filter(vt => vt.id !== id))
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Тумбы': 'bg-blue-100 text-blue-800',
      'Пеналы': 'bg-green-100 text-green-800',
      'Зеркала': 'bg-purple-100 text-purple-800',
      'Полки': 'bg-yellow-100 text-yellow-800',
      'Шкафы': 'bg-red-100 text-red-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getMarkupColor = (markup: number) => {
    if (markup >= 250) return 'bg-red-100 text-red-800'
    if (markup >= 200) return 'bg-orange-100 text-orange-800'
    if (markup >= 150) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getLaborCostColor = (cost: number) => {
    if (cost >= 1500) return 'bg-red-100 text-red-800'
    if (cost >= 1000) return 'bg-orange-100 text-orange-800'
    if (cost >= 600) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Управление видами товаров и наценками
          </CardTitle>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Добавить вид товара
          </Button>
        </CardHeader>
        

        <CardContent>
          {showAddForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="name">Название вида</Label>
                  <Input
                    id="name"
                    value={newViewType.name}
                    onChange={(e) => setNewViewType({ ...newViewType, name: e.target.value })}
                    placeholder="Название вида товара"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Категория</Label>
                  <select
                    id="category"
                    value={newViewType.category}
                    onChange={(e) => setNewViewType({ ...newViewType, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="markup">Базовая наценка (%)</Label>
                  <Input
                    id="markup"
                    type="number"
                    step="0.1"
                    min="0"
                    value={newViewType.base_markup}
                    onChange={(e) => setNewViewType({ ...newViewType, base_markup: parseFloat(e.target.value) || 0 })}
                    placeholder="150.0"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={newViewType.description}
                    onChange={(e) => setNewViewType({ ...newViewType, description: e.target.value })}
                    placeholder="Описание вида товара"
                    rows={1}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addViewType} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Сохранить
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  <X className="w-4 h-4" />
                  Отмена
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название вида</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Базовая наценка</TableHead>
                  <TableHead>Работа (сом)</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewTypes.map((viewType) => (
                  <ViewTypeRow
                    key={viewType.id}
                    viewType={viewType}
                    isEditing={editingId === viewType.id}
                    onEdit={() => setEditingId(viewType.id)}
                    onSave={(updates) => updateViewType(viewType.id, updates)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => deleteViewType(viewType.id)}
                    getCategoryColor={getCategoryColor}
                    getMarkupColor={getMarkupColor}
                    getLaborCostColor={getLaborCostColor}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ViewTypeRowProps {
  viewType: ProductViewType
  isEditing: boolean
  onEdit: () => void
  onSave: (updates: Partial<ProductViewType>) => void
  onCancel: () => void
  onDelete: () => void
  getCategoryColor: (category: string) => string
  getMarkupColor: (markup: number) => string
  getLaborCostColor: (cost: number) => string
}

function ViewTypeRow({ viewType, isEditing, onEdit, onSave, onCancel, onDelete, getCategoryColor, getMarkupColor, getLaborCostColor }: ViewTypeRowProps) {
  const [editData, setEditData] = useState(viewType)

  const handleSave = () => {
    onSave(editData)
  }

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <Input
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />
        </TableCell>
        <TableCell>
          <select
            value={editData.category}
            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRODUCT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </TableCell>
        <TableCell>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={editData.base_markup}
            onChange={(e) => setEditData({ ...editData, base_markup: parseFloat(e.target.value) || 0 })}
          />
        </TableCell>
        <TableCell>
          <Input
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          />
        </TableCell>

      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{viewType.name}</TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(viewType.category)}`}>
          {viewType.category}
        </span>
      </TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getMarkupColor(viewType.base_markup)}`}>
          +{viewType.base_markup}%
        </span>
      </TableCell>
      <TableCell className="text-sm text-gray-600">{viewType.description}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}