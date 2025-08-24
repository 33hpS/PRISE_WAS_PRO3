/**
 * Authentication and role management utilities (with local dev-session support)
 */
import { supabase } from './supabase'

export type UserRole = 'admin' | 'manager'

export interface UserWithRole {
  id: string
  email: string
  role: UserRole
  created_at: string
}

/**
 * Max age for local dev session (7 days)
 */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Read and validate local dev user ("test-user") from localStorage
 */
function getLocalDevUser(): UserWithRole | null {
  try {
    const raw = localStorage.getItem('test-user')
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed?.authenticated || !parsed?.email || !parsed?.role) {
      return null
    }

    const age = Date.now() - (parsed.timestamp || 0)
    if (age > MAX_AGE_MS) {
      localStorage.removeItem('test-user')
      return null
    }

    return {
      id: parsed.id || `test-${Date.now()}`,
      email: parsed.email,
      role: parsed.role as UserRole,
      created_at: new Date().toISOString(),
    }
  } catch {
    localStorage.removeItem('test-user')
    return null
  }
}

/**
 * Read and validate cached supabase user ("supabase-user") from localStorage
 */
function getCachedSupabaseUser(): UserWithRole | null {
  try {
    const raw = localStorage.getItem('supabase-user')
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed?.authenticated || !parsed?.email || !parsed?.role) {
      return null
    }

    const age = Date.now() - (parsed.timestamp || 0)
    if (age > MAX_AGE_MS) {
      localStorage.removeItem('supabase-user')
      return null
    }

    return {
      id: parsed.id,
      email: parsed.email,
      role: parsed.role as UserRole,
      created_at: new Date().toISOString(),
    }
  } catch {
    localStorage.removeItem('supabase-user')
    return null
  }
}

/**
 * Get current user with role information
 * Order:
 * 1) Local dev session ("test-user")
 * 2) Cached supabase user ("supabase-user")
 * 3) Active Supabase session
 */
export const getCurrentUserWithRole = async (): Promise<UserWithRole | null> => {
  try {
    // 1) Local dev user
    const devUser = getLocalDevUser()
    if (devUser) {
      return devUser
    }

    // 2) Cached Supabase user
    const cached = getCachedSupabaseUser()
    if (cached) {
      return cached
    }

    // 3) Fallback: ask Supabase directly
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return null
    }

    // Determine role by email (simple mapping)
    let userRole: UserRole = 'manager'
    if (user.email === 'sherhan1988hp@gmail.com' || user.email === 'admin@wasser.com') {
      userRole = 'admin'
    }

    return {
      id: user.id,
      email: user.email || '',
      role: userRole,
      created_at: user.created_at,
    }
  } catch (error) {
    console.error('❌ Ошибка получения пользователя:', error)
    return null
  }
}

/**
 * Check if current user is admin
 * Supports local dev session ("test-user")
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    // 1) Local dev user
    const devUser = getLocalDevUser()
    if (devUser) {
      return devUser.role === 'admin'
    }

    // 2) Cached supabase user
    const cached = getCachedSupabaseUser()
    if (cached) {
      return cached.role === 'admin'
    }

    // 3) Fallback to Supabase user email
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    return user.email === 'sherhan1988hp@gmail.com' || user.email === 'admin@wasser.com'
  } catch (error) {
    console.error('❌ Ошибка проверки админ статуса:', error)
    return false
  }
}

/**
 * Check if current user has permission for action
 */
export const hasPermission = async (action: 'read' | 'write' | 'admin'): Promise<boolean> => {
  try {
    const user = await getCurrentUserWithRole()
    if (!user) return false

    switch (action) {
      case 'read':
        return ['admin', 'manager'].includes(user.role)
      case 'write':
      case 'admin':
        return user.role === 'admin'
      default:
        return false
    }
  } catch (error) {
    console.error('❌ Ошибка проверки разрешений:', error)
    return false
  }
}

/**
 * Update user role (admin only)
 */
export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  try {
    const canUpdate = await hasPermission('admin')
    if (!canUpdate) {
      throw new Error('Недостаточно прав для изменения ролей')
    }

    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      // If table missing, log and soft-fail
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('⚠️ Таблица user_roles не существует, роль не сохранена в БД')
        return
      }
      throw new Error(`Ошибка обновления роли: ${error.message}`)
    }
  } catch (error: any) {
    console.error('❌ Критическая ошибка обновления роли:', error)
    throw error
  }
}

/**
 * Get all users with roles (admin only)
 */
export const getAllUsersWithRoles = async (): Promise<UserWithRole[]> => {
  const canView = await hasPermission('admin')
  if (!canView) {
    throw new Error('Недостаточно прав для просмотра пользователей')
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role,
      created_at,
      auth.users!inner(email)
    `)

  if (error) {
    throw new Error(`Ошибка загрузки пользователей: ${error.message}`)
  }

  return data?.map((item: any) => ({
    id: item.user_id,
    email: item.users?.email || '',
    role: item.role,
    created_at: item.created_at,
  })) || []
}
