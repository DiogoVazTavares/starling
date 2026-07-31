import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const SERVER_PORT = process.env.SERVER_PORT ?? '8787';

export default defineConfig({
  plugins: [react()],
  server: {
    // Same-origin `/api` calls in the browser, so there's no CORS to configure (ticket 004).
    proxy: {
      '/api': `http://localhost:${SERVER_PORT}`,
    },
  },
});
