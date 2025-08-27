import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Save, X, Edit2, Trash2, Package, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Типы данных
interface Material {
  id: string;
  name: string;
  price_per_m2: number;
  cost_per_g: number;
  consumption_g_per_m2: number;
  notes: string;
}

interface Product {
  id: string;
  name: string;
  article: string;
  unit: string;
  price: number;
  type: string;
}

interface LaborCost {
  labor_cost: number;
}

interface ProductFormData {
  name: string;
  article: string;
  unit: string;
  price: string;
  type: string;
  materials?: string[];
  laborHours?: string;
}

interface ProductManagerProps {
  onProductsChange?: (products: Product[]) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({ onProductsChange }) => {
  // Состояния
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [laborCostPerHour, setLaborCostPerHour] = useState<number>(1500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    article: '',
    unit: 'шт',
    price: '',
    type: 'product'
  });

  // Загрузка материалов из Supabase
  const loadMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('materials')
        .select('id, name, price_per_m2, cost_per_g, consumption_g_per_m2, notes');

      if (fetchError) {
        throw fetchError;
      }

      setMaterials(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки материалов';
      setError(errorMessage);
      console.error('Error loading materials:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка продуктов из Supabase
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('id, name, article, unit, price, type');

      if (fetchError) {
        throw fetchError;
      }

      setProducts(data || []);
      
      if (onProductsChange && data) {
        onProductsChange(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки продуктов';
      setError(errorMessage);
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [onProductsChange]);

  // Загрузка стоимости труда
  const loadLaborCost = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('settings')
        .select('labor_cost')
        .single();

      if (fetchError) {
        // Если настройки не найдены, используем значение по умолчанию
        console.log('Settings not found, using default labor cost');
        return;
      }

      if (data?.labor_cost) {
        setLaborCostPerHour(data.labor_cost);
      }
    } catch (err) {
      console.error('Error loading labor cost:', err);
    }
  }, []);

