# 🔐 Настройка аутентификации WASSER

## 📋 Пошаговая инструкция:

### 1. 🗃️ Настройка базы данных

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в ваш проект
3. Откройте **SQL Editor**
4. Выполните скрипт из файла `supabase-fix-auth.sql`

### 2. 👥 Тестовые пользователи

После выполнения скрипта будут созданы:

**👨‍💼 Администратор:**

- Email: `admin@wasser.com`
- Пароль: `admin123`
- Права: Полный доступ

**👤 Менеджер:**

- Email: `manager@wasser.com`
- Пароль: `manager123`
- Права: Просмотр и создание прайс-листов

### 3. ⚙️ Настройки Supabase

Убедитесь что в настройках проекта:

1. **Authentication → Settings:**
   - ✅ Enable email confirmations: **OFF** (для тестирования)
   - ✅ Enable phone confirmations: **OFF**

2. **Authentication → URL Configuration:**
   - Site URL: ваш домен или `http://localhost:3000`

### 4. 🔧 Если ошибки продолжаются:

1. **Проверьте RLS политики:**

   ```sql
   -- В SQL Editor выполните:
   SELECT schemaname, tablename, policyname, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'user_roles';
   ```

2. **Проверьте существование таблицы:**

   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'user_roles';
   ```

3. **Проверьте пользователей:**
   ```sql
   SELECT u.email, ur.role FROM auth.users u
   LEFT JOIN public.user_roles ur ON u.id = ur.user_id
   LIMIT 10;
   ```

### 5. 🆘 Устранение проблем:

**Проблема:** `Invalid login credentials`
**Решение:** Убедитесь что пользователи созданы и email подтвержден

**Проблема:** `404 user_roles`
**Решение:** Выполните SQL скрипт для создания таблицы

**Проблема:** `Permission denied`
**Решение:** Проверьте RLS политики

## ✅ Проверка работы:

1. Перезагрузите приложение
2. Войдите как admin@wasser.com / admin123
3. Должны быть доступны все разделы
4. Войдите как manager@wasser.com / manager123
5. Должны быть доступны только просмотр и прайс-листы
