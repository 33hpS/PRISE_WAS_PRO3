# Auto Commit Script for WASSER Project
param(
    [string]$message = "Auto update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

function Show-Menu {
    Clear-Host
    Write-Host "================== WASSER AUTO COMMIT ==================" -ForegroundColor Cyan
    Write-Host "1. Quick Commit (авто-сообщение)" -ForegroundColor Green
    Write-Host "2. Commit с описанием" -ForegroundColor Yellow
    Write-Host "3. Commit + Push" -ForegroundColor Magenta
    Write-Host "4. Pull последних изменений" -ForegroundColor Blue
    Write-Host "5. Показать статус" -ForegroundColor White
    Write-Host "6. Отменить последний коммит" -ForegroundColor Red
    Write-Host "Q. Выход" -ForegroundColor Gray
    Write-Host "=======================================================" -ForegroundColor Cyan
}

do {
    Show-Menu
    $choice = Read-Host "Выберите действие"
    
    switch ($choice) {
        '1' {
            git add .
            $files = git diff --cached --name-only
            if ($files) {
                $msg = "обновление: $($files -join ', ')"
                git commit -m $msg
                Write-Host "✅ Коммит создан: $msg" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Нет изменений для коммита" -ForegroundColor Yellow
            }
            Read-Host "Нажмите Enter для продолжения"
        }
        '2' {
            $customMsg = Read-Host "Введите сообщение коммита"
            git add .
            git commit -m $customMsg
            Write-Host "✅ Коммит создан: $customMsg" -ForegroundColor Green
            Read-Host "Нажмите Enter для продолжения"
        }
        '3' {
            $customMsg = Read-Host "Введите сообщение коммита"
            git add .
            git commit -m $customMsg
            git push
            Write-Host "✅ Изменения отправлены на сервер" -ForegroundColor Green
            Read-Host "Нажмите Enter для продолжения"
        }
        '4' {
            git pull
            Write-Host "✅ Получены последние изменения" -ForegroundColor Green
            Read-Host "Нажмите Enter для продолжения"
        }
        '5' {
            git status
            Read-Host "`nНажмите Enter для продолжения"
        }
        '6' {
            git reset HEAD~1
            Write-Host "✅ Последний коммит отменен" -ForegroundColor Yellow
            Read-Host "Нажмите Enter для продолжения"
        }
    }
} while ($choice -ne 'Q')
