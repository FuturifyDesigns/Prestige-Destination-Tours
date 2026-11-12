import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'"

export default defineConfig({
  base: './',
  esbuild: { jsx: 'automatic' },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin/index.html'),
      },
    },
  },
  plugins: [{
    name: 'production-content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [{tag:'meta',attrs:{'http-equiv':'Content-Security-Policy',content:policy},injectTo:'head-prepend'}],
  }],
})
