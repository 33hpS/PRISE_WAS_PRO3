# Окончательное исправление импортов Dashboard.tsx

Write-Host "Исправляем импорты Dashboard.tsx..." -ForegroundColor Green

$dashboardPath = "src\pages\Dashboard.tsx"

# Исправляем только строку импорта
$content = Get-Content $dashboardPath -Raw -Encoding UTF8

# Заменяем неправильные импорты на правильные
$correctedContent = $content -replace "import { getCurrentUserWithRole, signOut } from '@/lib/supabase'", "import { getCurrentUserWithRole } from '@/lib/auth'`nimport { signOut } from '@/lib/supabase'"

Set-Content $dashboardPath $correctedContent -Encoding UTF8

Write-Host "✅ Импорты исправлены!" -ForegroundColor Green

# Пересобираем
Write-Host "Пересобираем проект..." -ForegroundColor Cyan

try {
    npm run build
    Write-Host "`nПроект успешно собран!" -ForegroundColor Green
} catch {
    Write-Host "Ошибка сборки: $_" -ForegroundColor Red
}