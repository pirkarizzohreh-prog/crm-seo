import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Docker Desktop on Windows doesn't reliably forward filesystem change
    // events from a bind-mounted volume into the container, so Vite's
    // watcher can miss new/changed files (a new component never triggers a
    // reload) until the container is fully restarted. Polling sidesteps
    // that at the cost of a bit of CPU.
    watch: {
      usePolling: true,
    },
  },
})
