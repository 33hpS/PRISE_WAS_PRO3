import { build as esbuild } from 'esbuild'
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, unlinkSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Build script for the application
 * - JS -> dist/main.js (IIFE)
 * - CSS -> dist/main.css (Tailwind + shadcn.css)
 * - HTML -> dist/index.html (без inline-стилей)
 * - Copies Cloudflare Pages files: _headers, public/_redirects
 */

const isProduction = process.argv.includes('--production')

/** Ensure directory exists */
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
    console.log(`Building CSS with Tailwind...`)

    const inputCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;`

    writeFileSync('temp-input.css', inputCSS)

    const command = isProduction
      ? 'npx tailwindcss -i temp-input.css -o dist/main.css --minify'
      : 'npx tailwindcss -i temp-input.css -o dist/main.css'

    await execAsync(command)

    if (existsSync('src/shadcn.css')) {
      const shadcnCSS = readFileSync('src/shadcn.css', 'utf8')
      const builtCSS = readFileSync('dist/main.css', 'utf8')
      writeFileSync('dist/main.css', `${builtCSS}\n${shadcnCSS}`)
    }

    // Cleanup temp input
    if (existsSync('temp-input.css')) {
      try {
        unlinkSync('temp-input.css')
      } catch {
        /* ignore */
      }
    }

    console.log('CSS built successfully')
  } catch (error) {
    console.error('CSS build failed:', error)

    // Fallback CSS (минимальный набор)
    let fallbackCSS = `
/* Base styles */
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

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
.shadow { box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); }
`
    if (existsSync('src/shadcn.css')) {
      const shadcnCSS = readFileSync('src/shadcn.css', 'utf8')
      fallbackCSS += '\n' + shadcnCSS
    }
    ensureDir('dist')
    writeFileSync('dist/main.css', fallbackCSS)
    console.log('Fallback CSS created')
  }
}

/**
 * Build JavaScript using esbuild (classic JSX transform)
 */
async function buildJS() {
  try {
    console.log('Building JavaScript...')

    await esbuild({
      entryPoints: ['src/main.tsx'],
      bundle: true,
      outfile: 'dist/main.js',
      format: 'iife',
      target: 'es2020',
      minify: isProduction,
      sourcemap: !isProduction,

      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',

      define: {
        'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
        global: 'globalThis',
      },
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js',
      },
      external: [],
      platform: 'browser',

      inject: ['./react-shim.js'],
      keepNames: true,
      treeShaking: isProduction,
    })

    console.log('JavaScript built successfully')
  } catch (error) {
    console.error('JavaScript build failed:', error)
    throw error
  }
}

/** Create React shim file for automatic React import */
function createReactShim() {
  const shimContent = `import React from 'react';
export { React };
export default React;`
  writeFileSync('react-shim.js', shimContent)
}

/** Clean up temporary files */
function cleanupTempFiles() {
  const tempFiles = ['react-shim.js', 'temp-input.css']
  tempFiles.forEach((file) => {
    if (existsSync(file)) {
      try {
        unlinkSync(file)
      } catch {
        /* ignore */
      }
    }
  })
}

/** Generate HTML file (no inline style) */
function generateHTML() {
  console.log('Generating HTML...')

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Мебельная фабрика - Генератор прайс-листов</title>
  <link rel="stylesheet" href="./main.css">
</head>
<body>
  <div id="root">
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white z-50">
      <div class="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
      <div class="text-lg font-medium mb-1">Загрузка приложения...</div>
      <div class="text-sm opacity-90">Мебельная фабрика</div>
    </div>
  </div>
  <script src="./main.js" defer></script>
</body>
</html>`
  ensureDir('dist')
  writeFileSync('dist/index.html', html)
  console.log('HTML generated successfully')
}

/** Copy static files for Cloudflare Pages */
function copyStaticFiles() {
  console.log('Copying static files...')
  if (existsSync('_headers')) {
    copyFileSync('_headers', 'dist/_headers')
    console.log('Copied _headers')
  }
  if (existsSync('public/_redirects')) {
    copyFileSync('public/_redirects', 'dist/_redirects')
    console.log('Copied _redirects')
  }
}

/** Main build function */
async function buildApp() {
  try {
    console.log(`Starting ${isProduction ? 'production' : 'development'} build...`)

    ensureDir('dist')
    createReactShim()
    await buildCSS()
    await buildJS()
    generateHTML()
    copyStaticFiles()
    cleanupTempFiles()

    console.log('Build completed successfully')
  } catch (error) {
    console.error('Build failed:', error)
    cleanupTempFiles()
    process.exit(1)
  }
}

buildApp()
