import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext';
import { PresetProvider } from './context/PresetContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <PresetProvider>
        <App />
      </PresetProvider>
    </LanguageProvider>
  </StrictMode>,
);

