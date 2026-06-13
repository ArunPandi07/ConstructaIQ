import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three') || id.includes('postprocessing') || id.includes('three-bvh-csg')) {
              return 'vendor-three'
            }
            if (id.includes('mermaid')) return 'vendor-mermaid'
            if (id.includes('gantt-task-react')) return 'vendor-gantt'
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react'
            }
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['gantt-task-react'],
  },
})
