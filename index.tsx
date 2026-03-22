import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Implicitly handled by tailwind script in HTML, but good practice

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);