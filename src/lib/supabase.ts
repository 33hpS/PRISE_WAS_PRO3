/**
 * Supabase client configuration
 */
import { createClient } from '@supabase/supabase-js'

// Production Supabase configuration
const supabaseUrl = 'https://cmcqbyjbsfnkjxlqqamt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtY3FieWpic2Zua2p4bHFxYW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTQzNTIsImV4cCI6MjA2NjI5MDM1Mn0.0yNcqug48DlfMZJ61sNeiFdJRbCgJqRI69JNfSCf4R8'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

export type Database = {
  public: {
    Tables: {
      materials: {
        Row: {
          id: string
          name: string
          unit: string
          price: number
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          unit: string
          price: number
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          unit?: string
          price?: number
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          type: string
          collection: string
          view_type: string
          markup: number
          images: string[]
          tech_specs: any
          materials_used: any
          total_cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          type: string
          collection: string
          view_type: string
          markup?: number
          images?: string[]
          tech_specs?: any
          materials_used?: any
          total_cost?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          type?: string
          collection?: string
          view_type?: string
          markup?: number
          images?: string[]
          tech_specs?: any
          materials_used?: any
          total_cost?: number
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          name: string
          description: string
          markup_multiplier: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          markup_multiplier?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          markup_multiplier?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_types: {
        Row: {
          id: string
          name: string
          category: string
          base_markup: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          base_markup?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          base_markup?: number
          created_at?: string
          updated_at?: string
        }
      }
      price_lists: {
        Row: {
          id: string
          name: string
          style: string
          products: string[]
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          style: string
          products?: string[]
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          style?: string
          products?: string[]
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Product types with markups
export const PRODUCT_TYPES = [
  { name: 'Тумба', category: 'Тумбы', base_markup: 150 },
  { name: 'Тумба краш', category: 'Тумбы', base_markup: 200 },
  { name: 'Тум с ящ', category: 'Тумбы', base_markup: 180 },
  { name: 'Тумба с ящ краш', category: 'Тумбы', base_markup: 230 },
  { name: 'Пенал', category: 'Пеналы', base_markup: 160 },
  { name: 'Пенал краш', category: 'Пеналы', base_markup: 210 },
  { name: 'Зеркало', category: 'Зеркала', base_markup: 120 },
  { name: 'Зеркало краш', category: 'Зеркала', base_markup: 170 },
  { name: 'LED', category: 'Зеркала', base_markup: 250 },
  { name: 'Простое зеркало', category: 'Зеркала', base_markup: 100 }
]

export const PRODUCT_CATEGORIES = [
  'Тумбы',
  'Пеналы', 
  'Зеркала',
  'Полки',
  'Шкафы'
]

// Helper functions for authentication
export const signIn = async (email: string, password: string) => {
  try {
    console.log('🔐 Supabase signIn запрос для:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ Supabase Auth ошибка:', error)
      console.error('❌ Код ошибки:', error.status)
      console.error('❌ Сообщение:', error.message)
      
      // Проверяем конкретные ошибки
      if (error.status === 500) {
        console.error('🚨 Внутренняя ошибка сервера Supabase')
      } else if (error.status === 400) {
        console.error('❌ Неправильные данные для входа')
      } else if (error.status === 429) {
        console.error('⏱️ Слишком много запросов')
      }
    } else if (data?.user) {
      console.log('✅ Supabase вход успешен для:', data.user.email)
    }
    
    return { data, error }
  } catch (networkError: any) {
    console.error('🌐 Сетевая ошибка при входе:', networkError)
    return { 
      data: null, 
      error: {
        message: `Сетевая ошибка: ${networkError.message}`,
        status: 0
      }
    }
  }
}

export const signUp = async (email: string, password: string) => {
  try {
    console.log('🔐 Supabase signUp запрос для:', email)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/#/`,
        data: {
          email_confirm: true
        }
      }
    })
    
    if (error) {
      console.error('❌ Supabase регистрация ошибка:', error)
      console.error('❌ Код ошибки:', error.status)
      console.error('❌ Сообщение:', error.message)
    } else if (data?.user) {
      console.log('✅ Supabase регистрация успешна для:', data.user.email)
    }
    
    return { data, error }
  } catch (networkError: any) {
    console.error('🌐 Сетевая ошибка при регистрации:', networkError)
    return { 
      data: null, 
      error: {
        message: `Сетевая ошибка: ${networkError.message}`,
        status: 0
      }
    }
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
