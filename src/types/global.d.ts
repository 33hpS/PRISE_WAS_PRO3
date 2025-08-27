// Глобальные типы для мебельной фабрики WASSER
declare module 'jspdf-autotable' {
  const autoTable: any
  export default autoTable
}

declare module 'sonner' {
  export const Toaster: React.ComponentType<any>
  export const toast: any
}

// Расширение для React.startTransition
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
