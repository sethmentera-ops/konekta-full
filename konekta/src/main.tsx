import {createRoot} from 'react-dom/client';
import './services/pwaInstall';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA installability and offline caching
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed (e.g. preview sandbox restrictions)
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

