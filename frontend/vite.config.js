import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev` (port 5173) sends /api to the portal running in Docker, so the
// session cookie and the API behave exactly as in the real site.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3035',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Hashed files under /assets/: nginx caches them forever.
    assetsDir: 'assets',
  },
});
