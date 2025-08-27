/**
 * Component for managing tech card history and changes
 */
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { History, Eye, FileText, Calendar, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface TechCardChange {
  id: string
  product_id: string
  product_name: string
  change_type: 'created' | 'updated' | 'deleted'
  changed_by: string
  changes: any
  previous_data: any
  new_data: any
  created_at: string
}

interface TechCardHistoryProps {
  productId?: string
}

/**
 * TechCardHistory component for tracking changes
 */
export default function TechCardHistory({ productId }: TechCardHistoryProps) {
  const [changes, setChanges] = useState<TechCardChange[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChange, setSelectedChange] = useState<TechCardChange | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadChanges()
  }, [productId])

  /**
   * Load tech card changes from database
   */
  const loadChanges = async () => {
    try {
      let query = supabase
        .from('tech_card_changes')
        .select('*')
        .order('created_at', { ascending: false })

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query.limit(50)

      if (error) {
        console.error('Error loading changes:', error)
        // Use mock data if table doesn't exist
        const mockChanges = [
          {
            id: '1',
            product_id: productId || 'prod1',
            product_name: 'Зеркало Классик 80',
            change_type: 'created' as const,
            changed_by: 'admin@wasser.ru',
            changes: { action: 'Создана тех карта' },
            previous_data: null,
            new_data: { materials_count: 15, total_cost: 2500 },
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            product_id: productId || 'prod1',
            product_name: 'Зеркало Классик 80',
            change_type: 'updated' as const,
            changed_by: 'manager@wasser.ru',
            changes: { materials_updated: 2, cost_changed: true },
            previous_data: { total_cost: 2500 },
            new_data: { total_cost: 2650 },
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '3',
            product_id: productId || 'prod2',
            product_name: 'Тумба Модерн 60',
            change_type: 'created' as const,
            changed_by: 'admin@wasser.ru',
            changes: { action: 'Создан новый товар' },
            previous_data: null,
            new_data: { materials_count: 12, total_cost: 1800 },
            created_at: new Date(Date.now() - 172800000).toISOString(),
          },
        ]
        setChanges(mockChanges)
        return
      }

      setChanges(data || [])
    } catch (error) {
      console.error('Error loading changes:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get change type color
   */
  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-green-100 text-green-800'
      case 'updated':
        return 'bg-blue-100 text-blue-800'
      case 'deleted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  /**
   * Get change type text
   */
  const getChangeTypeText = (type: string) => {
    switch (type) {
      case 'created':
        return 'Создание'
      case 'updated':
        return 'Изменение'
      case 'deleted':
        return 'Удаление'
      default:
        return 'Неизвестно'
    }
  }

  /**
   * View change details
   */
  const viewChangeDetails = (change: TechCardChange) => {
    setSelectedChange(change)
    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-lg'>Загрузка истории...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <History className='w-5 h-5' />
            История изменений тех карт
          </CardTitle>
        </CardHeader>
        <CardContent>
          {changes.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <FileText className='w-12 h-12 mx-auto mb-4 text-gray-300' />
              <p>История изменений пуста</p>
            </div>
          ) : (
            <>
              {changes[0]?.id === '1' && (
                <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <p className='text-sm text-yellow-800'>
                    📝 <strong>Демо-данные:</strong> Показаны примеры истории изменений. Создайте
                    таблицу в базе данных для отслеживания реальных изменений.
                  </p>
                </div>
              )}

              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Продукт</TableHead>
                      <TableHead>Тип изменения</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.map(change => (
                      <TableRow key={change.id}>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Calendar className='w-4 h-4 text-gray-400' />
                            <span className='text-sm'>
                              {new Date(change.created_at).toLocaleString('ru-RU')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='font-medium'>{change.product_name}</div>
                          <div className='text-sm text-gray-500'>ID: {change.product_id}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getChangeTypeColor(change.change_type)}>
                            {getChangeTypeText(change.change_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <User className='w-4 h-4 text-gray-400' />
                            <span className='text-sm'>{change.changed_by}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => viewChangeDetails(change)}
                          >
                            <Eye className='w-4 h-4 mr-2' />
                            Подробности
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Change details dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Детали изменения</DialogTitle>
          </DialogHeader>
          {selectedChange && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-600'>Продукт</label>
                  <p className='font-medium'>{selectedChange.product_name}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>Тип изменения</label>
                  <Badge className={getChangeTypeColor(selectedChange.change_type)}>
                    {getChangeTypeText(selectedChange.change_type)}
                  </Badge>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>Дата</label>
                  <p>{new Date(selectedChange.created_at).toLocaleString('ru-RU')}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>Пользователь</label>
                  <p>{selectedChange.changed_by}</p>
                </div>
              </div>

              <div>
                <label className='text-sm font-medium text-gray-600'>Описание изменений</label>
                <div className='mt-2 p-3 bg-gray-50 rounded-lg'>
                  <pre className='text-sm text-gray-700 whitespace-pre-wrap'>
                    {JSON.stringify(selectedChange.changes, null, 2)}
                  </pre>
                </div>
              </div>

              {selectedChange.change_type === 'updated' && (
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-600'>Предыдущие данные</label>
                    <div className='mt-2 p-3 bg-red-50 rounded-lg'>
                      <pre className='text-sm text-red-700 whitespace-pre-wrap'>
                        {JSON.stringify(selectedChange.previous_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-600'>Новые данные</label>
                    <div className='mt-2 p-3 bg-green-50 rounded-lg'>
                      <pre className='text-sm text-green-700 whitespace-pre-wrap'>
                        {JSON.stringify(selectedChange.new_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
