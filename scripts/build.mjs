import { build as esbuild } from 'esbuild'
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Build script for the furniture factory application
 * - Outputs JS to dist/main.js
 * - Outputs CSS to dist/main.css (unified name expected by hosting)
 * - Generates dist/index.html with correct asset links
 * - Copies Cloudflare Pages redirects if present
 */
const isProduction = process.argv.includes('--production')

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

/**
 * Build CSS using Tailwind CLI
 * - Writes to dist/main.css
 * - Appends shadcn.css if present
 */
async function buildCSS() {
  try {
    console.log('🎨 Building CSS with Tailwind...')

    // Create a temporary input CSS file with Tailwind directives
    const inputCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;`

    writeFileSync('temp-input.css', inputCSS)

    // Build CSS using Tailwind CLI
    const command = isProduction
      ? 'npx tailwindcss -i temp-input.css -o dist/main.css --minify'
      : 'npx tailwindcss -i temp-input.css -o dist/main.css'

    await execAsync(command)

    // Append shadcn styles if they exist
    if (existsSync('src/shadcn.css')) {
      const shadcnCSS = readFileSync('src/shadcn.css', 'utf8')
      const builtCSS = readFileSync('dist/main.css', 'utf8')
      writeFileSync('dist/main.css', builtCSS + '\n' + shadcnCSS)
    }

    // Clean up temp file
    if (existsSync('temp-input.css')) {
      const fs = await import('fs')
      fs.unlinkSync('temp-input.css')
    }

    console.log('✅ CSS built successfully')
  } catch (error) {
    console.error('❌ CSS build failed:', error)

    // Fallback: create minimal CSS with shadcn
    let fallbackCSS = `
/* Base styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Utility classes */
.min-h-screen { min-height: 100vh; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.text-lg { font-size: 1.125rem; }
.p-4 { padding: 1rem; }
.bg-gray-100 { background-color: #f3f4f6; }
.text-gray-900 { color: #111827; }
.rounded { border-radius: 0.25rem; }
.shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
`

    if (existsSync('src/shadcn.css')) {
      const shadcnCSS = readFileSync('src/shadcn.css', 'utf8')
      fallbackCSS += '\n' + shadcnCSS
    }

    writeFileSync('dist/main.css', fallbackCSS)
    console.log('📋 Fallback CSS created')
  }
}

/**
 * Build JavaScript using esbuild
 * ИСПРАВЛЕНА конфигурация JSX для устранения React Hook Error #310
 */
async function buildJS() {
  try {
    console.log('🔧 Building JavaScript...')

    await esbuild({
      entryPoints: ['src/main.tsx'],
      bundle: true,
      outfile: 'dist/main.js',
      format: 'iife',
      target: 'es2020',
      minify: isProduction,
      sourcemap: !isProduction,
      
      // ИСПРАВЛЕНИЕ: Используем классический JSX transform вместо automatic
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      
      define: {
        'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
        'global': 'globalThis'
      },
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js'
      },
      external: [],
      platform: 'browser',
      
      // Добавляем inject для автоматического импорта React в каждый файл
      inject: ['./react-shim.js'],
      
      // Настройки для лучшей совместимости
      keepNames: true,
      treeShaking: isProduction
    })

    console.log('✅ JavaScript built successfully')
  } catch (error) {
    console.error('❌ JavaScript build failed:', error)
    throw error
  }
}

/**
 * Create React shim file for automatic React import
 */
function createReactShim() {
  const shimContent = `import React from 'react';
export { React };
export default React;`
  
  writeFileSync('react-shim.js', shimContent)
}

/**
 * Clean up temporary files
 */
function cleanupTempFiles() {
  const tempFiles = ['react-shim.js', 'temp-input.css']
  tempFiles.forEach(file => {
    if (existsSync(file)) {
      const fs = require('fs')
      try {
        fs.unlinkSync(file)
      } catch (e) {
        // ignore cleanup errors
      }
    }
  })
}

/**
 * Generate HTML file
 * - Links ./main.css and ./main.js
 */
function generateHTML() {
  console.log('📄 Generating HTML...')

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Мебельная фабрика - Генератор прайс-листов</title>
  <link rel="stylesheet" href="./main.css">
  <style>
    /* Critical CSS for initial load */
    .loading {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      color: white;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .loading-subtitle {
      font-size: 14px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="spinner"></div>
      <div class="loading-text">Загрузка приложения...</div>
      <div class="loading-subtitle">Мебельная фабрика</div>
    </div>
  </div>
  <script src="./main.js" defer></script>
</body>
</html>`

  writeFileSync('dist/index.html', html)
  console.log('✅ HTML generated successfully')
}

/**
 * Copy static files
 * - Copies public/_redirects to dist/_redirects for SPA fallback
 */
function copyStaticFiles() {
  console.log('📁 Copying static files...')

  // Copy _headers for Cloudflare Pages
  if (existsSync('_headers')) {
    copyFileSync('_headers', 'dist/_headers')
    console.log('📋 Copied _headers')
  }

  // Copy _redirects for Cloudflare Pages
  if (existsSync('public/_redirects')) {
    copyFileSync('public/_redirects', 'dist/_redirects')
    console.log('📋 Copied _redirects')
  }
}

/**
 * Main build function
 */
async function buildApp() {
  try {
    console.log(`🚀 Starting ${isProduction ? 'production' : 'development'} build...`)

    // Ensure dist directory exists
    ensureDir('dist')

    // Create React shim for esbuild injection
    createReactShim()

    // Build CSS first
    await buildCSS()

    // Build JavaScript
    await buildJS()

    // Generate HTML
    generateHTML()

    // Copy static files
    copyStaticFiles()

    // Clean up temporary files
    cleanupTempFiles()

    console.log('🎉 Build completed successfully!')

  } catch (error) {
    console.error('💥 Build failed:', error)
    // Clean up even on error
    cleanupTempFiles()
    process.exit(1)
  }
}

// Run build
buildApp()