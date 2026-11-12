import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight, CalendarDays, Check, Mail, ShieldCheck } from 'lucide-react'
import { destinations, experiences, transferRoutes, media } from './data'
import { EmailLinks, TelephoneLink } from './Contact'

const recoveryHash = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery'
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
  const [errors, setErrors] = useState({})
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
    const validation = {}
    if (!data.name || data.name.length > 120) validation.name = 'Enter your full name, up to 120 characters.'
    if (!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z0-9-]+$/i.test(data.email) || data.email.length > 254) {
      validation.email = 'Enter a valid email address so we can reply.'
    }
    if (data.phone && (!/^\+?[0-9().\s-]+$/.test(data.phone) || data.phone.replace(/\D/g, '').length < 7 || data.phone.replace(/\D/g, '').length > 15)) {
      validation.phone = 'Enter a valid phone number, including the country code if needed.'
    }
    if ((booking && !data.travel_date) || (data.travel_date && data.travel_date < today)) validation.travel_date = 'Choose today or a future travel date.'
    if ((booking && data.guests === null) || (data.guests !== null && (!Number.isInteger(data.guests) || data.guests < 1 || data.guests > 999))) {
      validation.guests = 'Enter a whole number between 1 and 999.'
    }
    if (!data.message) validation.message = 'Tell us a little about your trip.'
    if (transfer) data.message = 'Transfer route: ' + transfer + '\n\n' + data.message
    if (data.message.length > 4000) validation.message = 'Shorten your trip details before sending.'
    setErrors(validation)
    if (Object.keys(validation).length) {
      setResult('Please check the highlighted fields.')
      event.currentTarget.elements.namedItem(Object.keys(validation)[0])?.focus()
      return
    }
    setBusy(true)
    setResult('')
    try {
      const { error } = await db.from('travel_requests').insert(data)
      if (error) throw error
      setReceived(true)
    } catch (error) {
      setResult(error?.code === 'PT429' ? 'Too many requests were sent for this email. Wait a few minutes or contact us directly.' : 'We couldn’t save your request. Please try again or contact us directly.')
    } finally {
      setBusy(false)
    }
  }
  function fieldProps(name) {
    return {
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby': errors[name] ? name + '-error' : undefined,
      onChange: () => setErrors(current => ({...current, [name]:undefined})),
    }
  }
  function fieldError(name) {
    return errors[name] && <span className="field-error" id={name + '-error'}>{errors[name]}</span>
  }
  return <div className="wrap section planning">
    <aside data-intro><div className="eyebrow"><CalendarDays size={16} aria-hidden="true"/> TRIP PLANNING</div><h1>Let’s plan <em>your trip.</em></h1><p>Tell us where you’d like to go and when. We’ll email you to discuss the details and confirm availability.</p><img src={media('plan-hero.webp')} alt="Binoculars and a map on a table overlooking Botswana wetlands"/><div className="direct"><EmailLinks/><TelephoneLink/></div></aside>
    <section className="form-panel" data-intro>
      <div className="tabs" aria-label="Request type"><Link aria-current={booking ? undefined : 'page'} to={'/plan?' + new URLSearchParams({...Object.fromEntries(params),mode:'enquiry'})}>Enquiry</Link><Link aria-current={booking ? 'page' : undefined} to={'/plan?' + new URLSearchParams({...Object.fromEntries(params),mode:'booking'})}>Booking request</Link></div>
      {received ? <div className="confirmation" role="status"><Check/><h2>Request received</h2><p>Our team will follow up at the email address you provided.</p><button className="button" onClick={() => setReceived(false)}>Send another request</button></div> : <form onSubmit={submit} noValidate>
      <h2>{booking ? 'Request a booking' : 'Send an enquiry'}</h2>
      <div className="form-grid">
      <label>Full name<input name="name" autoComplete="name" maxLength="120" required {...fieldProps('name')}/>{fieldError('name')}</label>
      <label>Email address<input name="email" type="email" autoComplete="email" maxLength="254" required {...fieldProps('email')}/>{fieldError('email')}</label>
      <label>Phone / WhatsApp (optional)<input name="phone" type="tel" autoComplete="tel" maxLength="40" {...fieldProps('phone')}/>{fieldError('phone')}</label>
      <label>Destination<select name="destination" defaultValue={params.get('destination') || ''}><option value="">Help me choose</option>{destinations.map(({name}) => <option key={name}>{name}</option>)}</select></label>
      <label className="wide">Experience<select name="experience" value={experience} onChange={event => setExperience(event.target.value)}><option value="">Help me choose</option>{experiences.map(({name}) => <option key={name}>{name}</option>)}</select></label>
      {experience === 'Shuttles and transfers' && <label className="wide">Transfer route<select name="transfer" defaultValue={params.get('transfer') || ''}><option value="">Other or undecided</option>{transferRoutes.map(({name}) => <option key={name}>{name}</option>)}</select></label>}
      <label>Preferred date{!booking && ' (optional)'}<input name="travel_date" type="date" min={today} required={booking} {...fieldProps('travel_date')}/>{fieldError('travel_date')}</label>
      <label>Travellers{!booking && ' (optional)'}<input name="guests" type="number" min="1" max="999" required={booking} {...fieldProps('guests')}/>{fieldError('guests')}</label>
      <label className="wide">Trip details<textarea name="message" {...fieldProps('message')} required rows="4" maxLength={experience === 'Shuttles and transfers' ? 3900 : 4000} placeholder={booking ? 'Tell us about your itinerary, pickup point or preferred timing.' : 'What would you like to know?'}/>{fieldError('message')}</label>
      </div><div className="trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      <p className="caption">We’ll use these details to respond to your request.</p>
      {result && <p role="alert" className="error">{result}</p>}
      <button className="button" disabled={busy}>{busy ? 'Sending…' : booking ? 'Send booking request' : 'Send enquiry'} <ArrowRight size={17}/></button>
      </form>}
    </section>
  </div>
}

