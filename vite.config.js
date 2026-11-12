import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { pageEntries } from './src/routes.js'

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
  }, {
    name: 'public-route-entry-pages',
    apply: 'build',
    async writeBundle({dir}) {
      const home = await readFile(resolve(dir, 'index.html'), 'utf8')
      // GitHub Pages serves a directory index for a direct route or browser refresh.
      const nested = home.replace(/(\b(?:href|src)=["'])\.\//g, '$1../')
      await Promise.all(pageEntries.map(async ([route, title]) => {
        const directory = resolve(dir, route.slice(1))
        await mkdir(directory, {recursive:true})
        await writeFile(resolve(directory, 'index.html'), nested.replace(/<title>[^<]*<\/title>/, '<title>' + title + ' | Prestige Destination Tours</title>'))
      }))
    },
  }],
})
