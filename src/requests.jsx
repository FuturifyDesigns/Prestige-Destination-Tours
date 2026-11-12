import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight, Check, Mail, ShieldCheck } from 'lucide-react'
import { destinations, experiences, transferRoutes, media, phone, whatsapp } from './data'
import { EmailLinks } from './Contact'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const db = url && key ? createClient(url, key) : null
const statuses = ['New', 'In progress', 'Closed']

export function Plan() {
  const [params] = useSearchParams()
  const booking = params.get('mode') === 'booking'
  return <PlanForm key={params.toString()} params={params} booking={booking}/>
}

function PlanForm({ params, booking }) {
  const [experience, setExperience] = useState(params.get('experience') || '')
  const [result, setResult] = useState('')
  const [busy, setBusy] = useState(false)
  const [received, setReceived] = useState(false)
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Africa/Gaborone',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    if (!db) {
      setResult('Online submissions are currently unavailable. Please email or WhatsApp us with your trip details.')
      return
    }
    const data = Object.fromEntries(new FormData(event.currentTarget))
    if (data.website) return
    delete data.website
    data.kind = booking ? 'booking' : 'enquiry'
    data.travel_date ||= null
    data.guests = data.guests ? Number(data.guests) : null
    for (const field of ['name', 'email', 'phone', 'message']) data[field] = data[field].trim()
    const transfer = data.transfer
    delete data.transfer
    if (!data.name || !data.message) {
      setResult('Please enter your name and some details about your trip.')
      return
    }
    if (transfer) data.message = 'Transfer route: ' + transfer + '\n\n' + data.message
    if (data.message.length > 4000) {
      setResult('Please shorten your trip details before sending.')
      return
    }
    setBusy(true)
    setResult('')
    try {
      const { error } = await db.from('travel_requests').insert(data)
      if (error) throw error
      setReceived(true)
    } catch {
      setResult('We couldn’t save your request. Please try again or contact us directly.')
    } finally {
      setBusy(false)
    }
  }
  return <div className="wrap section planning">
    <aside data-intro><div className="eyebrow"><span>✦</span> TRIP PLANNING</div><h1>Let’s plan <em>your trip.</em></h1><p>Tell us where you’d like to go and when. We’ll email you to discuss the details and confirm availability.</p><img src={media('plan-hero.webp')} alt="Binoculars and a map on a table overlooking Botswana wetlands"/><div className="direct"><EmailLinks/><a href={whatsapp}>{phone} · WhatsApp</a></div></aside>
    <section className="form-panel" data-intro>
      <div className="tabs" aria-label="Request type"><Link aria-current={booking ? undefined : 'page'} to={'/plan?' + new URLSearchParams({...Object.fromEntries(params),mode:'enquiry'})}>Enquiry</Link><Link aria-current={booking ? 'page' : undefined} to={'/plan?' + new URLSearchParams({...Object.fromEntries(params),mode:'booking'})}>Booking request</Link></div>
      {received ? <div className="confirmation" role="status"><Check/><h2>Request received</h2><p>Our team will follow up at the email address you provided.</p><button className="button" onClick={() => setReceived(false)}>Send another request</button></div> : <form onSubmit={submit} key={params.toString()}>
      <h2>{booking ? 'Request a booking' : 'Send an enquiry'}</h2>
      <div className="form-grid">
      <label>Full name<input name="name" autoComplete="name" maxLength="120" required/></label>
      <label>Email address<input name="email" type="email" autoComplete="email" maxLength="254" required/></label>
      <label>Phone / WhatsApp (optional)<input name="phone" type="tel" autoComplete="tel" maxLength="40"/></label>
      <label>Destination<select name="destination" defaultValue={params.get('destination') || ''}><option value="">Help me choose</option>{destinations.map(({name}) => <option key={name}>{name}</option>)}</select></label>
      <label className="wide">Experience<select name="experience" value={experience} onChange={event => setExperience(event.target.value)}><option value="">Help me choose</option>{experiences.map(({name}) => <option key={name}>{name}</option>)}</select></label>
      {experience === 'Shuttles and transfers' && <label className="wide">Transfer route<select name="transfer" defaultValue={params.get('transfer') || ''}><option value="">Other or undecided</option>{transferRoutes.map(({name}) => <option key={name}>{name}</option>)}</select></label>}
      <label>Preferred date{!booking && ' (optional)'}<input name="travel_date" type="date" min={today} required={booking}/></label>
      <label>Travellers{!booking && ' (optional)'}<input name="guests" type="number" min="1" max="999" required={booking}/></label>
      <label className="wide">Trip details<textarea name="message" required rows="4" maxLength={experience === 'Shuttles and transfers' ? 3900 : 4000} placeholder={booking ? 'Tell us about your itinerary, pickup point or preferred timing.' : 'What would you like to know?'}/></label>
      </div><div className="trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      <p className="caption">We’ll use these details to respond to your request.</p>
      {result && <p role="alert" className="error">{result}</p>}
      <button className="button" disabled={busy}>{busy ? 'Sending…' : booking ? 'Send booking request' : 'Send enquiry'} <ArrowRight size={17}/></button>
      </form>}
    </section>
  </div>
}