export function Admin({ recoveryUrl = new URL('admin/', window.location.href).href }) {
  const [recovering, setRecovering] = useState(recoveryHash)
  const [resetRequested, setResetRequested] = useState(false)
  const [setupCode, setSetupCode] = useState(false)
  const [notice, setNotice] = useState('')
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
  const isStaff = !recovering && session?.user.app_metadata.prestige_staff === true
  useEffect(() => {
    if (!db) return
    const { data } = db.auth.onAuthStateChange((event, value) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
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
  async function requestReset(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    const address = new FormData(event.currentTarget).get('email')
    const { error } = await db.auth.resetPasswordForEmail(address, {redirectTo: recoveryUrl})
    if (error) setError('The reset request could not be completed. Try again in a few minutes.')
    else setNotice('If the address has an account, check its inbox for the password setup link.')
    setSaving(false)
  }
  async function verifySetupCode(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const form = new FormData(event.currentTarget)
    const { error } = await db.auth.verifyOtp({
      email:form.get('email'),
      token:form.get('code').trim(),
      type:'recovery',
    })
    if (error) setError('This setup code is invalid or has expired.')
    else {
      setRecovering(true)
      setSetupCode(false)
    }
    setSaving(false)
  }
  async function changePassword(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (form.get('password') !== form.get('confirmation')) {
      setError('Enter the same password in both fields.')
      return
    }
    setError('')
    setSaving(true)
    const { error } = await db.auth.updateUser({password:form.get('password')})
    if (error) setError('The password could not be updated. Request a fresh reset link and try again.')
    else {
      setRecovering(false)
      setResetRequested(false)
      setNotice('Password updated.')
    }
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
    <div className="staff-heading" data-intro><div><div className="eyebrow"><ShieldCheck size={16}/> PRESTIGE STAFF</div><h1>{isStaff ? 'Request inbox' : 'Staff sign-in'}</h1></div>{session && <button className="plain" onClick={() => {setError('');setNotice('');setRecovering(false);setPage(0);setFilter('all');db.auth.signOut()}}>Sign out</button>}</div>
    {error && <p role="alert" className="error">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {!db && <p>The staff inbox is awaiting its database connection.</p>}
    {db && recovering && session && <form className="form-panel" onSubmit={changePassword}>
      <h2>Set your password</h2>
      <label>New password<input name="password" type="password" autoComplete="new-password" minLength="14" maxLength="72" required/></label>
      <label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength="14" maxLength="72" required/></label>
      <button className="button" disabled={saving}>{saving ? 'Saving…' : 'Set password'}</button>
    </form>}
    {db && !session && (loading ? <p role="status">Checking session…</p> : setupCode ? <form className="form-panel" onSubmit={verifySetupCode}><label>Staff email<input name="email" type="email" autoComplete="username" required/></label><label>Setup code<input name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" required/></label><button className="button" disabled={saving}>{saving ? 'Verifying…' : 'Verify setup code'}</button><button className="text-link" type="button" onClick={() => {setSetupCode(false);setError('')}}>Back to sign-in</button></form> : resetRequested ? <form className="form-panel" onSubmit={requestReset}>
      <label>Staff email<input name="email" type="email" autoComplete="username" required/></label>
      <button className="button" disabled={saving}>{saving ? 'Sending…' : 'Send password setup link'}</button>
      <button className="text-link" type="button" onClick={() => {setResetRequested(false);setError('');setNotice('')}}>Back to sign-in</button>
    </form> : <form className="form-panel" onSubmit={login}><label>Staff email<input name="email" type="email" autoComplete="username" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" required/></label><button className="button" disabled={saving}>{saving ? 'Signing in…' : 'Sign in'}</button><button className="text-link" type="button" onClick={() => {setResetRequested(true);setError('');setNotice('')}}>Set or reset password</button><button className="text-link" type="button" onClick={() => {setSetupCode(true);setError('');setNotice('')}}>Use a setup code</button></form>)}
    {session && !isStaff && !recovering && <p>This account doesn’t have access to the Prestige staff inbox.</p>}
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
