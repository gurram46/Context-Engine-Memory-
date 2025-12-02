import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        'content/chatgpt': resolve(__dirname, 'src/content/chatgpt.ts'),
        'content/claude': resolve(__dirname, 'src/content/claude.ts'),
        'content/gemini': resolve(__dirname, 'src/content/gemini.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: { polyfill: false }, // Explicitly disable polyfill
    target: 'esnext', // Ensure modern JS output
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  }
})
