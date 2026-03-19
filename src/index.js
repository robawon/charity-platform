import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { supabase } from './lib/supabase';

// ─── Force sign out on every app restart ───────────────────────────────────
// We use a session key stored in sessionStorage (cleared on tab/browser close
// AND on every full page reload / server restart).
// If the key is missing it means the app just started fresh → sign out.
const SESSION_KEY = 'app_session_active';

const bootApp = async () => {
  const isActive = sessionStorage.getItem(SESSION_KEY);

  if (!isActive) {
    // App restarted — sign out any persisted Supabase session
    await supabase.auth.signOut();
    sessionStorage.setItem(SESSION_KEY, 'true');
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

bootApp();