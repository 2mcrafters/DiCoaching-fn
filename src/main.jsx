import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { initialUsers } from '@/lib/seed';

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
    <App />
  </React.StrictMode>
);