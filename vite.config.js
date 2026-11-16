import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { pageEntries } from './src/routes.js'
import { leadPhotos, heroImageSizes, galleryCoverSizes } from './src/photo-layout.js'
import photoVariants from './src/photo-variants.json' with { type: 'json' }

import { canonicalFor, searchPages, siteOrigin } from './src/search.js'

const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
const siteName = 'Prestige Destinations Tours'
const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': siteOrigin + '/#website', url:siteOrigin + '/', name:siteName, alternateName:'Prestige Tours' },
    { '@type': 'Organization', '@id': siteOrigin + '/#organization', url:siteOrigin + '/', name:siteName, logo:siteOrigin + '/favicon-96.png', telephone:'+26777968662', email:'info@prestigetours.co.bw', sameAs:['https://www.facebook.com/p/Prestige-Destinations-Tours-100068734279877/','https://www.tiktok.com/@prestige.destinat'] },
  ],
}

function describePage(html, route) {
  const [title, description, heading] = searchPages[route].map(escapeHtml)
  const url = canonicalFor(route)
  const links = pageEntries.map(([path, label]) =>
    '<a href="' + canonicalFor(path) + '">' + escapeHtml(label) + '</a>'
  ).join(' · ')
  const schema = route === '/' ? '<script type="application/ld+json">' + JSON.stringify(homeSchema) + '</script>' : ''
  const lead = leadPhotos[route]
  const prefix = route === '/' ? './' : '../'
  const candidates = photoVariants[lead]
  const preload = candidates?.length > 1
    ? '<link rel="preload" as="image" fetchpriority="high" imagesrcset="' +
      candidates.map(([width, file]) => prefix + file + ' ' + width + 'w').join(', ') +
      '" imagesizes="' + (route === '/gallery' ? galleryCoverSizes : heroImageSizes) + '">'
    : ''
  return html
    .replace('</head>', preload + '</head>')
    .replace(/<title>[^<]*<\/title>/, '<title>' + title + '</title>')
    .replace(/(<meta name="description" content=")[^"]*"/, '$1' + description + '"')
    .replace('</head>', '<link rel="canonical" href="' + url + '">' + schema + '</head>')
    .replace('<div id="root"></div>', '<div id="root"></div><noscript><main><h1>' + heading + '</h1><p>' + description + '</p><nav aria-label="Explore Prestige">' + links + '</nav></main></noscript>')
}

const policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'"

export default defineConfig({
  base: './',
  esbuild: { jsx: 'automatic' },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
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
      await Promise.all([writeFile(resolve(dir, 'index.html'), describePage(home, '/')), ...pageEntries.map(async ([route]) => {
        const directory = resolve(dir, route.slice(1))
        await mkdir(directory, {recursive:true})
        await writeFile(resolve(directory, 'index.html'), describePage(nested, route))
      })])
      const urls = Object.keys(searchPages).map(route => '<url><loc>' + canonicalFor(route) + '</loc></url>')
      await writeFile(resolve(dir, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('\n') + '</urlset>\n')
      await writeFile(resolve(dir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + siteOrigin + '/sitemap.xml\n')
    },
  }],
})
