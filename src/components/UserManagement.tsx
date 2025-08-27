/**
 * User management component for admins
 */
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Users, Shield, Eye, Plus, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react'
import { UserWithRole, getAllUsersWithRoles, updateUserRole, UserRole } from '../lib/auth'
import { signUp } from '../lib/supabase'

/**
 * User management component for role administration
 */
export default function UserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'manager' as UserRole,
  })
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  /**
   * Load all users with their roles
   */
  const loadUsers = async () => {
    try {
      const usersData = await getAllUsersWithRoles()
      setUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle role change for user
   */
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdating(userId)
      await updateUserRole(userId, newRole)
      await loadUsers() // Reload to show changes
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Ошибка при изменении роли пользователя')
    } finally {
      setUpdating(null)
    }
  }

  /**
   * Get role badge variant
   */
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'manager':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  /**
   * Get role display name
   */
  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Администратор'
      case 'manager':
        return 'Менеджер'
      default:
        return 'Неизвестно'
    }
  }

  /**
   * Handle creating new user
   */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!createForm.email || !createForm.password) {
      setCreateError('Заполните все обязательные поля')
      return
    }

    if (createForm.password !== createForm.confirmPassword) {
      setCreateError('Пароли не совпадают')
      return
    }

    if (createForm.password.length < 6) {
      setCreateError('Пароль должен содержать минимум 6 символов')
      return
    }

    try {
      setCreating(true)
      setCreateError('')

      console.log('👤 Создание нового пользователя:', createForm.email, createForm.role)

      // Create user via Supabase Auth
      const { data, error } = await signUp(createForm.email, createForm.password)

      if (error) {
        console.error('❌ Ошибка создания пользователя:', error)
        throw error
      }

      if (data?.user) {
        console.log('✅ Пользователь создан:', data.user.email)

        // Set user role
        try {
          await updateUserRole(data.user.id, createForm.role)
          console.log('✅ Роль назначена:', createForm.role)
        } catch (roleError) {
          console.log('⚠️ Ошибка назначения роли, но пользователь создан')
        }

        // Reload users list
        await loadUsers()

        // Reset form and close dialog
        setCreateForm({
          email: '',
          password: '',
          confirmPassword: '',
          role: 'manager',
        })
        setIsCreateDialogOpen(false)

        alert(`Пользователь ${createForm.email} успешно создан!`)
      }
    } catch (error: any) {
      console.error('❌ Ошибка создания пользователя:', error)

      if (error.message?.includes('User already registered')) {
        setCreateError('Пользователь с таким email уже существует')
      } else if (error.message?.includes('Invalid email')) {
        setCreateError('Некорректный email адрес')
      } else {
        setCreateError(`Ошибка создания пользователя: ${error.message}`)
      }
    } finally {
      setCreating(false)
    }
  }

  /**
   * Reset create form
   */
  const resetCreateForm = () => {
    setCreateForm({
      email: '',
      password: '',
      confirmPassword: '',
      role: 'manager',
    })
    setCreateError('')
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-lg'>Загрузка пользователей...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold flex items-center gap-2'>
          <Users className='w-6 h-6' />
          Управление пользователями
        </h2>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetCreateForm} className='flex items-center gap-2'>
              <UserPlus className='w-4 h-4' />
              Создать пользователя
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <UserPlus className='w-5 h-5' />
                Создание нового пользователя
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateUser} className='space-y-4'>
              {createError && (
                <div className='flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md'>
                  <AlertCircle className='w-4 h-4' />
                  {createError}
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='create-email' className='flex items-center gap-2'>
                  <Mail className='w-4 h-4' />
                  Email адрес
                </Label>
                <Input
                  id='create-email'
                  type='email'
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder='user@company.com'
                  required
                  disabled={creating}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='create-password' className='flex items-center gap-2'>
                  <Lock className='w-4 h-4' />
                  Пароль
                </Label>
                <Input
                  id='create-password'
                  type='password'
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder='••••••••'
                  required
                  minLength={6}
                  disabled={creating}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='create-confirm-password'>Подтвердите пароль</Label>
                <Input
                  id='create-confirm-password'
                  type='password'
                  value={createForm.confirmPassword}
                  onChange={e => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                  placeholder='••••••••'
                  required
                  minLength={6}
                  disabled={creating}
                />
              </div>

              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <Shield className='w-4 h-4' />
                  Роль пользователя
                </Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value: UserRole) => setCreateForm({ ...createForm, role: value })}
                  disabled={creating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='manager'>
                      <div className='flex items-center gap-2'>
                        <Eye className='w-4 h-4' />
                        Менеджер
                      </div>
                    </SelectItem>
                    <SelectItem value='admin'>
                      <div className='flex items-center gap-2'>
                        <Shield className='w-4 h-4' />
                        Администратор
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                <h4 className='font-medium text-blue-800 mb-2'>Права доступа:</h4>
                <div className='text-sm text-blue-700'>
                  {createForm.role === 'admin' ? (
                    <ul className='space-y-1'>
                      <li>✅ Полный доступ ко всем функциям</li>
                      <li>✅ Управление пользователями</li>
                      <li>✅ Редактирование данных</li>
                      <li>✅ Загрузка файлов</li>
                    </ul>
                  ) : (
                    <ul className='space-y-1'>
                      <li>✅ Просмотр данных</li>
                      <li>✅ Создание прайс-листов</li>
                      <li>✅ Печать документов</li>
                      <li>❌ Редактирование данных</li>
                    </ul>
                  )}
                </div>
              </div>

              <div className='flex gap-2 pt-4'>
                <Button type='submit' disabled={creating} className='flex-1'>
                  {creating ? (
                    <div className='flex items-center gap-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                      Создание...
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <UserPlus className='w-4 h-4' />
                      Создать пользователя
                    </div>
                  )}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={creating}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid gap-4'>
        {users.length === 0 ? (
          <Card>
            <CardContent className='p-8 text-center'>
              <p className='text-gray-500'>Пользователи не найдены</p>
            </CardContent>
          </Card>
        ) : (
          users.map(user => (
            <Card key={user.id}>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-lg flex items-center gap-2'>
                      {user.email}
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </h3>
                    <p className='text-sm text-gray-600'>
                      Регистрация: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>

                  <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2'>
                      <Shield className='w-4 h-4 text-gray-500' />
                      <Select
                        value={user.role}
                        onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}
                        disabled={updating === user.id}
                      >
                        <SelectTrigger className='w-40'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='manager'>
                            <div className='flex items-center gap-2'>
                              <Eye className='w-4 h-4' />
                              Менеджер
                            </div>
                          </SelectItem>
                          <SelectItem value='admin'>
                            <div className='flex items-center gap-2'>
                              <Shield className='w-4 h-4' />
                              Администратор
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {updating === user.id && (
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
                    )}
                  </div>
                </div>

                <div className='mt-3 p-3 bg-gray-50 rounded-lg'>
                  <h4 className='font-medium text-sm mb-2'>Права доступа:</h4>
                  <div className='flex gap-2 text-xs'>
                    {user.role === 'admin' ? (
                      <>
                        <Badge
                          variant='outline'
                          className='bg-green-50 text-green-700 border-green-200'
                        >
                          Полный доступ
                        </Badge>
                        <Badge
                          variant='outline'
                          className='bg-blue-50 text-blue-700 border-blue-200'
                        >
                          Управление пользователями
                        </Badge>
                        <Badge
                          variant='outline'
                          className='bg-purple-50 text-purple-700 border-purple-200'
                        >
                          Редактирование данных
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Badge
                          variant='outline'
                          className='bg-blue-50 text-blue-700 border-blue-200'
                        >
                          Просмотр данных
                        </Badge>
                        <Badge
                          variant='outline'
                          className='bg-green-50 text-green-700 border-green-200'
                        >
                          Создание прайс-листов
                        </Badge>
                        <Badge
                          variant='outline'
                          className='bg-orange-50 text-orange-700 border-orange-200'
                        >
                          Печать документов
                        </Badge>
                      </>
                    )}
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
