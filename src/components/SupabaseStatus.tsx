/**
 * Supabase connection status component with enhanced visual indication
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface SupabaseStatusProps {
  onStatusChange?: (connected: boolean) => void
  compact?: boolean
}

/**
 * Supabase logo component
 */
const SupabaseLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg 
    viewBox="0 0 109 113" 
    className={className}
    fill="currentColor"
  >
    <path d="M63.7076 110.284c-1.1534 1.4118-3.5541.4147-3.5541-1.4754V51.6804H20.8192c-2.0618 0-3.1963-2.3758-1.9193-4.0164L58.3899 2.28088c1.3-1.73333 3.826-.91333 3.826 1.24422v55.73398h39.239c2.062 0 3.196 2.376 1.919 4.016L63.7076 110.284Z"/>
  </svg>
)

/**
 * Component to check and display Supabase connection status with enhanced UI
 */
export default function SupabaseStatus({ onStatusChange, compact = false }: SupabaseStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState<boolean>(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)

  useEffect(() => {
    checkConnection()
    // Auto refresh every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkConnection = async () => {
    try {
      setIsChecking(true)
      const { data, error } = await supabase.from('products').select('count').limit(1)
      
      const connected = !error
      setIsConnected(connected)
      
      if (error) {
        console.error('Supabase connection error:', error)
        setRetryCount(prev => prev + 1)
      } else {
        setRetryCount(0)
      }
      setLastCheck(new Date())
      
      // Передаем состояние подключения
      if (onStatusChange) {
        onStatusChange(connected)
      }
    } catch (error) {
      console.error('Supabase connection failed:', error)
      setIsConnected(false)
      setRetryCount(prev => prev + 1)
      setLastCheck(new Date())
      if (onStatusChange) {
        onStatusChange(false)
      }
    } finally {
      setIsChecking(false)
    }
  }

  const getStatusColor = () => {
    if (isChecking) return 'text-amber-600 bg-amber-50 border-amber-200'
    if (isConnected) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getStatusIcon = () => {
    if (isChecking) return <SupabaseLogo className="w-4 h-4 animate-pulse" />
    if (isConnected) return <SupabaseLogo className="w-4 h-4" />
    return <SupabaseLogo className="w-4 h-4 opacity-50" />
  }

  const getStatusText = () => {
    if (isChecking) return 'Проверка Supabase...'
    if (isConnected) return 'Supabase подключен'
    return `Ошибка Supabase ${retryCount > 0 ? `(попытка ${retryCount})` : ''}`
  }

  const getLogoColor = () => {
    if (isChecking) return 'text-amber-500'
    if (isConnected) return 'text-green-500'
    return 'text-red-500'
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-300 shadow-lg backdrop-blur-sm ${getStatusColor()}`}>
        <div className={`flex items-center justify-center p-1 rounded-lg bg-white/20 ${getLogoColor()}`}>
          {getStatusIcon()}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold">SUPABASE</span>
          <span className="text-xs opacity-80">{isConnected ? 'Активен' : isChecking ? 'Проверка' : 'Ошибка'}</span>
        </div>
        {/* Connection indicator dot */}
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
          isChecking 
            ? 'bg-amber-400 animate-pulse' 
            : isConnected 
              ? 'bg-emerald-400 shadow-emerald-400/50 shadow-lg animate-pulse' 
              : 'bg-red-400'
        }`}></div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 shadow-lg backdrop-blur-sm ${getStatusColor()}`}>
      <div className={`flex items-center justify-center p-3 rounded-xl bg-white/30 ${getLogoColor()}`}>
        {getStatusIcon()}
      </div>
      
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold tracking-wide">SUPABASE</span>
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isChecking 
              ? 'bg-amber-400 animate-pulse' 
              : isConnected 
                ? 'bg-emerald-400 shadow-emerald-400/50 shadow-lg animate-pulse' 
                : 'bg-red-400'
          }`}></div>
        </div>
        
        <span className="text-sm font-medium mb-1">{getStatusText()}</span>
        
        {lastCheck && (
          <span className="text-xs opacity-75">
            Последняя проверка: {lastCheck.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {!isConnected && !isChecking && (
        <button
          onClick={checkConnection}
          className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/20 transition-colors border border-current/20"
        >
          Повторить
        </button>
      )}
    </div>
  )
}