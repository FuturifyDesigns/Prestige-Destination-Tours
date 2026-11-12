import { Facebook } from 'lucide-react'
import { email, peterEmail, facebook, tiktok, whatsapp } from './data'

export function EmailLinks() {
  return [email, peterEmail].map(address => <a key={address} href={'mailto:' + address}>{address}</a>)
}

export function SocialLinks() {
  return <div className="social-links" aria-label="Social media">
    <a href={facebook} aria-label="Find Prestige Destinations Tours on Facebook"><Facebook aria-hidden="true" size={19}/></a>
    <a href={tiktok} aria-label="Prestige Destination Tours on TikTok"><svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M14 2h3.2a5.1 5.1 0 0 0 4.3 4.4v3.2A8 8 0 0 1 17.2 8v8.1a6 6 0 1 1-6-6c.4 0 .7 0 1 .1v3.3a2.8 2.8 0 1 0 1.8 2.6V2Z"/></svg></a>
  </div>
}

export function WhatsAppButton() {
  return <a className="whatsapp-float" href={whatsapp} aria-label="Chat with Prestige Destination Tours on WhatsApp">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="25" height="25" fill="currentColor">
      <path d="M12 2a9.9 9.9 0 0 0-8.6 14.9L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3-.4-4.4-1.2l-.3-.2-2.8.7.7-2.7-.2-.3a8.3 8.3 0 1 1 7 3.7Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.9 6.9 0 0 1-3.4-3c-.2-.3.2-.4.7-1.2.1-.2.1-.3 0-.4L9.5 8c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.4.1-.6.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.7 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.2-.3-.3-.8-.7Z"/>
    </svg>
  </a>
}
