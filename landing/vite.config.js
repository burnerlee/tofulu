import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vite automatically handles SPA routing in dev mode
  // This ensures that refreshing on /login, /signup, /dashboard works correctly
  // If you experience 404s on refresh, try:
  // 1. Restart the dev server (stop and run `npm run dev` again)
  // 2. Clear browser cache
  // 3. Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux)
  // For production, ensure your server (e.g., Caddy, Nginx) is configured
  // to serve index.html for all routes (see AWS_DEPLOYMENT.md)
  build: {
    // Ensure proper build output
    outDir: 'dist',
  },
})


