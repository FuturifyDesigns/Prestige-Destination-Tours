import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { db } from './db'

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [version, setVersion] = useState(0)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!db) return
    const controller = new AbortController()
    db.from('guest_reviews').select('id,name,rating,message').eq('published',true)
      .order('created_at',{ascending:false}).limit(6).abortSignal(controller.signal)
      .then(({data}) => {if (!controller.signal.aborted && data) setReviews(data)})
    return () => controller.abort()
  }, [version])

  async function submit(event) {
    event.preventDefault()
    if (saving || !db) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const name = fields.get('name').trim()
    const message = fields.get('message').trim()
    if (!name || message.length < 10) {
      setNotice('Enter a display name and at least 10 characters for your review.')
      return
    }
    if (fields.get('website')) return
    setNotice('')
    setSaving(true)
    const {error} = await db.from('guest_reviews').insert({kind:'review',name,rating:Number(fields.get('rating')),message})
    setSaving(false)
    if (error) setNotice('We couldn’t save your review. Please try again.')
    else {
      form.reset()
      setVersion(value => value + 1)
      setNotice('Thank you. Your review is now public.')
    }
  }

  return <section id="reviews" className="wrap section guest-reviews" aria-labelledby="reviews-heading">
    <div className="review-intro"><div><h2 id="reviews-heading">Guest <em>reviews</em></h2>
      <p>Tell us about your experience with Prestige.</p></div>
      <details className="review-form">
        <summary className="button">Leave a review <ChevronDown className="review-toggle-icon" size={17} aria-hidden="true"/></summary>
        {db ? <form onSubmit={submit}>
          <p className="caption">Your display name, rating and review will appear publicly on our homepage. Leave contact details out of your message.</p>
          <label>Display name<input name="name" maxLength={80} required/></label>
          <label>Rating<select name="rating" defaultValue="" required><option value="" disabled>Choose a rating</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} out of 5</option>)}</select></label>
          <label>Your experience<textarea name="message" minLength={10} maxLength={1200} rows={4} required/></label>
          <div hidden><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
          <button className="button" disabled={saving}>{saving ? 'Sending…' : 'Post review'}</button>
          {notice && <p role="status">{notice}</p>}
        </form> : <p>Review submissions are temporarily unavailable.</p>}
      </details>
    </div>
    {reviews.length > 0 && <div className="review-grid">{reviews.map(review => <figure key={review.id}>
      <span className="review-stars" aria-label={review.rating + ' out of 5 stars'}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
      <blockquote>{review.message}</blockquote><figcaption>{review.name}</figcaption>
    </figure>)}</div>}
  </section>
}
