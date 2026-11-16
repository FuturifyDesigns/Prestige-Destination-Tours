import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { media } from './data'
import { photos } from './gallery-data'

gsap.registerPlugin(ScrollTrigger)

const filters = [['all','All photos'],['wildlife','Wildlife'],['river','River & wetlands']]
const photoUrl = (id, thumbnail = false) => media('gallery/360' + id + (thumbnail ? '-thumb' : '') + '.webp')

export default function Gallery() {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const page = useRef(null)
  const grid = useRef(null)
  const viewer = useRef(null)
  const trigger = useRef(null)
  const visible = photos.filter(([, , type]) => filter === 'all' || (type === 'r' ? filter === 'river' : filter === 'wildlife'))

  useLayoutEffect(() => {
    const motion = gsap.matchMedia()
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.gallery-intro > *', {y:26, opacity:0, stagger:.1, duration:.75, ease:'power2.out', clearProps:'transform,opacity'})
      gsap.from('.gallery-cover', {scale:1.07, duration:1.6, ease:'power2.out', clearProps:'transform'})
    }, page)
    return () => motion.revert()
  }, [])

  useLayoutEffect(() => {
    const motion = gsap.matchMedia()
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      ScrollTrigger.batch(grid.current.children, {
        start:'top 98%',
        once:true,
        onEnter: cards => gsap.fromTo(cards, {y:22, opacity:.45}, {y:0, opacity:1, duration:.58, stagger:.075, ease:'power2.out', clearProps:'transform,opacity'}),
      })
    }, grid)
    return () => motion.revert()
  }, [filter])

  useEffect(() => {
    const dialog = viewer.current
    if (selected !== null && !dialog.open) dialog.showModal()
  }, [selected])

  function change(offset) {
    setSelected(index => (index + offset + visible.length) % visible.length)
  }

  return <div ref={page}>
    <section className="gallery-hero" aria-labelledby="gallery-title">
      <div className="gallery-hero-image"><img className="gallery-cover" src={photoUrl(885)} fetchPriority="high" alt="Safari boats silhouetted against an orange river sunset"/></div>
      <div className="gallery-intro">
        <h1 id="gallery-title">Safari <em>gallery.</em></h1>
        <p>Elephants in the shallows, leopards in the grass, and the last light on the river.</p>
        <a href="#photo-collection" className="gallery-jump">Explore 35 photos <ArrowDown size={16}/></a>
      </div>
    </section>
    <section className="wrap section gallery-collection" id="photo-collection" aria-labelledby="collection-title">
      <div className="gallery-heading">
        <h2 id="collection-title">From the field</h2>
        <div className="gallery-filters" role="group" aria-label="Filter photos">
          {filters.map(([key,label]) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
        </div>
      </div>
      <p className="sr-only" role="status">{visible.length} photos</p>
      <div className="gallery-grid" ref={grid}>
        {visible.map(([id, title, type], index) => <button type="button" className={'gallery-card' + (type === 'p' ? ' portrait' : '')} key={id} onClick={event => {
          trigger.current = event.currentTarget
          setSelected(index)
        }}>
          <span className="gallery-frame"><img src={photoUrl(id, true)} alt="" loading="lazy" decoding="async"/><span className="gallery-expand" aria-hidden="true"><Maximize2 size={17}/></span></span>
          <span className="gallery-caption">{title}</span>
        </button>)}
      </div>
    </section>
    <dialog className="gallery-viewer" ref={viewer} aria-label="Photo viewer" onClose={() => {setSelected(null); trigger.current?.focus()}} onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        change(event.key === 'ArrowLeft' ? -1 : 1)
      }
    }} onClick={event => {if (event.target === event.currentTarget) viewer.current.close()}}>
      {selected !== null && <div className="viewer-content">
        <button className="viewer-close" type="button" autoFocus aria-label="Close photo viewer" onClick={() => viewer.current.close()}><X/></button>
        <img src={photoUrl(visible[selected][0])} alt={visible[selected][1]}/>
        <div className="viewer-nav">
          <button type="button" aria-label="Previous photo" onClick={() => change(-1)}><ArrowLeft/></button>
          <p aria-live="polite">{visible[selected][1]} <small>{selected + 1} / {visible.length}</small></p>
          <button type="button" aria-label="Next photo" onClick={() => change(1)}><ArrowRight/></button>
        </div>
      </div>}
    </dialog>
  </div>
}
