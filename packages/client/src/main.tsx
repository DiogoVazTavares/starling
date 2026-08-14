import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { StarlingApp } from './StarlingApp.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element — check index.html.');

createRoot(rootElement).render(
  <StrictMode>
    <StarlingApp />
  </StrictMode>,
);
