/**
 * @file Materials.tsx
 * @description Страница «Материалы» — обертка над существующим менеджером материалов.
 */
import React from 'react'
import MaterialsManager from '../components/MaterialsManager'

/**
 * MaterialsPage — прокси на готовый менеджер материалов
 */
export default function MaterialsPage(): JSX.Element {
  return (
    <div className='max-w-6xl mx-auto px-6 py-8'>
      <MaterialsManager />
    </div>
  )
}
