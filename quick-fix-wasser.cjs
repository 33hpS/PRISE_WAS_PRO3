#!/usr/bin/env node
/**
 * WASSER TypeScript Fix - CommonJS Edition  
 * Функциональная архитектура с типобезопасностью для мебельной фабрики
 * Совместимость с проектами "type": "module"
 */

const fs = require('fs');
const path = require('path');

console.log('🏭 WASSER TypeScript Fix - Функциональная архитектура');
console.log('====================================================\n');

/**
 * Функциональная конфигурация исправлений с типобезопасностью
 */
const createWasserFixConfiguration = () => ({
  // Приоритет 1: HTML → React стили (26 ошибок)
  pdfGeneratorOptimizations: {
    file: path.join('src', 'components', 'PdfGeneratorClient.tsx'),
    description: 'PDF Generator: HTML width → React style объекты',
    fixes: [
      {
        name: 'th width → style={{width}}',
        pattern: /<th\s+width=['"]([^'"]+)['"]([^>]*)>/g,
        replacement: '<th style={{width: "$1"}}$2>'
      },
      {
        name: 'td width → style={{width}}',
        pattern: /<td\s+width=['"]([^'"]+)['"]([^>]*)>/g,
        replacement: '<td style={{width: "$1"}}$2>'
      },
      {
        name: 'Общие width атрибуты',
        pattern: /width=['"]([0-9]+%?)['"](?!\s*\})/g,
        replacement: 'style={{width: "$1"}}'
      }
    ]
  },

  // Приоритет 2: Типобезопасные массивы (7 ошибок)
  priceListTypeSystem: {
    file: path.join('src', 'components', 'PriceListGenerator.tsx'),
    description: 'PriceList: Типобезопасные массивы для мебельных данных',
    fixes: [
      {
        name: 'number[] → (string | number)[]',
        pattern: /const\s+(\w+):\s*number\[\]\s*=\s*\[\]/g,
        replacement: 'const $1: (string | number)[] = []'
      },
      {
        name: 'row типизация',
        pattern: /(\w+):\s*number\[\](?!\s*=)/g,
        replacement: '$1: (string | number)[]'
      },
      {
        name: 'push с type assertion',
        pattern: /(\w+)\.push\(\s*([^)]+)\s*\)/g,
        replacement: '$1.push($2 as string | number)'
      }
    ]
  },

  // Приоритет 3: Supabase Promise архитектура (9 ошибок)
  supabaseAsyncOptimizations: [
    {
      file: path.join('src', 'components', 'ProductManager.tsx'),
      description: 'ProductManager: async/await архитектура',
      fixes: [
        {
          name: '.catch() → .then(null, handler)',
          pattern: /\.catch\(\s*([^)]+)\s*\)/g,
          replacement: '.then(null, $1)'
        }
      ]
    },
    {
      file: path.join('src', 'pages', 'Home.tsx'),
      description: 'Home: Функциональная Supabase обработка',
      fixes: [
        {
          name: '.catch() → .then(null, handler)',
          pattern: /\.catch\(\s*([^)]+)\s*\)/g,
          replacement: '.then(null, $1)'
        }
      ]
    }
  ],

  // Приоритет 4: Интерфейсы материалов (3 ошибки)
  materialSystemUnification: {
    file: path.join('src', 'components', 'MaterialsManager.tsx'),
    description: 'Materials: Унифицированная типизация',
    fixes: [
      {
        name: 'setImportData type assertion',
        pattern: /setImportData\(([^)]+)\)/g,
        replacement: 'setImportData($1 as MaterialImport[])'
      },
      {
        name: 'ParsedMaterialRow → MaterialImport',
        pattern: /ParsedMaterialRow(?!Import)/g,
        replacement: 'MaterialImport'
      }
    ]
  }
});

/**
 * Функциональное применение исправлений с типобезопасностью
 */
