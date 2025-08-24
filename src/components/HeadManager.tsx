/**
 * @file HeadManager.tsx
 * @description Глобальный компонент управления <head>: title, lang, meta и favicon.
 * Без зависимости от роутера. Использует data:URL SVG для иконки, чтобы не добавлять файлы.
 */

import { useEffect } from 'react'

/**
 * Props for HeadManager
 */
interface HeadManagerProps {
  /** Заголовок страницы (document.title) */
  title?: string
  /** Краткое описание страницы (meta description) */
  description?: string
  /** SVG-иконка (data URL). Если не задана — используется дефолтная. */
  faviconDataUrl?: string
}

/**
 * createOrUpdateLink: создать или обновить <link rel="icon"> с заданным href
 */
function createOrUpdateLink(rel: string, type: string, href: string) {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"][type="${type}"]`)
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    link.type = type
    document.head.appendChild(link)
  }
  link.href = href
}

/**
 * HeadManager: управляет заголовком, lang, meta description и favicon.
 * Компонент без визуальной части; просто побочные эффекты в head.
 */
export default function HeadManager({
  title = 'Система расчёта цен — WASSER',
  description = 'Система расчёта цен для мебельного производства: материалы, окраска, прайс‑листы и управление номенклатурой.',
  faviconDataUrl,
}: HeadManagerProps) {
  useEffect(() => {
    // Lang RU для доступности и локализации
    if (document?.documentElement) {
      document.documentElement.lang = 'ru'
    }

    // Заголовок
    document.title = title

    // Meta description
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = description

    // Favicon (SVG data URL)
    const defaultFaviconSvg =
      faviconDataUrl ||
      `data:image/svg+xml;utf8,` +
        encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#2563eb"/>
              <stop offset="100%" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill="url(#g)"/>
          <text x="50%" y="50%" font-family="Inter, Arial, sans-serif" font-size="32" dy="10" text-anchor="middle" fill="#fff">W</text>
        </svg>
      `)

    createOrUpdateLink('icon', 'image/svg+xml', defaultFaviconSvg)

    // Доп. цвет темы для мобильных адресных строк
    let theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!theme) {
      theme = document.createElement('meta')
      theme.name = 'theme-color'
      document.head.appendChild(theme)
    }
    theme.content = '#0ea5e9' // sky-500
  }, [title, description, faviconDataUrl])

  return null
}
