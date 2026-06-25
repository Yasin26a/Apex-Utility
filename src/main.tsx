import React from 'react';
import ReactDom from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { PresetProvider } from './context/PresetContext.tsx';
import './index.css';

ReactDom.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <PresetProvider>
          <App />
        </PresetProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
