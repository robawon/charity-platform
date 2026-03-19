import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { supabase } from './lib/supabase';

const SESSION_KEY = 'app_session_active';

const bootApp = async () => {
  try {
    const isActive = sessionStorage.getItem(SESSION_KEY);
    if (!isActive) {
      await supabase.auth.signOut();
      sessionStorage.setItem(SESSION_KEY, 'true');
    }
  } catch (err) {
    console.log('Session cleanup error:', err);
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

bootApp();