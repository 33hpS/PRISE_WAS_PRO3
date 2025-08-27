# PowerShell скрипт для настройки VS Code для проекта WASSER
# Запустите от имени администратора

Write-Host "🚀 Настройка VS Code для проекта WASSER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Переход в директорию проекта
$projectPath = "D:\PRISE_WAS_PRO3"
Set-Location $projectPath
Write-Host "📁 Работаем в директории: $projectPath" -ForegroundColor Green

# 1. УСТАНОВКА РАСШИРЕНИЙ VS CODE
Write-Host "`n📦 Устанавливаем расширения VS Code..." -ForegroundColor Yellow

$extensions = @(
    "dbaeumer.vscode-eslint",              # ESLint
    "esbenp.prettier-vscode",               # Prettier
    "formulahendry.auto-rename-tag",        # Auto Rename Tag
    "formulahendry.auto-close-tag",         # Auto Close Tag
    "bradlc.vscode-tailwindcss",           # Tailwind CSS IntelliSense
    "dsznajder.es7-react-js-snippets",     # React snippets
    "pmneo.tsimporter",                     # TypeScript Auto Import
    "yoavbls.pretty-ts-errors",            # Pretty TypeScript Errors
    "usernamehw.errorlens",                # Error Lens
    "eamodio.gitlens",                     # GitLens
    "mhutchie.git-graph",                   # Git Graph
    "donjayamanne.githistory",              # Git History
    "github.copilot",                       # GitHub Copilot
    "wayou.vscode-todo-highlight",          # TODO Highlight
    "gruntfuggly.todo-tree",                # Todo Tree
    "christian-kohler.path-intellisense",   # Path Intellisense
    "mikestead.dotenv",                     # DotENV
    "ms-vscode.vscode-typescript-next",     # TypeScript Nightly
    "styled-components.vscode-styled-components", # Styled Components
    "prisma.prisma",                        # Prisma для Supabase
    "streetsidesoftware.code-spell-checker", # Spell Checker
    "streetsidesoftware.code-spell-checker-russian" # Russian Spell Checker
)

foreach ($ext in $extensions) {
    Write-Host "  ➜ Устанавливаем $ext" -ForegroundColor Gray
    code --install-extension $ext --force 2>$null
}

# 2. СОЗДАНИЕ НАСТРОЕК VS CODE
Write-Host "`n⚙️ Создаем настройки VS Code..." -ForegroundColor Yellow

$vscodeDir = ".vscode"
if (!(Test-Path $vscodeDir)) {
    New-Item -ItemType Directory -Path $vscodeDir
}

# settings.json
$settingsJson = @'
{
  // Основные настройки редактора
  "editor.fontSize": 14,
  "editor.fontFamily": "'Cascadia Code', 'Fira Code', Consolas, monospace",
  "editor.fontLigatures": true,
  "editor.tabSize": 2,
  "editor.wordWrap": "on",
  "editor.minimap.enabled": true,
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",
  "editor.suggestSelection": "first",
  "editor.snippetSuggestions": "top",
  "editor.inlineSuggest.enabled": true,
  
  // TypeScript настройки
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  
  // Prettier настройки
  "prettier.semi": false,
  "prettier.singleQuote": true,
  "prettier.trailingComma": "all",
  "prettier.printWidth": 100,
  
  // ESLint
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  
  // Tailwind CSS
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  
  // Git настройки
  "git.enableSmartCommit": true,
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.postCommitCommand": "push",
  "git.defaultCloneDirectory": "D:\\",
  "gitlens.hovers.currentLine.over": "line",
  "gitlens.codeLens.enabled": true,
  
  // Автосохранение
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  
  // Исключения из поиска
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.git": true,
    "**/coverage": true
  },
  
  // Файловые ассоциации
  "files.associations": {
    "*.css": "tailwindcss",
    ".env*": "dotenv"
  },
  
  // Terminal
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.fontSize": 13,
  
  // TODO настройки
  "todo-tree.general.tags": [
    "TODO",
    "FIXME",
    "BUG",
    "HACK",
    "NOTE",
    "TODO:",
    "ВАЖНО:",
    "ИСПРАВИТЬ:"
  ],
  "todo-tree.regex.regex": "(//|#|<!--|;|/\\*|^|^\\s*(-|\\d+.))\\s*($TAGS)",
  
  // Spell checker для русского
  "cSpell.language": "en,ru",
  "cSpell.enableFiletypes": [
    "typescript",
    "typescriptreact",
    "javascript",
    "javascriptreact"
  ],
  
  // Emmet
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  
  // Path Intellisense
  "path-intellisense.mappings": {
    "@": "${workspaceFolder}/src",
    "~": "${workspaceFolder}"
  }
}
'@

