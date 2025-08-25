import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Font Awesome setup
import { library } from '@fortawesome/fontawesome-svg-core'
import { faDiscord, faTelegramPlane, faGithub, faSteam } from '@fortawesome/free-brands-svg-icons'
import { faArrowUp, faArrowDown, faEnvelope, faExternalLinkAlt, faStar, faCodeBranch } from '@fortawesome/free-solid-svg-icons'

library.add(faDiscord, faTelegramPlane, faGithub, faSteam, faArrowUp, faArrowDown, faEnvelope, faExternalLinkAlt, faStar, faCodeBranch)

// Регистрация Service Worker для оптимизации производительности
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
