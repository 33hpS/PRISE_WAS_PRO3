/**
 * @file pdfServer.ts
 * @description Клиент для обращения к серверу рендеринга PDF (Express + Puppeteer).
 */

/**
 * Параметры запроса к серверу PDF.
 */
export interface PdfServerPayload {
  /** Шаблон: modern | nordic | executive */
  template: 'modern' | 'nordic' | 'executive'
  /** Данные для документа */
  data: any
}

/**
 * Опции обращения к серверу PDF.
 */
export interface PdfServerOptions {
  /** Базовый URL сервера (по умолчанию — относительный путь) */
  baseUrl?: string
  /** Таймаут (мс) */
  timeout?: number
}

/**
 * Вызов серверной генерации PDF.
 */
export async function generateServerPdf(
  payload: PdfServerPayload,
  options?: PdfServerOptions
): Promise<Blob> {
  const baseUrl = options?.baseUrl || '/api/pdf'
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), options?.timeout || 30000)

  try {
    const res = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`PDF server error ${res.status}: ${text || res.statusText}`)
    }

    const blob = await res.blob()
    return blob
  } finally {
    clearTimeout(to)
  }
}