  // Сохранение продукта
  const saveProduct = useCallback(async () => {
    try {
      setError(null);

      if (!formData.name || !formData.article || !formData.price) {
        setError('Заполните обязательные поля');
        return;
      }

      const productData = {
        name: formData.name,
        article: formData.article,
        unit: formData.unit,
        price: parseFloat(formData.price) || 0,
        type: formData.type
      };

      if (editingProductId) {
        // Обновление существующего продукта
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProductId);

        if (updateError) throw updateError;
      } else {
        // Создание нового продукта
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);

        if (insertError) throw insertError;
      }

      // Обновляем список продуктов
      await loadProducts();

      // Сброс формы
      setFormData({
        name: '',
        article: '',
        unit: 'шт',
        price: '',
        type: 'product'
      });
      setEditingProductId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сохранения продукта';
      setError(errorMessage);
      console.error('Error saving product:', err);
    }
  }, [formData, editingProductId, loadProducts]);

  // Удаление продукта
  const deleteProduct = useCallback(async (id: string) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await loadProducts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления продукта';
      setError(errorMessage);
      console.error('Error deleting product:', err);
    }
  }, [loadProducts]);

  // Начало редактирования продукта
  const startEditProduct = useCallback((product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      article: product.article,
      unit: product.unit,
      price: product.price.toString(),
      type: product.type
    });
  }, []);

  // Отмена редактирования
  const cancelEdit = useCallback(() => {
    setEditingProductId(null);
    setFormData({
      name: '',
      article: '',
      unit: 'шт',
      price: '',
      type: 'product'
    });
  }, []);

  // Расчет себестоимости продукта
  const calculateProductCost = useCallback((product: Product, selectedMaterials: Material[]) => {
    const materialsCost = selectedMaterials.reduce((sum, material) => {
      return sum + (material.price_per_m2 || 0);
    }, 0);

    const laborHours = parseFloat(formData.laborHours || '0');
    const laborCost = laborHours * laborCostPerHour;

    const totalCost = materialsCost + laborCost;
    const margin = product.price - totalCost;
    const marginPercent = product.price > 0 ? (margin / product.price) * 100 : 0;

    return {
      materialsCost,
      laborCost,
      totalCost,
      margin,
      marginPercent
    };
  }, [formData.laborHours, laborCostPerHour]);

  // Загрузка данных при монтировании
  useEffect(() => {
    loadMaterials();
    loadProducts();
    loadLaborCost();
  }, [loadMaterials, loadProducts, loadLaborCost]);

  // Обработка изменений формы
  const handleFormChange = (field: keyof ProductFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Сохранение настроек стоимости труда
  const saveLaborCost = useCallback(async () => {
    try {
      setError(null);

      // Проверяем, существует ли запись настроек
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('id')
        .single();

      if (existingSettings) {
        // Обновляем существующую запись
        const { error: updateError } = await supabase
          .from('settings')
          .update({ labor_cost: laborCostPerHour })
          .eq('id', existingSettings.id);

        if (updateError) throw updateError;
      } else {
        // Создаем новую запись
        const { error: insertError } = await supabase
          .from('settings')
          .insert([{ labor_cost: laborCostPerHour }]);

        if (insertError) throw insertError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сохранения настроек';
      setError(errorMessage);
      console.error('Error saving labor cost:', err);
    }
  }, [laborCostPerHour]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Управление продуктами</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Продукты</TabsTrigger>
              <TabsTrigger value="materials">Материалы</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Форма добавления/редактирования */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                <Input
                  placeholder="Наименование"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                />
                <Input
                  placeholder="Артикул"
                  value={formData.article}
                  onChange={(e) => handleFormChange('article', e.target.value)}
                />
                <select
                  value={formData.unit}
                  onChange={(e) => handleFormChange('unit', e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="шт">шт</option>
                  <option value="м²">м²</option>
                  <option value="м">м</option>
                  <option value="комплект">комплект</option>
                </select>
                <Input
                  type="number"
                  placeholder="Цена"
                  value={formData.price}
                  onChange={(e) => handleFormChange('price', e.target.value)}
                />
                <div className="flex gap-2">
                  {editingProductId ? (
                    <>
                      <Button onClick={saveProduct} size="sm">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button onClick={cancelEdit} variant="outline" size="sm">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button onClick={saveProduct} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить
                    </Button>
                  )}
                </div>
              </div>

              {/* Таблица продуктов */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Артикул</th>
                      <th className="px-4 py-2 text-left">Наименование</th>
                      <th className="px-4 py-2 text-left">Единица</th>
                      <th className="px-4 py-2 text-right">Цена</th>
                      <th className="px-4 py-2 text-left">Тип</th>
                      <th className="px-4 py-2 text-center">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Загрузка...
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Продукты не найдены
                        </td>
                      </tr>
                    ) : (
                      products.map(product => (
                        <tr key={product.id} className="border-t">
                          <td className="px-4 py-2">{product.article}</td>
                          <td className="px-4 py-2">{product.name}</td>
                          <td className="px-4 py-2">{product.unit}</td>
                          <td className="px-4 py-2 text-right">
                            {product.price.toFixed(2)} ₽
                          </td>
                          <td className="px-4 py-2">{product.type}</td>
                          <td className="px-4 py-2">
                            <div className="flex justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditProduct(product)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteProduct(product.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="materials" className="space-y-4">
              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  Всего материалов в базе: {materials.length}
                </AlertDescription>
              </Alert>

              {/* Таблица материалов */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Наименование</th>
                      <th className="px-4 py-2 text-right">Цена за м²</th>
                      <th className="px-4 py-2 text-right">Цена за г</th>
                      <th className="px-4 py-2 text-right">Расход г/м²</th>
                      <th className="px-4 py-2 text-left">Примечания</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map(material => (
                      <tr key={material.id} className="border-t">
                        <td className="px-4 py-2">{material.name}</td>
                        <td className="px-4 py-2 text-right">
                          {material.price_per_m2?.toFixed(2) || '—'} ₽
                        </td>
                        <td className="px-4 py-2 text-right">
                          {material.cost_per_g?.toFixed(2) || '—'} ₽
                        </td>
                        <td className="px-4 py-2 text-right">
                          {material.consumption_g_per_m2?.toFixed(2) || '—'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {material.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="max-w-md">
                <Label htmlFor="labor-cost">Стоимость часа работы (₽)</Label>
                <div className="flex gap-2">
                  <Input
                    id="labor-cost"
                    type="number"
                    value={laborCostPerHour}
                    onChange={(e) => setLaborCostPerHour(parseFloat(e.target.value) || 0)}
                  />
                  <Button onClick={saveLaborCost}>
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                </div>
              </div>

              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertDescription>
                  Эта стоимость используется для расчета трудозатрат при калькуляции продуктов
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManager;