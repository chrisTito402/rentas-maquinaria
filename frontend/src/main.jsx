import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CarritoProvider } from './carrito/CarritoContext.jsx';
import './estilos.css';
import './figma.css';
import { SesionProvider } from './auth/Sesion.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CarritoProvider>
        <SesionProvider><App /></SesionProvider>
      </CarritoProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
