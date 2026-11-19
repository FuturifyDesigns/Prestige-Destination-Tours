export const recipient = 'info@prestigetours.co.bw'

export function notification(request) {
  const kind = request.kind === 'booking' ? 'Booking request' : 'Enquiry'
  const clean = value => String(value ?? '').replace(/[\r\n]+/g, ' ').trim()
  const fields = [
    ['Request reference', request.id], ['Received', request.created_at],
    ['Type', kind], ['Name', request.name], ['Email', request.email],
    ['Telephone', request.phone], ['Destination', request.destination],
    ['Experience', request.experience], ['Travel date', request.travel_date],
    ['Guests', request.guests],
  ]
  return {
    to: recipient,
    subject: `New ${kind.toLowerCase()} — ${clean(request.name).slice(0, 120)}`,
    replyTo: clean(request.email),
    text: `A new ${kind.toLowerCase()} has been received on the Prestige Destinations Tours website.\n\n`
      + fields.map(([label, value]) => `${label}: ${clean(value) || 'Not provided'}`).join('\n')
      + `\n\nTrip details:\n${request.message}\n\nManage this request: https://prestigetours.co.bw/admin\n\nA booking request is subject to availability and staff confirmation.`,
    messageId: `<request-${request.id}@prestigetours.co.bw>`,
  }
}
