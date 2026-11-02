import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// EduPre Plus runs on its own port (5174) so it never clashes with the original EduPre (5173).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  preview: { port: 5174, strictPort: false },
});
