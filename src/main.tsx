import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Detect browser toolbar height (e.g. Samsung Internet bottom nav)
// and expose it as a CSS variable so fixed-bottom elements can offset above it.
function updateBrowserChrome() {
  let offset = 0;
  if (window.visualViewport) {
    offset = window.innerHeight - window.visualViewport.height;
  }
  // Clamp to reasonable range (0-80px) to avoid glitches
  offset = Math.max(0, Math.min(80, offset));
  document.documentElement.style.setProperty('--browser-chrome-bottom', `${offset}px`);
}
updateBrowserChrome();
window.addEventListener('resize', updateBrowserChrome);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateBrowserChrome);
  window.visualViewport.addEventListener('scroll', updateBrowserChrome);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
