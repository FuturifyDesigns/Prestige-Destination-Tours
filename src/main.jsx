import { useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUpRight, Binoculars, Compass, MapPin, Menu, Waves, X } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { destinations, experiences, media, phone, whatsapp } from './data'
import { Plan, Admin } from './requests'
import { EmailLinks, SocialLinks, WhatsAppButton } from './Contact'
import './style.css'

gsap.registerPlugin(ScrollTrigger)

const links = [['/', 'Home'], ['/destinations', 'Destinations'], ['/experiences', 'Experiences'], ['/about', 'About']]
export const planLink = (key, value, mode = 'booking') => '/plan?' + new URLSearchParams({ mode, [key]: value })

export function Eyebrow({ children }) {
  return <div className="eyebrow"><span aria-hidden="true">✦</span>{children}</div>
}

export function Button({ to, children, secondary = false }) {
  return <Link className={'button' + (secondary ? ' secondary' : '')} to={to}>{children}<ArrowUpRight size={17}/></Link>
}

function Hero({ image, label, title, accent, text, home = false }) {
  return <section className={'hero ' + (home ? 'home-hero' : 'page-hero')}>
    <img className="hero-image" src={media(image)} alt="" fetchPriority="high"/>
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
  return <div className="cards">{items.map(item => <Link className="card" data-reveal key={item.name} to={planLink(kind, item.name)} aria-label={'Plan a trip: ' + item.name}>
    <img src={media(item.image)} alt="" loading="lazy"/>
    <div className="card-info"><span>{item.type}</span><h3>{item.name}</h3><p>{item.text}</p></div><span className="card-arrow"><ArrowUpRight size={19}/></span>
  </Link>)}</div>
}

function Callout({ image }) {
  return <section className="callout">{image && <img src={media(image)} alt="" loading="lazy"/>}<div data-reveal><Eyebrow>Plan your journey</Eyebrow><h2>Where would you <em>like to go?</em></h2><Button to="/plan?mode=enquiry">Talk to our team</Button></div></section>
}

function Home() {
  return <>
    <Hero home image="home-hero.webp" label="Private safaris & tailored journeys" title="Botswana, at" accent="your own pace." text="Private guided safaris, river cruises and wilderness journeys shaped around the way you want to travel."/>
    <div className="ribbon"><div className="wrap">{[[Binoculars, 'Private guided safaris'], [Waves, 'River cruises'], [Compass, 'Tailored adventures']].map(([Icon, name]) => <Link key={name} to="/experiences"><Icon size={22} strokeWidth={1.4}/>{name}</Link>)}</div></div>
    <section className="wrap section" id="discover"><div className="section-head" data-reveal><div><Eyebrow>Explore the region</Eyebrow><h2>Places worth <em>slowing down for.</em></h2></div><Link className="text-link" to="/destinations">All destinations <ArrowRight size={17}/></Link></div><Cards items={destinations.slice(0,3).map((item,index) => ({...item,image:['home-chobe.webp','plan.webp','home-falls.webp'][index]}))} kind="destination"/></section>
    <section className="feature wrap section" data-reveal><img src={media('lodge.webp')} alt="A lantern-lit safari lodge overlooking wetlands at sunset" loading="lazy"/><div><Eyebrow>Travel with Prestige</Eyebrow><h2>Make the journey <em>your own.</em></h2><p>Start with a place you’ve always wanted to see, an experience you’re curious about, or the dates you have in mind. We’ll help shape the details around you.</p><Link className="text-link" to="/about">Meet Prestige <ArrowRight size={17}/></Link></div></section>
    <Callout image="hero.webp"/>
  </>
}

function Destinations() {
  return <><Hero image="destinations-hero.webp" label="Botswana & beyond" title="Follow the river." accent="Go a little further." text="From the Chobe riverfront to Victoria Falls, explore the places that can shape your itinerary."/><section className="wrap section"><div data-reveal><Eyebrow>Choose a destination</Eyebrow><h2>Find your <em>starting point.</em></h2></div><Cards items={destinations} kind="destination"/><p className="caption">Safari imagery is illustrative. Ask our team about locations and seasonal conditions.</p></section><Callout/></>
}

function Experiences() {
  return <><Hero image="experiences-hero.webp" label="Tailored to you" title="On land." accent="On the water." text="Choose how to spend your time, from a private game drive to a cruise or a comfortable airport transfer."/><section className="wrap section experience-list">{experiences.map(item => <article className="feature" data-reveal key={item.name}><img src={media(item.image)} alt="" loading="lazy"/><div><Eyebrow>{item.type}</Eyebrow><h2>{item.name}</h2><p>{item.text}</p><Button to={planLink('experience', item.name)}>Request this experience</Button></div></article>)}</section><div className="wrap fleet" data-reveal><div><Eyebrow>Travel between destinations</Eyebrow><h2>From arrival <em>to onward travel.</em></h2><p>Ask about airport pickups, hotel drop-offs and cross-border routes.</p><Button to={planLink('experience', 'Shuttles and transfers')}>Arrange a transfer</Button></div><img src={media('hotel.webp')} alt="Prestige shuttle outside a hotel" loading="lazy"/></div><Callout image="experience-dusk.webp"/></>
}

const branches = [
  { title: 'Personalised service', image: 'wilderness-guide.webp', alt: 'A guide points out wildlife across the wetlands', text: 'Tell us your interests, pace and travel dates. We’ll help shape your itinerary around them.' },
  { title: 'Local discovery', image: 'dusk.webp', alt: 'An open safari vehicle beside a river at sunset', text: 'Get to know the wildlife, waterways and landscapes that make Botswana and the region distinctive.' },
  { title: 'Care along the way', image: 'airport.webp', alt: 'The Prestige shuttle waiting outside a covered hotel entrance', text: 'We’ll help with the practical details, from airport pickups to onward transfers and timing.' },
]

