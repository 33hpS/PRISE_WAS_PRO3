import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';

// Типы данных
interface ParsedMaterialRow {
  name: string;
  article: string;
  unit: string;
  price: number;
  category?: string; // опциональное поле category
}

export interface MaterialImport {
  name: string;
  article: string;
  unit: string;
  price: number;
  type: string; // обязательное поле type
}

interface Material extends MaterialImport {
  id: string;
  quantity?: number;
  supplier?: string;
  notes?: string;
}

interface MaterialsManagerProps {
  materials?: Material[];
  onMaterialsChange?: (materials: Material[]) => void;
  onImport?: (materials: MaterialImport[]) => void;
}

const MaterialsManager: React.FC<MaterialsManagerProps> = ({
  materials: externalMaterials,
  onMaterialsChange,
  onImport
}) => {
  const [materials, setMaterials] = useState<Material[]>(externalMaterials || []);
  const [importedMaterials, setImportedMaterials] = useState<MaterialImport[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Material>>({});
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: '',
    article: '',
    unit: 'шт',
    price: 0,
    type: 'material'
  });
  const [importError, setImportError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Конвертация ParsedMaterialRow в MaterialImport
  const convertToMaterialImport = useCallback((rows: ParsedMaterialRow[]): MaterialImport[] => {
    return rows.map(row => ({
      name: row.name,
      article: row.article,
      unit: row.unit,
      price: row.price,
      type: row.category || 'material' // маппинг category в type с дефолтным значением
    }));
  }, []);

  // Парсинг Excel файла
  const parseExcelFile = useCallback(async (file: File): Promise<ParsedMaterialRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
          
          const parsedRows: ParsedMaterialRow[] = jsonData.map((row: any) => ({
            name: String(row['Наименование'] || row['Name'] || ''),
            article: String(row['Артикул'] || row['Article'] || ''),
            unit: String(row['Единица'] || row['Unit'] || 'шт'),
            price: parseFloat(row['Цена'] || row['Price'] || '0') || 0,
            category: String(row['Категория'] || row['Category'] || 'material')
          }));
          
          resolve(parsedRows);
        } catch (error) {
          reject(new Error('Ошибка при парсинге файла: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => reject(new Error('Ошибка при чтении файла'));
      reader.readAsBinaryString(file);
    });
  }, []);

  // Обработка импорта файла
  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImportError(null);
    
    try {
      const parsedRows = await parseExcelFile(file);
      const convertedMaterials = convertToMaterialImport(parsedRows);
      
      setImportedMaterials(convertedMaterials);
      
      if (onImport) {
        onImport(convertedMaterials);
      }
      
      // Добавляем материалы с уникальными ID
      const newMaterials: Material[] = convertedMaterials.map(material => ({
        ...material,
        id: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
      
      setMaterials(prev => [...prev, ...newMaterials]);
      
      if (onMaterialsChange) {
        onMaterialsChange([...materials, ...newMaterials]);
      }
    } catch (error) {
      setImportError((error as Error).message);
    }
    
    // Сброс input для возможности повторного импорта того же файла
    event.target.value = '';
  }, [materials, onImport, onMaterialsChange, parseExcelFile, convertToMaterialImport]);

  // Экспорт материалов в Excel
  const handleExport = useCallback(() => {
    const exportData = materials.map(material => ({
      'Наименование': material.name,
      'Артикул': material.article,
      'Единица': material.unit,
      'Цена': material.price,
      'Тип': material.type,
      'Количество': material.quantity || '',
      'Поставщик': material.supplier || '',
      'Примечания': material.notes || ''
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Материалы');
    
    // Установка ширины колонок
    const maxWidth = 30;
    const wscols = [
      { wch: maxWidth }, // Наименование
      { wch: 15 },       // Артикул
      { wch: 10 },       // Единица
      { wch: 10 },       // Цена
      { wch: 15 },       // Тип
      { wch: 10 },       // Количество
      { wch: 20 },       // Поставщик
      { wch: maxWidth }  // Примечания
    ];
    worksheet['!cols'] = wscols;
    
    XLSX.writeFile(workbook, `materials_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [materials]);

  // Добавление нового материала
  const handleAddMaterial = useCallback(() => {
    if (!newMaterial.name || !newMaterial.article) {
      setImportError('Заполните обязательные поля: Наименование и Артикул');
      return;
    }
    
    const material: Material = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newMaterial.name!,
      article: newMaterial.article!,
      unit: newMaterial.unit || 'шт',
      price: newMaterial.price || 0,
      type: newMaterial.type || 'material',
      quantity: newMaterial.quantity,
      supplier: newMaterial.supplier,
      notes: newMaterial.notes
    };
    
    setMaterials(prev => [...prev, material]);
    
    if (onMaterialsChange) {
      onMaterialsChange([...materials, material]);
    }
    
    // Очистка формы
    setNewMaterial({
      name: '',
      article: '',
      unit: 'шт',
      price: 0,
      type: 'material'
    });
    setImportError(null);
  }, [newMaterial, materials, onMaterialsChange]);

  // Удаление материала
  const handleDeleteMaterial = useCallback((id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    
    if (onMaterialsChange) {
      onMaterialsChange(materials.filter(m => m.id !== id));
    }
  }, [materials, onMaterialsChange]);

  // Начало редактирования
  const handleStartEdit = useCallback((material: Material) => {
    setEditingId(material.id);
    setEditForm(material);
  }, []);

  // Сохранение редактирования
  const handleSaveEdit = useCallback(() => {
    if (!editingId) return;
    
    setMaterials(prev => prev.map(m => 
      m.id === editingId ? { ...m, ...editForm } as Material : m
    ));
    
    if (onMaterialsChange) {
      onMaterialsChange(materials.map(m => 
        m.id === editingId ? { ...m, ...editForm } as Material : m
      ));
    }
    
    setEditingId(null);
    setEditForm({});
  }, [editingId, editForm, materials, onMaterialsChange]);

  // Отмена редактирования
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({});
  }, []);

  // Фильтрация материалов
  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const matchesSearch = searchQuery === '' || 
        material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.article.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.supplier?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || material.type === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchQuery, selectedCategory]);

  // Получение уникальных категорий
  const categories = useMemo(() => {
    const uniqueCategories = new Set(materials.map(m => m.type));
    return ['all', ...Array.from(uniqueCategories)];
  }, [materials]);

  // Подсчет статистики
  const statistics = useMemo(() => {
    return {
      total: materials.length,
      totalValue: materials.reduce((sum, m) => sum + (m.price * (m.quantity || 0)), 0),
      byCategory: categories.reduce((acc, cat) => {
        if (cat !== 'all') {
          acc[cat] = materials.filter(m => m.type === cat).length;
        }
        return acc;
      }, {} as Record<string, number>)
    };
  }, [materials, categories]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Управление материалами</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Импорт/Экспорт */}
          <div className="flex gap-2">
            <div className="relative">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                className="hidden"
                id="file-import"
              />
              <Label htmlFor="file-import" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Импорт из Excel
                  </span>
                </Button>
              </Label>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Экспорт в Excel
            </Button>
          </div>

          {importError && (
            <Alert variant="destructive">
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}

          {/* Форма добавления */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Input
              placeholder="Наименование"
              value={newMaterial.name || ''}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Артикул"
              value={newMaterial.article || ''}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, article: e.target.value }))}
            />
            <Input
              placeholder="Единица"
              value={newMaterial.unit || 'шт'}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, unit: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Цена"
                value={newMaterial.price || ''}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              />
              <Button onClick={handleAddMaterial}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Фильтры */}
          <div className="flex gap-2">
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Все категории' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Всего материалов</div>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Общая стоимость</div>
              <div className="text-2xl font-bold">{statistics.totalValue.toFixed(2)} ₽</div>
            </div>
            {Object.entries(statistics.byCategory).slice(0, 2).map(([cat, count]) => (
              <div key={cat}>
                <div className="text-sm text-gray-600">{cat}</div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            ))}
          </div>

          {/* Таблица материалов */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Наименование</th>
                  <th className="px-4 py-2 text-left">Артикул</th>
                  <th className="px-4 py-2 text-left">Единица</th>
                  <th className="px-4 py-2 text-right">Цена</th>
                  <th className="px-4 py-2 text-left">Тип</th>
                  <th className="px-4 py-2 text-center">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map(material => (
                  <tr key={material.id} className="border-t">
                    {editingId === material.id ? (
                      <>
                        <td className="px-4 py-2">
                          <Input
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={editForm.article || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, article: e.target.value }))}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={editForm.unit || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={editForm.price || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={editForm.type || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2">{material.name}</td>
                        <td className="px-4 py-2">{material.article}</td>
                        <td className="px-4 py-2">{material.unit}</td>
                        <td className="px-4 py-2 text-right">{material.price.toFixed(2)} ₽</td>
                        <td className="px-4 py-2">{material.type}</td>
                        <td className="px-4 py-2">
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleStartEdit(material)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteMaterial(material.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMaterials.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Материалы не найдены
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialsManager;