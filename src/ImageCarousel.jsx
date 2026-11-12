import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { media } from './data'

export default function ImageCarousel({ images, label, variant, priority = false }) {
  const [active, setActive] = useState(0)
  const image = images[active]
  function move(offset) {
    setActive(index => (index + offset + images.length) % images.length)
  }
  return <div className={'image-carousel ' + variant} role={images.length > 1 ? 'group' : undefined} aria-label={images.length > 1 ? label : undefined}>
    <img key={image.src} src={media(image.src)} alt={image.alt ?? ''} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined}/>
    {images.length > 1 && <div className="slide-controls">
      <button type="button" onClick={() => move(-1)} aria-label={'Previous image for ' + label}><ChevronLeft size={17} aria-hidden="true"/></button>
      <span aria-live="polite">{active + 1}<span aria-hidden="true"> / </span><span className="sr-only"> of </span>{images.length}</span>
      <button type="button" onClick={() => move(1)} aria-label={'Next image for ' + label}><ChevronRight size={17} aria-hidden="true"/></button>
    </div>}
  </div>
}
