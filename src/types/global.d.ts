// Глобальные типы для мебельной фабрики WASSER
declare module 'jspdf-autotable' {
  const autoTable: any
  export default autoTable
}

declare module 'sonner' {
  export const Toaster: React.ComponentType<any>
  export const toast: any
}

// Расширение для React.startTransition (React Router v7 support)
declare namespace React {
  function startTransition(callback: () => void): void
}

// Расширение window для File System API
interface Window {
  fs?: {
    readFile: (path: string, options?: any) => Promise<any>
  }
}

// Типы для Supabase операций
interface SupabaseInsertOptions {
  count?: 'exact' | 'planned' | 'estimated'
  defaultToNull?: boolean
}

// Типы для React Router Future Flags
declare module 'react-router-dom' {
  interface BrowserRouterProps {
    future?: {
      v7_startTransition?: boolean
      v7_relativeSplatPath?: boolean
    }
  }
}

// Расширения для мебельной фабрики WASSER
declare global {
  interface Material {
    id: string
    name: string
    price: number
    category: string
  }
  
  interface FurnitureProduct {
    id: string
    name: string
    materials: Material[]
    basePrice: number
    markup?: number
  }
  
  interface PriceList {
    id: string
    name: string
    products: FurnitureProduct[]
    createdAt: Date
    version: string
  }
}
