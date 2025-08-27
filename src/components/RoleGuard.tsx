/**
 * Component for role-based access control
 */
import { useState, useEffect } from 'react'
import { hasPermission, UserRole } from '../lib/auth'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: 'read' | 'write' | 'admin'
  fallback?: React.ReactNode
  showLoading?: boolean
}

/**
 * Role-based access control component
 */
export default function RoleGuard({
  children,
  requiredRole = 'read',
  fallback = null,
  showLoading = true,
}: RoleGuardProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkPermission()
  }, [requiredRole])

  /**
   * Check if user has required permission
   */
  const checkPermission = async () => {
    try {
      const permission = await hasPermission(requiredRole)
      setHasAccess(permission)
    } catch (error) {
      console.error('Error checking permission:', error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading && showLoading) {
    return (
      <div className='flex items-center justify-center p-4'>
        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className='p-4 text-center'>
        {fallback || (
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <p className='text-yellow-800'>
              <strong>Недостаточно прав</strong>
              <br />У вас нет доступа к этому разделу
            </p>
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}
