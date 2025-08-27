/**
 * @file Products.tsx
 * @description Страница «Изделия» — обертка над существующим менеджером изделий.
 */
import React from 'react'
import ProductManager from '../components/ProductManager'

/**
 * ProductsPage — прокси на готовый менеджер изделий
 */
export default function ProductsPage(): JSX.Element {
  return (
    <div className='max-w-6xl mx-auto px-6 py-8'>
      <ProductManager />
    </div>
  )
}
