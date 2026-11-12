import { useEffect, useRef, useState } from 'react'
import { media } from './data'
import widths from './carousel-widths.json'

const imageSizes = {
  'hero-carousel': '(max-width: 900px) 1100px, 100vw',
  'card-carousel': '(max-width: 680px) 90vw, (max-width: 900px) 45vw, 420px',
  'tree-carousel': '(max-width: 680px) 85vw, 410px',
  'experience-carousel': '(max-width: 680px) 85vw, 650px',
}

function imageSource(src) {
  const full = media(src)
  const [small, original] = widths[src] ?? []
  if (!original) return {src:full}
  return {src:full, srcSet:media(src.replace('.webp','-small.webp')) + ' ' + small + 'w, ' + full + ' ' + original + 'w'}
}

export default function ImageCarousel({ images, label, variant, priority = false }) {
  const carousel = useRef(null)
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(!document.hidden)
  const count = images.length
  const image = images[active]
  const next = (active + 1) % count
  const nextSrc = images[next].src
  const sizes = imageSizes[variant]

  useEffect(() => {
    if (count < 2) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {threshold:0.1})
    observer.observe(carousel.current)
    const updateVisibility = () => setDocumentVisible(!document.hidden)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [count])

  useEffect(() => {
    if (count < 2 || !visible || !documentVisible) return
    let cancelled = false
    const preload = new Image()
    const { src, srcSet } = imageSource(nextSrc)
    preload.fetchPriority = 'low'
    preload.sizes = sizes
    if (srcSet) preload.srcset = srcSet
    preload.src = src
    const ready = preload.decode().catch(() => {})
    const timer = window.setTimeout(async () => {
      await ready
      if (!cancelled && preload.naturalWidth) setActive(next)
    }, priority ? 5500 : 7000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [count, visible, documentVisible, next, nextSrc, sizes, priority])

  return <div ref={carousel} className={'image-carousel ' + variant}
    role={count > 1 ? 'group' : undefined} aria-label={count > 1 ? label : undefined}>
    <img key={image.src} {...imageSource(image.src)} sizes={sizes} alt={image.alt ?? ''}
      loading={priority ? 'eager' : 'lazy'} fetchPriority={priority && active === 0 ? 'high' : undefined} decoding="async"/>
  </div>
}
