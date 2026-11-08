import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { PersonajesProvider } from './context/PersonajesContext.jsx';
import './estilos/index.css';
import './estilos/sin-animaciones.css';

createRoot(document.getElementById('root')).render(<PersonajesProvider><App /></PersonajesProvider>);
