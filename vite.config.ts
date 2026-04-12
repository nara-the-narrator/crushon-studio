import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { devUploadProxyPlugin } from './vite-plugins/devUploadProxy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [devUploadProxyPlugin(), react()],
  server: {
    proxy: {
      '/api/vgd': {
        target: 'https://v.gd',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/vgd/, '/create.php'),
      },
    },
  },
  preview: {
    proxy: {
      '/api/vgd': {
        target: 'https://v.gd',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/vgd/, '/create.php'),
      },
    },
  },
})
