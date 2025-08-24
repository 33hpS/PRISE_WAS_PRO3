/**
 * @file PdfGeneratorClient.tsx
 * @description Клиентский генератор PDF (html2canvas + jsPDF) + серверный режим (Puppeteer).
 * - Загрузка логотипа (base64) и массовая загрузка изображений товаров.
 * - Чтение реальных данных из Zustand (usePdfStore).
 * - Переключатель режима: Client / Server, автоопределение baseUrl.
 * - Профессиональные настройки внешнего вида: цвета, шрифты, фон, плотность, полосатость, видимость колонок.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import { Printer, Download, Eye, Server, Monitor, Upload, Images } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { LOGO_URL, BRAND } from '../config/branding'
import { usePdfStore, buildPdfDataFromProducts, type PdfData } from '../store/pdf-store'
import { generateServerPdf } from '../lib/pdfServer'

type TemplateType = 'modern' | 'nordic' | 'executive'

/**
 * Главный компонент: предпросмотр и экспорт PDF (клиентский + серверный режимы).
 */
export default function PdfGeneratorClient(): JSX.Element {
  const [template, setTemplate] = useState<TemplateType>('modern')
  const [mode, setMode] = useState<'client' | 'server'>('client')
  const [logo, setLogo] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const previewRef = useRef<HTMLDivElement>(null)

  // Доступ к стору: данные + метод обновления (используем для добавления изображений)
  const { data: storeData, setData } = usePdfStore()

  /**
   * Сбор данных для предпросмотра.
   * При наличии данных в store — используем их; иначе — демо.
   */
  const data: PdfData = useMemo(() => {
    if (storeData) {
      return {
        ...storeData,
        companyData: {
          ...storeData.companyData,
          logo: (storeData.config.showLogo ?? true) ? (logo || storeData.companyData.logo) : undefined,
        },
        config: { ...storeData.config, selectedStyle: template },
      }
    }
    // Демо-данные, если store ещё пуст
    return buildPdfDataFromProducts({
      products: [
        {
          id: '1',
          article: 'BL-V60',
          name: 'Тумба подвесная "Berlin 60"',
          type: 'TB',
          dimensions: '600×550×450',
          material: 'ЛДСП/МДФ',
          color: 'Белый глянец',
          base_price: 18500,
          images: [],
          category: 'Тумбы',
          collection: 'Berlin',
          description: 'Современный минимализм',
        },
        {
          id: '2',
          article: 'OS-T80',
          name: 'Тумба "Oslo 80"',
          type: 'TB',
          dimensions: '800×560×460',
          material: 'МДФ/Шпон дуба',
          color: 'Дуб натур',
          base_price: 24900,
          images: [],
          category: 'Тумбы',
          collection: 'Oslo',
          description: 'Скандинавская лаконичность',
        },
      ],
      selectedStyle: template,
      groupBy: 'none',
      selectedCollection: 'all',
      includeImages: false,
      documentData: {
        title: 'ПРАЙС-ЛИСТ МЕБЕЛИ ДЛЯ ВАННЫХ КОМНАТ',
      },
      companyData: { name: BRAND.name, tagline: BRAND.tagline },
      logo,
      primaryColor: '#667eea',
      accentColor: '#764ba2',
      bgColor: '#ffffff',
      fontFamily: 'Inter',
      striped: true,
      density: 'regular',
    })
  }, [storeData, template, logo])

  /**
   * Страницы предпросмотра согласно выбранному шаблону.
   */
  const pages = useMemo(() => {
    if (template === 'modern') return renderModernPages(data)
    if (template === 'nordic') return renderNordicPages(data)
    return renderExecutivePages(data)
  }, [template, data])

  /**
   * Экспорт PDF (клиент): html2canvas + jsPDF
   */
  const handleDownloadClient = async (): Promise<void> => {
    if (!previewRef.current) return
    const pageNodes = Array.from(previewRef.current.querySelectorAll('.pdf-page')) as HTMLElement[]
    if (pageNodes.length === 0) return

    setLoading(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      for (let i = 0; i < pageNodes.length; i++) {
        const canvas = await html2canvas(pageNodes[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true })
        const imgData = canvas.toDataURL('image/png')
        if (i > 0) doc.addPage()
        doc.addImage(imgData, 'PNG', 0, 0, 210, 297)
      }
      doc.save(`WASSER_${template}_${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Экспорт PDF (сервер): вызов Puppeteer-API
   */
  const handleDownloadServer = async (): Promise<void> => {
    setLoading(true)
    try {
      const payload = { template, data }
      // Автоопределение baseUrl: localhost -> http://localhost:8787/api/pdf, иначе относительный /api/pdf
      const baseUrl =
        (window as any).PDF_SERVER_URL ||
        (location.hostname === 'localhost' ? 'http://localhost:8787/api/pdf' : '/api/pdf')

      const blob = await generateServerPdf(payload, { baseUrl })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `WASSER_${template}_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Server PDF error, fallback to client:', e)
      await handleDownloadClient()
    } finally {
      setLoading(false)
    }
  }

  /**
   * Печать: рендер страниц в изображения и вызов print()
   */
  const handlePrint = async (): Promise<void> => {
    if (!previewRef.current) return
    const pageNodes = Array.from(previewRef.current.querySelectorAll('.pdf-page')) as HTMLElement[]
    if (pageNodes.length === 0) return

    setLoading(true)
    try {
      const imgs: string[] = []
      for (const node of pageNodes) {
        const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
        imgs.push(canvas.toDataURL('image/png'))
      }
      const w = window.open('', '_blank')
      if (!w) return
      w.document.write(`
        <html>
          <head>
            <title>Печать PDF</title>
            <style>
              @page { size: A4; margin: 0; }
              @media print {
                body { margin: 0; }
                img.page { page-break-after: always; }
                img.page:last-child { page-break-after: auto; }
              }
              body { margin: 0; display: flex; flex-direction: column; align-items: center; }
              img.page { width: 210mm; height: 297mm; object-fit: contain; }
            </style>
          </head>
          <body>
            ${imgs.map((src) => `<img class="page" src="${src}" alt="page" />`).join('')}
          </body>
        </html>
      `)
      w.document.close()
      setTimeout(() => w.print(), 400)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Загрузка логотипа (base64)
   */
  const onLogoUpload = async (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setLogo(reader.result as string)
    reader.readAsDataURL(file)
  }

  /**
   * Массовая загрузка изображений товаров с сопоставлением по артикулу/названию
   */
  const onProductsImagesUpload = async (files: FileList) => {
    if (!files || files.length === 0 || !storeData) return
    const maxFiles = Math.min(files.length, 30)
    const toRead = Array.from(files).slice(0, maxFiles)

    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '')
    const findTargetIndex = (fileName: string) => {
      const nameNorm = norm(fileName)
      let idx = -1
      idx = storeData.products.findIndex(p => p.article && nameNorm.includes(norm(p.article!)))
      if (idx !== -1) return idx
      idx = storeData.products.findIndex(p => nameNorm.includes(norm(p.name)))
      return idx
    }

    const results: Array<{ index: number; dataUrl: string }> = []
    await Promise.all(
      toRead.map(
        (file) =>
          new Promise<void>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              const index = findTargetIndex(file.name)
              if (index !== -1 && typeof reader.result === 'string') {
                results.push({ index, dataUrl: reader.result })
              }
              resolve()
            }
            reader.readAsDataURL(file)
          })
      )
    )

    if (results.length === 0) {
      alert('Не удалось сопоставить изображения с товарами. Переименуйте файлы: начните с артикула или части названия товара.')
      return
    }

    const updated = storeData.products.map((p, i) => {
      const matches = results.filter(r => r.index === i).map(r => r.dataUrl)
      if (matches.length === 0) return p
      const uniq = Array.from(new Set([...(p.images || []), ...matches]))
      return { ...p, images: uniq }
    })

    setData({
      ...storeData,
      products: updated,
      config: { ...storeData.config, includeImages: true },
    })
  }

  useEffect(() => {
    if (storeData?.companyData?.logo && !logo) {
      setLogo(storeData.companyData.logo)
    }
  }, [storeData, logo])

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Генератор PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Шаблон */}
          <div className="w-full md:w-64">
            <Select value={template} onValueChange={(v) => setTemplate(v as TemplateType)}>
              <SelectTrigger>
                <SelectValue placeholder="Шаблон PDF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern — Градиентный</SelectItem>
                <SelectItem value="nordic">Nordic — Минимализм</SelectItem>
                <SelectItem value="executive">Executive — Корпоративный</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Режим */}
          <div className="flex items-center gap-2">
            <Button
              variant={mode === 'client' ? 'default' : 'outline'}
              className={mode === 'client' ? '' : 'bg-transparent'}
              onClick={() => setMode('client')}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Client
            </Button>
            <Button
              variant={mode === 'server' ? 'default' : 'outline'}
              className={mode === 'server' ? '' : 'bg-transparent'}
              onClick={() => setMode('server')}
            >
              <Server className="w-4 h-4 mr-2" />
              Server
            </Button>
          </div>

          {/* Логотип */}
          <div className="flex items-center gap-3 md:ml-auto">
            {logo ? (
              <img src={logo} alt="logo" className="w-10 h-10 rounded border object-cover" />
            ) : (
              <div className="w-10 h-10 rounded border bg-gray-50" />
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onLogoUpload(e.target.files[0])}
              />
              <span className="inline-flex">
                <Button variant="outline" className="bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Логотип
                </Button>
              </span>
            </label>
          </div>

          {/* Фото товаров */}
          {storeData && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && onProductsImagesUpload(e.target.files)}
              />
              <span className="inline-flex">
                <Button variant="outline" className="bg-transparent">
                  <Images className="w-4 h-4 mr-2" />
                  Фото товаров
                </Button>
              </span>
            </label>
          )}

          {/* Действия */}
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline" className="bg-transparent" disabled={loading}>
              <Printer className="w-4 h-4 mr-2" />
              Печать
            </Button>
            <Button onClick={mode === 'server' ? handleDownloadServer : handleDownloadClient} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Подготовка...' : 'Скачать PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle>Предпросмотр (A4)</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={previewRef} className="flex flex-col items-center gap-6">
            {pages}
          </div>
          <Separator className="my-4" />
          <div className="text-xs text-gray-500">
            Примечание: В режиме Client используются системные шрифты (html2canvas + jsPDF).
            Режим Server (Puppeteer) обеспечивает пиксель‑перфект рендер Google Fonts.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Общий стиль страницы A4 для предпросмотра.
 */
