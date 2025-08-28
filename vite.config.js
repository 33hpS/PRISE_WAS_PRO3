/**
 * @file vite.config.ts
 * @description Production-оптимизированная конфигурация для мебельной фабрики WASSER
 *
 * Особенности:
 * - Функциональная архитектура с оптимизацией сборки
 * - Cloudflare Pages совместимость
 * - Производительность и типобезопасность
 * - Специфика мебельного каталога
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [
        react({
            // Оптимизация React для мебельных компонентов
            fastRefresh: true,
            jsxImportSource: '@emotion/react',
            babel: {
                plugins: [
                    // Оптимизация для большого каталога мебели
                    ['babel-plugin-import', {
                            libraryName: 'lodash',
                            libraryDirectory: '',
                            camel2DashComponentName: false
                        }, 'lodash']
                ]
            }
        })
    ],
    // Path resolution для чистой архитектуры
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/contexts': path.resolve(__dirname, './src/contexts'),
            '@/types': path.resolve(__dirname, './src/types'),
            '@/lib': path.resolve(__dirname, './src/lib'),
            '@/furniture': path.resolve(__dirname, './src/types/furniture')
        }
    },
    // Development server
    server: {
        port: 5173,
        host: true,
        strictPort: false
    },
    // Production build optimization
    build: {
        outDir: 'dist',
        sourcemap: true,
        minify: 'terser',
        target: 'es2020',
        // Разбиение чанков для оптимальной загрузки каталога
        rollupOptions: {
            output: {
                manualChunks: {
                    // Основные vendor библиотеки
                    'react-vendor': ['react', 'react-dom'],
                    'ui-vendor': ['lucide-react'],
                    // Компоненты мебельной фабрики
                    'furniture-core': [
                        './src/types/furniture',
                        './src/contexts/AuthContext'
                    ],
                    // Большие компоненты каталога
                    'furniture-catalog': [
                        './src/components/PriceListGenerator',
                        './src/components/MaterialsManager',
                        './src/components/ProductManager'
                    ]
                },
                // Naming strategy for cache optimization
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        },
        // Terser оптимизация для production
        terserOptions: {
            compress: {
                drop_console: true, // Удаляем console.log в production
                drop_debugger: true,
                passes: 2
            },
            mangle: {
                safari10: true // Совместимость с Safari
            }
        },
        // Размеры чанков для Cloudflare Pages
        chunkSizeWarningLimit: 1000
    },
    // CSS optimization
    css: {
        postcss: {
            plugins: [
                // Autoprefixer для кроссбраузерности
                require('autoprefixer'),
                // CSSnano для минификации
                require('cssnano')({
                    preset: 'default'
                })
            ]
        }
    },
    // TypeScript performance
    esbuild: {
        target: 'es2020',
        logOverride: {
            'this-is-undefined-in-esm': 'silent'
        }
    },
    // Optimization deps для быстрой пересборки
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'lucide-react'
        ],
        exclude: [
        // Исключаем крупные библиотеки из предварительной сборки
        ]
    },
    // Preview configuration
    preview: {
        port: 4173,
        host: true
    }
});
