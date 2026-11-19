import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@7'
import { notification } from './message.mjs'

const env = (name: string) => Deno.env.get(name) || ''
const response = (status: number, body: object) => Response.json(body, { status })

Deno.serve(async request => {
  if (request.method !== 'POST') return response(405, { error: 'Method not allowed' })
  const token = env('REQUEST_NOTIFICATION_TOKEN')
  if (!token || request.headers.get('x-notification-token') !== token) {
    return response(401, { error: 'Unauthorized' })
  }
  const provider = env('REQUEST_MAIL_PROVIDER')
  const from = env('REQUEST_MAIL_FROM')
  const configured = from && (provider === 'brevo'
    ? env('BREVO_API_KEY')
    : provider === 'smtp' && env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS'))
  // Do not consume queued requests until a sender is configured.
  if (!configured) return response(503, { error: 'Mail sender is not configured' })

  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: jobs, error } = await db.rpc('claim_request_notifications')
  if (error) return response(500, { error: 'Unable to claim notifications' })
  let sent = 0
  let failed = 0
  const smtp = provider === 'smtp' ? nodemailer.createTransport({
    host: env('SMTP_HOST'), port: 465, secure: true,
    auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true,
  }) : null
  for (const job of jobs || []) {
    let delivered = false
    let providerId = ''
    let failure = ''
    try {
      const mail = notification(job.request)
      if (provider === 'brevo') {
        const result = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST', signal: AbortSignal.timeout(15000),
          headers: { 'api-key': env('BREVO_API_KEY'), 'content-type': 'application/json' },
          body: JSON.stringify({
            sender: { email: from, name: 'Prestige Destinations Tours' },
            to: [{ email: mail.to }], replyTo: { email: mail.replyTo },
            subject: mail.subject, textContent: mail.text,
            headers: { 'idempotencyKey': job.request.id },
          }),
        })
        if (!result.ok) {
          const detail = await result.json().catch(() => ({}))
          const reason = String(detail.message || detail.code || 'rejected')
            .replace(/xkeysib-[A-Za-z0-9-]+/g, '[redacted]')
            .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
            .replace(/[\r\n]+/g, ' ').slice(0, 150)
          throw new Error(`Brevo HTTP ${result.status}: ${reason}`)
        }
        providerId = (await result.json()).messageId || ''
      } else {
        const result = await smtp!.sendMail({
          ...mail, from: { name: 'Prestige Destinations Tours', address: from },
        })
        if (!result.accepted?.length) throw new Error('SMTP recipient was not accepted')
        providerId = result.messageId || mail.messageId
      }
      delivered = true
      sent++
    } catch (error) {
      failed++
      // Store only a code, never SMTP credentials or customer details from provider errors.
      failure = provider === 'brevo' && /^Brevo HTTP \d+: /.test(error.message)
        ? error.message : `Mail delivery failed (${error.code || error.name || 'unknown'})`
    }
    const { error: finishError } = await db.rpc('finish_request_notification', {
      job_id: job.id, claim_token: job.lease_token, delivered,
      delivery_id: providerId, failure_code: failure,
    })
    if (finishError) console.error('Notification delivery state could not be saved', job.id)
  }
  smtp?.close()
  return response(200, { sent, failed })
})
