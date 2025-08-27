// src/types/global-patches.d.ts
declare module '*.tsx' {
  const content: any;
  export default content;
}

declare module '*.ts' {
  const content: any;
  export default content;
}

// Расширяем глобальные типы для мебельной фабрики
declare global {
  interface Window {
    wasserFurniture?: any;
  }
  
  // Патчи для HTML атрибутов
  namespace React {
    interface HTMLAttributes<T> {
      width?: string;
    }
    
    interface ThHTMLAttributes<T> {
      width?: string;
    }
  }
}

// Типы для валют мебельной фабрики
type BaseCurrency = string;
type CheckedState = boolean | 'indeterminate' | string;

// Универсальные типы для материалов
interface MaterialImport {
  name?: string;
  article?: string;
  unit?: string;
  price?: number;
  category?: string;
  type?: string;
  [key: string]: any;
}

interface ParsedMaterialRow extends MaterialImport {}

interface NormalizedRate {
  code: string;
  name: string;
  rate: number;
  flag?: string;
  perUnit?: string;
  [key: string]: any;
}

// Патчи для Supabase
interface PostgrestResponse<T> {
  data: T[] | null;
  error: any;
  catch?: (fn: any) => any;
}

// Патчи для Recharts
interface TooltipProps {
  payload?: any;
  label?: any;
  active?: boolean;
  [key: string]: any;
}

export {};
