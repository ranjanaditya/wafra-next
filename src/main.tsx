import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useApp } from './store';
import './index.css';

// Dev-only handle for QA scripts (state inspection in the browser console).
if (import.meta.env.DEV) (window as unknown as { __app: typeof useApp }).__app = useApp;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
