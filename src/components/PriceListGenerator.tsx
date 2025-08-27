import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox, CheckedState } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, Filter, Search, Calculator, Package, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Расширяем типы jsPDF для autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

// Типы данных
interface Product {
  id: string;
  article: string;
  name: string;
  collection: string;
  category: string;
  baseMaterial: string;
  materials: Material[];
  laborHours: number;
  markup: number;
  basePrice: number;
  finalPrice: number;
  selected?: boolean;
}

interface Material {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

interface Collection {
  id: string;
  name: string;
  multiplier: number;
}

interface PriceSettings {
  laborCostPerHour: number;
  defaultMarkup: number;
  vatRate: number;
  discountThreshold: number;
  discountPercentage: number;
}

interface ExportOptions {
  format: 'pdf' | 'excel';
  includeDetails: boolean;
  includeMaterials: boolean;
  includeVat: boolean;
  groupByCollection: boolean;
  language: 'ru' | 'en';
}

interface PriceListGeneratorProps {
  products?: Product[];
  collections?: Collection[];
  onGeneratePriceList?: (products: Product[], options: ExportOptions) => void;
}

const PriceListGenerator: React.FC<PriceListGeneratorProps> = ({
  products: externalProducts,
  collections: externalCollections,
  onGeneratePriceList
}) => {
  // Состояния
  const [products, setProducts] = useState<Product[]>(externalProducts || generateSampleProducts());
  const [collections] = useState<Collection[]>(externalCollections || generateSampleCollections());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectAll, setSelectAll] = useState(false);
  const [settings, setSettings] = useState<PriceSettings>({
    laborCostPerHour: 1500,
    defaultMarkup: 30,
    vatRate: 20,
    discountThreshold: 100000,
    discountPercentage: 5
  });
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeDetails: true,
    includeMaterials: false,
    includeVat: true,
    groupByCollection: false,
    language: 'ru'
  });

  // Генерация примерных данных
  function generateSampleProducts(): Product[] {
    const sampleProducts: Product[] = [
      {
        id: '1',
        article: 'WF-001',
        name: 'Стол обеденный "Классик"',
        collection: 'classic',
        category: 'tables',
        baseMaterial: 'Массив дуба',
        materials: [
          { name: 'Массив дуба', quantity: 2.5, unit: 'м²', price: 5000, total: 12500 },
          { name: 'Лак мебельный', quantity: 0.5, unit: 'л', price: 1200, total: 600 },
          { name: 'Фурнитура', quantity: 1, unit: 'комплект', price: 2500, total: 2500 }
        ],
        laborHours: 8,
        markup: 30,
        basePrice: 27600,
        finalPrice: 35880
      },
      {
        id: '2',
        article: 'WF-002',
        name: 'Стул мягкий "Комфорт"',
        collection: 'modern',
        category: 'chairs',
        baseMaterial: 'Массив березы',
        materials: [
          { name: 'Массив березы', quantity: 0.8, unit: 'м²', price: 3500, total: 2800 },
          { name: 'Ткань обивочная', quantity: 1.2, unit: 'м', price: 1800, total: 2160 },
          { name: 'Поролон', quantity: 0.5, unit: 'м²', price: 800, total: 400 }
        ],
        laborHours: 4,
        markup: 35,
        basePrice: 11360,
        finalPrice: 15336
      }
    ];
    return sampleProducts;
  }

  function generateSampleCollections(): Collection[] {
    return [
      { id: 'classic', name: 'Классика', multiplier: 1.0 },
      { id: 'modern', name: 'Модерн', multiplier: 1.1 },
      { id: 'premium', name: 'Премиум', multiplier: 1.3 },
      { id: 'luxury', name: 'Люкс', multiplier: 1.5 }
    ];
  }

  // Пересчет цены продукта
  const recalculateProductPrice = useCallback((product: Product): Product => {
    const materialsCost = product.materials.reduce((sum, m) => sum + m.total, 0);
    const laborCost = product.laborHours * settings.laborCostPerHour;
    const basePrice = materialsCost + laborCost;
    const markupAmount = basePrice * (product.markup / 100);
    const finalPrice = basePrice + markupAmount;
    
    const collection = collections.find(c => c.id === product.collection);
    const collectionMultiplier = collection?.multiplier || 1;
    
    return {
      ...product,
      basePrice,
      finalPrice: finalPrice * collectionMultiplier
    };
  }, [settings.laborCostPerHour, collections]);

  // Обновление настроек
  const handleSettingsChange = useCallback((field: keyof PriceSettings, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSettings(prev => ({ ...prev, [field]: numValue }));
    
    // Пересчитываем цены всех продуктов
    setProducts(prevProducts => 
      prevProducts.map(product => recalculateProductPrice(product))
    );
  }, [recalculateProductPrice]);

  // Фильтрация продуктов
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Поиск
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.article.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.baseMaterial.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Коллекция
      const matchesCollection = selectedCollection === 'all' || 
        product.collection === selectedCollection;
      
      // Категория
      const matchesCategory = selectedCategory === 'all' || 
        product.category === selectedCategory;
      
      // Диапазон цен - преобразуем строки в числа
      const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
      const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      const matchesPrice = product.finalPrice >= minPrice && product.finalPrice <= maxPrice;
      
      return matchesSearch && matchesCollection && matchesCategory && matchesPrice;
    });
  }, [products, searchQuery, selectedCollection, selectedCategory, priceRange]);

  // Выбор/снятие выбора всех продуктов
  const handleSelectAll = useCallback((checked: CheckedState) => {
    // CheckedState может быть boolean | "indeterminate"
    const isChecked = checked === true;
    setSelectAll(isChecked);
    setProducts(prevProducts => 
      prevProducts.map(product => ({
        ...product,
        selected: filteredProducts.some(fp => fp.id === product.id) ? isChecked : product.selected
      }))
    );
  }, [filteredProducts]);

  // Выбор отдельного продукта
  const handleSelectProduct = useCallback((productId: string, checked: boolean) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId ? { ...product, selected: checked } : product
      )
    );
  }, []);

  // Экспорт в PDF
  const exportToPDF = useCallback(() => {
    const selectedProducts = products.filter(p => p.selected);
    if (selectedProducts.length === 0) {
      alert('Выберите хотя бы один продукт для экспорта');
      return;
    }

    const doc = new jsPDF();
    
    // Заголовок
    doc.setFontSize(20);
    doc.text('Прайс-лист мебельной фабрики', 14, 15);
    doc.setFontSize(10);
    doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 14, 25);

    // Таблица продуктов
    const tableData = selectedProducts.map(product => {
      const row = [
        product.article,
        product.name,
        product.collection,
        product.baseMaterial
      ];

      if (exportOptions.includeDetails) {
        row.push(`${product.laborHours} ч`);
        row.push(`${product.markup}%`);
      }

      if (exportOptions.includeVat) {
        const vatAmount = product.finalPrice * (settings.vatRate / 100);
        const priceWithVat = product.finalPrice + vatAmount;
        row.push(`${product.finalPrice.toFixed(2)} ₽`);
        row.push(`${priceWithVat.toFixed(2)} ₽`);
      } else {
        row.push(`${product.finalPrice.toFixed(2)} ₽`);
      }

      return row;
    });

    const headers = ['Артикул', 'Наименование', 'Коллекция', 'Материал'];
    if (exportOptions.includeDetails) {
      headers.push('Трудозатраты', 'Наценка');
    }
    if (exportOptions.includeVat) {
      headers.push('Цена без НДС', 'Цена с НДС');
    } else {
      headers.push('Цена');
    }

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 35,
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] }
    });

    // Итоги
    const totalPrice = selectedProducts.reduce((sum, p) => sum + p.finalPrice, 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.text(`Итого: ${totalPrice.toFixed(2)} ₽`, 14, finalY);
    
    if (exportOptions.includeVat) {
      const totalVat = totalPrice * (settings.vatRate / 100);
      const totalWithVat = totalPrice + totalVat;
      doc.text(`НДС ${settings.vatRate}%: ${totalVat.toFixed(2)} ₽`, 14, finalY + 7);
      doc.text(`Итого с НДС: ${totalWithVat.toFixed(2)} ₽`, 14, finalY + 14);
    }

    if (totalPrice > settings.discountThreshold) {
      const discount = totalPrice * (settings.discountPercentage / 100);
      const finalTotal = totalPrice - discount;
      doc.text(`Скидка ${settings.discountPercentage}%: ${discount.toFixed(2)} ₽`, 14, finalY + 21);
      doc.setFontSize(14);
      doc.text(`К оплате: ${finalTotal.toFixed(2)} ₽`, 14, finalY + 28);
    }

    doc.save(`price-list_${new Date().toISOString().split('T')[0]}.pdf`);
  }, [products, exportOptions, settings]);

  // Экспорт в Excel
  const exportToExcel = useCallback(() => {
    const selectedProducts = products.filter(p => p.selected);
    if (selectedProducts.length === 0) {
      alert('Выберите хотя бы один продукт для экспорта');
      return;
    }

    const exportData = selectedProducts.map(product => {
      const row: any = {
        'Артикул': product.article,
        'Наименование': product.name,
        'Коллекция': collections.find(c => c.id === product.collection)?.name || product.collection,
        'Категория': product.category,
        'Основной материал': product.baseMaterial
      };

      if (exportOptions.includeDetails) {
        row['Трудозатраты (ч)'] = product.laborHours;
        row['Наценка (%)'] = product.markup;
        row['Базовая цена'] = product.basePrice.toFixed(2);
      }

      if (exportOptions.includeMaterials) {
        row['Материалы'] = product.materials.map(m => 
          `${m.name}: ${m.quantity} ${m.unit}`
        ).join('; ');
      }

      row['Цена'] = product.finalPrice.toFixed(2);

      if (exportOptions.includeVat) {
        const vatAmount = product.finalPrice * (settings.vatRate / 100);
        row['НДС'] = vatAmount.toFixed(2);
        row['Цена с НДС'] = (product.finalPrice + vatAmount).toFixed(2);
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Прайс-лист');

    // Добавляем лист с итогами
    const totalPrice = selectedProducts.reduce((sum, p) => sum + p.finalPrice, 0);
    const summaryData = [
      { 'Показатель': 'Количество позиций', 'Значение': selectedProducts.length },
      { 'Показатель': 'Общая сумма', 'Значение': totalPrice.toFixed(2) }
    ];

    if (exportOptions.includeVat) {
      const totalVat = totalPrice * (settings.vatRate / 100);
      summaryData.push(
        { 'Показатель': `НДС ${settings.vatRate}%`, 'Значение': totalVat.toFixed(2) },
        { 'Показатель': 'Итого с НДС', 'Значение': (totalPrice + totalVat).toFixed(2) }
      );
    }

    if (totalPrice > settings.discountThreshold) {
      const discount = totalPrice * (settings.discountPercentage / 100);
      summaryData.push(
        { 'Показатель': `Скидка ${settings.discountPercentage}%`, 'Значение': discount.toFixed(2) },
        { 'Показатель': 'К оплате', 'Значение': (totalPrice - discount).toFixed(2) }
      );
    }

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Итоги');

    XLSX.writeFile(workbook, `price-list_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [products, collections, exportOptions, settings]);

  // Обработчик экспорта
  const handleExport = useCallback(() => {
    if (exportOptions.format === 'pdf') {
      exportToPDF();
    } else {
      exportToExcel();
    }

    if (onGeneratePriceList) {
      onGeneratePriceList(products.filter(p => p.selected), exportOptions);
    }
  }, [exportOptions, exportToPDF, exportToExcel, products, onGeneratePriceList]);

  // Статистика
  const statistics = useMemo(() => {
    const selected = products.filter(p => p.selected);
    const totalPrice = selected.reduce((sum, p) => sum + p.finalPrice, 0);
    const avgPrice = selected.length > 0 ? totalPrice / selected.length : 0;
    const minPrice = selected.length > 0 ? Math.min(...selected.map(p => p.finalPrice)) : 0;
    const maxPrice = selected.length > 0 ? Math.max(...selected.map(p => p.finalPrice)) : 0;

    return {
      totalProducts: products.length,
      selectedProducts: selected.length,
      totalPrice,
      avgPrice,
      minPrice,
      maxPrice,
      discount: totalPrice > settings.discountThreshold ? 
        totalPrice * (settings.discountPercentage / 100) : 0
    };
  }, [products, settings]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Генератор прайс-листов</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Продукты</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
              <TabsTrigger value="export">Экспорт</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              {/* Фильтры */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="md:col-span-2"
                />
                <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все коллекции</SelectItem>
                    {collections.map(col => (
                      <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все категории</SelectItem>
                    <SelectItem value="tables">Столы</SelectItem>
                    <SelectItem value="chairs">Стулья</SelectItem>
                    <SelectItem value="cabinets">Шкафы</SelectItem>
                    <SelectItem value="sofas">Диваны</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Диапазон цен */}
              <div className="flex gap-2 items-center">
                <Label>Цена от:</Label>
                <Input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-32"
                />
                <Label>до:</Label>
                <Input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-32"
                />
              </div>

              {/* Таблица продуктов */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2">
                        <Checkbox 
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-2 text-left">Артикул</th>
                      <th className="px-4 py-2 text-left">Наименование</th>
                      <th className="px-4 py-2 text-left">Коллекция</th>
                      <th className="px-4 py-2 text-left">Материал</th>
                      <th className="px-4 py-2 text-right">Цена</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="border-t">
                        <td className="px-4 py-2">
                          <Checkbox
                            checked={product.selected || false}
                            onCheckedChange={(checked) => 
                              handleSelectProduct(product.id, checked as boolean)
                            }
                          />
                        </td>
                        <td className="px-4 py-2">{product.article}</td>
                        <td className="px-4 py-2">{product.name}</td>
                        <td className="px-4 py-2">
                          {collections.find(c => c.id === product.collection)?.name}
                        </td>
                        <td className="px-4 py-2">{product.baseMaterial}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {product.finalPrice.toFixed(2)} ₽
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Статистика */}
              <Alert>
                <AlertDescription>
                  Выбрано: {statistics.selectedProducts} из {statistics.totalProducts} | 
                  Сумма: {statistics.totalPrice.toFixed(2)} ₽ | 
                  Средняя цена: {statistics.avgPrice.toFixed(2)} ₽
                  {statistics.discount > 0 && ` | Скидка: ${statistics.discount.toFixed(2)} ₽`}
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Стоимость часа работы (₽)</Label>
                  <Input
                    type="number"
                    value={settings.laborCostPerHour}
                    onChange={(e) => handleSettingsChange('laborCostPerHour', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Базовая наценка (%)</Label>
                  <Input
                    type="number"
                    value={settings.defaultMarkup}
                    onChange={(e) => handleSettingsChange('defaultMarkup', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Ставка НДС (%)</Label>
                  <Input
                    type="number"
                    value={settings.vatRate}
                    onChange={(e) => handleSettingsChange('vatRate', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Порог для скидки (₽)</Label>
                  <Input
                    type="number"
                    value={settings.discountThreshold}
                    onChange={(e) => handleSettingsChange('discountThreshold', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Процент скидки (%)</Label>
                  <Input
                    type="number"
                    value={settings.discountPercentage}
                    onChange={(e) => handleSettingsChange('discountPercentage', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Формат экспорта</Label>
                  <Select 
                    value={exportOptions.format} 
                    onValueChange={(value: 'pdf' | 'excel') => 
                      setExportOptions(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Язык</Label>
                  <Select 
                    value={exportOptions.language}
                    onValueChange={(value: 'ru' | 'en') => 
                      setExportOptions(prev => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={exportOptions.includeDetails}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeDetails: checked as boolean }))
                    }
                  />
                  <Label>Включить детальную информацию</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={exportOptions.includeMaterials}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeMaterials: checked as boolean }))
                    }
                  />
                  <Label>Включить список материалов</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={exportOptions.includeVat}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeVat: checked as boolean }))
                    }
                  />
                  <Label>Включить НДС</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={exportOptions.groupByCollection}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, groupByCollection: checked as boolean }))
                    }
                  />
                  <Label>Группировать по коллекциям</Label>
                </div>
              </div>

              <Button onClick={handleExport} className="w-full">
                <FileDown className="w-4 h-4 mr-2" />
                Экспортировать прайс-лист
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceListGenerator;