function About() {
  return <>
    <Hero image="about-hero.webp" label="About Prestige" title="A more personal" accent="way to explore." text="We plan guided safaris, river cruises and wilderness adventures around the places you want to see."/>
    <section className="wrap section about-tree" aria-labelledby="tree-title">
      <div className="tree-root" data-reveal>
        <img src={media('about.webp')} alt="A safari guide showing travellers the floodplain" loading="lazy"/>
        <div><Eyebrow>Our approach</Eyebrow><h2 id="tree-title">Rooted in <em>Botswana.</em></h2><p>From Chobe’s riverbanks to the Okavango waterways and the mist of Victoria Falls, we bring together guided experiences that connect you with the region.</p></div>
      </div>
      <div className="tree-branches">
        {branches.map(({title,image,alt,text}) => <article className="tree-branch" key={title} data-reveal>
          <img src={media(image)} alt={alt} loading="lazy"/><div><h3>{title}</h3><p>{text}</p></div>
        </article>)}
      </div>
    </section>
    <Callout/>
  </>
}

function Layout() {
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const main = useRef()
  useLayoutEffect(() => {
    setMenu(false)
    window.scrollTo(0,0)
    document.title = (links.find(([route]) => route === pathname)?.[1] ?? (pathname === '/admin' ? 'Staff inbox' : 'Plan your trip')) + ' | Prestige Destination Tours'
    const motion = gsap.matchMedia()
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = main.current.querySelectorAll('[data-intro]')
      const starts = {'/': {y: 32}, '/destinations': {x: -30}, '/experiences': {y: 24, scale: .97}, '/about': {y: 28, clipPath:'inset(0 0 100% 0)'}, '/plan': {x: 20}, '/admin': {y: 12}}
      if (intro.length) gsap.from(intro, { ...starts[pathname], opacity: 0, duration:.85, stagger:.11, ease:'power3.out' })
      if (pathname === '/') gsap.from('.hero-image', {scale:1.08, duration:1.8, ease:'power2.out'})
      const slide = window.matchMedia('(min-width: 681px)').matches
      const sections = main.current.querySelectorAll('[data-reveal]')
      sections.forEach((el, index) => {
        let start = {y: 24}
        if (pathname === '/destinations' && el.classList.contains('card')) start = {y: 38, scale: .96}
        if (pathname === '/experiences' && el.classList.contains('feature')) start = slide ? {x: index % 2 ? 46 : -46} : {y: 24}
        if (pathname === '/about' && el.classList.contains('tree-branch')) start = {y: 30, scale: .97}
        gsap.from(el, {...start, opacity:0, duration:.8, ease:'power2.out', scrollTrigger:{trigger:el,start:'top 94%',once:true}})
      })
      const branches = main.current.querySelector('.tree-branches')
      if (branches) gsap.from(branches, {'--branch-progress':0,duration:1.15,ease:'power2.out',scrollTrigger:{trigger:branches,start:'top 88%',once:true}})
      if (pathname === '/plan') gsap.from('.planning aside img', {clipPath:'inset(0 100% 0 0)', duration:1.1,ease:'power3.out',delay:.16})
    }, main)
    return () => motion.revert()
  }, [pathname])

  return <><header className={'header ' + (pathname === '/plan' || pathname === '/admin' ? 'solid' : '')}><div className="wrap header-inner"><Link to="/" aria-label="Prestige Destination Tours home"><img src={media('logo.png')} alt="Prestige Destination Tours" className="logo"/></Link><button className="menu-toggle" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-controls="site-nav" aria-label={menu ? 'Close menu' : 'Open menu'}>{menu ? <X/> : <Menu/>}</button><nav id="site-nav" className={menu ? 'open' : ''} aria-label="Main navigation">{links.map(([to,label]) => <NavLink key={to} end to={to} onClick={() => setMenu(false)}>{label}</NavLink>)}</nav><Link className="nav-cta" to="/plan?mode=booking" onClick={() => setMenu(false)}>Plan your trip <ArrowUpRight size={16}/></Link></div></header>
  <main ref={main} id="main" className={'route-' + (pathname.slice(1) || 'home')}><Routes><Route path="/" element={<Home/>}/><Route path="/destinations" element={<Destinations/>}/><Route path="/experiences" element={<Experiences/>}/><Route path="/about" element={<About/>}/><Route path="/plan" element={<Plan/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<section className="wrap section"><h1>Page unavailable</h1><Button to="/">Back to home</Button></section>}/></Routes></main>
  <footer><div className="wrap footer-grid"><Link to="/"><img src={media('logo-with-tagline.png')} alt="Prestige Destination Tours. Open chapter, write your memory."/></Link><div><strong>Explore</strong><Link to="/destinations">Destinations</Link><Link to="/experiences">Experiences</Link><Link to="/plan?mode=enquiry">Make an enquiry</Link></div><div><strong>Get in touch</strong><EmailLinks/><a href={whatsapp}>{phone} · WhatsApp</a><Link to="/admin">Staff sign-in</Link><SocialLinks/></div></div><div className="wrap footer-bottom">© {new Date().getFullYear()} Prestige Destination Tours <a href="https://futurifydesigns.com">Built by Futurify Designs <ArrowUpRight size={13}/></a></div></footer>{pathname !== '/admin' && <WhatsAppButton/>}</>
}
createRoot(document.getElementById('root')).render(<HashRouter><Layout/></HashRouter>)
