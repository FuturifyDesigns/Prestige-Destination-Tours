import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUpRight, Binoculars, Compass, Map, MapPin, Menu, Plane, TreePine, Waves, X } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { destinations, experiences, transferRoutes, media, siteBase } from './data'
import { EmailLinks, SocialLinks, TelephoneLink, WhatsAppButton } from './Contact'
import ImageCarousel from './ImageCarousel'
import { cleanPath, navigation as links, pageEntries } from './routes'
import './style.css'

gsap.registerPlugin(ScrollTrigger)

const Plan = lazy(() => import('./requests').then(({Plan}) => ({default:Plan})))

export const planLink = (key, value, mode = 'booking') => '/plan?' + new URLSearchParams({ mode, [key]: value })

export function Eyebrow({ children }) {
  const pathname = cleanPath(useLocation().pathname)
  const Icon = {'/': Compass, '/destinations': Map, '/experiences': Binoculars, '/shuttles': Plane, '/about': TreePine}[pathname] ?? Compass
  return <div className="eyebrow"><Icon size={16} strokeWidth={1.7} aria-hidden="true"/>{children}</div>
}

export function Button({ to, children, secondary = false }) {
  return <Link className={'button' + (secondary ? ' secondary' : '')} to={to}>{children}<ArrowUpRight size={17}/></Link>
}