export function Admin() {
  const [session, setSession] = useState(null)
  const [filter, setFilter] = useState('all')
  const [requests, setRequests] = useState([])
  const [active, setActive] = useState(null)
  const [page, setPage] = useState(0)
  const [more, setMore] = useState(false)
  const [version, setVersion] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(db))
  const [saving, setSaving] = useState(false)
  const isStaff = session?.user.app_metadata.prestige_staff === true
  useEffect(() => {
    if (!db) return
    const { data } = db.auth.onAuthStateChange((_event, value) => {
      setSession(value)
      setLoading(false)
      if (!value) {
        setRequests([])
        setActive(null)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!isStaff) return
    let ignore = false
    async function load() {
      setLoading(true)
      setError('')
      let query = db.from('travel_requests').select('*').order('created_at', {ascending:false}).order('id', {ascending:false}).range(page * 25, page * 25 + 25)
      if (filter !== 'all') query = query.eq('kind', filter)
      const result = await query
      if (ignore) return
      setRequests(result.data?.slice(0,25) ?? [])
      setMore((result.data?.length ?? 0) > 25)
      if (result.error) setError('Unable to load requests. Use Refresh to try again.')
      setLoading(false)
    }
    load()
    return () => {ignore = true}
  }, [isStaff, filter, page, version])
  async function login(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const form = new FormData(event.currentTarget)
    const { error } = await db.auth.signInWithPassword({email:form.get('email'),password:form.get('password')})
    if (error) setError('Sign-in failed. Check your email and password.')
    setSaving(false)
  }
  async function update(status) {
    setSaving(true)
    setError('')
    const { data, error } = await db.from('travel_requests').update({status}).eq('id',active).select().single()
    if (error) setError('The status could not be updated.')
    else setRequests(items => items.map(item => item.id === data.id ? data : item))
    setSaving(false)
  }
  const request = requests.find(item => item.id === active)
  const label = kind => kind === 'booking' ? 'Booking request' : 'Enquiry'
  const date = value => new Intl.DateTimeFormat('en-BW',{dateStyle:'medium',timeZone:'Africa/Gaborone'}).format(new Date(value))
  return <section className={'wrap section staff' + (!isStaff ? ' sign-in' : '')}>
    <div className="staff-heading" data-intro><div><div className="eyebrow"><ShieldCheck size={16}/> PRESTIGE STAFF</div><h1>{isStaff ? 'Request inbox' : 'Staff sign-in'}</h1></div>{session && <button className="plain" onClick={() => {setError('');setPage(0);setFilter('all');db.auth.signOut()}}>Sign out</button>}</div>
    {error && <p role="alert" className="error">{error}</p>}
    {!db && <p>The staff inbox is awaiting its database connection.</p>}
    {db && !session && (loading ? <p role="status">Checking session…</p> : <form className="form-panel" onSubmit={login}><label>Staff email<input name="email" type="email" autoComplete="username" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" required/></label><button className="button" disabled={saving}>{saving ? 'Signing in…' : 'Sign in'}</button></form>)}
    {session && !isStaff && <p>This account doesn’t have access to the Prestige staff inbox.</p>}
    {isStaff && <>
      <div className="inbox-controls"><div className="tabs">{[['all','All requests'],['enquiry','Enquiries'],['booking','Bookings']].map(([id,name]) => <button key={id} aria-pressed={filter === id} onClick={() => {setFilter(id);setPage(0);setActive(null)}}>{name}</button>)}</div><button className="plain" onClick={() => setVersion(v => v+1)}>Refresh</button></div>
      <div className="inbox">
        <div className="request-list">{loading ? <p role="status">Loading requests…</p> : requests.length === 0 ? <p>No requests to display.</p> : requests.map(item => <button key={item.id} aria-pressed={active === item.id} onClick={() => setActive(item.id)}><strong>{item.name}</strong><small>{label(item.kind)} · {date(item.created_at)}</small><span>{item.status}</span></button>)}</div>
        <div className="request-detail">{request && !loading ? <><div className="eyebrow">{label(request.kind)}</div><h2>{request.name}</h2><p>{request.email}{request.phone && <><br/>{request.phone}</>}</p><dl>{[['Destination',request.destination],['Experience',request.experience],['Travel date',request.travel_date],['Travellers',request.guests]].filter(([,value]) => value).map(([name,value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl><p className="request-message">{request.message}</p><label>Status<select value={request.status} disabled={saving} onChange={e => update(e.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label><a className="button" href={'mailto:' + encodeURIComponent(request.email) + '?subject=' + encodeURIComponent('Prestige Destination Tours | ' + label(request.kind))}><Mail size={17}/> Reply by email</a></> : <p>Select a request to view its details and reply.</p>}</div>
      </div>
      <div className="pagination"><button className="plain" disabled={page === 0 || loading} onClick={() => {setActive(null);setPage(p => p-1)}}>Previous</button><span>Page {page+1}</span><button className="plain" disabled={!more || loading} onClick={() => {setActive(null);setPage(p => p+1)}}>Next</button></div>
    </>}
  </section>
}
