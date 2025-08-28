import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [
        react({
            // Современная конфигурация без deprecated опций
            include: "**/*.{jsx,tsx}"
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/contexts': path.resolve(__dirname, './src/contexts'),
            '@/types': path.resolve(__dirname, './src/types'),
            '@/lib': path.resolve(__dirname, './src/lib')
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'terser',
        target: 'es2020',
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor': ['react', 'react-dom', 'react-router-dom'],
                    'ui': ['lucide-react']
                }
            }
        },
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    },
    esbuild: {
        target: 'es2020'
    }
});
