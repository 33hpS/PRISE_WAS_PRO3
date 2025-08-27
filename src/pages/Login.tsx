import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import { AlertCircle, Eye, EyeOff, Loader2, LogIn, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '../components/ui/alert'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface LoginProps {
  onLogin: () => Promise<void>
}

export default function Login({ onLogin }: LoginProps) {
  // Form state
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  // Auto-focus email input
  useEffect(() => {
    const emailInput = document.getElementById('email')
    if (emailInput) {
      emailInput.focus()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Введите email и пароль')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (signInError) {
        setError('Неверные учетные данные')
        return
      }

      if (data.user) {
        await onLogin()
        navigate('/')
      }
    } catch (err) {
      setError('Ошибка подключения к серверу')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>WASSER</h1>
          <p className='text-gray-600'>Мебельная фабрика</p>
        </div>

        <Card className='shadow-xl border-0 bg-white/95 backdrop-blur-sm'>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle className='text-2xl font-bold'>Вход в систему</CardTitle>
            <CardDescription>Введите данные для доступа к панели управления</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='admin@wasser.kg'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  className='transition-all duration-200 focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>Пароль</Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    className='pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500'
                  />
                  <button
                    type='button'
                    className='absolute inset-y-0 right-0 pr-3 flex items-center'
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4 text-gray-400 hover:text-gray-600' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-400 hover:text-gray-600' />
                    )}
                  </button>
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='remember'
                  checked={remember}
                  onCheckedChange={checked => setRemember(!!checked)}
                />
                <Label htmlFor='remember' className='text-sm text-gray-600'>
                  Запомнить меня
                </Label>
              </div>

              {error && (
                <Alert variant='destructive' className='animate-in slide-in-from-top-1'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Вход...
                  </>
                ) : (
                  <>
                    <LogIn className='mr-2 h-4 w-4' />
                    Войти
                  </>
                )}
              </Button>
            </form>

            <div className='pt-4 border-t border-gray-200'>
              <Button
                type='button'
                variant='outline'
                className='w-full bg-transparent'
                onClick={() => navigate('/')}
                aria-label='Вернуться на главную'
                title='Вернуться на главную'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                На главную
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className='text-center mt-6 text-sm text-gray-500'>
          <p>© 2024 WASSER Мебельная фабрика</p>
          <p>Система управления производством</p>
        </div>
      </div>
    </div>
  )
}