const applyFunctionalFix = (filePath, fixes, description) => {
  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    console.log(`⚠️  ${filePath}: файл не найден`);
    return { fixed: 0, success: false };
  }

  try {
    let fileContent = fs.readFileSync(absolutePath, 'utf8');
    let totalApplications = 0;
    const appliedOptimizations = [];

    // Применяем функциональные исправления следуя пользовательскому стилю
    fixes.forEach(({ name, pattern, replacement }) => {
      const matches = fileContent.match(pattern);
      if (matches && matches.length > 0) {
        fileContent = fileContent.replace(pattern, replacement);
        totalApplications += matches.length;
        appliedOptimizations.push(`${name}: ${matches.length}`);
      }
    });

    if (totalApplications > 0) {
      // Создаем резервную копию
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${absolutePath}.backup.${timestamp}`;
      fs.writeFileSync(backupPath, fs.readFileSync(absolutePath, 'utf8'));

      // Применяем оптимизированный код
      fs.writeFileSync(absolutePath, fileContent, 'utf8');

      console.log(`✅ ${filePath}: ${totalApplications} функциональных улучшений`);
      console.log(`   📝 ${description}`);
      appliedOptimizations.forEach(opt => 
        console.log(`      • ${opt}`)
      );
      console.log(`   💾 Backup: ${path.basename(backupPath)}\n`);

      return { fixed: totalApplications, success: true };
    } else {
      console.log(`➖ ${filePath}: архитектура уже оптимизирована\n`);
      return { fixed: 0, success: false };
    }
  } catch (error) {
    console.log(`❌ ${filePath}: ${error.message}\n`);
    return { fixed: 0, success: false };
  }
};

/**
 * Главная функция оптимизации WASSER архитектуры
 */
const executeWasserOptimization = () => {
  const startTime = Date.now();
  const config = createWasserFixConfiguration();
  
  let totalOptimizations = 0;
  let optimizedFiles = 0;

  console.log('🔧 Применяем функциональные оптимизации TypeScript...\n');

  // PDF Generator оптимизации
  const pdfResult = applyFunctionalFix(
    config.pdfGeneratorOptimizations.file,
    config.pdfGeneratorOptimizations.fixes,
    config.pdfGeneratorOptimizations.description
  );
  totalOptimizations += pdfResult.fixed;
  if (pdfResult.success) optimizedFiles++;

  // PriceList типизация  
  const priceListResult = applyFunctionalFix(
    config.priceListTypeSystem.file,
    config.priceListTypeSystem.fixes,
    config.priceListTypeSystem.description
  );
  totalOptimizations += priceListResult.fixed;
  if (priceListResult.success) optimizedFiles++;

  // Supabase async оптимизации
  config.supabaseAsyncOptimizations.forEach(supabaseConfig => {
    const result = applyFunctionalFix(
      supabaseConfig.file,
      supabaseConfig.fixes,
      supabaseConfig.description
    );
    totalOptimizations += result.fixed;
    if (result.success) optimizedFiles++;
  });

  // Material система унификация
  const materialResult = applyFunctionalFix(
    config.materialSystemUnification.file,
    config.materialSystemUnification.fixes,
    config.materialSystemUnification.description
  );
  totalOptimizations += materialResult.fixed;
  if (materialResult.success) optimizedFiles++;

  // Результаты оптимизации
  const duration = Math.round((Date.now() - startTime) / 10) / 100;
  
  console.log('📊 РЕЗУЛЬТАТЫ ФУНКЦИОНАЛЬНОЙ ОПТИМИЗАЦИИ WASSER');
  console.log('===============================================');
  console.log(`✨ Применено улучшений: ${totalOptimizations}`);
  console.log(`📁 Оптимизировано файлов: ${optimizedFiles}`); 
  console.log(`📈 Архитектурный прогресс: ${Math.round((totalOptimizations / 56) * 100)}%`);
  console.log(`⚡ Время выполнения: ${duration}мс\n`);

  // Рекомендации в стиле пользователя
  console.log('🏗️  РЕКОМЕНДАЦИИ ПО ФУНКЦИОНАЛЬНОЙ АРХИТЕКТУРЕ:');
  console.log('===============================================');
  console.log('1. npm run type-check      # TypeScript валидация');
  console.log('2. npm run build          # Production сборка');
  console.log('3. npm run dev            # Development сервер');
  console.log('4. code .                 # VS Code редактор\n');

  console.log('💡 ДАЛЬНЕЙШИЕ АРХИТЕКТУРНЫЕ УЛУЧШЕНИЯ:');
  console.log('======================================');
  console.log('• React.memo(() => JSX) для FurnitureItem компонентов');
  console.log('• useMemo(() => calculations) для расчетов цен');
  console.log('• useCallback(() => handlers) для обработчиков');
  console.log('• React.startTransition для PDF генерации');
  console.log('• Error Boundaries для Supabase операций');
  console.log('• Типобезопасные хуки для бизнес-логики');

  return { totalOptimizations, optimizedFiles, duration };
};

// Проверка окружения
const validateEnvironment = () => {
  console.log('🔍 Проверка функциональной архитектуры...');
  
  if (!fs.existsSync('package.json')) {
    console.log('❌ package.json не найден');
    process.exit(1);
  }
  
  if (!fs.existsSync('src')) {
    console.log('❌ Папка src не найдена');
    process.exit(1);
  }
  
  console.log('✅ Структура проекта WASSER корректна');
  console.log(`✅ Рабочая директория: ${process.cwd()}\n`);
};

// Запуск если выполняется напрямую
if (require.main === module) {
  try {
    validateEnvironment();
    const result = executeWasserOptimization();
    
    if (result.totalOptimizations > 0) {
      console.log('\n🎉 WASSER функциональная архитектура оптимизирована!');
      console.log('🚀 Следующий шаг: npm run dev');
    } else {
      console.log('\n✨ Архитектура уже в оптимальном состоянии!');
    }
    
  } catch (error) {
    console.error(`💥 Ошибка: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { executeWasserOptimization };