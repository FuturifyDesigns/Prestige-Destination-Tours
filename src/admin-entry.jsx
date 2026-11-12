import { createRoot } from 'react-dom/client'
import { Admin } from './requests'
import './style.css'

const recoveryUrl = new URL(window.location.pathname.replace(/\/?$/, '/'), window.location.origin).href
createRoot(document.getElementById('root')).render(<>
  <header className="admin-brand"><div className="wrap"><a href="../" aria-label="Prestige Destination Tours home"><img src="../logo.png" alt="Prestige Destination Tours"/></a></div></header>
  <main><Admin recoveryUrl={recoveryUrl}/></main>
</>)
