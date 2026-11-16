import { useEffect, useState } from 'react'
import { db } from './db'

export function ReviewModeration() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [page, setPage] = useState(0)
  const [more, setMore] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoaded(false)
    setError('')
    db.from('guest_reviews').select('*').order('created_at',{ascending:false})
      .order('id',{ascending:false}).range(page*25,page*25+25).abortSignal(controller.signal)
      .then(({data,error}) => {
        if (controller.signal.aborted) return
        setItems(data?.slice(0,25) ?? [])
        setMore((data?.length ?? 0)>25)
        setError(error ? 'Could not load feedback.' : '')
        setLoaded(true)
      })
    return () => controller.abort()
  }, [page,version])

  async function moderate(item, action) {
    if (busy) return
    if (action === 'delete' && !window.confirm('Permanently delete this submission?')) return
    setBusy(true)
    setError('')
    const operation = action === 'delete' ? db.from('guest_reviews').delete()
      : db.from('guest_reviews').update({published:!item.published})
    const {error} = await operation.eq('id',item.id).select('id').single()
    setBusy(false)
    if (error) setError('Could not update this submission. Please try again.')
    else setVersion(value => value+1)
  }

  return <section aria-labelledby="moderation-title" className="review-moderation">
    <h2 id="moderation-title">Reviews &amp; feedback</h2>
    <button className="plain" disabled={busy} onClick={() => setVersion(value => value+1)}>Refresh feedback</button>
    {error && <p role="alert">{error}</p>}
    {!loaded ? <p role="status">Loading feedback…</p> : items.length === 0 && !error ? <p>No submissions on this page.</p> : null}
    {loaded && items.map(item => <article key={item.id}>
      <p className="caption">{item.kind === 'feedback' ? 'Private feedback' : item.published ? 'Published review' : 'Unpublished review'} · {item.rating}/5</p>
      <h3>{item.name}</h3><p className="request-message">{item.message}</p>
      <div className="reply-actions">
        {item.kind === 'review' && <button className="button" disabled={busy} onClick={() => moderate(item,'publish')}>{item.published ? 'Hide review' : 'Publish review'}</button>}
        <button className="plain" disabled={busy} onClick={() => moderate(item,'delete')}>Delete submission</button>
      </div>
    </article>)}
    <div className="pagination"><button className="plain" disabled={!page || busy} onClick={() => setPage(p => p-1)}>Previous</button><span>Page {page+1}</span><button className="plain" disabled={!more || busy} onClick={() => setPage(p => p+1)}>Next</button></div>
  </section>
}
