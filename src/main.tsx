import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { registrarServiceWorker } from './utils/pwaService'

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  registrarServiceWorker().catch((error) => {
    console.warn('Error registrando Service Worker:', error)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
