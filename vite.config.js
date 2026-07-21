import { defineConfig } from 'vite'
import { execSync } from 'child_process';
import react from '@vitejs/plugin-react'

const commitHash =
  process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) ??
  (() => {
    try {
      return execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
      return 'dev';
    }
  })();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      }
    }
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
})
