import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode is nice, but for AudioContext and Live API prototypes, 
  // it can sometimes cause double-initialization issues with streams. 
  // We'll keep it but handle cleanup robustly in hooks.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);