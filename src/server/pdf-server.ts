/**
 * @file pdf-server.ts
 * @description Express + Puppeteer сервер для пиксель-перфект PDF трёх шаблонов: modern, nordic, executive.
 * Эндпоинт: POST /api/pdf/generate -> application/pdf
 */

import express from 'express'
import cors from 'cors'
import puppeteer from 'puppeteer'

/** Типы для входных данных */
type TemplateType = 'modern' | 'nordic' | 'executive'

/** Простая проверка полезной нагрузки */
function assertPayload(body: any) {
  if (!body || !body.template || !body.data) {
    throw new Error('Invalid payload. Expected { template, data }')
  }
}

/** Базовый HTML-шаблон с инлайновыми шрифтами Google */
function htmlBase(content: string, template: TemplateType): string {
  const fonts =
    template === 'modern'
      ? `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">`
      : template === 'nordic'
      ? `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">`
      : `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet">`

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    ${fonts}
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WASSER PDF</title>
    <style>
      @page { size: A4; margin: 0; }
      body { margin: 0; background: #ffffff; }
      .pdf-page { width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto; position: relative; box-sizing: border-box; }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>`
}

/** Утилиты CSS — совпадают с клиентскими версиями */
function modernCss(): string {
  return `
  * { box-sizing: border-box; } body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
  .header-container { display:grid; grid-template-columns:1fr auto; gap:24px; padding:10px 0 20px; margin-bottom:12px; }
  .brand-identity { display:flex; align-items:center; gap:14px; }
  .brand-mark { width:54px; height:54px; border-radius:16px; display:grid; place-items:center; color:#fff; font-weight:800; font-size:24px;
    background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); transform: rotate(-4deg); }
  .brand-text { transform: translateY(2px); }
  .brand-name { font-size:28px; font-weight:800; letter-spacing:-0.5px; background: linear-gradient(135deg,#667eea,#764ba2);
    -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
  .brand-descriptor { font-size:11px; text-transform:uppercase; letter-spacing:1.4px; color:#4a5568; }
  .contact-matrix { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; font-size:11px; }
  .contact-cell { display:flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid #e2e8f0; border-radius:8px; background:linear-gradient(135deg,#f6f9fc,#fff); }
  .contact-icon { width:18px; height:18px; border-radius:50%; display:grid; place-items:center; color:#fff; background: linear-gradient(135deg,#667eea,#764ba2); font-size:10px; font-weight:700; }
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
  .catalog-index { width:56px; display:grid; place-items:center; color:#fff; font-weight:800; font-size:20px; background: linear-gradient(135deg,#667eea,#764ba2); }
  .catalog-info { flex:1; padding:12px 16px; background: linear-gradient(135deg,#f8f9fa,#fff); }
  .catalog-title { font-weight:800; color:#1a1a2e; font-size:15px; margin-bottom:4px; }
  .catalog-subtitle { font-size:11px; color:#4a5568; font-style:italic; }
  .data-table { width:100%; border-collapse:separate; border-spacing:0; font-size:11px; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
  thead { background: linear-gradient(135deg,#f8f9fa,#e9ecef); }
  th { padding:10px; text-align:left; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.6px; color:#4a5568; border-bottom:2px solid #e2e8f0; }
  td { padding:12px 10px; border-bottom:1px solid #f1f3f5; vertical-align:middle; }
  tbody tr:last-child td { border-bottom:none; }
  .cell-article { font-family: monospace; font-weight:700; color:#5b21b6; }
  .cell-visual { width:42px; height:32px; border-radius:8px; display:grid; place-items:center; color:#fff; font-weight:800; font-size:10px; background: linear-gradient(135deg,#4facfe,#00f2fe); }
  .cell-dimensions { font-family: monospace; font-size:10px; color:#4a5568; white-space:nowrap; }
  .cell-material { display:flex; gap:6px; flex-wrap:wrap; }
  .material-badge { padding:2px 6px; background:#f0f4f8; border-radius:4px; font-size:9px; font-weight:700; color:#4a5568; }
  .cell-color { display:flex; align-items:center; gap:8px; }
  .color-sample { width:18px; height:18px; border-radius:6px; border:2px solid #e2e8f0; }
  .cell-price { font-size:13px; font-weight:800; background: linear-gradient(135deg,#f093fb,#f5576c); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
  .footer { margin-top:12px; font-size:10px; color:#64748b; text-align:center; }
  `
}
function nordicCss(): string {
  return `
  * { box-sizing: border-box; } body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
  .header { text-align:center; padding-bottom:28px; margin-bottom:24px; position:relative; }
  .header::after { content:''; position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:60px; height:2px; background:#2c3e50; }
  .logo { font-size:44px; font-weight:200; letter-spacing:6px; color:#2c3e50; margin-bottom:6px; }
  .tagline { font-size:11px; text-transform:uppercase; letter-spacing:3px; color:#95a5a6; font-weight:600; }
  .contacts-strip { display:flex; justify-content:center; gap:24px; margin-top:16px; font-size:11px; color:#7f8c8d; }
  .contacts-strip span { display:flex; align-items:center; gap:5px; }
  .contacts-strip span::before { content:'•'; color:#2c3e50; }
  .doc-title { text-align:center; margin:16px 0 22px; }
  .doc-title h1 { font-size:18px; font-weight:300; letter-spacing:2px; text-transform:uppercase; color:#2c3e50; margin-bottom:6px; }
  .doc-date { font-size:11px; color:#95a5a6; }
  .intro { text-align:center; max-width:600px; margin:0 auto 20px; font-size:13px; color:#7f8c8d; line-height:1.7; }
  .product-section { margin-bottom:22px; page-break-inside: avoid; }
  .section-header { display:flex; align-items:center; margin-bottom:12px; }
  .section-line { flex:1; height:1px; background:#ecf0f1; }
  .section-title { padding:0 16px; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#2c3e50; }
  .section-desc { text-align:center; font-size:11px; color:#95a5a6; margin-bottom:10px; font-style:italic; }
  .product-table { width:100%; border-collapse:separate; border-spacing:0; font-size:12px; }
  .product-table thead tr { background:#f8f9fa; }
  .product-table th { padding:10px; text-align:left; font-weight:600; color:#7f8c8d; border-bottom:2px solid #ecf0f1; font-size:10px; text-transform:uppercase; }
  .product-table td { padding:10px; border-bottom:1px solid #f1f3f5; vertical-align:middle; }
  .article { font-weight:700; color:#2c3e50; font-family: monospace; font-size:11px; }
  .photo-cell { width:60px; height:45px; background:#f8f9fa; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:9px; color:#bdc3c7; }
  .dimensions { font-family: monospace; font-size:11px; color:#7f8c8d; }
  .color-dot { width:12px; height:12px; border-radius:50%; border:1px solid #ecf0f1; display:inline-block; margin-right:6px; }
  .price { font-weight:700; font-size:13px; color:#2c3e50; }
  .page-number { position:absolute; bottom:10mm; right:15mm; font-size:11px; color:#7f8c8d; }
  `
}
function executiveCss(): string {
  return `
  * { box-sizing: border-box; } body { font-family: Inter, Roboto, system-ui, -apple-system, Segoe UI, Arial; }
  .header { display:flex; justify-content:space-between; gap:16px; }
  .company-logo { font-size:28px; font-weight:800; letter-spacing:2px; color:#0d47a1; }
  .company-type { color:#546e7a; font-weight:600; }
  .contact-section { font-size:12px; color:#455a64; line-height:1.6; }
  .doc-title { text-align:center; margin:16px 0 12px; }
  .doc-title h1 { font-size:18px; font-weight:800; color:#0d47a1; letter-spacing:0.5px; }
  .doc-date { font-size:11px; color:#78909c; text-align:center; }
  .intro { font-size:13px; color:#546e7a; line-height:1.7; margin:14px 0 12px; }
  .section-header { margin-top:8px; font-weight:800; color:#0d47a1; }
  .product-table { width:100%; border-collapse:separate; border-spacing:0; font-size:12px; margin-top:8px; }
  .product-table thead tr { background:#e3f2fd; }
  .product-table th { padding:10px; text-align:left; font-weight:700; color:#0d47a1; border-bottom:2px solid #bbdefb; font-size:10px; text-transform:uppercase; }
  .product-table td { padding:10px; border-bottom:1px solid #eceff1; vertical-align:middle; }
  .page-number { position:absolute; bottom:10mm; right:15mm; font-size:11px; color:#78909c; }
  `
}

/** Утилита: безопасный HTML */
function esc(str: string): string {
  return (str || '').toString().replace(/[<&>"]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' } as any)[m])
}

/** Построение Modern контента (2 страницы) */
function renderModernHTML(data: any): string {
  const { companyData, documentData, products, config } = data
  const header = `
  <div class="pdf-page">
    <style>${modernCss()}</style>
    <div class="header-container">
      <div class="brand-identity">
        ${companyData.logo ? `<img src="${esc(companyData.logo)}" alt="logo" style="width:54px;height:54px;border-radius:16px;object-fit:cover;transform:rotate(-4deg);" />` : `<div class="brand-mark">W</div>`}
        <div class="brand-text">
          <div class="brand-name">${esc(companyData.name)}</div>
          <div class="brand-descriptor">${esc(companyData.tagline)}</div>
        </div>
      </div>
      <div class="contact-matrix">
        <div class="contact-cell"><div class="contact-icon">A</div><div class="contact-text">${esc(companyData.address)}</div></div>
        <div class="contact-cell"><div class="contact-icon">T</div><div class="contact-text">${esc(companyData.phone)}</div></div>
        <div class="contact-cell"><div class="contact-icon">@</div><div class="contact-text">${esc(companyData.email)}</div></div>
        <div class="contact-cell"><div class="contact-icon">W</div><div class="contact-text">${esc(companyData.website)}</div></div>
      </div>
    </div>
    <div class="doc-header">
      <div class="doc-title">${esc(documentData.title)}</div>
      <div class="doc-meta">
        <div class="meta-item"><span>Версия:</span><span class="meta-badge">${esc(documentData.version)}</span></div>
        <div class="meta-item"><span>Дата:</span><span class="meta-badge">${esc(documentData.date)}</span></div>
        <div class="meta-item"><span>Статус:</span><span class="meta-badge">АКТУАЛЬНЫЙ</span></div>
      </div>
    </div>
    ${documentData.specialOffer ? `
      <div class="notification-bar">
        <div class="notification-icon">🎯</div>
        <div class="notification-text">${esc(documentData.specialOffer)}</div>
      </div>
    ` : ''}

    ${(() => {
      // группировка по config.groupBy если нужно
      const by = config?.groupBy || 'none'
      const groupMap: Record<string, any[]> = {}
      ;(products || []).forEach((p: any) => {
        const key =
          by === 'collection' ? (p.collection || 'Без коллекции') :
          by === 'type' ? (p.type || 'Без типа') :
          by === 'category' ? (p.category || 'Без категории') : 'Все товары'
        if (!groupMap[key]) groupMap[key] = []
        groupMap[key].push(p)
      })
      let idx = 0
      return Object.entries(groupMap).map(([groupName, list]) => {
        idx++
        const rows = (list as any[]).map((it, i) => {
          const price = (it.base_price || 0)
          const matBadges = (it.material || '').split('/').filter(Boolean).map((m: string) => `<span class="material-badge">${esc(m.trim())}</span>`).join('')
          const typeCube = `<div class="cell-visual">${esc(it.type || '-')}</div>`
          const colorBadge = `<div class="cell-color"><span class="color-sample" style="background:#fff;"></span><span>${esc(it.color || '-')}</span></div>`
          return `
            <tr>
              <td class="cell-article">${esc(it.article || '-')}</td>
              <td>${esc(it.name || '-')}</td>
              <td>${typeCube}</td>
              <td class="cell-dimensions">${esc(it.dimensions || '-')}</td>
              <td class="cell-material">${matBadges || '-'}</td>
              <td>${colorBadge}</td>
              <td class="cell-price">${price.toLocaleString('ru-RU')}</td>
            </tr>
          `
        }).join('')
        return `
          <div class="catalog-section">
            ${by !== 'none' ? `
              <div class="catalog-header">
                <div class="catalog-index">${String(idx).padStart(2,'0')}</div>
                <div class="catalog-info">
                  <div class="catalog-title">${esc(groupName)}</div>
                  <div class="catalog-subtitle">Сгруппировано по "${esc(by)}"</div>
                </div>
              </div>
            ` : ''}
            <table class="data-table">
              <thead>
                <tr>
                  <th width="10%">Артикул</th>
                  <th width="24%">Наименование</th>
                  <th width="8%">Вид</th>
                  <th width="15%">Габариты</th>
                  <th width="18%">Материал</th>
                  <th width="13%">Цвет</th>
                  <th width="12%">Цена (KGS)</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `
      }).join('')
    })()}

    <div class="footer">© ${new Date().getFullYear()} ${esc(companyData.name)} • ${esc(companyData.tagline)}</div>
  </div>
  <div class="pdf-page">
    <style>${modernCss()}</style>
    <div style="padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:linear-gradient(135deg,#f6f9fc,#ffffff);">
      <div style="text-align:center;margin-bottom:12px;font-weight:800;color:#1a1a2e;">УСЛОВИЯ СОТРУДНИЧЕСТВА</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        ${[
          ['Ценообразование','Цены в KGS с НДС. Корректировка с уведомлением за 14 дней.'],
          ['Оплата','Дилеры: по договору. Розница: 100% предоплата.'],
          ['Сроки','Склад: 3 дня. Под заказ: 14–21 день.'],
          ['Логистика','Бишкек: бесплатно от 30 000 сом. Регионы КР: по тарифам ТК.'],
          ['Гарантия','24 месяца. Постгарантийное обслуживание.'],
          ['Партнерство','Индивидуальные условия и маркетинговая поддержка.'],
        ].map(([t,d]) => `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">
            <div style="font-size:12px;font-weight:800;margin-bottom:6px;">${esc(t)}</div>
            <div style="font-size:11px;color:#4a5568;line-height:1.5;">${esc(d)}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;margin-top:16px;background:linear-gradient(135deg,#667eea,#764ba2);padding:14px;border-radius:14px;color:#fff;">
      <div style="width:60px;height:60px;border-radius:50%;border:3px solid rgba(255,255,255,0.3);display:grid;place-items:center;background:rgba(255,255,255,0.2);">👤</div>
      <div>
        <div style="font-size:10px;opacity:0.85;letter-spacing:1px;text-transform:uppercase;">Менеджер по работе с клиентами</div>
        <div style="font-size:18px;font-weight:800;">${esc(companyData.manager?.name || '')}</div>
        <div style="display:flex;gap:12px;font-size:12px;"><span>📱 ${esc(companyData.manager?.phone || '')}</span><span>✉️ ${esc(companyData.manager?.email || '')}</span></div>
      </div>
      <div style="width:70px;height:70px;background:#fff;border-radius:10px;"></div>
    </div>
    <div class="footer">© ${new Date().getFullYear()} ${esc(companyData.name)} • Все права защищены</div>
  </div>
  `
}

function renderNordicHTML(data: any): string {
  const { companyData, documentData, products } = data
  return `
  <div class="pdf-page">
    <style>${nordicCss()}</style>
    <div class="header">
      ${companyData.logo ? `<img src="${esc(companyData.logo)}" alt="logo" style="height:48px;object-fit:contain;margin:0 auto 8px;display:block;" />` : ''}
      <div class="logo">${esc(companyData.name)}</div>
      <div class="tagline">${esc(companyData.tagline)}</div>
      <div class="contacts-strip">
        <span>${esc(companyData.address)}</span>
        <span>${esc(companyData.phone)}</span>
        <span>${esc(companyData.email)}</span>
      </div>
    </div>
    <div class="doc-title">
      <h1>Прайс-лист</h1>
      <div class="doc-date">Действителен с ${esc(documentData.date)}</div>
    </div>
    <div class="intro">Представляем актуальный прайс‑лист на продукцию мебельной фабрики ${esc(companyData.name)}.</div>
    ${(products || []).map((p: any) => `
      <div class="product-section">
        <div class="section-header">
          <div class="section-line"></div>
          <div class="section-title">${esc(p.collection || p.type || p.category || 'Серия')}</div>
          <div class="section-line"></div>
        </div>
        <table class="product-table">
          <thead>
            <tr>
              <th width="10%">Артикул</th>
              <th width="28%">Наименование</th>
              <th width="10%">Фото</th>
              <th width="16%">Размеры</th>
              <th width="14%">Материал</th>
              <th width="12%">Цвет</th>
              <th width="10%">Цена</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="article">${esc(p.article || '-')}</td>
              <td>${esc(p.name || '-')}</td>
              <td><div class="photo-cell">IMG</div></td>
              <td class="dimensions">${esc(p.dimensions || '-')}</td>
              <td>${esc(p.material || '-')}</td>
              <td><span class="color-dot" style="background:#ffffff"></span>${esc(p.color || '-')}</td>
              <td class="price">${(p.base_price || 0).toLocaleString('ru-RU')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `).join('')}
    <div class="page-number">1 / 2</div>
  </div>
  <div class="pdf-page">
    <style>${nordicCss()}</style>
    <div class="doc-title">
      <h1>Условия сотрудничества</h1>
      <div class="doc-date">Актуально на ${esc(documentData.date)}</div>
    </div>
    <div style="padding:18px;background:#fafbfc;border-radius:12px;">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;font-size:11px;color:#7f8c8d;">
        ${[
          ['Цены','KGS с НДС. Изменения с уведомлением за 14 дней.'],
          ['Оплата','Дилеры — по договору. Розница — 100% предоплата.'],
          ['Сроки','В наличии — 3 дня. Под заказ — 14–21 день.'],
          ['Доставка','Бишкек — от 30 000 сом бесплатно. Регионы — по тарифам ТК.'],
          ['Гарантия','24 месяца.'],
          ['Партнерство','Спецусловия для дилеров.'],
        ].map(([t, d]) => `
          <div style="display:flex;gap:10px;line-height:1.6;">
            <div>●</div>
            <div><strong>${esc(t)}</strong> ${esc(d)}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div style="text-align:center;margin-top:18px;">
      Ваш менеджер: <strong>${esc(companyData.manager?.name || '')}</strong><br/>
      <span>${esc(companyData.manager?.phone || '')}</span> · <span>${esc(companyData.manager?.email || '')}</span>
    </div>
    <div class="page-number">2 / 2</div>
  </div>
  `
}

function renderExecutiveHTML(data: any): string {
  const { companyData, documentData, products } = data
  return `
  <div class="pdf-page">
    <style>${executiveCss()}</style>
    <div class="header">
      <div>
        ${companyData.logo ? `<img src="${esc(companyData.logo)}" alt="logo" style="height:40px;object-fit:contain;margin-bottom:6px;" />` : ''}
        <div class="company-logo">${esc(companyData.name)}</div>
        <div class="company-type">${esc(companyData.tagline)}</div>
      </div>
      <div class="contact-section">
        <strong>Кыргызская Республика</strong><br/>
        ${esc(companyData.address)}<br/>
        <strong>Тел:</strong> ${esc(companyData.phone)}<br/>
        <strong>Email:</strong> ${esc(companyData.email)}<br/>
        <strong>Web:</strong> ${esc(companyData.website)}
      </div>
    </div>
    <div class="doc-title"><h1>${esc(documentData.title)}</h1></div>
    <div class="doc-date">Действителен с ${esc(documentData.date)}</div>
    <div class="intro"><strong>Уважаемые партнеры и клиенты!</strong><br/>Представляем актуальный прайс‑лист.</div>
    <div class="section-header">СЕРИЯ / РАЗДЕЛ</div>
    <table class="product-table">
      <thead>
        <tr>
          <th width="12%">Артикул</th>
          <th width="25%">Наименование</th>
          <th width="12%">Фото</th>
          <th width="18%">Размеры (мм)</th>
          <th width="13%">Материал</th>
          <th width="10%">Цвет</th>
          <th width="10%">Цена (KGS)</th>
        </tr>
      </thead>
      <tbody>
        ${(products || []).map((p: any) => `
          <tr>
            <td class="article">${esc(p.article || '-')}</td>
            <td>${esc(p.name || '-')}</td>
            <td><div style="width:60px;height:45px;background:#e3f2fd;color:#0d47a1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;">ФОТО</div></td>
            <td class="dimensions">${esc(p.dimensions || '-')}</td>
            <td>${esc(p.material || '-')}</td>
            <td>${esc(p.color || '-')}</td>
            <td class="price">${(p.base_price || 0).toLocaleString('ru-RU')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="page-number">Страница 1 из 2</div>
  </div>
  <div class="pdf-page">
    <style>${executiveCss()}</style>
    <div class="section-header">Условия сотрудничества</div>
    <ul style="font-size:12px;color:#455a64;line-height:1.7;margin:10px 0 16px 16px;">
      <li><strong>ЦЕНЫ:</strong> В сомах (KGS), с НДС. Изменения с уведомлением за 14 дней.</li>
      <li><strong>ОПЛАТА:</strong> Дилеры — по договору, розница — 100% предоплата.</li>
      <li><strong>СРОКИ:</strong> В наличии — 3 рабочих дня, под заказ — 14–21 день.</li>
      <li><strong>ДОСТАВКА:</strong> Бишкек — бесплатно от 30 000 сом. Регионы — по тарифам ТК.</li>
      <li><strong>ГАРАНТИЯ:</strong> 24 месяца на всю продукцию.</li>
    </ul>
    <div style="padding:12px;border:1px solid #e3f2fd;border-radius:8px;color:#0d47a1;background:#f5fbff;">
      Контактное лицо: <strong>${esc(companyData.manager?.name || '')}</strong> · ${esc(companyData.manager?.phone || '')} · ${esc(companyData.manager?.email || '')}
    </div>
    <div class="page-number">Страница 2 из 2</div>
  </div>
  `
}

/** Построитель HTML по шаблону */
function buildHtml(template: TemplateType, data: any): string {
  const content =
    template === 'modern' ? renderModernHTML(data)
    : template === 'nordic' ? renderNordicHTML(data)
    : renderExecutiveHTML(data)
  return htmlBase(content, template)
}

async function start() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '10mb' }))

  app.post('/api/pdf/generate', async (req, res) => {
    try {
      assertPayload(req.body)
      const tpl: TemplateType = req.body.template
      const data = req.body.data

      const html = buildHtml(tpl, data)

      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } })
      await browser.close()

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="wasser_${tpl}.pdf"`)
      res.send(pdfBuffer)
    } catch (e: any) {
      console.error('PDF server error:', e)
      res.status(500).send(e?.message || 'Server error')
    }
  })

  const port = process.env.PORT || 8787
  app.listen(port, () => {
    console.log(`WASSER PDF server listening on http://localhost:${port}`)
  })
}

if (require.main === module) {
  // Запуск только при старте как отдельный процесс: node dist/server/pdf-server.js
  start()
}

export default start
