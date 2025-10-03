import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { initialUsers } from '@/lib/seed';
// Dynamic import fallback: allows the app to run even if react-redux isn't installed yet.
let Provider;
let store;
let fetchTerms;
try {
  // Attempt static import path. This will be replaced by Vite during normal runs when packages are installed.
  // Keep as dynamic require-like import to avoid build-time resolution errors when dependencies are missing.
  // eslint-disable-next-line no-eval
  const maybe = eval('require');
  const redux = maybe('./store/store');
  // When running in ESM environment, the above may not work; attempt dynamic import fallback.
  if (redux) {
    store = redux.store || redux.default || redux;
  }
} catch (e) {
  // ignore — will try dynamic import below at runtime
}

async function initReduxRuntime() {
  try {
    // Use a runtime-generated import function so Vite cannot statically analyze the module name.
    const dynamicImport = new Function('m', 'return import(m)');
    const r = await dynamicImport('react' + '-redux');
    const s = await dynamicImport('@/store/store');
    const slice = await dynamicImport('@/features/terms/termsSlice');
    Provider = r.Provider;
    store = s.store || s.default || s;
    fetchTerms = slice.fetchTerms;
  } catch (err) {
    // If packages are not installed, log a clear warning and keep Provider undefined.
    // The app will render without Redux (read-only) until you install the packages.
    // This prevents Vite's import-analysis from failing during development in this environment.
    // eslint-disable-next-line no-console
    console.warn('[startup] react-redux or @reduxjs/toolkit not available. Redux disabled until you install dependencies.');
  }
}

// Start runtime init but don't block render.
initReduxRuntime();

// Optional one-time clearing of legacy localStorage keys so the app uses Redux + backend only.
// Enable by setting VITE_CLEAR_LOCAL_STORAGE=true in your frontend .env and restarting Vite.
const SHOULD_CLEAR_LOCAL = Boolean(import.meta.env.VITE_CLEAR_LOCAL_STORAGE === 'true');
function clearLegacyLocalStorage() {
  try {
    const keysToClear = [
      'coaching_dict_terms',
      'coaching_dict_comments',
      'coaching_dict_reports',
      'coaching_dict_modifications',
      'coaching_dict_notifications',
      'coaching_dict_newsletter_subscribers',
      'coaching_dict_likes'
    ];
    keysToClear.forEach(k => localStorage.removeItem(k));
    // keep `coaching_dict_users` so the fallback API user remains available until users are served from backend
    console.info('[migration] Cleared legacy localStorage keys:', keysToClear);
  } catch (e) {
    console.warn('[migration] Failed to clear legacy localStorage:', e);
  }
}

if (SHOULD_CLEAR_LOCAL) {
  // run before any legacy initialization to ensure stale caches removed
  clearLegacyLocalStorage();
}

const initializeLegacyData = () => {
  if (!localStorage.getItem('coaching_dict_users')) {
    const usersWithApi = [
      ...initialUsers,
      {
        id: 'user-api',
        name: 'Mohamed Rachid Belhadj',
        email: 'api@example.com',
        password: 'api-password',
        role: 'auteur',
        status: 'active',
        createdAt: new Date().toISOString(),
        profilePicture: 'https://i.pravatar.cc/150?u=api-user',
        biography: 'Source de données initiale pour le dictionnaire.',
        socials: [],
        documents: []
      }
    ];
    localStorage.setItem('coaching_dict_users', JSON.stringify(usersWithApi));
  }
  if (!localStorage.getItem('coaching_dict_comments')) {
    localStorage.setItem('coaching_dict_comments', JSON.stringify([]));
  }
  if (!localStorage.getItem('coaching_dict_reports')) {
    localStorage.setItem('coaching_dict_reports', JSON.stringify([]));
  }
  if (!localStorage.getItem('coaching_dict_modifications')) {
    localStorage.setItem('coaching_dict_modifications', JSON.stringify([]));
  }
  if (!localStorage.getItem('coaching_dict_notifications')) {
    const initialNotifications = [
      { id: 1, userId: 'user-admin', content: 'Bienvenue sur la plateforme ! N\'hésitez pas à explorer les fonctionnalités d\'administration.', read: false, createdAt: new Date().toISOString() },
      { id: 2, userId: 'user-auteur-1', content: 'Votre compte auteur a été approuvé. Vous pouvez maintenant soumettre des termes.', read: false, createdAt: new Date().toISOString() },
    ];
    localStorage.setItem('coaching_dict_notifications', JSON.stringify(initialNotifications));
  }
  if (!localStorage.getItem('coaching_dict_newsletter_subscribers')) {
    localStorage.setItem('coaching_dict_newsletter_subscribers', JSON.stringify([]));
  }
  // Initialize terms here if not already, to ensure category is 'Coaching' for all initial terms.
  // This part is handled by DataContext's initialFetch and fetchData, ensuring consistency.
};

initializeLegacyData();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* If Redux is available at runtime, render App inside Provider; otherwise render App directly. */}
    {Provider && store ? (
      <Provider store={store}>
        <App />
      </Provider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);

// If fetchTerms is available (Redux loaded), dispatch initial fetch; otherwise DataContext will fetch.
if (typeof fetchTerms === 'function' && store && typeof store.dispatch === 'function') {
  store.dispatch(fetchTerms());
}