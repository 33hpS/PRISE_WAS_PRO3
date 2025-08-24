/**
 * @file Header.tsx
 * @description Универсальный заголовок приложения: логотип, навигация (hash‑links), кнопка выхода.
 * Использует централизованный брендинг (src/config/branding.ts).
 */

import React from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { LogOut, Home as HomeIcon, FileText, Package, Settings, Database, User } from 'lucide-react'
import { LOGO_URL, BRAND } from '../config/branding'

/** Тип пользователя с ролью (минимум для шапки) */
export interface HeaderUser {
  id?: string
  email?: string
  role?: 'admin' | 'manager' | string
}

/** Пропсы заголовка */
interface HeaderProps {
  /** Текущий пользователь для отображения */
  user?: HeaderUser | null
  /** Коллбек выхода из системы */
  onLogout?: () => void | Promise<void>
}

/**
 * Header: верхняя панель приложения с логотипом, навигацией и выходом.
 * Навигация через hash‑ссылки, чтобы не зависеть от контекста роутера.
 */
export default function Header({ user, onLogout }: HeaderProps): JSX.Element {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="h-14 flex items-center justify-between gap-4">
          {/* Бренд */}
          <a href="#/" className="flex items-center gap-2 group" aria-label="На главную">
            <img
              src={LOGO_URL}
              alt={`${BRAND.name} logo`}
              className="w-8 h-8 rounded-md object-contain bg-white border"
            />
            <div className="leading-tight">
              <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{BRAND.name}</div>
              <div className="text-xs text-gray-500">Furniture Factory</div>
            </div>
          </a>

          {/* Навигация (основные разделы) */}
          <nav className="hidden md:flex items-center gap-2">
            <a
              href="#/"
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md hover:bg-gray-50 text-gray-700 border"
              title="Главная"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Главная</span>
            </a>

            <a
              href="#/products"
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md hover:bg-gray-50 text-gray-700 border"
              title="Продукция"
            >
              <Package className="w-4 h-4" />
              <span>Продукция</span>
            </a>

            <a
              href="#/materials"
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md hover:bg-gray-50 text-gray-700 border"
              title="Материалы"
            >
              <Database className="w-4 h-4" />
              <span>Материалы</span>
            </a>

            <a
              href="#/collections"
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md hover:bg-gray-50 text-gray-700 border"
              title="Коллекции"
            >
              <Settings className="w-4 h-4" />
              <span>Коллекции</span>
            </a>

            <a
              href="#/dashboard"
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md hover:bg-gray-50 text-gray-700 border"
              title="Панель"
            >
              <FileText className="w-4 h-4" />
              <span>Панель</span>
            </a>
          </nav>

          {/* Пользователь и выход */}
          <div className="flex items-center gap-2">
            <Card className="px-2 py-1 hidden sm:flex items-center gap-2 border-gray-200">
              <User className="w-4 h-4 text-gray-600" />
              <div className="text-xs text-gray-700">
                <div className="font-medium truncate max-w-[160px]" title={user?.email || 'Гость'}>
                  {user?.email || 'Гость'}
                </div>
                <div className="text-gray-500">{user?.role ? String(user.role) : 'no-role'}</div>
              </div>
            </Card>

            <Button
              variant="outline"
              onClick={() => void onLogout?.()}
              className="bg-transparent flex items-center gap-1.5 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              aria-label="Выйти"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Выйти</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
