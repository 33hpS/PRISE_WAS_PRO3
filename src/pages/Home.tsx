import React from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Package, FileText, Users, TrendingUp } from 'lucide-react'

const Home = () => {
  const stats = [
    {
      title: 'Товары',
      value: '248',
      description: 'Активных позиций',
      icon: Package,
      trend: '+12%'
    },
    {
      title: 'Прайс-листы',
      value: '12',
      description: 'Сгенерировано за месяц',
      icon: FileText,
      trend: '+8%'
    },
    {
      title: 'Клиенты',
      value: '64',
      description: 'Активных партнеров',
      icon: Users,
      trend: '+23%'
    },
    {
      title: 'Продажи',
      value: '₽2.4М',
      description: 'За текущий месяц',
      icon: TrendingUp,
      trend: '+18%'
    }
  ]

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Панель управления</h2>
        <div className="flex items-center space-x-2">
          <Button>Создать прайс-лист</Button>
        </div>
      </div>
      
      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <p className="text-xs text-green-500 mt-1">{stat.trend} с прошлого месяца</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Последние действия */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Последние товары</CardTitle>
            <CardDescription>
              Недавно добавленные или обновленные товары
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Стол обеденный "Классик"', collection: 'Premium', price: '45,000 ₽' },
                { name: 'Шкаф-купе "Модерн"', collection: 'Comfort', price: '82,000 ₽' },
                { name: 'Кровать двуспальная "Люкс"', collection: 'Premium', price: '95,000 ₽' },
                { name: 'Комод "Минимал"', collection: 'Basic', price: '28,000 ₽' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Коллекция: {item.collection}</p>
                  </div>
                  <div className="font-bold">{item.price}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Активность</CardTitle>
            <CardDescription>
              История последних действий в системе
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Создан прайс-лист', user: 'Админ', time: '2 мин назад' },
                { action: 'Обновлен товар', user: 'Менеджер', time: '15 мин назад' },
                { action: 'Добавлен материал', user: 'Админ', time: '1 час назад' },
                { action: 'Экспорт в PDF', user: 'Менеджер', time: '2 часа назад' }
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-muted-foreground">{activity.user}</p>
                  </div>
                  <p className="text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Home
