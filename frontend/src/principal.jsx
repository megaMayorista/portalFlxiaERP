import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './Aplicacion';
import { ToastProvider } from './contexto/AvisosContexto';
import { SessionProvider } from './contexto/SesionContexto';
import { ThemeProvider } from './contexto/TemaContexto';
import './estilos.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <SessionProvider>
            <App />
          </SessionProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
