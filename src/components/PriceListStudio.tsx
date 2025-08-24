/**
 * @file PriceListStudio.tsx
 * @description Единый конструктор прайс-листа: визуальные настройки, выбор данных и живой предпросмотр PDF.
 */

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { Palette, Type, Image as ImageIcon, Sparkles, Columns } from 'lucide-react'
import PriceListGenerator from './PriceListGenerator'
import PdfGeneratorClient from './PdfGeneratorClient'
import { usePdfStore } from '../store/pdf-store'

/**
 * Простой color-input с подписью.
 */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded-md border border-gray-200 p-1"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  )
}

/**
 * Единый конструктор: слева настройки вида, ниже выбор и колонки; справа предпросмотр PDF.
 */
export default function PriceListStudio(): JSX.Element {
  const { data, mergeConfig, updateLogo, setData } = usePdfStore()
  const [primary, setPrimary] = useState<string>(data?.config.primaryColor || '#667eea')
  const [accent, setAccent] = useState<string>(data?.config.accentColor || '#764ba2')
  const [bg, setBg] = useState<string>(data?.config.bgColor || '#ffffff')
  const [font, setFont] = useState<'Inter' | 'Roboto' | 'System' | 'Space Grotesk'>(data?.config.fontFamily || 'Inter')
  const [showLogo, setShowLogo] = useState<boolean>(data?.config.showLogo ?? true)
  const [striped, setStriped] = useState<boolean>(data?.config.striped ?? true)
  const [density, setDensity] = useState<'compact' | 'regular' | 'spacious'>(data?.config.density || 'regular')

  /** Применение настроек в store */
  useEffect(() => {
    mergeConfig({
      primaryColor: primary,
      accentColor: accent,
      bgColor: bg,
      fontFamily: font,
      showLogo,
      striped,
      density,
    })
  }, [primary, accent, bg, font, showLogo, striped, density, mergeConfig])

  /** Загрузка логотипа (base64) в store */
  const onLogoUpload = (f: File) => {
    const reader = new FileReader()
    reader.onload = () => updateLogo(reader.result as string)
    reader.readAsDataURL(f)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-6">
        {/* Визуальные настройки */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Вид и брендирование
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm flex items-center gap-2"><Type className="w-4 h-4" /> Шрифт</Label>
                <Select value={font} onValueChange={(v) => setFont(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Шрифт" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Space Grotesk">Space Grotesk</SelectItem>
                    <SelectItem value="System">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Логотип</Label>
                <div className="flex items-center gap-3">
                  {data?.companyData.logo ? (
                    <img src={data.companyData.logo} alt="logo" className="w-10 h-10 rounded border object-cover" />
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
                      <Button variant="outline" className="bg-transparent">Загрузить</Button>
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox id="showLogo" checked={showLogo} onCheckedChange={(c) => setShowLogo(!!c)} />
                  <Label htmlFor="showLogo" className="text-sm">Показывать логотип</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ColorField label="Primary" value={primary} onChange={setPrimary} />
              <ColorField label="Accent" value={accent} onChange={setAccent} />
              <ColorField label="Фон страницы" value={bg} onChange={setBg} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-sm flex items-center gap-2"><Columns className="w-4 h-4" /> Плотность</Label>
                <Select value={density} onValueChange={(v) => setDensity(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Плотность" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Компактная</SelectItem>
                    <SelectItem value="regular">Обычная</SelectItem>
                    <SelectItem value="spacious">Воздушная</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="flex items-center gap-3 mt-6">
                  <Checkbox id="striped" checked={striped} onCheckedChange={(c) => setStriped(!!c)} />
                  <Label htmlFor="striped" className="text-sm">Полосатые строки таблицы</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Блок выбора данных и колонок (используем готовый генератор) */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Данные и колонки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PriceListGenerator />
          </CardContent>
        </Card>
      </div>

      {/* Предпросмотр и экспорт */}
      <div className="space-y-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>Предпросмотр и экспорт</CardTitle>
          </CardHeader>
          <CardContent>
            <PdfGeneratorClient />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
