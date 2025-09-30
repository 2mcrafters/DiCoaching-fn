// Service d'authentification pour communiquer avec l'API backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Configuration des headers avec token
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Connexion
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        this.token = data.data.token;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Erreur de connexion' };
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  }

  // Inscription
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        this.token = data.data.token;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Erreur d\'inscription' };
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  }

  // Déconnexion
  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return !!this.token;
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Obtenir le profil de l'utilisateur depuis l'API
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return { success: true, data: data.data.user };
      } else {
        if (response.status === 401 || response.status === 403) {
          this.logout();
        }
        return { success: false, error: data.message || 'Erreur lors de la récupération du profil' };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  }

  // Faire une requête authentifiée
  async authenticatedRequest(url, options = {}) {
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url.startsWith('http') ? url : `${API_BASE_URL}${url}`, config);
      
      if (response.status === 401 || response.status === 403) {
        this.logout();
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      return response;
    } catch (error) {
      console.error('Erreur lors de la requête authentifiée:', error);
      throw error;
    }
  }
}

// Instance unique du service d'authentification
const authService = new AuthService();

export default authService;