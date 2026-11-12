import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
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
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [interacting, setInteracting] = useState(false)
  const [focused, setFocused] = useState(false)
  const count = images.length
  const image = images[active]
  const next = (active + 1) % count
  const nextSrc = images[next].src
  const sizes = imageSizes[variant]

  useEffect(() => {
    if (count < 2) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.intersectionRatio >= .25), {threshold:.25})
    observer.observe(carousel.current)
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = event => setPlaying(!event.matches)
    const updateVisibility = () => setDocumentVisible(!document.hidden)
    motion.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      observer.disconnect()
      motion.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [count])

  useEffect(() => {
    if (count < 2 || !visible || !documentVisible || !playing || interacting || focused) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      const preload = new Image()
      const { src, srcSet } = imageSource(nextSrc)
      preload.fetchPriority = 'low'
      preload.sizes = sizes
      if (srcSet) preload.srcset = srcSet
      preload.src = src
      await preload.decode().catch(() => {})
      if (!cancelled && preload.naturalWidth) setActive(next)
    }, priority ? 6500 : 8500)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [count, visible, documentVisible, playing, interacting, focused, next, nextSrc, sizes, priority])

  function move(offset) {
    setActive(index => (index + offset + count) % count)
  }

  return <div
    ref={carousel}
    className={'image-carousel ' + variant}
    role={count > 1 ? 'group' : undefined}
    aria-label={count > 1 ? label : undefined}
    onPointerEnter={event => {if (event.pointerType === 'mouse') setInteracting(true)}}
    onPointerLeave={() => setInteracting(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)}}
  >
    <img key={image.src} {...imageSource(image.src)} sizes={sizes} alt={image.alt ?? ''}
      loading={priority && active === 0 ? 'eager' : 'lazy'}
      fetchPriority={priority && active === 0 ? 'high' : undefined} decoding="async"/>
    {count > 1 && <div className="slide-controls">
      <button type="button" onClick={() => move(-1)} aria-label={'Previous image for ' + label}><ChevronLeft size={17} aria-hidden="true"/></button>
      <button type="button" onClick={() => setPlaying(value => !value)} aria-label={(playing ? 'Pause slideshow for ' : 'Play slideshow for ') + label}>
        {playing ? <Pause size={15} aria-hidden="true"/> : <Play size={15} aria-hidden="true"/>}
      </button>
      <button type="button" onClick={() => move(1)} aria-label={'Next image for ' + label}><ChevronRight size={17} aria-hidden="true"/></button>
    </div>}
  </div>
}