function pageStyle(fontFamily?: string, bg?: string): React.CSSProperties {
  return {
    width: '210mm',
    minHeight: '297mm',
    padding: '15mm',
    margin: '0 auto',
    background: bg || '#ffffff',
    position: 'relative',
    boxShadow: '0 2mm 8mm rgba(0,0,0,0.05)',
    fontFamily: fontFamily && fontFamily !== 'System' ? fontFamily : 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial',
  }
}

/**
 * Список видимых колонок на основе config.columns с заданным порядком.
 */
function visibleColumns(config: PdfData['config']) {
  const cols = config.columns || {
    index: true,
    article: true,
    name: true,
    collection: true,
    type: true,
    dimensions: true,
    material: true,
    color: true,
    description: false,
    cost: false,
    markup: false,
    price: true,
    image: false,
  }
  const order: Array<keyof typeof cols> = [
    'index',
    'article',
    'name',
    'collection',
    'type',
    'dimensions',
    'material',
    'color',
    'description',
    'cost',
    'markup',
    'price',
    'image',
  ]
  return order.filter((k) => (cols as any)[k])
}

/**
 * Modern-шаблон (2 страницы) с учётом конфигурации.
 */
function renderModernPages(pdf: PdfData): JSX.Element[] {
  const { companyData, documentData, products, config } = pdf
  const groups: Record<string, typeof products> = {}
  const by = config?.groupBy || 'none'
  const pColor = config.primaryColor || '#667eea'
  const aColor = config.accentColor || '#764ba2'
  const font = config.fontFamily
  const bg = config.bgColor

  // Группировка товаров
  products.forEach((p) => {
    const key =
      by === 'collection' ? (p.collection || 'Без коллекции')
        : by === 'type' ? (p.type || 'Без типа')
          : by === 'category' ? (p.category || 'Без категории')
            : 'Все товары'
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  })

  const cols = visibleColumns(config)

  return [
    <div key="modern-1" className="pdf-page" style={pageStyle(font, bg)}>
      <style>{modernCss(pColor, aColor, !!config.striped, config.density || 'regular')}</style>
      <div className="header-container">
        <div className="brand-identity">
          {companyData.logo ? (
            <img src={companyData.logo} alt="logo" style={{ width: 54, height: 54, borderRadius: 16, objectFit: 'cover', transform: 'rotate(-4deg)' }} />
          ) : (
            <div className="brand-mark">W</div>
          )}
          <div className="brand-text">
            <div className="brand-name">{companyData.name}</div>
            <div className="brand-descriptor">{companyData.tagline}</div>
          </div>
        </div>
        <div className="contact-matrix">
          <div className="contact-cell"><div className="contact-icon">А</div><div className="contact-text">{companyData.address}</div></div>
          <div className="contact-cell"><div className="contact-icon">Т</div><div className="contact-text">{companyData.phone}</div></div>
          <div className="contact-cell"><div className="contact-icon">@</div><div className="contact-text">{companyData.email}</div></div>
          <div className="contact-cell"><div className="contact-icon">W</div><div className="contact-text">{companyData.website}</div></div>
        </div>
      </div>

      <div className="doc-header" style={{ background: `linear-gradient(135deg, ${pColor}, ${aColor})` }}>
        <div className="doc-title">{documentData.title}</div>
        <div className="doc-meta">
          <div className="meta-item"><span>Версия:</span><span className="meta-badge">{documentData.version}</span></div>
          <div className="meta-item"><span>Дата:</span><span className="meta-badge">{documentData.date}</span></div>
          <div className="meta-item"><span>Статус:</span><span className="meta-badge">АКТУАЛЬНЫЙ</span></div>
        </div>
      </div>

      {documentData.specialOffer && (
        <div className="notification-bar">
          <div className="notification-icon">🎯</div>
          <div className="notification-text">{documentData.specialOffer}</div>
        </div>
      )}

      {Object.entries(groups).map(([groupName, list], idx) => (
        <div className="catalog-section" key={groupName}>
          {by !== 'none' && (
            <div className="catalog-header">
              <div className="catalog-index" style={{ background: `linear-gradient(135deg, ${pColor}, ${aColor})` }}>{String(idx + 1).padStart(2, '0')}</div>
              <div className="catalog-info">
                <div className="catalog-title">{groupName}</div>
                <div className="catalog-subtitle">Сгруппировано по "{by}"</div>
              </div>
            </div>
          )}
          <table className="data-table">
            <thead>
              <tr>
                {cols.includes('index') && <th width="6%">№</th>}
                {cols.includes('article') && <th width="10%">Артикул</th>}
                {cols.includes('name') && <th width="22%">Наименование</th>}
                {cols.includes('collection') && <th width="12%">Коллекция</th>}
                {cols.includes('type') && <th width="8%">Вид</th>}
                {cols.includes('dimensions') && <th width="12%">Габариты</th>}
                {cols.includes('material') && <th width="12%">Материал</th>}
                {cols.includes('color') && <th width="10%">Цвет</th>}
                {cols.includes('description') && <th width="16%">Описание</th>}
                {cols.includes('cost') && <th width="10%">Себестоимость</th>}
                {cols.includes('markup') && <th width="10%">Наценка</th>}
                {cols.includes('price') && <th width="10%">Цена (KGS)</th>}
              </tr>
            </thead>
            <tbody>
              {list.map((item, i) => (
                <tr key={`${item.id}-${i}`}>
                  {cols.includes('index') && <td className="cell-index">{i + 1}</td>}
                  {cols.includes('article') && <td className="cell-article">{item.article || '-'}</td>}
                  {cols.includes('name') && <td>{item.name}</td>}
                  {cols.includes('collection') && <td>{item.collection || '-'}</td>}
                  {cols.includes('type') && <td><div className="cell-visual">{item.type || '-'}</div></td>}
                  {cols.includes('dimensions') && <td className="cell-dimensions">{item.dimensions || '-'}</td>}
                  {cols.includes('material') && (
                    <td className="cell-material">
                      {(item.material || '').split('/').filter(Boolean).map((m, j) => (
                        <span className="material-badge" key={j}>{m.trim()}</span>
                      ))}
                    </td>
                  )}
                  {cols.includes('color') && (
                    <td className="cell-color">
                      <span className="color-sample" />
                      <span>{item.color || '-'}</span>
                    </td>
                  )}
                  {cols.includes('description') && <td className="cell-desc">{item.description || '-'}</td>}
                  {cols.includes('cost') && <td className="cell-num">{(item.total_cost || 0).toLocaleString('ru-RU')}</td>}
                  {cols.includes('markup') && <td className="cell-num">{(item.markup || 0).toLocaleString('ru-RU')}</td>}
                  {cols.includes('price') && (
                    <td
                      className="cell-price"
                      style={{
                        background: `linear-gradient(135deg, ${pColor}, ${aColor})`,
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        fontWeight: 800,
                      }}
                    >
                      {(item.base_price || 0).toLocaleString('ru-RU')}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>,

    <div key="modern-2" className="pdf-page" style={pageStyle(font, bg)}>
      <style>{modernCss(pColor, aColor, !!config.striped, config.density || 'regular')}</style>
      <div className="terms-container">
        <div className="terms-header">
          <div className="terms-title">УСЛОВИЯ СОТРУДНИЧЕСТВА</div>
          <div className="terms-subtitle">Актуальные параметры коммерческого взаимодействия</div>
        </div>
        <div className="terms-grid">
          {[
            ['Ценообразование', 'Цены указаны в KGS с учетом НДС. Корректировка тарифов — с уведомлением за 14 дней.'],
            ['Схема оплаты', 'Дилеры: согласно договору. Розница: 100% предоплата.'],
            ['Сроки', 'Склад: 3 рабочих дня. Под заказ: 14–21 день.'],
            ['Логистика', 'Бишкек: бесплатно от 30 000 сом. Регионы КР: по тарифам ТК.'],
            ['Гарантия', '24 месяца на весь ассортимент. Постгарантийное обслуживание.'],
            ['Партнерство', 'Индивидуальные условия и маркетинговая поддержка.'],
          ].map(([title, desc], i) => (
            <div className="term-card" key={i}>
              <div className="term-number">{i + 1}</div>
              <div className="term-icon">★</div>
              <div className="term-title">{title}</div>
              <div className="term-description">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="contact-section">
        <div className="contact-avatar">👤</div>
        <div className="contact-info">
          <div className="contact-role">Менеджер по работе с клиентами</div>
          <div className="contact-name">{companyData.manager.name}</div>
          <div className="contact-details">
            <span>📱 {companyData.manager.phone}</span>
            <span>✉️ {companyData.manager.email}</span>
          </div>
        </div>
        <div className="contact-qr"><div className="qr-placeholder" /></div>
      </div>

      <div className="footer">
        <div className="footer-left">© {new Date().getFullYear()} {companyData.name}</div>
        <div className="footer-center">{companyData.tagline}</div>
        <div className="footer-right">Все права защищены</div>
      </div>
    </div>,
  ]
}

/**
 * Nordic-шаблон (2 страницы) с учётом конфигурации.
 */
function renderNordicPages(data: PdfData): JSX.Element[] {
  const { companyData, documentData, products, config } = data
  const font = config.fontFamily
  const bg = config.bgColor
  const pColor = config.primaryColor || '#2c3e50'
  const cols = visibleColumns(config)

  return [
    <div key="nordic-1" className="pdf-page" style={pageStyle(font, bg)}>
      <style>{nordicCss(pColor, !!config.striped, config.density || 'regular')}</style>
      <div className="header">
        {companyData.logo ? (
          <img src={companyData.logo} alt="logo" style={{ height: 48, objectFit: 'contain', margin: '0 auto 8px', display: 'block' }} />
        ) : null}
        <div className="logo">{companyData.name}</div>
        <div className="tagline">{companyData.tagline}</div>
        <div className="contacts-strip">
          <span>{companyData.address}</span>
          <span>{companyData.phone}</span>
          <span>{companyData.email}</span>
        </div>
      </div>

      <div className="doc-title">
        <h1>Прайс-лист</h1>
        <div className="doc-date">Действителен с {documentData.date}</div>
      </div>

      <div className="product-section">
        <table className="product-table">
          <thead>
            <tr>
              {cols.includes('article') && <th width="12%">Артикул</th>}
              {cols.includes('name') && <th width="30%">Наименование</th>}
              {cols.includes('image') && <th width="10%">Фото</th>}
              {cols.includes('dimensions') && <th width="16%">Размеры</th>}
              {cols.includes('material') && <th width="14%">Материал</th>}
              {cols.includes('color') && <th width="10%">Цвет</th>}
              {cols.includes('price') && <th width="12%">Цена</th>}
            </tr>
          </thead>
          <tbody>
            {(products || []).map((p, i) => (
              <tr key={`${p.id}-${i}`}>
                {cols.includes('article') && <td className="article">{p.article || '-'}</td>}
                {cols.includes('name') && <td>{p.name || '-'}</td>}
                {cols.includes('image') && <td><div className="photo-cell">IMG</div></td>}
                {cols.includes('dimensions') && <td className="dimensions">{p.dimensions || '-'}</td>}
                {cols.includes('material') && <td>{p.material || '-'}</td>}
                {cols.includes('color') && (
                  <td className="color">
                    <span className="color-dot" style={{ background: '#ffffff' }} />
                    {p.color || '-'}
                  </td>
                )}
                {cols.includes('price') && <td className="price">{(p.base_price || 0).toLocaleString('ru-RU')}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="page-number">1 / 2</div>
    </div>,

    <div key="nordic-2" className="pdf-page" style={pageStyle(font, bg)}>
      <style>{nordicCss(pColor, !!config.striped, config.density || 'regular')}</style>
      <div className="doc-title">
        <h1>Условия сотрудничества</h1>
        <div className="doc-date">Актуально на {documentData.date}</div>
      </div>
      <div style={{ padding: '18px', background: '#fafbfc', borderRadius: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', fontSize: '11px', color: '#7f8c8d' }}>
          {[
            ['Цены', 'KGS с НДС. Изменения с уведомлением за 14 дней.'],
            ['Оплата', 'Дилеры — по договору. Розница — 100% предоплата.'],
            ['Сроки', 'В наличии — 3 дня. Под заказ — 14–21 день.'],
            ['Доставка', 'Бишкек — бесплатно от 30 000 сом. Регионы — по тарифам ТК.'],
            ['Гарантия', '24 месяца.'],
            ['Партнёрство', 'Спецусловия для дилеров.'],
          ].map(([t, d], i) => (
            <div style={{ display: 'flex', gap: '10px', lineHeight: 1.6 }} key={i}>
              <div>●</div>
              <div><strong>{t}</strong> {d}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '18px' }}>
        Ваш менеджер: <strong>{companyData.manager.name}</strong><br />
        <span>{companyData.manager.phone}</span> · <span>{companyData.manager.email}</span>
      </div>
      <div className="page-number">2 / 2</div>
    </div>,
  ]
}

/**
 * Executive-шаблон (2 страницы) с учётом конфигурации.
 */
function renderExecutivePages(data: PdfData): JSX.Element[] {
  const { companyData, documentData, products, config } = data
  const font = config.fontFamily
  const bg = config.bgColor
  const pColor = config.primaryColor || '#0d47a1'
  const cols = visibleColumns(config)

  return [
    <div key="executive-1" className="pdf-page" style={pageStyle(font, bg)}>
      <style>{executiveCss(pColor, !!config.striped, config.density || 'regular')}</style>
      <div className="header">
        <div>
          {companyData.logo ? (
            <img src={companyData.logo} alt="logo" style={{ height: 40, objectFit: 'contain', marginBottom: 6 }} />
          ) : null}
          <div className="company-logo" style={{ color: pColor }}>{companyData.name}</div>
          <div className="company-type">{companyData.tagline}</div>
        </div>
        <div className="contact-section">
          <strong>Кыргызская Республика</strong><br />
          {companyData.address}<br />
          <strong>Тел:</strong> {companyData.phone}<br />
          <strong>Email:</strong> {companyData.email}<br />
          <strong>Web:</strong> {companyData.website}
        </div>
      </div>

      <div className="doc-title"><h1>{documentData.title}</h1></div>
      <div className="doc-date">Действителен с {documentData.date}</div>
      <div className="intro"><strong>Уважаемые партнёры и клиенты!</strong><br />Представляем актуальный прайс‑лист.</div>

      <div className="section-header">СЕРИЯ / РАЗДЕЛ</div>
      <table className="product-table">
        <thead>
          <tr>
            {cols.includes('article') && <th width="12%">Артикул</th>}
            {cols.includes('name') && <th width="25%">Наименование</th>}
            {cols.includes('image') && <th width="12%">Фото</th>}
            {cols.includes('dimensions') && <th width="18%">Размеры (мм)</th>}
            {cols.includes('material') && <th width="13%">Материал</th>}
            {cols.includes('color') && <th width="10%">Цвет</th>}
            {cols.includes('price') && <th width="10%">Цена (KGS)</th>}
          </tr>
        </thead>
        <tbody>
          {(products || []).map((p, i) => (
            <tr key={`${p.id}-${i}`}>
              {cols.includes('article') && <td className="article">{p.article || '-'}</td>}
              {cols.includes('name') && <td>{p.name || '-'}</td>}
              {cols.includes('image') && (
                <td className="photo-cell">
                  {p.images && p.images[0] ? (
                    <img src={p.images[0]} alt={p.name} style={{ width: 70, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <div className="photo-placeholder">ФОТО</div>
                  )}
                </td>
              )}
              {cols.includes('dimensions') && <td className="dimensions">{p.dimensions || '-'}</td>}
              {cols.includes('material') && <td>{p.material || '-'}</td>}
              {cols.includes('color') && <td>{p.color || '-'}</td>}
              {cols.includes('price') && <td className="price">{(p.base_price || 0).toLocaleString('ru-RU')}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="page-number">Страница 1 из 2</div>
    </div>,

    <div key="executive-2" className="pdf-page" style={pageStyle(font, bg)}>
      <style>{executiveCss(pColor, !!config.striped, config.density || 'regular')}</style>
      <div className="terms">
        <h2>Условия сотрудничества</h2>
        <ul className="terms-list">
          <li><strong>ЦЕНЫ:</strong> Все цены указаны в KGS и включают НДС. Изменения с уведомлением за 14 дней.</li>
          <li><strong>ОПЛАТА:</strong> Дилеры — по договору. Розничные клиенты — 100% предоплата.</li>
          <li><strong>СРОКИ:</strong> В наличии — отгрузка до 3 рабочих дней. Под заказ — 14–21 день.</li>
          <li><strong>ДОСТАВКА:</strong> Бишкек — бесплатно от 30 000 сом. Регионы КР — по тарифам ТК.</li>
          <li><strong>ГАРАНТИЯ:</strong> 24 месяца на всю продукцию.</li>
        </ul>
      </div>

      <div className="contact-card" style={{ background: `linear-gradient(135deg, ${pColor}, #1e64d1)` }}>
        <h3>МЕНЕДЖЕР ПО РАБОТЕ С КЛИЕНТАМИ</h3>
        <div className="manager-name">{companyData.manager.name}</div>
        <div className="manager-contacts">
          Телефон: <strong>{companyData.manager.phone}</strong><br />
          Email: <strong>{companyData.manager.email}</strong>
        </div>
      </div>

      <div className="footer">
        <div className="footer-company">С уважением, Дирекция мебельной фабрики «{companyData.name}»</div>
        © {new Date().getFullYear()} {companyData.name}. Все права защищены
      </div>

      <div className="page-number">Страница 2 из 2</div>
    </div>,
  ]
}

/**
 * CSS-хелпер: Modern.
 */
function modernCss(primary: string, accent: string, striped: boolean, density: 'compact' | 'regular' | 'spacious'): string {
  const rowPad = density === 'compact' ? '10px' : density === 'spacious' ? '16px' : '12px'
  return `
  * { box-sizing: border-box; } body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
  .header-container { display:grid; grid-template-columns:1fr auto; gap:24px; padding:10px 0 20px; margin-bottom:12px; }
  .brand-identity { display:flex; align-items:center; gap:14px; }
  .brand-mark { width:54px; height:54px; border-radius:16px; display:grid; place-items:center; color:#fff; font-weight:800; font-size:24px;
    background: linear-gradient(135deg, ${primary} 0%, ${accent} 100%); transform: rotate(-4deg); }
  .brand-text { transform: translateY(2px); }
  .brand-name { font-size:28px; font-weight:800; letter-spacing:-0.5px; background: linear-gradient(135deg, ${primary}, ${accent});
    -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
  .brand-descriptor { font-size:11px; text-transform:uppercase; letter-spacing:1.4px; color:#4a5568; }
  .contact-matrix { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; font-size:11px; }
  .contact-cell { display:flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid #e2e8f0; border-radius:8px; background:linear-gradient(135deg,#f6f9fc,#fff); }
  .contact-icon { width:18px; height:18px; border-radius:50%; display:grid; place-items:center; color:#fff; background: linear-gradient(135deg, ${primary}, ${accent}); font-size:10px; font-weight:700; }
  .contact-text { color:#4a5568; }
  .doc-header { background: linear-gradient(135deg,#1a1a2e,#16213e); color:#fff; margin:0 -15mm 18px; padding:18px 15mm; text-align:center; position:relative; }
  .doc-title { font-size:18px; font-weight:800; letter-spacing:0.5px; margin-bottom:6px; }
  .doc-meta { display:flex; justify-content:center; gap:16px; color:rgba(255,255,255,0.8); font-size:11px; }
  .meta-item { display:flex; gap:6px; align-items:center; }
  .meta-badge { padding:2px 8px; background:rgba(255,255,255,0.12); border-radius:10px; font-weight:700; font-size:10px; }
  .notification-bar { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:12px; background: linear-gradient(135deg,#fa709a,#fee140); color:#fff; box-shadow:0 4px 10px rgba(250,112,154,0.2); margin-bottom:16px; }
  .notification-icon { width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.2); display:grid; place-items:center; }
  .notification-text { font-size:13px; font-weight:600; }
  .catalog-section { margin-bottom:18px; page-break-inside: avoid; }
  .catalog-header { display:flex; align-items:stretch; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06); margin-bottom:10px; }
  .catalog-index { width:56px; display:grid; place-items:center; color:#fff; font-weight:800; font-size:20px; background: linear-gradient(135deg, ${primary}, ${accent}); }
  .catalog-info { flex:1; padding:12px 16px; background: linear-gradient(135deg,#f8f9fa,#fff); }
  .catalog-title { font-weight:800; color:#1a1a2e; font-size:15px; margin-bottom:4px; }
  .catalog-subtitle { font-size:11px; color:#4a5568; font-style:italic; }
  .data-table { width:100%; border-collapse:separate; border-spacing:0; font-size:11px; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
  thead { background: linear-gradient(135deg,#f8f9fa,#e9ecef); }
  th { padding:${rowPad}; text-align:left; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.4px; color:#4a5568; border-bottom:2px solid #e2e8f0; }
  td { padding:${rowPad}; border-bottom:1px solid #f1f3f5; vertical-align:middle; }
  tbody tr:hover { background:#fbfdff; }
  ${striped ? 'tbody tr:nth-child(even){ background:#fafbff; }' : ''}
  .cell-article { font-family: "JetBrains Mono", monospace; font-weight:700; color:#5b21b6; }
  .cell-visual { width:44px; height:32px; background: linear-gradient(135deg,#4facfe,#00f2fe); color:#fff; display:grid; place-items:center; font-weight:800; border-radius:6px; font-size:10px; }
  .cell-dimensions { font-family: "JetBrains Mono", monospace; font-size:10px; color:#4a5568; white-space:nowrap; }
  .cell-material { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .material-badge { padding:2px 6px; background:#f0f4f8; border-radius:4px; font-size:9px; font-weight:700; color:#4a5568; }
  .cell-color { display:flex; align-items:center; gap:8px; }
  .color-sample { width:18px; height:18px; border-radius:6px; border:2px solid #e2e8f0; background:linear-gradient(135deg,#fff,#f8f9fa); }
  .cell-desc { color:#475569; }
  .cell-num { text-align:right; font-weight:700; color:#334155; }
  .cell-price { text-align:right; }
  .terms-container { margin-top: 24px; padding: 20px; background: linear-gradient(135deg,#f6f9fc,#ffffff); border-radius: 12px; border: 1px solid #e2e8f0; }
  .terms-header { text-align:center; margin-bottom:14px; }
  .terms-title { font-size:16px; font-weight:800; color:#1a1a2e; margin-bottom:4px; }
  .terms-subtitle { font-size:11px; color:#4a5568; }
  .terms-grid { display:grid; grid-template-columns:repeat(3,1fr); gap: 10px; }
  .term-card { background:#fff; padding:16px; border-radius:10px; border:1px solid #e2e8f0; position:relative; }
  .term-number { position:absolute; top:-10px; left:14px; width:24px; height:24px; background: linear-gradient(135deg, ${primary}, ${accent}); color:#fff;
    border-radius:50%; display:grid; place-items:center; font-size:11px; font-weight:800; }
  .term-icon { width: 36px; height: 36px; border-radius:10px; background: linear-gradient(135deg,#f0f4f8,#e2e8f0); display:grid; place-items:center; margin-bottom:8px; }
  .term-title { font-size:12px; font-weight:800; color:#1a1a2e; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.4px; }
  .term-description { font-size:10px; color:#4a5568; line-height:1.6; }
  .contact-section { margin: 18px 0; padding: 16px; background: linear-gradient(135deg, ${primary}, ${accent}); border-radius: 12px; color:#fff; display:grid;
    grid-template-columns: auto 1fr auto; gap: 20px; align-items:center; }
  .contact-avatar { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; display:grid; place-items:center; font-size: 28px; border: 3px solid rgba(255,255,255,0.3); }
  .contact-info { display:grid; gap:4px; }
  .contact-role { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; }
  .contact-name { font-size: 18px; font-weight: 800; }
  .contact-details { display:flex; gap: 14px; font-size: 12px; margin-top: 4px; }
  .contact-qr { width: 64px; height: 64px; background: white; border-radius: 10px; padding: 8px; display: grid; place-items: center; }
  .qr-placeholder { width:100%; height:100%; border:2px solid #1a1a2e; border-radius: 4px; }
  .footer { margin-top: 18px; padding-top: 10px; border-top: 2px solid #e2e8f0; display:grid; grid-template-columns: 1fr auto 1fr; align-items:center; font-size: 11px; color:#4a5568; }
  .footer-left { font-weight: 700; }
  .footer-center { padding: 4px 12px; background: linear-gradient(135deg, ${primary}, ${accent}); color: #fff; border-radius: 16px; font-weight: 700; }
  .footer-right { text-align: right; }
  `
}

/**
 * CSS-хелпер: Nordic.
 */
function nordicCss(primary: string, striped: boolean, density: 'compact' | 'regular' | 'spacious'): string {
  const rowPad = density === 'compact' ? '8px' : density === 'spacious' ? '16px' : '12px'
  return `
  * { box-sizing: border-box; } body { font-family: Inter, -apple-system, system-ui, Segoe UI, Roboto, Arial; color:#2c3e50; }
  .header { text-align:center; padding-bottom: 24px; margin-bottom: 24px; position:relative; }
  .logo { font-size: 36px; font-weight: 300; letter-spacing: 6px; color:${primary}; margin-bottom: 6px; }
  .tagline { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #95a5a6; font-weight: 600; }
  .contacts-strip { display:flex; justify-content:center; gap: 22px; margin-top: 16px; font-size: 11px; color: #7f8c8d; }
  .contacts-strip span { display:flex; align-items:center; gap:5px; }
  .doc-title { text-align:center; margin-bottom: 20px; }
  .doc-title h1 { font-size: 16px; font-weight: 400; letter-spacing: 2px; text-transform: uppercase; color:${primary}; margin-bottom: 6px; }
  .doc-date { font-size: 11px; color: #95a5a6; }
  .product-section { margin-top: 8px; page-break-inside: avoid; }
  .product-table { width:100%; border-collapse:separate; border-spacing:0; font-size:12px; }
  .product-table thead tr { background: #f8f9fa; }
  th { padding:${rowPad}; text-align:left; font-weight:600; color:#7f8c8d; border-bottom:2px solid #ecf0f1; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding:${rowPad}; border-bottom:1px solid #f1f3f5; vertical-align:middle; }
  tbody tr:hover { background: #fafbfc; }
  ${striped ? 'tbody tr:nth-child(even){ background:#fbfcfe; }' : ''}
  .article { font-weight: 700; color:${primary}; font-family: "Courier New", monospace; }
  .photo-cell { width: 60px; height: 45px; background: #f8f9fa; border-radius: 6px; display:flex; align-items:center; justify-content:center; font-size:10px; color:#bdc3c7; }
  .dimensions { font-family: monospace; font-size:11px; color:#7f8c8d; white-space:nowrap; }
  .color { display:flex; align-items:center; gap:6px; }
  .color-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid #ecf0f1; }
  .price { font-weight:700; color:#2c3e50; }
  .page-number { position: absolute; bottom: 10mm; left: 50%; transform: translateX(-50%); font-size: 10px; color: #bdc3c7; }
  `
}

/**
 * CSS-хелпер: Executive.
 */
function executiveCss(primary: string, striped: boolean, density: 'compact' | 'regular' | 'spacious'): string {
  const rowPad = density === 'compact' ? '8px' : density === 'spacious' ? '14px' : '10px'
  return `
  * { box-sizing: border-box; } body { font-family: Roboto, Inter, -apple-system, system-ui, Segoe UI, Arial; color:#212529; }
  .header { display:flex; justify-content:space-between; padding-bottom: 16px; border-bottom: 4px solid ${primary}; margin-bottom: 18px; }
  .company-logo { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
  .company-type { font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
  .contact-section { text-align: right; font-size: 12px; color: #495057; line-height: 1.7; }
  .doc-title { background: linear-gradient(90deg, ${primary}, #0056b3); color:#fff; padding: 12px; margin: 0 -15mm 12px; text-align:center; }
  .doc-title h1 { font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
  .doc-date { font-size: 12px; color:#495057; margin: 6px 0 10px; }
  .intro { background: #f8f9fa; border-left: 4px solid ${primary}; padding: 12px; margin-bottom: 12px; font-size: 12px; color: #495057; }
  .section-header { background: ${primary}; color:#fff; padding: 10px 14px; font-weight: 800; }
  .product-table { width:100%; border-collapse:collapse; font-size:12px; }
  thead { background: #f0f4f8; }
  th { padding:${rowPad}; text-align:left; font-weight:700; color:${primary}; border: 1px solid #dee2e6; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; }
  td { padding:${rowPad}; border: 1px solid #dee2e6; vertical-align: middle; }
  tbody tr:hover { background: #eef4ff; }
  ${striped ? 'tbody tr:nth-child(even){ background:#f8f9fa; }' : ''}
  .article { font-weight: 800; color:${primary}; font-family: "Courier New", monospace; }
  .photo-cell { text-align:center; }
  .photo-placeholder { display:inline-block; width: 70px; height: 50px; background: linear-gradient(135deg,#e9ecef,#dee2e6); border-radius:4px; line-height:50px; font-size:10px; color:#6c757d; }
  .dimensions { font-family: monospace; white-space: nowrap; }
  .price { font-weight: 800; color:#212529; white-space: nowrap; }
  .terms { margin-top: 18px; padding-top: 12px; border-top: 3px solid ${primary}; }
  .terms h2 { font-size: 16px; color:${primary}; margin-bottom: 10px; font-weight: 800; text-transform: uppercase; }
  .terms-list { list-style: none; padding-left: 0; }
  .terms-list li { margin-bottom: 10px; padding-left: 22px; position: relative; font-size: 12px; line-height: 1.6; }
  .terms-list li::before { content: "■"; position: absolute; left: 0; color:${primary}; font-size: 10px; top: 2px; }
  .contact-card { color:#fff; padding: 16px; border-radius: 10px; margin: 16px 0; text-align: center; }
  .contact-card h3 { font-size: 14px; margin-bottom: 10px; font-weight: 600; }
  .manager-name { font-size: 18px; font-weight: 900; margin-bottom: 8px; }
  .manager-contacts { font-size: 13px; line-height: 1.7; }
  .footer { margin-top: 16px; padding-top: 12px; border-top: 2px solid #dee2e6; text-align: center; font-size: 12px; color: #6c757d; }
  .footer-company { font-weight: 800; color:${primary}; margin-bottom: 6px; }
  .page-number { position: absolute; bottom: 10mm; right: 15mm; font-size: 11px; color: #6c757d; }
  `
}
