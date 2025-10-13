import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { initialUsers } from '@/lib/seed';
// Dynamic import fallback: allows the app to run even if react-redux isn't installed yet.

import { useState, useEffect } from "react";

function ReduxAppLoader({ children }) {
  const [ready, setReady] = useState(false);
  const [ProviderComp, setProvider] = useState(null);
  const [storeObj, setStore] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadRedux() {
      try {
        const r = await import("react-redux");
        const s = await import("@/store/store");
        setProvider(() => r.Provider);
        setStore(s.store || s.default || s);
        setReady(true);
      } catch (e) {
        setReady(true); // fallback to non-redux
      }
    }
    loadRedux();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready)
    return (
      <div style={{ textAlign: "center", marginTop: "10vh" }}>
        Chargement de l'application...
      </div>
    );
  if (ProviderComp && storeObj) {
    return <ProviderComp store={storeObj}>{children}</ProviderComp>;
  }
  return children;
}

// Optional one-time clearing of legacy localStorage keys so the app uses Redux + backend only.
// Enable by setting VITE_CLEAR_LOCAL_STORAGE=true in your frontend .env and restarting Vite.
const SHOULD_CLEAR_LOCAL = Boolean(
  import.meta.env.VITE_CLEAR_LOCAL_STORAGE === "true"
);
function clearLegacyLocalStorage() {
  try {
    const keysToClear = [
      "coaching_dict_terms",
      "coaching_dict_comments",
      "coaching_dict_modifications",
      "coaching_dict_notifications",
      "coaching_dict_newsletter_subscribers",
      "coaching_dict_likes",
    ];
    keysToClear.forEach((k) => localStorage.removeItem(k));
    // keep `coaching_dict_users` so the fallback API user remains available until users are served from backend
    console.info("[migration] Cleared legacy localStorage keys:", keysToClear);
  } catch (e) {
    console.warn("[migration] Failed to clear legacy localStorage:", e);
  }
}

if (SHOULD_CLEAR_LOCAL) {
  // run before any legacy initialization to ensure stale caches removed
  clearLegacyLocalStorage();
}

const initializeLegacyData = () => {
  // Removed localStorage initialization for users - now using database only
  // if (!localStorage.getItem("coaching_dict_users")) {
  //   const usersWithApi = [
  //     ...initialUsers,
  //     {
  //       id: "user-api",
  //       name: "Mohamed Rachid Belhadj",
  //       email: "api@example.com",
  //       password: "api-password",
  //       role: "auteur",
  //       status: "active",
  //       createdAt: new Date().toISOString(),
  //       profilePicture: "https://i.pravatar.cc/150?u=api-user",
  //       biography: "Source de données initiale pour le dictionnaire.",
  //       socials: [],
  //       documents: [],
  //     },
  //   ];
  //   localStorage.setItem("coaching_dict_users", JSON.stringify(usersWithApi));
  // }
  if (!localStorage.getItem("coaching_dict_comments")) {
    localStorage.setItem("coaching_dict_comments", JSON.stringify([]));
  }
  // local notifications initialization removed (notifications disabled)
  if (!localStorage.getItem("coaching_dict_newsletter_subscribers")) {
    localStorage.setItem(
      "coaching_dict_newsletter_subscribers",
      JSON.stringify([])
    );
  }
  // Initialize terms here if not already, to ensure category is 'Coaching' for all initial terms.
  // This part is handled by DataContext's initialFetch and fetchData, ensuring consistency.
};

initializeLegacyData();

// Ignore unhandled promise rejections caused by AbortController (common during
// StrictMode double-render and navigation). This prevents noisy console errors
// for expected aborts while keeping other rejections visible.
window.addEventListener("unhandledrejection", (event) => {
  try {
    const reason = event.reason;
    const name = ((reason && (reason.name || "")) || "")
      .toString()
      .toLowerCase();
    const msg = ((reason && (reason.message || "")) || "")
      .toString()
      .toLowerCase();
    if (
      name === "aborterror" ||
      msg.includes("aborted") ||
      msg.includes("abort")
    ) {
      // prevent the default logging for aborted requests
      event.preventDefault();
      console.debug(
        "Suppressed unhandled rejection due to AbortError:",
        reason
      );
    }
  } catch (e) {
    // ignore
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ReduxAppLoader>
      <App />
    </ReduxAppLoader>
  </React.StrictMode>
);