function Hero({ image, alternate, label, title, accent, text, home = false }) {
  return <section className={'hero ' + (home ? 'home-hero' : 'page-hero')}>
    <ImageCarousel variant="hero-carousel" label={label} priority images={[{src:image}, ...(alternate ? [{src:alternate}] : [])]}/>
    <div className="hero-shade"/>
    <div className="hero-copy wrap">
      <div data-intro><Eyebrow>{label}</Eyebrow></div>
      <h1 data-intro>{title}<br/><em>{accent}</em></h1>
      <p data-intro>{text}</p>
      {home && <div className="actions" data-intro><Button to="/plan?mode=booking">Plan your safari</Button><Button to="/destinations" secondary>Explore destinations</Button></div>}
    </div>
    {home && <div className="hero-foot wrap"><span><MapPin size={15}/> BOTSWANA · SOUTHERN AFRICA</span><a href="#discover" onClick={event => {event.preventDefault(); document.getElementById('discover')?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'})}}>DISCOVER <ArrowDown size={16}/></a></div>}
  </section>
}

function Cards({ items, kind }) {
  return <div className="cards">{items.map(item => <article className="card" data-reveal key={item.name}>
    <ImageCarousel variant="card-carousel" label={item.name} images={[{src:item.image}, ...(item.alternate ? [{src:item.alternate}] : [])]}/>
    <Link className="card-link" to={planLink(kind, item.name)} aria-label={'Plan a trip: ' + item.name}>
      <div className="card-info"><span>{item.type}</span><h3>{item.name}</h3><p>{item.text}</p></div><span className="card-arrow"><ArrowUpRight size={19}/></span>
    </Link>
  </article>)}</div>
}

function Callout({ image }) {
  return <section className="callout">{image && <img src={media(image)} alt="" loading="lazy"/>}<div data-reveal><Eyebrow>Plan your journey</Eyebrow><h2>Where would you <em>like to go?</em></h2><Button to="/plan?mode=enquiry">Talk to our team</Button></div></section>
}

function Home() {
  return <>
    <Hero home image="home-hero.webp" alternate="home-slide.webp" label="Private safaris & tailored journeys" title="Botswana, at" accent="your own pace." text="Private guided safaris, river cruises and wilderness journeys shaped around the way you want to travel."/>
    <div className="ribbon"><div className="wrap">{[[Binoculars, 'Private guided safaris', '/experiences'], [Waves, 'River cruises', '/experiences'], [Compass, 'Tailored adventures', '/experiences'], [Plane, 'Shuttles & transfers', '/shuttles']].map(([Icon, name, to]) => <Link key={name} to={to}><Icon size={22} strokeWidth={1.4}/>{name}</Link>)}</div></div>
    <section className="wrap section" id="discover"><div className="section-head" data-reveal><div><Eyebrow>Explore the region</Eyebrow><h2>Places worth <em>slowing down for.</em></h2></div><Link className="text-link" to="/destinations">All destinations <ArrowRight size={17}/></Link></div><Cards items={destinations.slice(0,3).map((item,index) => ({...item,alternate:['home-chobe-slide.webp','home-delta-slide.webp','home-falls-slide.webp'][index],image:['home-chobe.webp','plan.webp','home-falls.webp'][index]}))} kind="destination"/></section>
    <section className="feature wrap section" data-reveal><img src={media('lodge.webp')} alt="A lantern-lit safari lodge overlooking wetlands at sunset" loading="lazy"/><div><Eyebrow>Travel with Prestige</Eyebrow><h2>Make the journey <em>your own.</em></h2><p>Start with a place you’ve always wanted to see, an experience you’re curious about, or the dates you have in mind. We’ll help shape the details around you.</p><Link className="text-link" to="/about">Meet Prestige <ArrowRight size={17}/></Link></div></section>
    <Callout image="hero.webp"/>
  </>
}

function Destinations() {
  return <><Hero image="destinations-hero.webp" alternate="destinations-slide.webp" label="Botswana & beyond" title="Follow the river." accent="Go a little further." text="From the Chobe riverfront to Victoria Falls, explore the places that can shape your itinerary."/><section className="wrap section destination-section"><div className="section-head" data-reveal><div><Eyebrow>Choose a destination</Eyebrow><h2>Find your <em>starting point.</em></h2></div></div><Cards items={destinations} kind="destination"/><p className="caption">Safari imagery is illustrative. Ask our team about locations and seasonal conditions.</p></section><Callout/></>
}

function Experiences() {
  return <><Hero image="experiences-hero.webp" alternate="experiences-slide.webp" label="Tailored to you" title="On land." accent="On the water." text="Choose how to spend your time, from a private game drive to a cruise or a comfortable airport transfer."/><section className="wrap section experience-list">{experiences.filter(item => item.name !== 'Shuttles and transfers').map(item => <article className="feature" data-reveal key={item.name}><ImageCarousel variant="experience-carousel" label={item.name} images={[{src:item.image},{src:item.alternate}]}/><div><Eyebrow>{item.type}</Eyebrow><h2>{item.name}</h2><p>{item.text}</p><Button to={planLink('experience', item.name)}>Request this experience</Button></div></article>)}</section><div className="wrap fleet shuttle-teaser" data-reveal><div><Eyebrow>Travel between destinations</Eyebrow><h2>From arrival <em>to onward travel.</em></h2><p>Ask about airport pickups, hotel drop-offs and cross-border routes.</p></div><Button to="/shuttles">Explore shuttle services</Button></div><Callout image="experience-dusk.webp"/></>
}

function Shuttles() {
  return <>
    <Hero image="transfer.webp" label="Shuttle services" title="Airport pickups." accent="Cross-border transfers." text="Arrange an airport pickup or drop-off, or plan a transfer to the Caprivi Strip, Victoria Falls or Katima Mulilo."/>
    <section className="wrap section shuttle-routes" aria-labelledby="shuttle-routes-title">
      <div className="section-head" data-reveal><div><Eyebrow>Airport & cross-border routes</Eyebrow><h2 id="shuttle-routes-title">Where are you <em>headed?</em></h2></div></div>
      <div className="shuttle-grid">
        {transferRoutes.map(({name,area,text,image,small,alt}) => <article className="shuttle-card" key={name} data-reveal>
          <div className="shuttle-card-image">
            <img src={media(image)} srcSet={small ? media(small) + ' 540w, ' + media(image) + ' 1024w' : undefined} sizes="(max-width: 680px) 90vw, (max-width: 1378px) 45vw, 612px" alt={alt} loading="lazy" decoding="async"/>
          </div>
          <div className="shuttle-card-body">
            <Eyebrow>{area}</Eyebrow><h3>{name}</h3><p>{text}</p>
            <Link className="text-link" to={'/plan?' + new URLSearchParams({mode:'booking',experience:'Shuttles and transfers',transfer:name})}>Request a transfer <ArrowRight size={17}/></Link>
          </div>
        </article>)}
      </div>
    </section>
    <section className="wrap feature shuttle-photo" data-reveal>
      <img src={media('hotel.webp')} alt="Prestige Destination Tours shuttle outside a hotel" loading="lazy"/>
      <div><Eyebrow>Plan your pickup</Eyebrow><h2>Tell us where <em>to meet you.</em></h2><p>Share your travel date, group size and pickup and drop-off details. Our team will email you to confirm availability and arrange the transfer.</p><Button to={planLink('experience','Shuttles and transfers','enquiry')}>Ask about transfers</Button></div>
    </section>
  </>
}

const branches = [
  { title: 'Personalised service', alternate: 'service-slide.webp', image: 'wilderness-guide.webp', alt: 'A guide points out wildlife across the wetlands', text: 'Tell us your interests, pace and travel dates. We’ll help shape your itinerary around them.' },
  { title: 'Local discovery', alternate: 'discovery-slide.webp', image: 'dusk.webp', alt: 'An open safari vehicle beside a river at sunset', text: 'Get to know the wildlife, waterways and landscapes that make Botswana and the region distinctive.' },
  { title: 'Care along the way', alternate: 'care-slide.webp', image: 'airport.webp', alt: 'The Prestige shuttle waiting outside a covered hotel entrance', text: 'We’ll help with the practical details, from airport pickups to onward transfers and timing.' },
]

function About() {
  return <>
    <Hero image="about-hero.webp" alternate="about-slide.webp" label="About Prestige" title="A more personal" accent="way to explore." text="We plan guided safaris, river cruises and wilderness adventures around the places you want to see."/>
    <section className="wrap section about-tree" aria-labelledby="tree-title">
      <div className="tree-root" data-reveal>
        <img src={media('about.webp')} alt="A safari guide showing travellers the floodplain" loading="lazy"/>
        <div><Eyebrow>Our approach</Eyebrow><h2 id="tree-title">Rooted in <em>Botswana.</em></h2><p>From Chobe’s riverbanks to the Okavango waterways and the mist of Victoria Falls, we bring together guided experiences that connect you with the region.</p></div>
      </div>
      <div className="tree-branches">
        {branches.map(({title,image,alternate,alt,text}) => <article className="tree-branch" key={title} data-reveal>
          <ImageCarousel variant="tree-carousel" label={title} images={[{src:image,alt},{src:alternate}]}/><div><h3>{title}</h3><p>{text}</p></div>
        </article>)}
      </div>
    </section>
    <Callout/>
  </>
}

function Layout() {
  const pathname = cleanPath(useLocation().pathname)
  const [menu, setMenu] = useState(false)
  const main = useRef()
  useLayoutEffect(() => {
    setMenu(false)
    window.scrollTo(0,0)
    document.title = (links.find(([route]) => route === pathname)?.[1] ?? (pathname === '/plan' ? 'Plan your trip' : 'Page unavailable')) + ' | Prestige Destination Tours'
    const motion = gsap.matchMedia()
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = main.current.querySelectorAll('[data-intro]')
      const starts = {'/': {y: 32}, '/destinations': {x: -30}, '/experiences': {y: 24, scale: .97}, '/shuttles': {x: 26}, '/about': {y: 28, clipPath:'inset(0 0 100% 0)'}}
      if (pathname !== '/plan' && intro.length) gsap.from(intro, { ...starts[pathname], opacity: 0, duration:.85, stagger:.11, ease:'power3.out' })
      if (pathname === '/') gsap.from('.hero-carousel img', {scale:1.08, duration:1.8, ease:'power2.out'})
      const slide = window.matchMedia('(min-width: 681px)').matches
      const sections = main.current.querySelectorAll('[data-reveal]')
      sections.forEach((el, index) => {
        if (pathname === '/destinations' && el.classList.contains('card')) {
          const edges = ['inset(100% 0 0 0)', 'inset(0 100% 0 0)', 'inset(0 0 0 100%)', 'inset(0 0 100% 0)', 'inset(12% 12% 12% 12%)']
          const timeline = gsap.timeline({scrollTrigger:{trigger:el,start:'top 94%',once:true}})
          timeline
            .from(el, {y:26, opacity:0, duration:.65, ease:'power2.out', clearProps:'transform,opacity'})
            .fromTo(el.querySelector('.card-carousel'), {clipPath:edges[(index - 1) % edges.length]}, {clipPath:'inset(0% 0% 0% 0%)', duration:.84, ease:'power3.out', clearProps:'clipPath'}, 0)
            .from(el.querySelector('.card-info'), {y:22, opacity:0, duration:.56, ease:'power2.out', clearProps:'transform,opacity'}, .18)
          return
        }
        if (pathname === '/shuttles' && el.classList.contains('shuttle-card')) {
          const featured = el === main.current.querySelector('.shuttle-card')
          const timeline = gsap.timeline({scrollTrigger:{trigger:el,start:'top 94%',once:true}})
          timeline
            .from(el, {x:slide ? (featured ? -36 : (index % 2 ? -28 : 28)) : 0, y:slide ? 12 : 28, opacity:0, duration:.72, ease:'power3.out', clearProps:'transform,opacity'})
            .from(el.querySelector('.shuttle-card-image img'), {scale:1.1, duration:.88, ease:'power2.out', clearProps:'transform'}, 0)
            .from(el.querySelector('.shuttle-card-body'), {y:16, opacity:0, duration:.58, ease:'power2.out', clearProps:'transform,opacity'}, .13)
          return
        }
        let start = {y: 24}
        if (pathname === '/experiences' && el.classList.contains('feature')) start = slide ? {x: index % 2 ? 46 : -46} : {y: 24}
        if (pathname === '/about' && el.classList.contains('tree-branch')) start = {y: 30, scale: .97}
        gsap.from(el, {...start, opacity:0, duration:.8, ease:'power2.out', scrollTrigger:{trigger:el,start:'top 94%',once:true}})
      })
      const branches = main.current.querySelector('.tree-branches')
      if (branches) gsap.from(branches, {'--branch-progress':0,duration:1.15,ease:'power2.out',scrollTrigger:{trigger:branches,start:'top 88%',once:true}})
    }, main)
    return () => motion.revert()
  }, [pathname])

  return <><header className={'header ' + (pathname === '/plan' || !links.some(([route]) => route === pathname) ? 'solid' : '')}><div className="wrap header-inner"><Link to="/" aria-label="Prestige Destination Tours home"><img src={media('logo.png')} alt="Prestige Destination Tours" className="logo"/></Link><button className="menu-toggle" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-controls="site-nav" aria-label={menu ? 'Close menu' : 'Open menu'}>{menu ? <X/> : <Menu/>}</button><nav id="site-nav" className={menu ? 'open' : ''} aria-label="Main navigation">{links.map(([to,label]) => <NavLink key={to} end to={to} onClick={() => setMenu(false)}>{label}</NavLink>)}</nav><Link className="nav-cta" to="/plan?mode=booking" onClick={() => setMenu(false)}>Plan your trip <ArrowUpRight size={16}/></Link></div></header>
  <main ref={main} id="main" className={'route-' + (pathname.slice(1) || 'home')}><Routes><Route path="/" element={<Home/>}/><Route path="/destinations" element={<Destinations/>}/><Route path="/experiences" element={<Experiences/>}/><Route path="/shuttles" element={<Shuttles/>}/><Route path="/about" element={<About/>}/><Route path="/plan" element={<Suspense fallback={<div className="wrap section" role="status">Loading trip planner…</div>}><Plan/></Suspense>}/><Route path="*" element={<section className="wrap section"><h1>Page unavailable</h1><Button to="/">Back to home</Button></section>}/></Routes></main>
  <footer><div className="wrap footer-grid"><Link to="/"><img src={media('logo-with-tagline.png')} alt="Prestige Destination Tours. Open chapter, write your memory."/></Link><div><strong>Explore</strong><Link to="/destinations">Destinations</Link><Link to="/experiences">Experiences</Link><Link to="/shuttles">Shuttles & transfers</Link><Link to="/plan?mode=enquiry">Make an enquiry</Link></div><div><strong>Get in touch</strong><EmailLinks/><TelephoneLink/><SocialLinks/></div></div><div className="wrap footer-bottom">© {new Date().getFullYear()} Prestige Destination Tours <a href="https://futurifydesigns.com">Built by Futurify Designs <ArrowUpRight size={13}/></a></div></footer><WhatsAppButton/></>
}
const legacy = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : ''
const legacyUrl = legacy.split('?')[0]
const legacyPath = cleanPath(legacyUrl)
if (legacyPath === '/admin') {
  window.location.replace(siteBase + 'admin/')
} else {
  if (legacyUrl && (legacyPath === '/' && !legacyUrl.startsWith('//') || pageEntries.some(([route]) => route === legacyPath))) {
    const query = legacy.slice(legacyUrl.length)
    window.history.replaceState(window.history.state, '', siteBase + legacyPath.slice(1) + query)
  }
  createRoot(document.getElementById('root')).render(<BrowserRouter basename={siteBase}><Layout/></BrowserRouter>)
}

