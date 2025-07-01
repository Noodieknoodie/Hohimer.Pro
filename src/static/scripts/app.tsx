import { app } from "@microsoft/teams-js";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Initialize Teams SDK before rendering React
app.initialize().then(() => {
  app.notifySuccess();
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});