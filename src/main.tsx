import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { initPWA } from './utils/initPWA'

// Limpiar sessionStorage del banner si el permiso cambió
if (Notification.permission !== 'default') {
  sessionStorage.removeItem('notificacion-banner-cerrado');
}

// Inicializar PWA (Service Worker y permisos)
initPWA().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