$settingsJson | Out-File -FilePath "$vscodeDir\settings.json" -Encoding UTF8

# 3. СОЗДАНИЕ TASKS.JSON для автоматизации
Write-Host "`n📋 Создаем tasks.json..." -ForegroundColor Yellow

$tasksJson = @'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Dev Server",
      "type": "npm",
      "script": "dev",
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Build Production",
      "type": "npm",
      "script": "build",
      "problemMatcher": []
    },
    {
      "label": "Auto Commit & Push",
      "type": "shell",
      "command": "git add . && git commit -m 'Auto update: ${input:commitMessage}' && git push",
      "problemMatcher": []
    },
    {
      "label": "Generate PDF Test",
      "type": "npm",
      "script": "test:pdf",
      "problemMatcher": []
    },
    {
      "label": "Supabase Generate Types",
      "type": "shell",
      "command": "npx supabase gen types typescript --project-id ${input:supabaseProjectId} > src/types/supabase.ts",
      "problemMatcher": []
    }
  ],
  "inputs": [
    {
      "id": "commitMessage",
      "type": "promptString",
      "description": "Commit message",
      "default": "обновление компонентов"
    },
    {
      "id": "supabaseProjectId",
      "type": "promptString",
      "description": "Supabase Project ID"
    }
  ]
}
'@

$tasksJson | Out-File -FilePath "$vscodeDir\tasks.json" -Encoding UTF8

# 4. СОЗДАНИЕ LAUNCH.JSON для отладки
Write-Host "`n🐛 Создаем launch.json для отладки..." -ForegroundColor Yellow

$launchJson = @'
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}",
      "sourceMaps": true,
      "sourceMapPathOverrides": {
        "webpack:///./src/*": "${webRoot}/src/*"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug PDF Server",
      "program": "${workspaceFolder}/src/server/pdf-server.ts",
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
'@

$launchJson | Out-File -FilePath "$vscodeDir\launch.json" -Encoding UTF8

# 5. СОЗДАНИЕ EXTENSIONS.JSON
Write-Host "`n📌 Создаем extensions.json..." -ForegroundColor Yellow

$extensionsJson = @'
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "eamodio.gitlens",
    "usernamehw.errorlens"
  ]
}
'@

$extensionsJson | Out-File -FilePath "$vscodeDir\extensions.json" -Encoding UTF8

# 6. НАСТРОЙКА GIT HOOKS для автокоммита
Write-Host "`n🔧 Настраиваем Git hooks..." -ForegroundColor Yellow

# Создаем pre-commit hook
$preCommitHook = @'
#!/bin/sh
# Автоматически добавляем все изменения перед коммитом
git add .

# Проверяем код через ESLint
npm run lint:fix 2>/dev/null || true

# Форматируем код через Prettier
npm run format 2>/dev/null || true

exit 0
'@

$gitHooksDir = ".git\hooks"
if (Test-Path $gitHooksDir) {
    $preCommitHook | Out-File -FilePath "$gitHooksDir\pre-commit" -Encoding UTF8 -NoNewline
}

# 7. СОЗДАНИЕ СКРИПТА АВТОКОММИТА
Write-Host "`n🤖 Создаем PowerShell скрипт для автокоммита..." -ForegroundColor Yellow

$autoCommitScript = @'
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
'@

$autoCommitScript | Out-File -FilePath "auto-commit.ps1" -Encoding UTF8

# 8. СОЗДАНИЕ PRETTIER CONFIG
Write-Host "`n💅 Создаем Prettier конфигурацию..." -ForegroundColor Yellow

