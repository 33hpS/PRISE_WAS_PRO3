/**
 * HeadManager component
 * Purpose: Manage document head metadata safely without injecting external CDNs.
 * - Sets page title and meta description
 * - Proactively removes Tailwind CDN script if it was added elsewhere (prevents 429/warnings)
 */

import { useEffect } from 'react'

/**
 * Props for HeadManager
 */
interface HeadManagerProps {
  /** Optional page title; defaults to the app title */
  title?: string
  /** Optional meta description; defaults to a generic app description */
  description?: string
}

/**
 * HeadManager: Updates document head on mount/update, cleans unsafe CDNs.
 */
export default function HeadManager({ title, description }: HeadManagerProps) {
  useEffect(() => {
    // Preserve previous title to restore on unmount
    const prevTitle = document.title

    // Apply title
    document.title = title ?? 'Мебельная фабрика - Система управления'

    // Ensure meta description
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content =
      description ??
      'Система управления мебельной фабрикой: материалы, продукция, коллекции и прайс-листы.'

    // Safety: remove Tailwind CDN script if present (must use local built CSS)
    document
      .querySelectorAll('script[src*="cdn.tailwindcss.com"]')
      .forEach((el) => el.parentElement?.removeChild(el))

    return () => {
      // Restore previous title on unmount
      document.title = prevTitle
    }
  }, [title, description])

  // No visible UI
  return null
}
