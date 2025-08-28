/**
 * @file components/index.ts
 * @description Barrel exports для React компонентов
 */

// Dashboard компоненты
export { DashboardHeader } from './Dashboard/DashboardHeader'
export { DashboardTabs } from './Dashboard/DashboardTabs'
export { DashboardContent } from './Dashboard/DashboardContent'

// Мебельные компоненты
export { FurnitureItem } from './Furniture/FurnitureItem'
export { PriceListPreview } from './Furniture/PriceListPreview'
export { MaterialSelector } from './Furniture/MaterialSelector'
export { CollectionSelector } from './Furniture/CollectionSelector'

// UI компоненты (re-exports)
export * from './ui/button'
export * from './ui/card'
export * from './ui/badge'
export * from './ui/input'
export * from './ui/select'
export * from './ui/table'

// Layout компоненты
export { Header } from './Header'
export { Sidebar } from './Sidebar'
export { Footer } from './Footer'