$prettierConfig = @'
{
  "semi": false,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
'@

$prettierConfig | Out-File -FilePath ".prettierrc" -Encoding UTF8

# 9. СОЗДАНИЕ ESLINT CONFIG
Write-Host "`n📏 Создаем ESLint конфигурацию..." -ForegroundColor Yellow

$eslintConfig = @'
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
'@

$eslintConfig | Out-File -FilePath ".eslintrc.json" -Encoding UTF8

# 10. НАСТРОЙКА GIT АЛИАСОВ
Write-Host "`n🎯 Настраиваем Git алиасы..." -ForegroundColor Yellow

git config --global alias.s "status -s"
git config --global alias.co "checkout"
git config --global alias.br "branch"
git config --global alias.cm "commit -m"
git config --global alias.ac "!git add . && git commit -m"
git config --global alias.acp "!git add . && git commit -m '$1' && git push"
git config --global alias.undo "reset HEAD~1"
git config --global alias.last "log -1 HEAD"
git config --global alias.visual "!gitk"

# 11. УСТАНОВКА NPM СКРИПТОВ
Write-Host "`n📦 Обновляем package.json скрипты..." -ForegroundColor Yellow

$packageJsonPath = "package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    
    # Добавляем полезные скрипты
    $packageJson.scripts | Add-Member -NotePropertyName "commit" -NotePropertyValue "git add . && git-cz" -Force
    $packageJson.scripts | Add-Member -NotePropertyName "push" -NotePropertyValue "git push" -Force
    $packageJson.scripts | Add-Member -NotePropertyName "pull" -NotePropertyValue "git pull" -Force
    $packageJson.scripts | Add-Memberetermine "lint:fix" -NotePropertyValue "eslint . --fix" -Force
    $packageJson.scripts | Add-Member -NotePropertyName "format" -NotePropertyValue "prettier --write ." -Force
    $packageJson.scripts | Add-Member -NotePropertyName "type-check" -NotePropertyValue "tsc --noEmit" -Force
    $packageJson.scripts | Add-Member -NotePropertyName "clean" -NotePropertyValue "rimraf dist node_modules" -Force
    
    $packageJson | ConvertTo-Json -Depth 10 | Out-File $packageJsonPath -Encoding UTF8
}

# 12. СОЗДАНИЕ ГЛОБАЛЬНОГО GIT IGNORE
Write-Host "`n🚫 Обновляем .gitignore..." -ForegroundColor Yellow

$gitignoreAdditions = @"

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# Temp
*.tmp
*.temp
*.cache

# Build
dist/
build/
out/

# Environment
.env.local
.env.development
.env.production

# Database
*.db
*.sqlite
"@

if (Test-Path ".gitignore") {
    Add-Content -Path ".gitignore" -Value $gitignoreAdditions
} else {
    $gitignoreAdditions | Out-File -FilePath ".gitignore" -Encoding UTF8
}

# 13. ФИНАЛЬНАЯ СИНХРОНИЗАЦИЯ
Write-Host "`n🔄 Синхронизация с репозиторием..." -ForegroundColor Yellow

# Проверяем статус
git fetch origin 2>$null
$status = git status --porcelain

if ($status) {
    Write-Host "📝 Обнаружены локальные изменения" -ForegroundColor Cyan
    $commitNow = Read-Host "Хотите закоммитить изменения сейчас? (y/n)"
    
    if ($commitNow -eq 'y') {
        git add .
        git commit -m "feat: настройка VS Code и автоматизация рабочего процесса"
        Write-Host "✅ Изменения закоммичены" -ForegroundColor Green
        
        $pushNow = Read-Host "Отправить изменения на сервер? (y/n)"
        if ($pushNow -eq 'y') {
            git push
            Write-Host "✅ Изменения отправлены" -ForegroundColor Green
        }
    }
}

# 14. СОЗДАНИЕ ЯРЛЫКА ДЛЯ БЫСТРОГО ЗАПУСКА
Write-Host "`n🚀 Создаем ярлык для быстрого запуска..." -ForegroundColor Yellow

$shortcutPath = "$env:USERPROFILE\Desktop\WASSER Project.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "code"
$shortcut.Arguments = $projectPath
$shortcut.WorkingDirectory = $projectPath
$shortcut.IconLocation = "code.exe,0"
$shortcut.Description = "Open WASSER Project in VS Code"
$shortcut.Save()

Write-Host "`n✅ НАСТРОЙКА ЗАВЕРШЕНА!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "📌 Полезные команды:" -ForegroundColor Cyan
Write-Host "  • npm run dev - запуск dev сервера" -ForegroundColor White
Write-Host "  • npm run build - сборка проекта" -ForegroundColor White
Write-Host "  • ./auto-commit.ps1 - меню автокоммита" -ForegroundColor White
Write-Host "  • git ac 'message' - быстрый коммит" -ForegroundColor White
Write-Host "  • git acp 'message' - коммит + push" -ForegroundColor White
Write-Host "  • git undo - отмена последнего коммита" -ForegroundColor White
Write-Host "  • Ctrl+Shift+P -> Run Task - запуск задач VS Code" -ForegroundColor Yellow
Write-Host "`n🎯 Ярлык создан на рабочем столе!" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Green

# Открываем VS Code
$openVscode = Read-Host "`nОткрыть проект в VS Code? (y/n)"
if ($openVscode -eq 'y') {
    code .
}

Write-Host "`n👍 Удачной работы с проектом WASSER!" -ForegroundColor Cyan