/**
 * @file hooks/index.ts
 * @description Barrel exports для функциональных хуков мебельной фабрики
 */

// Dashboard хуки
export * from './dashboard/useDashboardState'
export * from './dashboard/useUserPermissions'

// Хуки для мебели
export { useLocalStorage } from './useLocalStorage'
export { useFurnitureCalculations } from './useFurnitureCalculations'
export { usePriceListGeneration } from './usePriceListGeneration'
export { useMaterialsManager } from './useMaterialsManager'
export { useCollectionsManager } from './useCollectionsManager'

// Utility хуки
export { useDebounce } from './useDebounce'
export { useAsync } from './useAsync'
export { usePerformanceMonitor } from './usePerformanceMonitor'
